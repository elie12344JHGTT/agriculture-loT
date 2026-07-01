
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
        Schema::create('historiques', function (Blueprint $table) {
            $table->id();
            $table->string('type_evenement'); 
            $table->text('description');
            $table->string('source');
            $table->string('niveau');
            $table->string('contenu');
            // Ajout de la clé étrangère vers la table 'actions'
            $table->foreignId('action_id')->constrained('actions')->onDelete('cascade');
            $table->timestamp('date_evenement');
            $table->timestamps();
            

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historiques');
    }
};
