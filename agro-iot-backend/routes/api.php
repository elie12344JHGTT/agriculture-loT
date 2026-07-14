<?php

use App\Models\Action;
use App\Models\Actionneur;
use App\Models\User;
use App\Models\Profil;
use App\Models\Alerte;
use App\Models\Historique;
use App\Models\Mesure;
use App\Models\Notification_systeme as NotificationSysteme;
use App\Models\Seuil;
use App\Models\Script;
use App\Support\AgroApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

if (! function_exists('agro_audit_log')) {
    function agro_audit_log(array $data): ?int
    {
        if (! Schema::hasTable('audit_logs')) {
            return null;
        }

        $status = $data['status'] ?? 'success';
        $dedupeSeconds = (int) ($data['dedupe_seconds'] ?? 5);

        if ($dedupeSeconds > 0 && $status !== 'failed') {
            $sameNullableValue = function ($query, string $column, $value) {
                if ($value === null || $value === '') {
                    return $query->whereNull($column);
                }

                return $query->where($column, $value);
            };

            $existingId = DB::table('audit_logs')
                ->where('occurred_at', '>=', now()->subSeconds($dedupeSeconds))
                ->where(function ($query) use ($sameNullableValue, $data) {
                    $sameNullableValue($query, 'session_id', $data['session_id'] ?? null);
                })
                ->where(function ($query) use ($sameNullableValue, $data) {
                    $sameNullableValue($query, 'user_id', $data['user_id'] ?? null);
                })
                ->where(function ($query) use ($sameNullableValue, $data) {
                    $sameNullableValue($query, 'user_email', $data['user_email'] ?? null);
                })
                ->where(function ($query) use ($sameNullableValue, $data) {
                    $sameNullableValue($query, 'page', $data['page'] ?? null);
                })
                ->where('action', $data['action'] ?? 'Action utilisateur')
                ->where(function ($query) use ($sameNullableValue, $data) {
                    $sameNullableValue($query, 'details', $data['details'] ?? null);
                })
                ->where('status', $status)
                ->value('id');

            if ($existingId) {
                return (int) $existingId;
            }
        }

        return DB::table('audit_logs')->insertGetId([
            'session_id' => $data['session_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'user_name' => $data['user_name'] ?? null,
            'user_email' => $data['user_email'] ?? null,
            'user_role' => $data['user_role'] ?? null,
            'page' => $data['page'] ?? null,
            'action' => $data['action'] ?? 'Action utilisateur',
            'details' => $data['details'] ?? null,
            'status' => $data['status'] ?? 'success',
            'ip_address' => $data['ip_address'] ?? null,
            'occurred_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
if (! function_exists('agro_require_role')) {
    function agro_require_role(Request $request, array $roles)
    {
        $user = $request->attributes->get('agro_user') ?? $request->user();
        $role = $user?->profil?->role;

        if (! $user || ! in_array($role, $roles, true)) {
            return response()->json([
                'message' => 'Acces refuse pour ce role',
            ], 403);
        }

        return null;
    }
}

Route::post('/auth/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = User::with('profil')->where('email', $credentials['email'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        agro_audit_log([
            'user_email' => $credentials['email'],
            'page' => 'Login',
            'action' => 'Tentative de connexion echouee',
            'details' => 'Email ou mot de passe incorrect',
            'status' => 'failed',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Email ou mot de passe incorrect',
        ], 401);
    }

    if (! $user->email_verified_at) {
        agro_audit_log([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'user_role' => $user->profil?->role,
            'page' => 'Login',
            'action' => 'Tentative de connexion refusee',
            'details' => 'Compte inactif ou en attente de validation',
            'status' => 'failed',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Compte inactif ou en attente de validation',
        ], 403);
    }

    $auditSessionId = 'SES-' . now()->format('YmdHis') . '-' . $user->id . '-' . substr(md5((string) microtime(true)), 0, 6);

    agro_audit_log([
        'session_id' => $auditSessionId,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'user_role' => $user->profil?->role ?? 'Agriculteur',
        'page' => 'Login',
        'action' => 'Connexion reussie',
        'details' => 'Utilisateur connecte au logiciel',
        'status' => 'success',
        'ip_address' => $request->ip(),
    ]);

    return response()->json([
        'token' => AgroApiToken::issue($user, $auditSessionId),
        'user' => [
            'id' => $user->id,
            'id_user' => 'USR-' . str_pad((string) $user->id, 3, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'nom' => $user->name,
            'email' => $user->email,
            'role' => $user->profil?->role ?? 'Agriculteur',
            'status' => 'Actif',
            'audit_session_id' => $auditSessionId,
        ],
    ]);
})->middleware('throttle:5,1');

Route::middleware('agro.auth')->group(function () {
Route::get('/auth/me', function (Request $request) {
    $user = $request->attributes->get('agro_user');

    return response()->json([
        'user' => [
            'id' => $user->id,
            'id_user' => 'USR-' . str_pad((string) $user->id, 3, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'nom' => $user->name,
            'email' => $user->email,
            'role' => $user->profil?->role ?? 'Agriculteur',
            'status' => 'Actif',
            'audit_session_id' => $user->audit_session_id,
        ],
    ]);
});
Route::post('/auth/logout', function (Request $request) {
    $user = $request->attributes->get('agro_user');

    agro_audit_log([
        'session_id' => $request->input('session_id'),
        'user_id' => $user?->id,
        'user_name' => $user?->name,
        'user_email' => $user?->email,
        'user_role' => $user?->profil?->role,
        'page' => 'Login',
        'action' => 'Deconnexion',
        'details' => 'Utilisateur deconnecte du logiciel',
        'status' => 'success',
        'ip_address' => $request->ip(),
        'dedupe_seconds' => 60,
    ]);

    return response()->json([
        'success' => true,
    ]);
});

Route::post('/audit-logs', function (Request $request) {
    $data = $request->validate([
        'page' => ['nullable', 'string', 'max:255'],
        'action' => ['required', 'string', 'max:255'],
        'details' => ['nullable', 'string'],
        'status' => ['nullable', 'string', 'max:255'],
    ]);

    $user = $request->attributes->get('agro_user');

    $id = agro_audit_log([
        'session_id' => $request->input('session_id'),
        'user_id' => $user?->id,
        'user_name' => $user?->name,
        'user_email' => $user?->email,
        'user_role' => $user?->profil?->role,
        'page' => $data['page'] ?? null,
        'action' => $data['action'],
        'details' => $data['details'] ?? null,
        'status' => $data['status'] ?? 'success',
        'ip_address' => $request->ip(),
    ]);

    return response()->json([
        'success' => true,
        'id_log' => $id ? 'AUD-' . str_pad((string) $id, 3, '0', STR_PAD_LEFT) : null,
    ], 201);
});
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

Route::get('/alerts/active', function (Request $request) {
    $limit = min((int) $request->query('limit', 100), 500);
    $formatDate = fn ($value) => $value ? date('Y-m-d H:i', strtotime((string) $value)) : '--';

    return response()->json(
        Alerte::with('notification')
            ->where('statut', false)
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
                'niveau_criticite' => $alerte->niveau_criticite,
                'statut' => $alerte->statut ? 'Traitee' : 'Ouverte',
                'date' => $formatDate($alerte->date),
                'priorite' => $alerte->priorite,
                'action' => $alerte->notification?->contenu ?? 'Verification recommandee',
            ])
            ->values()
    );
});

Route::put('/alerts/{alert}/resolve', function (Request $request, Alerte $alert) {
    if ($response = agro_require_role($request, ['Admin', 'Technicien'])) {
        return $response;
    }
    $alert->update(['statut' => true]);

    return response()->json([
        'success' => true,
        'id_alerte' => 'ALT-' . str_pad((string) $alert->id, 3, '0', STR_PAD_LEFT),
        'statut' => 'Traitee',
    ]);
});

Route::get('/thresholds', function () {
    return response()->json(
        Seuil::query()
            ->orderBy('nom')
            ->get()
            ->map(fn ($seuil) => [
                'id' => $seuil->id,
                'key' => 'seuil_' . $seuil->id,
                'label' => $seuil->nom,
                'value' => $seuil->valeur_min,
                'min' => $seuil->valeur_min,
                'max' => $seuil->valeur_max,
                'unit' => $seuil->unite,
                'rule' => 'Valeur attendue entre ' . $seuil->valeur_min . ' et ' . $seuil->valeur_max . ' ' . $seuil->unite,
            ])
            ->values()
    );
});

Route::put('/thresholds', function (Request $request) {
    if ($response = agro_require_role($request, ['Admin', 'Technicien'])) {
        return $response;
    }
    $rows = collect($request->json()->all());

    $updatedRows = $rows->map(function ($row) {
        $id = $row['id'] ?? (str_starts_with((string) ($row['key'] ?? ''), 'seuil_') ? substr((string) $row['key'], 6) : null);
        $seuil = $id ? Seuil::find($id) : null;

        if (! $seuil) {
            return null;
        }

        $seuil->update([
            'valeur_min' => array_key_exists('value', $row) ? (float) $row['value'] : $seuil->valeur_min,
        ]);

        return [
            'id' => $seuil->id,
            'key' => 'seuil_' . $seuil->id,
            'label' => $seuil->nom,
            'value' => $seuil->valeur_min,
            'min' => $seuil->valeur_min,
            'max' => $seuil->valeur_max,
            'unit' => $seuil->unite,
            'rule' => 'Valeur attendue entre ' . $seuil->valeur_min . ' et ' . $seuil->valeur_max . ' ' . $seuil->unite,
        ];
    })->filter()->values();

    return response()->json($updatedRows);
});


Route::get('/automation-rules', function () {
    return response()->json(
        Script::query()
            ->orderBy('code')
            ->get()
            ->map(fn ($script) => [
                'id' => $script->id,
                'condition' => $script->code,
                'action' => $script->description,
                'status' => 'Configure',
            ])
            ->values()
    );
});
Route::get('/notifications/channels', function () {
    return response()->json(
        NotificationSysteme::query()
            ->orderByDesc('date_envoi')
            ->limit(100)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'channel' => $notification->canal,
                'recipient' => $notification->contenu,
                'status' => $notification->statut,
                'type' => $notification->type_notif,
                'date' => $notification->date_envoi ? date('Y-m-d H:i', strtotime((string) $notification->date_envoi)) : '--',
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

Route::get('/users', function (Request $request) {
    if ($response = agro_require_role($request, ['Admin'])) {
        return $response;
    }
    $limit = min((int) $request->query('limit', 200), 500);
    $search = strtolower((string) $request->query('search', ''));

    $query = User::with('profil')->orderBy('name');

    if ($search !== '') {
        $query->where(function ($builder) use ($search) {
            $builder->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"])
                ->orWhereHas('profil', function ($profileQuery) use ($search) {
                    $profileQuery->whereRaw('LOWER(role) LIKE ?', ["%{$search}%"]);
                });
        });
    }

    $rows = $query->limit($limit)->get()->map(fn ($user) => [
        'id' => $user->id,
        'id_user' => 'USR-' . str_pad((string) $user->id, 3, '0', STR_PAD_LEFT),
        'nom' => $user->name,
        'email' => $user->email,
        'role' => $user->profil?->role ?? 'Agriculteur',
        'status' => $user->email_verified_at ? 'Actif' : 'Invite',
        'password' => '',
    ])->values();

    return response()->json([
        'rows' => $rows,
        'total' => $rows->count(),
    ]);
});

Route::post('/users', function (Request $request) {
    if ($response = agro_require_role($request, ['Admin'])) {
        return $response;
    }
    $data = $request->validate([
        'nom' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'role' => ['required', 'string', 'max:255'],
        'status' => ['nullable', 'string', 'max:255'],
        'password' => ['required', 'string', 'min:4'],
    ]);

    $user = User::create([
        'name' => $data['nom'],
        'email' => $data['email'],
        'password' => Hash::make($data['password']),
    ]);
    $user->email_verified_at = ($data['status'] ?? 'Invite') === 'Actif' ? now() : null;
    $user->save();

    Profil::create([
        'user_id' => $user->id,
        'nom' => $data['nom'],
        'postnom' => '-',
        'prenom' => '-',
        'telephone' => '-',
        'role' => $data['role'],
    ]);

    $user->load('profil');

    return response()->json([
        'id' => $user->id,
        'id_user' => 'USR-' . str_pad((string) $user->id, 3, '0', STR_PAD_LEFT),
        'nom' => $user->name,
        'email' => $user->email,
        'role' => $user->profil?->role ?? $data['role'],
        'status' => $user->email_verified_at ? 'Actif' : 'Invite',
        'password' => '',
    ], 201);
});

Route::put('/users/{user}', function (Request $request, User $user) {
    if ($response = agro_require_role($request, ['Admin'])) {
        return $response;
    }
    $data = $request->validate([
        'nom' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
        'role' => ['required', 'string', 'max:255'],
        'status' => ['nullable', 'string', 'max:255'],
        'password' => ['nullable', 'string', 'min:4'],
    ]);

    $payload = [
        'name' => $data['nom'],
        'email' => $data['email'],
    ];

    if (! empty($data['password'])) {
        $payload['password'] = Hash::make($data['password']);
    }

    $user->update($payload);
    $user->email_verified_at = ($data['status'] ?? 'Invite') === 'Actif' ? ($user->email_verified_at ?? now()) : null;
    $user->save();

    Profil::updateOrCreate(
        ['user_id' => $user->id],
        [
            'nom' => $data['nom'],
            'postnom' => $user->profil?->postnom ?? '-',
            'prenom' => $user->profil?->prenom ?? '-',
            'telephone' => $user->profil?->telephone ?? '-',
            'role' => $data['role'],
        ]
    );

    $user->load('profil');

    return response()->json([
        'id' => $user->id,
        'id_user' => 'USR-' . str_pad((string) $user->id, 3, '0', STR_PAD_LEFT),
        'nom' => $user->name,
        'email' => $user->email,
        'role' => $user->profil?->role ?? $data['role'],
        'status' => $user->email_verified_at ? 'Actif' : 'Invite',
        'password' => '',
    ]);
});

Route::delete('/users/{user}', function (Request $request, User $user) {
    if ($response = agro_require_role($request, ['Admin'])) {
        return $response;
    }
    $user->delete();

    return response()->json([
        'success' => true,
    ]);
});

Route::get('/access-logs', function (Request $request) {
    if ($response = agro_require_role($request, ['Admin'])) {
        return $response;
    }
    $limit = min((int) $request->query('limit', 200), 500);
    $search = strtolower((string) $request->query('search', ''));

    $rows = collect();

    if (Schema::hasTable('audit_logs')) {
        $rows = DB::table('audit_logs')
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn ($log) => [
                'id_log' => 'AUD-' . str_pad((string) $log->id, 3, '0', STR_PAD_LEFT),
                'session_id' => $log->session_id,
                'utilisateur' => $log->user_name ?? $log->user_email ?? 'Utilisateur inconnu',
                'user_role' => $log->user_role ?? '--',
                'heure_connexion' => $log->occurred_at ? date('Y-m-d H:i', strtotime((string) $log->occurred_at)) : '--',
                'heure_deconnexion' => '--',
                'page' => $log->page ?? '--',
                'commande' => $log->action,
                'commande_type' => $log->status === 'failed' ? 'failed' : ($log->action === 'Connexion reussie' ? 'login' : ($log->action === 'Deconnexion' ? 'logout' : 'action')),
                'details' => $log->details ?? '--',
                'statut' => $log->status ?? 'success',
            ]);
    }

    $rows = $rows
        ->filter(function ($row) use ($search) {
            if ($search === '') {
                return true;
            }

            return str_contains(strtolower(implode(' ', $row)), $search);
        })
        ->take($limit)
        ->values();

    return response()->json([
        'rows' => $rows,
        'total' => $rows->count(),
    ]);
});
Route::post('/actuators/{actuator}', function (Request $request, string $actuator) {
    if ($response = agro_require_role($request, ['Admin', 'Technicien'])) {
        return $response;
    }
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
});

