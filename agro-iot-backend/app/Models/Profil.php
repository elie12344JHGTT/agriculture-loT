<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profil extends Model
{
    /** @use HasFactory<\Database\Factories\ProfilFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'user_id',
        'nom',
        'postnom',
        'prenom',
        'telephone',
        'role'
    ];
    public function user() {
        return $this->belongsTo(User::class);
    }
}
