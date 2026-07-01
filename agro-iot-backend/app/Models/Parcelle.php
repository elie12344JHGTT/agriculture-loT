<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Parcelle extends Model
{
    /** @use HasFactory<\Database\Factories\ParcelleFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'nom',
        'superficie',
        'type_culture',
        'localisation',
    ];
    // Une parcelle possède plusieurs capteurs
    public function capteurs() {
        return $this->hasMany(Capteur::class);
    }

    // Une parcelle possède plusieurs actionneurs
    public function actionneurs() {
        return $this->hasMany(Actionneur::class);
    }
}
