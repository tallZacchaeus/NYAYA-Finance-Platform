<?php

namespace Database\Factories;

use App\Modules\Department\Models\Department;
use App\Modules\Event\Models\Event;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FinanceRequest>
 */
class FinanceRequestFactory extends Factory
{
    protected $model = FinanceRequest::class;

    public function definition(): array
    {
        $unitCostKobo = fake()->numberBetween(5_000_00, 500_000_00);
        $quantity     = fake()->numberBetween(1, 10);

        return [
            'reference'      => 'NYAYA-' . date('Y') . '-' . str_pad(fake()->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'requester_id'   => User::factory(),
            'department_id'  => Department::factory(),
            'event_id'       => Event::factory(),
            'title'          => fake()->sentence(4),
            'description'    => fake()->optional()->paragraph(),
            'unit_cost_kobo' => $unitCostKobo,
            'quantity'       => $quantity,
            'amount_kobo'    => $unitCostKobo * $quantity,
            'request_type'   => fake()->randomElement([
                FinanceRequest::TYPE_CASH_DISBURSEMENT,
                FinanceRequest::TYPE_PROCUREMENT,
            ]),
            'status'         => FinanceRequest::STATUS_PENDING,
        ];
    }
}
