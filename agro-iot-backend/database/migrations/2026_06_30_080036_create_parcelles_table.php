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
        Schema::create('parcelles', function (Blueprint $table) {
            $table->id();
            $table->string('nom');        // ex: "Parcelle Nord", "Serre Tomates"
            $table->string('superficie'); // ex: "500m²"
            $table->string('type_culture');    // ex: "Maïs", "Tomates"
            $table->string('localisation');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parcelles');
    }
};
