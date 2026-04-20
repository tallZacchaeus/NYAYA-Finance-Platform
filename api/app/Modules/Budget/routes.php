<?php

use App\Modules\Budget\Controllers\BudgetController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::prefix('events/{eventId}/budgets')->group(function () {
        Route::get('/', [BudgetController::class, 'index']);
        Route::post('/', [BudgetController::class, 'store'])->middleware('permission:budgets.create');
        Route::post('import', [BudgetController::class, 'import'])->middleware('permission:budgets.import');
        Route::post('import/confirm', [BudgetController::class, 'confirmImport'])->middleware('permission:budgets.import');
    });

    Route::prefix('budgets')->group(function () {
        Route::put('{id}', [BudgetController::class, 'update'])->middleware('permission:budgets.create');
        Route::post('{id}/approve', [BudgetController::class, 'approve'])->middleware('permission:budgets.approve');
    });
});
