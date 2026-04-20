<?php

namespace App\Modules\Export\Exports;

use App\Modules\Budget\Models\Budget;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BudgetSummaryExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function query()
    {
        $query = Budget::with(['department', 'event']);

        if (isset($this->filters['event_id'])) {
            $query->where('event_id', $this->filters['event_id']);
        }
        if (isset($this->filters['department_id'])) {
            $query->where('department_id', $this->filters['department_id']);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'Event', 'Department', 'Allocated (₦)', 'Spent (₦)',
            'Remaining (₦)', '% Used', 'Status',
        ];
    }

    public function map($row): array
    {
        $remaining = $row->allocated_amount_kobo - $row->spent_amount_kobo;
        $pct = $row->allocated_amount_kobo > 0
            ? round(($row->spent_amount_kobo / $row->allocated_amount_kobo) * 100, 2)
            : 0;

        return [
            $row->event?->name,
            $row->department?->name,
            number_format($row->allocated_amount_kobo / 100, 2),
            number_format($row->spent_amount_kobo / 100, 2),
            number_format($remaining / 100, 2),
            $pct . '%',
            $row->status,
        ];
    }
}
