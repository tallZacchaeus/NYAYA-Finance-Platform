<?php

namespace Database\Factories;

use App\Modules\Event\Models\Event;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'name'                => fake()->words(3, true) . ' Festival',
            'description'         => fake()->optional()->paragraph(),
            'event_date'          => fake()->dateTimeBetween('+1 month', '+1 year')->format('Y-m-d'),
            'venue'               => fake()->optional()->city(),
            'status'              => 'planning',
            'total_budget_kobo'   => fake()->numberBetween(1_000_000_00, 500_000_000_00),
            'expected_attendance' => fake()->optional()->numberBetween(100, 100000),
            'created_by'          => User::factory(),
        ];
    }
}
