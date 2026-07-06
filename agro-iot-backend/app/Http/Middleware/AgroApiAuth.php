<?php

namespace App\Http\Middleware;

use App\Support\AgroApiToken;
use Closure;
use Illuminate\Http\Request;

class AgroApiAuth
{
    public function handle(Request $request, Closure $next)
    {
        $user = AgroApiToken::resolve($request->header('Authorization'));

        if (! $user) {
            return response()->json([
                'message' => 'Authentification requise',
            ], 401);
        }

        $request->attributes->set('agro_user', $user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}

