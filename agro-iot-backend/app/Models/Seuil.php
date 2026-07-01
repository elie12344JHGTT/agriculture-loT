<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seuil extends Model
{
    use HasFactory;
    protected $fillable = [
        'id',
        'nom',
        'valeur_min',
        'valeur_max',
        'unite',
    ];
}
