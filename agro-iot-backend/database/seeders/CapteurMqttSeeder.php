<?php

namespace Database\Seeders;

use App\Models\Capteur;
use App\Models\Parcelle;
use App\Models\Seuil;
use Illuminate\Database\Seeder;

class CapteurMqttSeeder extends Seeder
{
    /**
     * Crée les capteurs MQTT actifs attendus par le back-end pour le flux IoT :
     * température, luminosité et niveau d'eau.
     */
    public function run(): void
    {
        $parcelle = Parcelle::first();
        $seuilTemperature = Seuil::where('nom', 'like', '%Température%')->first();
        $seuilLuminosite = Seuil::where('nom', 'like', '%Luminosité%')->first();
        $seuilEau = Seuil::where('nom', 'like', '%Niveau%')->first();

        if (! $parcelle) {
            $this->command->error('Aucune parcelle disponible : lancez ParcelleSeeder d\'abord.');
            return;
        }

        $capteurs = [
            ['nom' => 'Capteur Température MQTT', 'type' => 'DHT22', 'seuil' => $seuilTemperature],
            ['nom' => 'Capteur Luminosité MQTT', 'type' => 'Luminosité', 'seuil' => $seuilLuminosite],
            ['nom' => 'Capteur Niveau Eau MQTT', 'type' => 'Niveau Eau', 'seuil' => $seuilEau],
        ];

        foreach ($capteurs as $definition) {
            Capteur::updateOrCreate(
                ['nom' => $definition['nom']],
                [
                    'type' => $definition['type'],
                    'statut' => 'actif',
                    'etat' => 'Connecté',
                    'date_intallation' => now(),
                    'seuil_id' => $definition['seuil']?->id,
                    'valeur_mesure' => '0',
                    'parcelle_id' => $parcelle->id,
                ]
            );
        }

        $this->command->info('Capteurs MQTT créés (température, luminosité, niveau d\'eau).');
    }
}
