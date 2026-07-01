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
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->string('type_alerte');
            $table->string('message');
            $table->string('niveau_criticite');
            $table->boolean('statut')->default(false);// Si l'utilisateur a vu l'alerte
            $table->dateTime('date');
            $table->foreignId('notification_id')->constrained('notification_systemes')->onDelete('cascade');
            $table->string('priorite'); // ex: 'haute', 'moyenne', 'basse'
            $table->timestamps();
                
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};
