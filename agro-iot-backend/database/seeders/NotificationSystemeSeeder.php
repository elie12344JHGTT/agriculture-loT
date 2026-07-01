<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Notification_systeme;

class NotificationSystemeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
public function run(): void
    {
        $notifications = [
            ['contenu' => 'Taux humidité critique', 'canal' => 'SMS', 'statut' => 'envoyé', 'date_envoi' => now(), 'type_notif' => 'alerte'],
            ['contenu' => 'Batterie faible - Capteur A', 'canal' => 'Email', 'statut' => 'en attente', 'date_envoi' => now(), 'type_notif' => 'maintenance'],
            ['contenu' => 'Irrigation activée', 'canal' => 'Push', 'statut' => 'envoyé', 'date_envoi' => now()->subHours(1), 'type_notif' => 'info'],
            ['contenu' => 'Température élevée', 'canal' => 'SMS', 'statut' => 'envoyé', 'date_envoi' => now()->subHours(2), 'type_notif' => 'alerte'],
            ['contenu' => 'Mise à jour système', 'canal' => 'Email', 'statut' => 'envoyé', 'date_envoi' => now()->subDays(1), 'type_notif' => 'info'],
            ['contenu' => 'Calibrage requis', 'canal' => 'Push', 'statut' => 'en attente', 'date_envoi' => now()->subDays(1), 'type_notif' => 'maintenance'],
            ['contenu' => 'Débit eau anormal', 'canal' => 'SMS', 'statut' => 'envoyé', 'date_envoi' => now()->subDays(2), 'type_notif' => 'alerte'],
            ['contenu' => 'Rapport hebdomadaire', 'canal' => 'Email', 'statut' => 'envoyé', 'date_envoi' => now()->subDays(3), 'type_notif' => 'info'],
            ['contenu' => 'Capteur hors ligne', 'canal' => 'SMS', 'statut' => 'en attente', 'date_envoi' => now()->subDays(4), 'type_notif' => 'alerte'],
            ['contenu' => 'Fin de cycle irrigation', 'canal' => 'Push', 'statut' => 'envoyé', 'date_envoi' => now()->subDays(5), 'type_notif' => 'info'],
        ];

        foreach ($notifications as $notif) {
            // Utilisation de updateOrCreate pour éviter les doublons sur le contenu
            Notification_systeme::updateOrCreate(
                ['contenu' => $notif['contenu']], 
                $notif
            );
        }
    }
}
