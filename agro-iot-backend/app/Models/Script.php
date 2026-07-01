<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Script extends Model
{
    /** @use HasFactory<\Database\Factories\ScriptFactory> */
    use HasFactory;
    protected $fillable = [
        'id',
        'code',
        'description',
    ];
}
