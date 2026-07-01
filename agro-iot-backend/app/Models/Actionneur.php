<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Actionneur extends Model
{
    /** @use HasFactory<\Database\Factories\ActionneurFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'nom',
        'type',
        'statut',
        'emplacement',
        'parcelle_id',

    ];
    public function actions() {
        return $this->hasMany(Action::class);
    }
    public function parcelle() {
        return $this->belongsTo(Parcelle::class);
    }
}
