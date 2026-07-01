<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Seuil;

class SeuilSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $seuils = [
            ['nom' => 'Humidité Maïs', 'valeur_min' => 20.0, 'valeur_max' => 45.0, 'unite' => '%'],
            ['nom' => 'Humidité Tomate', 'valeur_min' => 25.0, 'valeur_max' => 50.0, 'unite' => '%'],
            ['nom' => 'Température Serre', 'valeur_min' => 15.0, 'valeur_max' => 30.0, 'unite' => '°C'],
            ['nom' => 'pH Sol', 'valeur_min' => 5.5, 'valeur_max' => 7.5, 'unite' => 'pH'],
            ['nom' => 'Humidité Riz', 'valeur_min' => 30.0, 'valeur_max' => 60.0, 'unite' => '%'],
            ['nom' => 'Luminosité', 'valeur_min' => 2000.0, 'valeur_max' => 8000.0, 'unite' => 'Lux'],
            ['nom' => 'Conductivité Électrique', 'valeur_min' => 0.5, 'valeur_max' => 2.0, 'unite' => 'dS/m'],
            ['nom' => 'Niveau Réservoir', 'valeur_min' => 10.0, 'valeur_max' => 90.0, 'unite' => '%'],
            ['nom' => 'Température Eau', 'valeur_min' => 10.0, 'valeur_max' => 25.0, 'unite' => '°C'],
            ['nom' => 'Salinité', 'valeur_min' => 0.1, 'valeur_max' => 1.5, 'unite' => 'g/L'],
        ];

        foreach ($seuils as $seuil) {
            // Utilise le nom comme clé unique pour l'idempotence
            Seuil::updateOrCreate(
                ['nom' => $seuil['nom']],
                $seuil
            );
        }
    }
}

