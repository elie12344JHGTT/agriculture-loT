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
        Schema::create('seuils', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); // ex: "Seuil Humidité Zone A"
            $table->float('valeur_min');
            $table->float('valeur_max');
            $table->string('unite'); // ex: "%", "°C"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seuils');
    }
};
