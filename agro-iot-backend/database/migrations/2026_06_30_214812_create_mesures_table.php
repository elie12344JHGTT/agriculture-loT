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
        Schema::create('mesures', function (Blueprint $table) {
            $table->id();
            $table->timestamp('date');
            $table->float('valeur');
        // Optionnel : relation vers le capteur correspondant
            $table->foreignId('capteur_id')->constrained('capteurs');
            $table->timestamps();
        });
    }
    

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mesures');
    }
};
