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
        $admin = User::updateOrCreate(
            ['email' => 'admin@agri-iot.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        Profil::updateOrCreate(
            ['user_id' => $admin->id],
            [
                'nom' => 'Administrateur',
                'postnom' => 'System',
                'prenom' => 'Root',
                'telephone' => '+243999999999',
                'role' => 'Administrateur',
            ]
        );

        // 2. Création de l'Utilisateur (Agriculteur)
        $user = User::updateOrCreate(
            ['email' => 'agriculteur@agri-iot.com'],
            [
                'name' => 'Agriculteur',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        Profil::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nom' => 'kizekele',
                'postnom' => 'Musaga',
                'prenom' => 'John',
                'telephone' => '+243855039424',
                'role' => 'Agriculteur',
            ]
        );
    }
}

