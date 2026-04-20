<?php

use App\Modules\RequestType\Controllers\RequestTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('request-types')->group(function () {
    Route::get('/',        [RequestTypeController::class, 'index']);
    Route::post('/',       [RequestTypeController::class, 'store'])->middleware('permission:request-types.manage');
    Route::put('{id}',     [RequestTypeController::class, 'update'])->middleware('permission:request-types.manage');
    Route::delete('{id}',  [RequestTypeController::class, 'destroy'])->middleware('permission:request-types.manage');
});
