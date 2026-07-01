<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Capteur;
use App\Models\Parcelle;
use App\Models\Seuil;
use Carbon\Carbon;

class CapteurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $parcelles = Parcelle::all();
        $seuils = Seuil::all();

        if ($parcelles->isEmpty() || $seuils->isEmpty()) {
            $this->command->error("Assurez-vous que les tables Parcelles et Seuils sont remplies avant de lancer CapteurSeeder.");
            return;
        }

        $types = ['DHT22', 'SoilMoisture', 'Luminosité', 'PH-mètre'];
        $statuts = ['actif', 'inactif', 'maintenance'];

        for ($i = 1; $i <= 10; $i++) {
            Capteur::create([
                'nom' => "Capteur " . ($types[array_rand($types)]) . " #{$i}",
                'type' => $types[array_rand($types)],
                'statut' => $statuts[array_rand($statuts)],
                'etat' => 'Connecté',
                'date_intallation' => Carbon::now()->subMonths(rand(1, 6)),
                'seuil_id' => $seuils->random()->id,
                'valeur_mesure' => rand(0, 100),
                'parcelle_id' => $parcelles->random()->id,
            ]);
        }
    }
}
