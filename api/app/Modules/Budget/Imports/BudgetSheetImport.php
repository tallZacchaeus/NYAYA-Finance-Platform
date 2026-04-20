<?php

namespace App\Modules\Budget\Imports;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Parses a multi-sheet Excel budget file using PhpSpreadsheet directly.
 * Each sheet = one department; columns A-D = Description, Qty, Unit Cost, Total.
 */
class BudgetSheetImport
{
    private array $sheets = [];

    public function import(UploadedFile $file): void
    {
        $spreadsheet = IOFactory::load($file->getRealPath());

        foreach ($spreadsheet->getAllSheets() as $worksheet) {
            $sheetName = trim($worksheet->getTitle());
            $rows      = [];

            foreach ($worksheet->getRowIterator(2) as $row) {
                $iterator = $row->getCellIterator('A', 'D');
                $iterator->setIterateOnlyExistingCells(false);
                $cells = iterator_to_array($iterator);

                $description = trim((string) ($cells['A']->getValue() ?? ''));
                $quantity    = (int)   abs((float) ($cells['B']->getValue() ?? 0));
                $unitCost    = (float) abs((float) ($cells['C']->getValue() ?? 0));
                $rawTotal    = (float) ($cells['D']->getValue() ?? 0);

                // Use column D if populated, otherwise compute from qty × unit cost
                $total = $rawTotal > 0 ? $rawTotal : ($quantity * $unitCost);

                if (empty($description) || $total <= 0) {
                    continue;
                }

                $rows[] = [
                    'description'    => $description,
                    'quantity'       => $quantity,
                    'unit_cost'      => $unitCost,
                    'unit_cost_kobo' => (int) round($unitCost * 100),
                    'total'          => $total,
                    'total_kobo'     => (int) round($total * 100),
                ];
            }

            if (! empty($rows)) {
                $this->sheets[$sheetName] = $rows;
            }
        }
    }

    public function getSheets(): array
    {
        return $this->sheets;
    }
}
