<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Script;

class ScriptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $scripts = [
            ['code' => 'START_IRRIGATION', 'description' => 'Active le système d\'irrigation pour la parcelle cible.'],
            ['code' => 'STOP_IRRIGATION',  'description' => 'Arrête le système d\'irrigation immédiatement.'],
            ['code' => 'CALIBRATE_SENSOR', 'description' => 'Lance la procédure de calibration du capteur.'],
            ['code' => 'RESET_SYSTEM',     'description' => 'Réinitialise les paramètres du contrôleur local.'],
            ['code' => 'READ_HUMIDITY',    'description' => 'Force une lecture immédiate du taux d\'humidité.'],
            ['code' => 'READ_TEMP',        'description' => 'Force une lecture immédiate de la température.'],
            ['code' => 'SYNC_DATA',        'description' => 'Synchronise les logs locaux avec le serveur central.'],
            ['code' => 'POWER_SAVE_ON',    'description' => 'Active le mode économie d\'énergie pour le capteur.'],
            ['code' => 'POWER_SAVE_OFF',   'description' => 'Désactive le mode économie d\'énergie.'],
            ['code' => 'UPDATE_FIRMWARE',  'description' => 'Prépare le système pour une mise à jour distante.'],
        ];

        foreach ($scripts as $s) {
            // On utilise le 'code' comme mot-clé unique pour l'idempotence
            Script::updateOrCreate(
                ['code' => $s['code']],
                $s
            );
        }
    }
}
