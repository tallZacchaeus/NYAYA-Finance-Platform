<?php

use App\Modules\Department\Controllers\DepartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('departments')->group(function () {
    Route::get('/', [DepartmentController::class, 'index']);
    Route::post('/', [DepartmentController::class, 'store'])->middleware('permission:departments.manage');
    Route::get('{id}', [DepartmentController::class, 'show']);
    Route::put('{id}', [DepartmentController::class, 'update'])->middleware('permission:departments.manage');
    Route::delete('{id}', [DepartmentController::class, 'destroy'])->middleware('permission:departments.manage');
});
