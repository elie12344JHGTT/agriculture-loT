<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([
            // 1. Tables indépendantes (Parents de base)
            UserSeeder::class, 
            ParcelleSeeder::class,
            SeuilSeeder::class,
            NotificationSystemeSeeder::class, // Dépend de rien
            
            // 2. Tables de niveau 2 (Dépendent de Parcelle ou Seuil)
            CapteurSeeder::class,   // Dépend de Parcelle et Seuil
            ActionneurSeeder::class, // Dépend de Parcelle
            ScriptSeeder::class,  // Dépend de rien, mais liée aux actions
            
            // 3. Tables de niveau 3 (Dépendent des autres)
            MesureSeeder::class,    // Dépend de Capteur
            AlerteSeeder::class,    // Dépend de Mesure et NotificationSysteme
            ActionSeeder::class,    // Dépend de Actionneur et Commande

            // 4. Le maillon final (Dépend de Action)
            HistoriqueSeeder::class,
        ]);

    }
}
