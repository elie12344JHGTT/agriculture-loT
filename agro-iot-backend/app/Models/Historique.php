<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Historique extends Model
{
    protected $fillable = [
        'id',
        'type_evenement',
        'description',
        'source',
        'niveau',
        'contenu',
        'date_evenement',
        'action_id',

    ];
    public function action()
    {
        // Un historique appartient à une action précise
        return $this->belongsTo(Action::class);
    }
}
