<?php

namespace Database\Factories;

use App\Modules\Budget\Models\Budget;
use App\Modules\Department\Models\Department;
use App\Modules\Event\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    protected $model = Budget::class;

    public function definition(): array
    {
        $allocated = fake()->numberBetween(500_000_00, 50_000_000_00);
        return [
            'event_id'             => Event::factory(),
            'department_id'        => Department::factory(),
            'allocated_amount_kobo' => $allocated,
            'spent_amount_kobo'    => 0,
            'status'               => 'draft',
        ];
    }
}
