<?php

namespace App\Services;

use App\Models\Alerte;
use App\Models\Capteur;
use App\Models\Mesure;
use App\Models\Notification_systeme as NotificationSysteme;
use PhpMqtt\Client\Contracts\MqttClient;
use PhpMqtt\Client\Facades\MQTT;

class MqttService
{
    /**
     * Topics par défaut utilisés par l'application.
     */
    protected function sensorsTopic(): string
    {
        return (string) config('mqtt-client.topics.sensors', 'agro-iot/sensors');
    }

    protected function actionsTopic(): string
    {
        return (string) config('mqtt-client.topics.actions', 'agro-iot/actions');
    }

    /**
     * Publie une commande destinée à un actionneur (ex: une LED).
     *
     * Message JSON : {"actionneur_id": id, "actionneur": "light"|"irrigation"|..., "state": "on"|"off"}
     *
     * Le paramètre $slug est le nom logique de l'actionneur utilisé par la route
     * (light, irrigation, ventilation...). Il permet à l'ESP32 d'identifier la
     * sortie physique à piloter indépendamment de l'ID en base.
     */
    public function publishAction(int $actionneurId, string $state, ?string $slug = null): void
    {
        $payload = json_encode(array_filter([
            'actionneur_id' => $actionneurId,
            'actionneur' => $slug,
            'state' => strtolower($state) === 'off' ? 'off' : 'on',
        ], fn ($value) => $value !== null), JSON_UNESCAPED_UNICODE);

        try {
            /** @var MqttClient $mqtt */
            $mqtt = MQTT::connection();
            $mqtt->publish($this->actionsTopic(), (string) $payload, 0);
            $mqtt->disconnect();
        } finally {
            MQTT::disconnect();
        }
    }

    /**
     * Écoute en continu les messages publiés par l'ESP32 sur le topic capteurs
     * et les persiste dans la base de données.
     *
     * Cette méthode est conçue pour être exécutée depuis une commande Artisan
     * (elle ne rend pas la main tant que le broker est joignable).
     */
    public function listen(): void
    {
        /** @var MqttClient $mqtt */
        $mqtt = MQTT::connection('listener');

        $mqtt->subscribe($this->sensorsTopic(), function (string $topic, string $message) {
            $this->processSensorReading($message);
        }, 1);

        // Boucle de réception infinie.
        $mqtt->loop(true);
    }

    /**
     * Parse un message capteur et crée une Mesure pour chaque grandeur reçue.
     *
     * Format attendu (JSON) :
     *   {"temperature": 25.3, "luminosite": 812, "eau": 45}
     * Chaque clé est associée au capteur correspondant via son type.
     */
    public function processSensorReading(string $message): void
    {
        $data = json_decode($message, true);

        if (! is_array($data)) {
            return;
        }

        $mappings = [
            'temperature' => ['dht', 'temperature', 'temp'],
            'humidite' => ['humid', 'air', 'humidity'],
            'humidity' => ['humid', 'air', 'humidity'],
            'luminosite' => ['luminos', 'light', 'lux'],
            'eau' => ['eau', 'niveau', 'water', 'soil', 'moisture'],
            'co2' => ['co2', 'dioxyde', 'gaz'],
        ];

        foreach ($mappings as $grandeur => $keywords) {
            if (! array_key_exists($grandeur, $data)) {
                continue;
            }

            $capteur = $this->findCapteurFor($keywords);

            if (! $capteur) {
                continue;
            }

            Mesure::create([
                'date' => now(),
                'valeur' => (float) $data[$grandeur],
                'capteur_id' => $capteur->id,
            ]);

            $capteur->update([
                'valeur_mesure' => (string) $data[$grandeur],
                'etat' => 'Connecté',
                'statut' => 'actif',
            ]);
        }

        // --- ALERTES AUTOMATIQUES (reflètent le clignotement des LED côté ESP32) ---
        // Si le niveau d'eau < 50% : la LED irrigation (broche 25) clignote côté ESP32.
        if (array_key_exists('eau', $data) && (float) $data['eau'] < 50) {
            $this->upsertSensorAlert(
                'eau_basse',
                'Niveau d\'eau bas',
                'Le niveau d\'eau est inférieur à 50% : la LED d\'irrigation clignote, le remplissage est recommandé.',
                'haute',
                'Critique',
                false
            );
        } else {
            $this->resolveSensorAlert('eau_basse');
        }

        // Si le CO2 dépasse le seuil : la LED ventilation (broche 27) clignote côté ESP32.
        if (array_key_exists('co2', $data) && (float) $data['co2'] > $this->co2Threshold()) {
            $this->upsertSensorAlert(
                'co2_eleve',
                'CO2 élevé',
                'Le taux de CO2 dépasse le seuil : la LED de ventilation clignote, l\'aération est nécessaire.',
                'haute',
                'Critique',
                false
            );
        } else {
            $this->resolveSensorAlert('co2_eleve');
        }
    }

    /**
     * Seuil de CO2 au-delà duquel la LED ventilation clignote côté ESP32.
     * Doit rester cohérent avec la constante SEUIL_CO2_ELEVE du firmware.
     */
    protected function co2Threshold(): float
    {
        return 1000;
    }

    /**
     * Crée (ou réactive) une alerte active et sa notification associée,
     * en évitant de créer des doublons tant qu'une alerte du même type est ouverte.
     */
    protected function upsertSensorAlert(
        string $key,
        string $type,
        string $message,
        string $priorite,
        string $niveau,
        bool $statut
    ): void {
        $existing = Alerte::where('type_alerte', $type)->where('statut', false)->latest('date')->first();

        if ($existing) {
            return;
        }

        $notification = NotificationSysteme::create([
            'contenu' => $message,
            'canal' => 'Dashboard',
            'statut' => $statut ? 'lu' : 'non lu',
            'date_envoi' => now(),
            'type_notif' => 'alerte',
        ]);

        Alerte::create([
            'type_alerte' => $type,
            'message' => $message,
            'niveau_criticite' => $niveau,
            'statut' => $statut,
            'date' => now(),
            'notification_id' => $notification->id,
            'priorite' => $priorite,
        ]);
    }

    /**
     * Clôture les alertes du type donné lorsque la condition redevient normale.
     */
    protected function resolveSensorAlert(string $key): void
    {
        $type = $key === 'eau_basse'
            ? 'Niveau d\'eau bas'
            : 'CO2 élevé';

        Alerte::where('type_alerte', $type)
            ->where('statut', false)
            ->update(['statut' => true]);
    }

    /**
     * Normalise une chaîne pour comparer sans accents (cf. Luminosité/luminosite).
     */
    protected function normalize(string $value): string
    {
        return strtr($value, [
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'à' => 'a', 'â' => 'a', 'ä' => 'a',
            'î' => 'i', 'ï' => 'i',
            'ô' => 'o', 'ö' => 'o',
            'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c',
        ]);
    }

    /**
     * Trouve le capteur actif correspondant aux mots-clés.
     * Priorité aux capteurs MQTT dédiés, puis aux plus anciens.
     */
    protected function findCapteurFor(array $keywords): ?Capteur
    {
        $capteurs = Capteur::where('statut', 'actif')->get()->sort(function ($a, $b) {
            $aMqtt = str_contains((string) $a->nom, 'MQTT') ? 0 : 1;
            $bMqtt = str_contains((string) $b->nom, 'MQTT') ? 0 : 1;

            if ($aMqtt !== $bMqtt) {
                return $aMqtt <=> $bMqtt;
            }

            return $a->id <=> $b->id;
        });

        foreach ($capteurs as $capteur) {
            $haystack = $this->normalize(strtolower(trim((string) $capteur->type) . ' ' . trim((string) $capteur->nom)));

            foreach ($keywords as $keyword) {
                if (str_contains($haystack, $this->normalize(strtolower($keyword)))) {
                    return $capteur;
                }
            }
        }

        return null;
    }
}
