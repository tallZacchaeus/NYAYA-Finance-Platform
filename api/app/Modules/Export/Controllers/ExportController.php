<?php

namespace App\Modules\Export\Controllers;

use App\Modules\Export\Exports\BudgetSummaryExport;
use App\Modules\Export\Exports\FinanceRequestsExport;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    public function requests(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filters = $request->only(['event_id', 'department_id', 'status', 'request_type']);

        return Excel::download(
            new FinanceRequestsExport($filters),
            'finance-requests-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function budgetSummary(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filters = $request->only(['event_id', 'department_id']);

        return Excel::download(
            new BudgetSummaryExport($filters),
            'budget-summary-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}
