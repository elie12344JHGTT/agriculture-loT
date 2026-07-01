<?php

use App\Models\Action;
use App\Models\Actionneur;
use App\Models\Alerte;
use App\Models\Historique;
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

Route::get('/history/measurements', function (Request $request) {
    $limit = min((int) $request->query('limit', 200), 500);
    $type = strtolower((string) $request->query('type', ''));
    $date = $request->query('date');

    $query = Mesure::with('capteur.parcelle')->orderByDesc('date');

    if ($date) {
        $query->whereDate('date', $date);
    }

    $rows = $query->limit($limit)->get();

    if ($type !== '' && $type !== 'tous') {
        $rows = $rows->filter(function ($mesure) use ($type) {
            $sensorType = strtolower(($mesure->capteur?->type ?? '') . ' ' . ($mesure->capteur?->nom ?? ''));
            return str_contains($sensorType, $type);
        });
    }

    $formatDate = fn ($value) => $value ? date('Y-m-d H:i', strtotime((string) $value)) : '--';
    $formatUnit = function (?string $sensorType) {
        $sensorType = strtolower((string) $sensorType);
        return str_contains($sensorType, 'co2') ? 'ppm' : (str_contains($sensorType, 'luminosite') || str_contains($sensorType, 'light') ? 'lux' : (str_contains($sensorType, 'temperature') || str_contains($sensorType, 'temp') ? 'C' : '%'));
    };

    $formattedRows = $rows->values()->map(fn ($mesure) => [
        'id_mesure' => 'MES-' . str_pad((string) $mesure->id, 3, '0', STR_PAD_LEFT),
        'date_mesure' => $formatDate($mesure->date),
        'parcelle' => $mesure->capteur?->parcelle?->nom ?? '--',
        'capteur' => $mesure->capteur?->nom ?? '--',
        'type_mesure' => $mesure->capteur?->type ?? '--',
        'valeur' => $mesure->valeur,
        'unite' => $formatUnit($mesure->capteur?->type),
    ]);

    return response()->json([
        'rows' => $formattedRows,
        'total' => $formattedRows->count(),
    ]);
});

Route::get('/history/alerts', function (Request $request) {
    $limit = min((int) $request->query('limit', 200), 500);
    $formatDate = fn ($value) => $value ? date('Y-m-d H:i', strtotime((string) $value)) : '--';

    $rows = Alerte::with('notification')
        ->orderByDesc('date')
        ->limit($limit)
        ->get()
        ->map(fn ($alerte) => [
            'id_alerte' => 'ALT-' . str_pad((string) $alerte->id, 3, '0', STR_PAD_LEFT),
            'date_creation' => $formatDate($alerte->date),
            'parcelle' => '--',
            'type_alerte' => $alerte->type_alerte,
            'message' => $alerte->message,
            'niveau' => $alerte->niveau_criticite,
            'statut' => $alerte->statut ? 'Traitee' : 'Ouverte',
            'regle' => $alerte->notification?->type_notif ?? '--',
        ]);

    return response()->json([
        'rows' => $rows,
        'total' => $rows->count(),
    ]);
});

Route::get('/history/actions', function (Request $request) {
    $limit = min((int) $request->query('limit', 200), 500);
    $formatDate = fn ($value) => $value ? date('Y-m-d H:i', strtotime((string) $value)) : '--';

    $actionRows = Action::with('actionneur')
        ->orderByDesc('date_declenchement')
        ->limit($limit)
        ->get()
        ->map(fn ($action) => [
            'id_action' => 'ACT-' . str_pad((string) $action->id, 3, '0', STR_PAD_LEFT),
            'date_action' => $formatDate($action->date_declenchement),
            'actionneur' => $action->actionneur?->nom ?? $action->nom,
            'type_action' => $action->type,
            'source' => $action->source,
            'statut' => $action->statut,
            'utilisateur' => '--',
        ]);

    $historyRows = Historique::with('action.actionneur')
        ->orderByDesc('date_evenement')
        ->limit($limit)
        ->get()
        ->map(fn ($historique) => [
            'id_action' => 'HIS-' . str_pad((string) $historique->id, 3, '0', STR_PAD_LEFT),
            'date_action' => $formatDate($historique->date_evenement),
            'actionneur' => $historique->action?->actionneur?->nom ?? $historique->action?->nom ?? '--',
            'type_action' => $historique->type_evenement,
            'source' => $historique->source,
            'statut' => $historique->niveau,
            'utilisateur' => '--',
        ]);

    $rows = $actionRows->concat($historyRows)
        ->sortByDesc('date_action')
        ->take($limit)
        ->values();

    return response()->json([
        'rows' => $rows,
        'total' => $rows->count(),
    ]);
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


