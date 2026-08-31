<?php

namespace App\Services;

use App\Models\Capteur;
use App\Models\Mesure;
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
     * Message JSON : {"actionneur_id": id, "state": "on"|"off"}
     */
    public function publishAction(int $actionneurId, string $state): void
    {
        $payload = json_encode([
            'actionneur_id' => $actionneurId,
            'state' => strtolower($state) === 'off' ? 'off' : 'on',
        ], JSON_UNESCAPED_UNICODE);

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
        $mqtt = MQTT::connection();

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
            'luminosite' => ['luminos', 'light', 'lux'],
            'eau' => ['eau', 'niveau', 'water', 'soil', 'moisture', 'humidit'],
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
    }

    /**
     * Trouve un capteur actif dont le type (ou le nom) correspond aux mots-clés.
     */
    protected function findCapteurFor(array $keywords): ?Capteur
    {
        $capteurs = Capteur::where('statut', 'actif')->get();

        foreach ($capteurs as $capteur) {
            $haystack = strtolower(trim((string) $capteur->type) . ' ' . trim((string) $capteur->nom));

            foreach ($keywords as $keyword) {
                if (str_contains($haystack, strtolower($keyword))) {
                    return $capteur;
                }
            }
        }

        return null;
    }
}
