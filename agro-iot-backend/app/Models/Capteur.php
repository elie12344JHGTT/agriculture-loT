<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Capteur extends Model
{
    /** @use HasFactory<\Database\Factories\CapteurFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'nom',
        'type',
        'statut',
        'etat',
        'date_intallation',
        'seuil_id',
        'valeur_mesure',
        'parcelle_id'
    ];
    public function parcelle() {
        return $this->belongsTo(Parcelle::class);
    }
    // Relation : Un capteur appartient à un seuil
    public function seuil()
    {
        return $this->belongsTo(Seuil::class);
    }
    public function mesures() {
        return $this->hasMany(Mesure::class);
    }
}
