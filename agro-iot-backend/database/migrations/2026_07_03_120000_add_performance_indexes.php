<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mesures', function (Blueprint $table) {
            $table->index('date', 'mesures_date_index');
            $table->index(['capteur_id', 'date'], 'mesures_capteur_date_index');
        });

        Schema::table('alertes', function (Blueprint $table) {
            $table->index('date', 'alertes_date_index');
            $table->index('statut', 'alertes_statut_index');
            $table->index(['statut', 'date'], 'alertes_statut_date_index');
            $table->index('notification_id', 'alertes_notification_index');
        });

        Schema::table('actions', function (Blueprint $table) {
            $table->index('date_declenchement', 'actions_date_declenchement_index');
            $table->index('actionneur_id', 'actions_actionneur_index');
            $table->index(['actionneur_id', 'date_declenchement'], 'actions_actionneur_date_index');
        });

        Schema::table('historiques', function (Blueprint $table) {
            $table->index('date_evenement', 'historiques_date_evenement_index');
            $table->index('action_id', 'historiques_action_index');
            $table->index(['action_id', 'date_evenement'], 'historiques_action_date_index');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('occurred_at', 'audit_logs_occurred_at_index');
            $table->index('user_id', 'audit_logs_user_index');
            $table->index(['user_id', 'occurred_at'], 'audit_logs_user_occurred_index');
            $table->index('status', 'audit_logs_status_index');
        });

        Schema::table('profils', function (Blueprint $table) {
            $table->index('role', 'profils_role_index');
        });
    }

    public function down(): void
    {
        Schema::table('profils', function (Blueprint $table) {
            $table->dropIndex('profils_role_index');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_occurred_at_index');
            $table->dropIndex('audit_logs_user_index');
            $table->dropIndex('audit_logs_user_occurred_index');
            $table->dropIndex('audit_logs_status_index');
        });

        Schema::table('historiques', function (Blueprint $table) {
            $table->dropIndex('historiques_date_evenement_index');
            $table->dropIndex('historiques_action_index');
            $table->dropIndex('historiques_action_date_index');
        });

        Schema::table('actions', function (Blueprint $table) {
            $table->dropIndex('actions_date_declenchement_index');
            $table->dropIndex('actions_actionneur_index');
            $table->dropIndex('actions_actionneur_date_index');
        });

        Schema::table('alertes', function (Blueprint $table) {
            $table->dropIndex('alertes_date_index');
            $table->dropIndex('alertes_statut_index');
            $table->dropIndex('alertes_statut_date_index');
            $table->dropIndex('alertes_notification_index');
        });

        Schema::table('mesures', function (Blueprint $table) {
            $table->dropIndex('mesures_date_index');
            $table->dropIndex('mesures_capteur_date_index');
        });
    }
};
