<?php

$frontendUrls = array_filter(array_map(
    'trim',
    explode(',', env('FRONTEND_URLS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'))
));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | FRONTEND_URLS peut contenir plusieurs domaines separes par des virgules.
    | Exemple Railway/Vercel :
    | FRONTEND_URLS=https://agro-iot.vercel.app,http://localhost:5174
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $frontendUrls,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
