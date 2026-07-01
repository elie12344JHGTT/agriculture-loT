<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Action;
use App\Models\Actionneur;
use Carbon\Carbon;

class ActionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        // On récupère tous les actionneurs existants pour varier les liaisons
        $actionneurs = Actionneur::all();

        if ($actionneurs->isEmpty()) {
            $this->command->error("Aucun actionneur trouvé. Veuillez lancer ActionneurSeeder avant !");
            return;
        }

        $sources = ['Automatique', 'Manuel', 'API_System'];
        $types = ['Relais', 'Moteur', 'Pompe'];

        for ($i = 1; $i <= 10; $i++) {
            Action::create([
                'nom' => "Action #{$i}",
                'type' => $types[array_rand($types)],
                'statut' => ($i % 2 == 0) ? 'Terminé' : 'En cours',
                'duree' => rand(60, 3600), // Durée aléatoire entre 1 min et 1h
                'actionneur_id' => $actionneurs->random()->id, // Lien aléatoire vers un actionneur
                'date_declenchement' => Carbon::now()->subDays(rand(0, 7)), // Date sur la dernière semaine
                'source' => $sources[array_rand($sources)],
            ]);
        }
    }
}
