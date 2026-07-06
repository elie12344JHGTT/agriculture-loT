<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AgroRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->attributes->get('agro_user') ?? $request->user();
        $role = $user?->profil?->role;

        if (! $user || ! in_array($role, $roles, true)) {
            return response()->json([
                'message' => 'Acces refuse pour ce role',
            ], 403);
        }

        return $next($request);
    }
}

