<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
        schema::create('notification_systemes', function (Blueprint $table) {
            $table->id();
            $table->string('contenu');
            $table->string('canal');
            $table->string('statut');// Pour le suivi de lecture
            $table->dateTime('date_envoi');
            $table->string('type_notif');// ex: 'alerte', 'info', 'erreur'
            

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
