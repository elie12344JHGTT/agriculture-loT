<?php

namespace App\Console\Commands;

use App\Services\MqttService;
use Illuminate\Console\Command;

class ListenToMqttBroker extends Command
{
    protected $signature = 'mqtt:listen';

    protected $description = 'Ecoute en continu le broker MQTT et persiste les mesures recues par les capteurs';

    public function handle(MqttService $mqtt): int
    {
        $this->info('Démarrage de l\'écoute MQTT en cours...');

        try {
            $mqtt->listen();
        } catch (\Throwable $e) {
            $this->error('Erreur lors de l\'écoute MQTT : ' . $e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
