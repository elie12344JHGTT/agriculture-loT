<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Historique;
use App\Models\Action;

class HistoriqueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupère ou crée une action par défaut (plus court)
        $actionId = Action::firstOrCreate(['nom' => 'Action par défaut', 'type' => 'Relais', 'statut' => false, 'duree' => null, 'actionneur_id' => 1, 'date_declenchement' => null, 'source' => 'Automatique'])->id;

        $historiques = [
            ['type_evenement' => 'Connexion', 'description' => 'Utilisateur connecté', 'source' => 'Web', 'niveau' => 'info', 'contenu' => 'Connexion réussie', 'date_evenement' => now(), 'action_id' => $actionId],
            ['type_evenement' => 'Capteur', 'description' => 'Seuil critique atteint', 'source' => 'IoT', 'niveau' => 'alerte', 'contenu' => 'Humidité < 20%', 'date_evenement' => now(), 'action_id' => $actionId],
        ];

        foreach ($historiques as $item) {
            // updateOrCreate cherche par les deux premiers critères
            // et crée l'enregistrement s'il n'existe pas
            Historique::updateOrCreate(
                ['description' => $item['description'], 'type_evenement' => $item['type_evenement']],
                $item
            );
        }
    }
    
}
