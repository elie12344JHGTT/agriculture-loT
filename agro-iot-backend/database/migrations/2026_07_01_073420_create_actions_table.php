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
        Schema::create('actions', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); // ex: "Pompe Eau A"
            $table->string('type'); // ex: "Relais", "Vanne"
            $table->string('statut'); // On/Off
            $table->integer('duree')->nullable(); // Durée en secondes ou minutes
            $table->timestamp('date_declenchement')->nullable();
            $table->string('source'); // ex: 'Automatique', 'Manuel', 'API'
            // La clé étrangère lie l'action à l'actionneur spécifique
            $table->foreignId('actionneur_id')->constrained('actionneurs')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actions');
    }
};
