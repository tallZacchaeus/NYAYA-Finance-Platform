<?php

use App\Modules\Event\Controllers\EventController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('events')->group(function () {
    Route::get('/', [EventController::class, 'index']);
    Route::post('/', [EventController::class, 'store'])->middleware('permission:events.manage');
    Route::get('{id}', [EventController::class, 'show']);
    Route::put('{id}', [EventController::class, 'update'])->middleware('permission:events.manage');
    Route::get('{id}/dashboard', [EventController::class, 'dashboard']);
});
