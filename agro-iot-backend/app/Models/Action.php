<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Action extends Model
{
    /** @use HasFactory<\Database\Factories\ActionFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'nom',
        'type',
        'statut',
        'duree',
        'actionneur_id',
        'date_declenchement',
        'source',
    ];
    public function historiques()
    {
        // Une action a plusieurs entrées dans l'historique
        return $this->hasMany(Historique::class);
    }
    public function actionneur() {
        return $this->belongsTo(Actionneur::class);
    }
}
