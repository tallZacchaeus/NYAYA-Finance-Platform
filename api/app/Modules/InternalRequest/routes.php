<?php

use App\Modules\InternalRequest\Controllers\InternalRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('internal-requests')->group(function () {
    Route::get('/',                [InternalRequestController::class, 'index']);
    Route::post('/',               [InternalRequestController::class, 'store'])->middleware('permission:internal-requests.create');
    Route::get('{id}',             [InternalRequestController::class, 'show']);
    Route::put('{id}',             [InternalRequestController::class, 'update']);
    Route::delete('{id}',          [InternalRequestController::class, 'destroy']);
    Route::post('{id}/submit',     [InternalRequestController::class, 'submit']);
    Route::post('{id}/review',     [InternalRequestController::class, 'review'])->middleware('permission:internal-requests.review');
    Route::post('{id}/documents',  [InternalRequestController::class, 'uploadDocument']);
});
