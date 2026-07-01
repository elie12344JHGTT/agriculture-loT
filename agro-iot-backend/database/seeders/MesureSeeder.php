<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Mesure;
use App\Models\Capteur;

class MesureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void

    {
        // On récupère un capteur existant ou on en crée un par défaut
        $capteur = Capteur::firstOrCreate(['nom' => 'Capteur Humidité 01', 'type' => 'humidité', 'statut' => 'actif', 'etat' => 'Connecté', 'date_intallation' => now(), 'seuil_id' => 1, 'valeur_mesure' => 50, 'parcelle_id' => 1]);

        $mesures = [
            ['date' => now()->subHours(10), 'valeur' => 22.5, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(9),  'valeur' => 21.8, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(8),  'valeur' => 20.2, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(7),  'valeur' => 19.5, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(6),  'valeur' => 18.9, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(5),  'valeur' => 18.2, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(4),  'valeur' => 17.5, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(3),  'valeur' => 17.0, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(2),  'valeur' => 16.8, 'capteur_id' => $capteur->id],
            ['date' => now()->subHours(1),  'valeur' => 16.5, 'capteur_id' => $capteur->id],
        ];

        foreach ($mesures as $m) {
            // Idempotence : on vérifie par la date et le capteur pour éviter les doublons
            Mesure::updateOrCreate(
                ['date' => $m['date'], 'capteur_id' => $m['capteur_id']],
                $m
            );
        }
    }
}
