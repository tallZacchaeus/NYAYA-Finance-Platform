<?php

namespace App\Modules\Budget\Services;

use App\Modules\Budget\Models\Budget;
use App\Modules\Budget\Imports\BudgetSheetImport;
use App\Modules\Department\Models\Department;
use App\Modules\Event\Models\Event;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
class BudgetImportService
{
    /**
     * Parse the Excel file and return a preview without saving to DB.
     * The parsed data is cached under a token for the confirm step.
     */
    public function preview(Event $event, UploadedFile $file): array
    {
        $import = new BudgetSheetImport();
        $import->import($file);

        $sheets  = $import->getSheets();
        $token   = Str::uuid()->toString();
        $preview = [];

        foreach ($sheets as $sheetName => $rows) {
            $total = collect($rows)->sum('total_kobo');
            $preview[] = [
                'department_name' => $sheetName,
                'line_items'      => count($rows),
                'total'           => $total / 100,
                'total_kobo'      => $total,
            ];
        }

        // Cache for 30 minutes so the user can review then confirm
        Cache::put("budget_import_{$token}", [
            'event_id' => $event->id,
            'sheets'   => $sheets,
        ], now()->addMinutes(30));

        return [
            'import_token'     => $token,
            'departments'      => $preview,
            'total_departments' => count($preview),
        ];
    }

    /**
     * Commit the previously previewed import to the database.
     */
    public function confirm(Event $event, string $token, User $actor): array
    {
        $cached = Cache::get("budget_import_{$token}");

        abort_if(! $cached, 422, 'Import token expired or not found. Please re-upload the file.');
        abort_if($cached['event_id'] !== $event->id, 422, 'Token does not match this event.');

        $created = DB::transaction(function () use ($event, $cached) {
            $result = [];

            foreach ($cached['sheets'] as $sheetName => $rows) {
                $department = Department::firstOrCreate(
                    ['slug' => Str::slug($sheetName)],
                    ['name' => $sheetName]
                );

                $totalKobo = collect($rows)->sum('total_kobo');

                $budget = Budget::updateOrCreate(
                    ['event_id' => $event->id, 'department_id' => $department->id],
                    ['allocated_amount_kobo' => $totalKobo, 'status' => 'draft']
                );

                $result[] = [
                    'department' => $sheetName,
                    'budget_id'  => $budget->id,
                    'allocated'  => $totalKobo / 100,
                ];
            }

            return $result;
        });

        Cache::forget("budget_import_{$token}");

        return ['imported' => $created];
    }
}
