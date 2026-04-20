<?php

namespace Database\Seeders;

use App\Modules\Department\Models\Department;
use App\Modules\Event\Models\Event;
use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────────────────────

        $superAdmin = User::create([
            'name'      => 'Super Admin',
            'email'     => 'admin@yaya.org',
            'password'  => Hash::make('password'),
            'is_active' => true,
        ]);
        $superAdmin->assignRole('super_admin');

        $financeAdmin = User::create([
            'name'      => 'Finance Admin',
            'email'     => 'finance@yaya.org',
            'password'  => Hash::make('password'),
            'is_active' => true,
        ]);
        $financeAdmin->assignRole('finance_admin');

        $teamLead = User::create([
            'name'      => 'Transport Lead',
            'email'     => 'transport.lead@yaya.org',
            'password'  => Hash::make('password'),
            'is_active' => true,
        ]);
        $teamLead->assignRole('team_lead');

        $member = User::create([
            'name'      => 'Test Member',
            'email'     => 'member@yaya.org',
            'password'  => Hash::make('password'),
            'is_active' => true,
        ]);
        $member->assignRole('member');

        // ── Departments ────────────────────────────────────────────────────────

        $transport  = Department::create(['name' => 'Transport',  'slug' => 'transport',  'description' => 'Logistics and transport']);
        $media      = Department::create(['name' => 'Media',      'slug' => 'media',      'description' => 'Audio-visual and media']);
        $welfare    = Department::create(['name' => 'Welfare',    'slug' => 'welfare',    'description' => 'Member welfare and care']);
        $programmes = Department::create(['name' => 'Programmes', 'slug' => 'programmes', 'description' => 'Events and programmes']);

        $teamLead->update(['department_id' => $transport->id]);
        $member->update(['department_id' => $transport->id]);

        // ── Event ──────────────────────────────────────────────────────────────

        Event::create([
            'name'        => 'Mega Music Festival 2026',
            'description' => 'Annual YAYA Youth music festival',
            'event_date'  => '2026-06-01',
            'status'      => 'active',
            'created_by'  => $superAdmin->id,
        ]);

        $this->command->info('Development seed complete.');
        $this->command->info('Logins (password: password):');
        $this->command->info('  admin@yaya.org       → super_admin');
        $this->command->info('  finance@yaya.org     → finance_admin');
        $this->command->info('  transport.lead@yaya.org → team_lead');
        $this->command->info('  member@yaya.org      → member');
    }
}
