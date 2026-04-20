<?php

namespace App\Modules\Export\Exports;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class FinanceRequestsExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function query()
    {
        $query = FinanceRequest::with(['requester', 'department', 'event']);

        if (isset($this->filters['event_id'])) {
            $query->where('event_id', $this->filters['event_id']);
        }
        if (isset($this->filters['department_id'])) {
            $query->where('department_id', $this->filters['department_id']);
        }
        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }
        if (isset($this->filters['request_type'])) {
            $query->where('request_type', $this->filters['request_type']);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'Reference', 'Title', 'Event', 'Department', 'Requester',
            'Amount (₦)', 'Quantity', 'Unit Cost (₦)', 'Type', 'Status',
            'Submitted', 'Approved At',
        ];
    }

    public function map($row): array
    {
        return [
            $row->reference,
            $row->title,
            $row->event?->name,
            $row->department?->name,
            $row->requester?->name,
            number_format($row->amount_kobo / 100, 2),
            $row->quantity,
            number_format($row->unit_cost_kobo / 100, 2),
            $row->request_type,
            $row->status,
            $row->created_at?->toDateTimeString(),
            $row->approved_at?->toDateTimeString(),
        ];
    }
}
