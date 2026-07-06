<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

class AgroApiToken
{
    private const TOKEN_TTL_SECONDS = 28800;

    public static function issue(User $user, string $sessionId): string
    {
        $payload = [
            'sub' => $user->id,
            'session_id' => $sessionId,
            'iat' => now()->timestamp,
            'exp' => now()->timestamp + self::TOKEN_TTL_SECONDS,
            'nonce' => Str::random(16),
        ];

        $encodedPayload = self::base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = self::sign($encodedPayload);

        return $encodedPayload . '.' . $signature;
    }

    public static function resolve(?string $authorizationHeader): ?User
    {
        if (! $authorizationHeader || ! str_starts_with($authorizationHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authorizationHeader, 7));
        $parts = explode('.', $token);

        if (count($parts) !== 2) {
            return null;
        }

        [$encodedPayload, $signature] = $parts;

        if (! hash_equals(self::sign($encodedPayload), $signature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);

        if (! is_array($payload) || empty($payload['sub']) || empty($payload['exp']) || $payload['exp'] < now()->timestamp) {
            return null;
        }

        $user = User::with('profil')->whereKey($payload['sub'])->whereNotNull('email_verified_at')->first();

        if ($user) {
            $user->setAttribute('audit_session_id', $payload['session_id'] ?? null);
        }

        return $user;
    }

    private static function sign(string $payload): string
    {
        return self::base64UrlEncode(hash_hmac('sha256', $payload, self::secret(), true));
    }

    private static function secret(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            return base64_decode(substr($key, 7)) ?: $key;
        }

        return $key;
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        $padded = str_pad($value, strlen($value) + (4 - strlen($value) % 4) % 4, '=');
        return base64_decode(strtr($padded, '-_', '+/')) ?: '';
    }
}

