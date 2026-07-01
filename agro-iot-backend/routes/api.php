<?php
use Illuminate\Support\Facades\Route;

// routes/api.php

Route::get('/test-connection', function () {
    return response()->json([
        'message' => 'Connexion réussie avec Laravel !',
        'status' => 'success'
    ]);
});