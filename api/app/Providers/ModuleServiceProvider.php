<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ModuleServiceProvider extends ServiceProvider
{
    /**
     * Policies to register: [Model::class => Policy::class]
     */
    protected array $policies = [
        \App\Modules\Department\Models\Department::class              => \App\Modules\Department\Policies\DepartmentPolicy::class,
        \App\Modules\Event\Models\Event::class                        => \App\Modules\Event\Policies\EventPolicy::class,
        \App\Modules\Budget\Models\Budget::class                      => \App\Modules\Budget\Policies\BudgetPolicy::class,
        \App\Modules\FinanceRequest\Models\FinanceRequest::class      => \App\Modules\FinanceRequest\Policies\FinanceRequestPolicy::class,
        \App\Modules\InternalRequest\Models\InternalRequest::class    => \App\Modules\InternalRequest\Policies\InternalRequestPolicy::class,
    ];

    /**
     * Events and their listeners: [Event::class => [Listener::class]]
     */
    protected array $listen = [
        \App\Modules\FinanceRequest\Events\RequestStatusChanged::class => [
            \App\Modules\FinanceRequest\Listeners\SendStatusNotification::class,
            \App\Modules\FinanceRequest\Listeners\UpdateBudgetSpent::class,
        ],
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerModuleRoutes();
        $this->registerPolicies();
        $this->registerEvents();
        $this->registerMiddleware();
    }

    protected function registerModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');

        foreach (glob("{$modulesPath}/*/routes.php") as $routeFile) {
            Route::prefix('api')
                ->middleware('api')
                ->group($routeFile);
        }
    }

    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    protected function registerEvents(): void
    {
        foreach ($this->listen as $event => $listeners) {
            foreach ($listeners as $listener) {
                Event::listen($event, $listener);
            }
        }
    }

    protected function registerMiddleware(): void
    {
        $this->app['router']->aliasMiddleware('active', \App\Http\Middleware\EnsureActiveUser::class);

        // Spatie Permission middleware aliases (not auto-registered in Laravel 11)
        $this->app['router']->aliasMiddleware('permission', \Spatie\Permission\Middleware\PermissionMiddleware::class);
        $this->app['router']->aliasMiddleware('role', \Spatie\Permission\Middleware\RoleMiddleware::class);
        $this->app['router']->aliasMiddleware('role_or_permission', \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class);
    }
}
