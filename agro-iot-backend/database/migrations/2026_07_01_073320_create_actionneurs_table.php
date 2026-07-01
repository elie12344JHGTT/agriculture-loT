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
        Schema::create('actionneurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');        // ex: "Pompe principale", "Vanne secteur 1"
            $table->string('type');       // ex: "Relais", "Moteur"
            $table->string('statut'); // ex: "on", "off"
            $table->string('emplacement'); // ex: "Zone A", "Serre 2"
            // Ajout de la clé étrangère vers la table 'parcelles'
            $table->foreignId('parcelle_id')->constrained('parcelles')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actionneurs');
    }
};
