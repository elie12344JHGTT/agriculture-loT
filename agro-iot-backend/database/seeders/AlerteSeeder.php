<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Actionneur;
use App\Models\Parcelle;
class AlerteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $parcelles = Parcelle::all();

        if ($parcelles->isEmpty()) {
            $this->command->error("Aucune parcelle trouvée. Veuillez lancer ParcelleSeeder avant !");
            return;
        }

        $types = ['Pompe', 'Vanne', 'Ventilateur', 'Relais'];
        $statuts = ['actif', 'inactif', 'maintenance'];

        for ($i = 1; $i <= 10; $i++) {
            Actionneur::create([
                'nom' => "Actionneur " . ($types[array_rand($types)]) . " #{$i}",
                'type' => $types[array_rand($types)],
                'statut' => $statuts[array_rand($statuts)],
                'emplacement' => "Emplacement " . chr(65 + rand(0, 5)), // Génère A, B, C...
                'parcelle_id' => $parcelles->random()->id, // Liaison aléatoire à une parcelle existante
            ]);
        }
    }
    
}
