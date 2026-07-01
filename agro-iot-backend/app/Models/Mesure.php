<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mesure extends Model
{
    /** @use HasFactory<\Database\Factories\MesureFactory> */
    use HasFactory;

    protected $fillable = [
        'id',
        'date',
        'valeur',
        'capteur_id'
    ];

    public function capteur() {
        return $this->belongsTo(Capteur::class);
    }

    // Si une mesure peut générer une alerte directement
    public function alertes() {
        return $this->hasMany(Alerte::class);
    }
    }
