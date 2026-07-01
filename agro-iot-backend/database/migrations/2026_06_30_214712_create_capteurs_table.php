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
        Schema::create('capteurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');       // ex: "Capteur humidité Sol Nord"
            $table->string('type');      // ex: "DHT11", "Capteur Humidité"
            $table->string('statut');    // ex: "actif", "inactif", "en maintenance"
            $table->string('etat');
            $table->dateTime('date_intallation');
            $table->string('valeur_mesure');
            // Ajout de la clé étrangère vers la table 'seuils'
            $table->foreignId('seuil_id')->constrained('seuils')->onDelete('cascade');
            
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
        Schema::dropIfExists('capteurs');
    }
};
