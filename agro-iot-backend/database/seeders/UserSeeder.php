<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profil;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        // 1. Création de l'Administrateur
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@agri-iot.com',
            'password' => Hash::make('password123'), // Haché ici
        ]);

        Profil::create([
            'user_id' => $admin->id,
            'nom' => 'Administrateur',
            'postnom' => 'System',
            'prenom' => 'Root',
            'telephone' => '+243999999999',
            'role' => 'Administrateur',
        ]);

        // 2. Création de l'Utilisateur (Agriculteur)
        $user = User::create([
            'name' => 'Agriculteur',
            'email' => 'agriculteur@agri-iot.com',
            'password' => Hash::make('password123'),
        ]);

        Profil::create([
            'user_id' => $user->id,
            'nom' => 'kizekele',
            'postnom' => 'Musaga',
            'prenom' => 'John',
            'telephone' => '+243855039424',
            'role' => 'Agriculteur',
        ]);
    }
}

