<?php

use App\Modules\Export\Controllers\ExportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('export')->group(function () {
    Route::get('requests', [ExportController::class, 'requests'])->middleware('permission:export.requests');
    Route::get('budget-summary', [ExportController::class, 'budgetSummary'])->middleware('permission:export.budgets');
});
