<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Parcelle;

class ParcelleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $parcelles = [
            ['nom' => 'Parcelle A1', 'superficie' => 500.5, 'type_culture' => 'Maïs', 'localisation' => 'Zone Nord'],
            ['nom' => 'Parcelle A2', 'superficie' => 300.0, 'type_culture' => 'Tomate', 'localisation' => 'Zone Nord'],
            ['nom' => 'Parcelle B1', 'superficie' => 1200.75, 'type_culture' => 'Riz', 'localisation' => 'Zone Est'],
            ['nom' => 'Parcelle B2', 'superficie' => 450.2, 'type_culture' => 'Haricot', 'localisation' => 'Zone Est'],
            ['nom' => 'Parcelle C1', 'superficie' => 800.0, 'type_culture' => 'Blé', 'localisation' => 'Zone Sud'],
            ['nom' => 'Parcelle C2', 'superficie' => 650.4, 'type_culture' => 'Soja', 'localisation' => 'Zone Sud'],
            ['nom' => 'Parcelle D1', 'superficie' => 200.1, 'type_culture' => 'Patate', 'localisation' => 'Zone Ouest'],
            ['nom' => 'Parcelle D2', 'superficie' => 550.0, 'type_culture' => 'Oignon', 'localisation' => 'Zone Ouest'],
            ['nom' => 'Parcelle E1', 'superficie' => 900.8, 'type_culture' => 'Cotonnier', 'localisation' => 'Zone Centrale'],
            ['nom' => 'Parcelle E2', 'superficie' => 350.3, 'type_culture' => 'Arachide', 'localisation' => 'Zone Centrale'],
        ];

        foreach ($parcelles as $parcelle) {
            // Utilise le 'nom' comme clé unique pour vérifier l'existence
            Parcelle::updateOrCreate(
                ['nom' => $parcelle['nom']],
                $parcelle
            );
        }
    }
}
