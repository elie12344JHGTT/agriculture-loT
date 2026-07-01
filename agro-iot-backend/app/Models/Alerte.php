<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Notification_systeme as NotificationSysteme;

class Alerte extends Model
{
    /** @use HasFactory<\Database\Factories\AlerteFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'type_alerte',
        'message',
        'niveau_criticite',
        'statut',
        'date',
        'notification_id',
        'priorite',
    ];

    public function mesure() {
        return $this->belongsTo(Mesure::class);
    }

    public function notification() {
        return $this->belongsTo(NotificationSysteme::class, 'notification_id');
    }
}
