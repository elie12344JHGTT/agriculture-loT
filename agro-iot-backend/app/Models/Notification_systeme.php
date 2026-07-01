<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification_systeme extends Model
{
    
    //
    protected $fillable = [
        'id',
        'contenu',
        'canal',
        'statut',
        'date_envoi',
        'type_notif',
    ];
}
