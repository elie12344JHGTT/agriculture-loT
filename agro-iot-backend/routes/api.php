<?php

use App\Models\Action;
use App\Models\Actionneur;
use App\Models\Alerte;
use App\Models\Mesure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test-connection', function () {
    return response()->json([
        'message' => 'Connexion reussie avec Laravel !',
        'status' => 'success'
    ]);
});

Route::get('/measurements/latest', function () {
    $latestMeasures = Mesure::with('capteur')
        ->orderByDesc('date')
        ->get()
        ->groupBy(fn ($mesure) => strtolower($mesure->capteur?->type ?? $mesure->capteur?->nom ?? 'capteur'))
        ->map(fn ($measures) => $measures->first());

    $findMeasure = function (array $keywords) use ($latestMeasures) {
        return $latestMeasures->first(function ($mesure, $sensorName) use ($keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($sensorName, strtolower($keyword))) {
                    return true;
                }
            }

            return false;
        });
    };

    $formatMeasure = function ($mesure, string $unit) {
        return [
            'value' => $mesure?->valeur ?? 0,
            'unit' => $unit,
            'status' => $mesure ? ($mesure->capteur?->statut ?? 'Recu') : '--',
            'date' => $mesure?->date,
        ];
    };

    return response()->json([
        'temperature' => $formatMeasure($findMeasure(['temperature', 'temp', 'dht']), 'C'),
        'air_humidity' => $formatMeasure($findMeasure(['humidite air', 'humidity air', 'air_humidity', 'dht']), '%'),
        'soil_humidity' => $formatMeasure($findMeasure(['soil', 'sol', 'humidite', 'moisture']), '%'),
        'co2' => $formatMeasure($findMeasure(['co2']), 'ppm'),
        'light' => $formatMeasure($findMeasure(['light', 'luminosite', 'bh1750']), 'lux'),
        'water_level' => $formatMeasure($findMeasure(['water', 'eau', 'niveau']), '%'),
    ]);
});

Route::get('/measurements/chart', function (Request $request) {
    $type = strtolower((string) $request->query('type', 'temperature'));

    $rows = Mesure::with('capteur')
        ->orderByDesc('date')
        ->limit(8)
        ->get()
        ->filter(function ($mesure) use ($type) {
            $sensorName = strtolower(($mesure->capteur?->type ?? '') . ' ' . ($mesure->capteur?->nom ?? ''));
            return $type === '' || str_contains($sensorName, $type) || str_contains($sensorName, 'dht');
        })
        ->sortBy('date')
        ->values();

    return response()->json([
        'labels' => $rows->map(fn ($mesure) => optional($mesure->date)->format('H:i') ?? date('H:i', strtotime($mesure->date)))->values(),
        'series' => $rows->map(fn ($mesure) => (float) $mesure->valeur)->values(),
        'unit' => $type === 'co2' ? 'ppm' : ($type === 'light' || $type === 'luminosite' ? 'lux' : ($type === 'temperature' ? 'C' : '%')),
    ]);
});

Route::get('/alerts/active', function () {
    return response()->json(
        Alerte::query()
            ->where('statut', false)
            ->orderByDesc('date')
            ->limit(3)
            ->get()
            ->map(fn ($alerte) => [
                'id_alerte' => $alerte->id,
                'type_alerte' => $alerte->type_alerte,
                'message' => $alerte->message,
                'niveau_criticite' => $alerte->niveau_criticite,
                'statut' => $alerte->statut ? 'Traitee' : 'Ouverte',
                'date' => $alerte->date,
                'priorite' => $alerte->priorite,
            ])
            ->values()
    );
});

Route::post('/actuators/{actuator}', function (Request $request, string $actuator) {
    $allowedActuators = [
        'irrigation' => ['pompe', 'irrigation'],
        'ventilation' => ['ventilateur', 'ventilation'],
        'light' => ['lampe', 'light', 'eclairage'],
    ];

    if (! array_key_exists($actuator, $allowedActuators)) {
        return response()->json([
            'success' => false,
            'message' => 'Actionneur inconnu',
        ], 404);
    }

    $command = $request->input('command', 'start');
    $source = $request->input('source', 'manual');
    $keywords = $allowedActuators[$actuator];

    $actionneur = Actionneur::query()
        ->where(function ($query) use ($keywords) {
            foreach ($keywords as $keyword) {
                $query->orWhere('nom', 'like', "%{$keyword}%")
                    ->orWhere('type', 'like', "%{$keyword}%");
            }
        })
        ->first();

    if (! $actionneur) {
        return response()->json([
            'success' => false,
            'message' => 'Aucun actionneur correspondant trouve',
            'status' => 'Actionneur manquant',
        ], 404);
    }

    $action = Action::create([
        'nom' => ucfirst($actuator),
        'type' => $actionneur->type,
        'statut' => $command === 'stop' ? 'off' : 'on',
        'duree' => null,
        'date_declenchement' => now(),
        'source' => $source,
        'actionneur_id' => $actionneur->id,
    ]);

    $actionneur->update([
        'statut' => $command === 'stop' ? 'off' : 'on',
    ]);

    return response()->json([
        'success' => true,
        'id_action' => 'ACT-' . str_pad((string) $action->id, 3, '0', STR_PAD_LEFT),
        'status' => 'Commande envoyee',
        'actionneur' => $actionneur->nom,
    ]);
});
