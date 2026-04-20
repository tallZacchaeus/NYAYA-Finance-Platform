# NYAYA Finance Platform — Laravel API + Next.js Frontend Migration

## PROJECT CONTEXT

You are building the backend API for **NYAYA Finance Platform**, a financial request management system for NYAYA Youth Affairs (a church youth organization under RCCG). The platform manages budget planning, financial request submissions, multi-tier approvals, payment tracking, and receipt uploads for large-scale events (e.g., a music festival with ₦513M budget across 16 departments, 10,000 volunteers, 100,000+ attendees).

### What currently exists

There is an existing Next.js 14 frontend (App Router) with Tailwind CSS, React Hook Form + Zod, and Lucide icons. It currently uses Firebase (Firestore, Auth, Storage) as the backend. We are **replacing the backend with Laravel** while keeping the Next.js frontend and rewiring it to consume the new Laravel API.

### Architecture decision

- **Backend**: Laravel 11 API (Sanctum auth, MySQL, modular domain structure)
- **Frontend**: Next.js 14 (existing, adapted to call Laravel API instead of Firebase)
- **Monorepo structure**: `/api` (Laravel) and `/web` (Next.js) in the same project root

---

## IMPLEMENTATION INSTRUCTIONS

Work through the phases below **in order**. Complete each phase fully before moving to the next. After each phase, verify the work compiles/passes before proceeding.

---

## PHASE 1: Laravel Project Scaffolding

### 1.1 Create the Laravel project

```bash
mkdir nyaya-finance && cd nyaya-finance
composer create-project laravel/laravel api
cd api
```

### 1.2 Install required packages

```bash
composer require laravel/sanctum
composer require spatie/laravel-permission
composer require owen-it/laravel-auditing
composer require maatwebsite/excel
composer require laravel/resend   # or use Resend via HTTP in a mail transport
composer require intervention/image
```

If `laravel/resend` is unavailable, configure Resend as a custom mail transport using Resend's PHP SDK (`resend/resend-php`).

### 1.3 Configure environment

In `.env`:

```env
APP_NAME="NYAYA Finance"
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nyaya_finance
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=resend
RESEND_API_KEY=your_key_here
MAIL_FROM_ADDRESS=finance@nyaya.org
MAIL_FROM_NAME="NYAYA Finance"

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 1.4 Configure CORS

In `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'supports_credentials' => true,
```

### 1.5 Configure Sanctum

Use cookie-based SPA authentication (not token-based) since the Next.js frontend runs on a known domain. In `config/sanctum.php`, set the stateful domains. Add Sanctum's middleware to the API middleware group.

---

## PHASE 2: Database Migrations

Create all migrations in this exact order. Use `php artisan make:migration` for each. All monetary amounts are stored in **kobo** (smallest unit of NGN — 100 kobo = ₦1) as unsigned big integers to avoid floating point issues. The API layer converts to/from naira for display.

### 2.1 departments table

```php
Schema::create('departments', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

### 2.2 Modify users table

Add to the default users migration or create an alteration migration:

```php
// Add these columns to users table
$table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
$table->string('phone')->nullable();
$table->string('avatar')->nullable();
$table->boolean('is_active')->default(true);
$table->softDeletes();
```

Spatie Permission will create its own `roles` and `permissions` tables via its migration.

### 2.3 events table

```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->date('event_date');
    $table->string('venue')->nullable();
    $table->string('status')->default('planning'); // planning, active, completed, cancelled
    $table->unsignedBigInteger('total_budget_kobo')->default(0);
    $table->unsignedInteger('expected_attendance')->nullable();
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
    $table->softDeletes();
});
```

### 2.4 budgets table

```php
Schema::create('budgets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('event_id')->constrained()->cascadeOnDelete();
    $table->foreignId('department_id')->constrained()->cascadeOnDelete();
    $table->unsignedBigInteger('allocated_amount_kobo');
    $table->unsignedBigInteger('spent_amount_kobo')->default(0);
    $table->string('status')->default('draft'); // draft, approved, locked
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('approved_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();

    $table->unique(['event_id', 'department_id']);
});
```

### 2.5 finance_requests table

NOTE: Do NOT name the model `Request` — it conflicts with Laravel's HTTP Request class. Use `FinanceRequest`.

```php
Schema::create('finance_requests', function (Blueprint $table) {
    $table->id();
    $table->string('reference')->unique(); // Auto-generated: NYAYA-2026-00001
    $table->foreignId('event_id')->constrained()->cascadeOnDelete();
    $table->foreignId('department_id')->constrained();
    $table->foreignId('requester_id')->constrained('users');
    $table->string('title');
    $table->text('description')->nullable();
    $table->unsignedBigInteger('amount_kobo');
    $table->unsignedInteger('quantity')->default(1);
    $table->unsignedBigInteger('unit_cost_kobo');
    $table->string('request_type')->default('cash_disbursement'); // cash_disbursement, procurement
    $table->string('status')->default('pending');
    // Status flow: pending → recommended → approved → paid → completed
    //                      ↘ rejected

    // Approval chain
    $table->foreignId('recommended_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('recommended_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('approved_at')->nullable();
    $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('rejected_at')->nullable();
    $table->text('rejection_reason')->nullable();
    $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('paid_at')->nullable();
    $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('completed_at')->nullable();

    $table->timestamps();
    $table->softDeletes();
});
```

### 2.6 request_documents table

```php
Schema::create('request_documents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('finance_request_id')->constrained()->cascadeOnDelete();
    $table->string('file_name');
    $table->string('file_path');
    $table->string('file_type'); // pdf, jpeg, png, webp
    $table->unsignedBigInteger('file_size'); // bytes
    $table->foreignId('uploaded_by')->constrained('users');
    $table->timestamps();
});
```

### 2.7 receipts table

```php
Schema::create('receipts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('finance_request_id')->constrained()->cascadeOnDelete();
    $table->string('file_name');
    $table->string('file_path');
    $table->string('file_type');
    $table->unsignedBigInteger('file_size');
    $table->unsignedBigInteger('amount_paid_kobo');
    $table->text('payment_notes')->nullable();
    $table->foreignId('uploaded_by')->constrained('users');
    $table->timestamps();
});
```

### 2.8 notifications table

Use Laravel's built-in database notification migration:

```bash
php artisan notifications:table
```

### 2.9 audit_logs table

Laravel Auditing package handles its migration. Publish and run:

```bash
php artisan vendor:publish --provider="OwenIt\Auditing\AuditingServiceProvider" --tag="migrations"
```

### 2.10 Run all migrations

```bash
php artisan migrate
```

### 2.11 Seed roles and permissions

Create a seeder `database/seeders/RolesAndPermissionsSeeder.php`:

Roles: `super_admin`, `finance_admin`, `team_lead`, `requester`

Permissions (use Spatie's system):
- `requests.create`, `requests.view-own`, `requests.view-department`, `requests.view-all`
- `requests.recommend`, `requests.approve`, `requests.reject`, `requests.mark-paid`, `requests.upload-receipt`
- `budgets.create`, `budgets.view`, `budgets.approve`, `budgets.import`
- `departments.manage`, `events.manage`, `users.manage`
- `export.requests`, `export.budgets`

Assign to roles:
- **requester**: `requests.create`, `requests.view-own`
- **team_lead**: all requester permissions + `requests.view-department`, `requests.recommend`, `budgets.view`
- **finance_admin**: all team_lead permissions + `requests.view-all`, `requests.approve`, `requests.reject`, `requests.mark-paid`, `requests.upload-receipt`, `budgets.create`, `budgets.approve`, `budgets.import`, `export.*`
- **super_admin**: everything

---

## PHASE 3: Modular Application Structure

Create the following folder structure under `app/`. Each module is a self-contained domain.

```
app/
├── Modules/
│   ├── Auth/
│   │   ├── Controllers/
│   │   │   └── AuthController.php
│   │   ├── Requests/
│   │   │   ├── LoginRequest.php
│   │   │   └── RegisterRequest.php
│   │   └── routes.php
│   │
│   ├── User/
│   │   ├── Controllers/
│   │   │   └── UserController.php
│   │   ├── Models/
│   │   │   └── User.php          # Move from app/Models/User.php
│   │   ├── Requests/
│   │   │   └── UpdateUserRequest.php
│   │   ├── Resources/
│   │   │   └── UserResource.php
│   │   └── routes.php
│   │
│   ├── Department/
│   │   ├── Controllers/
│   │   │   └── DepartmentController.php
│   │   ├── Models/
│   │   │   └── Department.php
│   │   ├── Requests/
│   │   │   ├── StoreDepartmentRequest.php
│   │   │   └── UpdateDepartmentRequest.php
│   │   ├── Resources/
│   │   │   └── DepartmentResource.php
│   │   ├── Policies/
│   │   │   └── DepartmentPolicy.php
│   │   └── routes.php
│   │
│   ├── Event/
│   │   ├── Controllers/
│   │   │   └── EventController.php
│   │   ├── Models/
│   │   │   └── Event.php
│   │   ├── Requests/
│   │   │   ├── StoreEventRequest.php
│   │   │   └── UpdateEventRequest.php
│   │   ├── Resources/
│   │   │   └── EventResource.php
│   │   ├── Policies/
│   │   │   └── EventPolicy.php
│   │   └── routes.php
│   │
│   ├── Budget/
│   │   ├── Controllers/
│   │   │   └── BudgetController.php
│   │   ├── Models/
│   │   │   └── Budget.php
│   │   ├── Services/
│   │   │   ├── BudgetService.php
│   │   │   └── BudgetImportService.php
│   │   ├── Imports/
│   │   │   └── BudgetSheetImport.php    # Maatwebsite Excel import class
│   │   ├── Requests/
│   │   │   ├── StoreBudgetRequest.php
│   │   │   └── ImportBudgetRequest.php
│   │   ├── Resources/
│   │   │   └── BudgetResource.php
│   │   ├── Policies/
│   │   │   └── BudgetPolicy.php
│   │   └── routes.php
│   │
│   ├── FinanceRequest/
│   │   ├── Controllers/
│   │   │   ├── FinanceRequestController.php
│   │   │   └── RequestApprovalController.php
│   │   ├── Models/
│   │   │   ├── FinanceRequest.php
│   │   │   ├── RequestDocument.php
│   │   │   └── Receipt.php
│   │   ├── Services/
│   │   │   ├── FinanceRequestService.php
│   │   │   └── ApprovalService.php
│   │   ├── StateMachine/
│   │   │   └── RequestStatusMachine.php
│   │   ├── Requests/
│   │   │   ├── StoreFinanceRequestRequest.php
│   │   │   ├── RecommendRequest.php
│   │   │   ├── ApproveRequest.php
│   │   │   ├── RejectRequest.php
│   │   │   └── UploadReceiptRequest.php
│   │   ├── Resources/
│   │   │   ├── FinanceRequestResource.php
│   │   │   └── FinanceRequestDetailResource.php
│   │   ├── Policies/
│   │   │   └── FinanceRequestPolicy.php
│   │   ├── Events/
│   │   │   └── RequestStatusChanged.php
│   │   ├── Listeners/
│   │   │   ├── SendStatusNotification.php
│   │   │   └── UpdateBudgetSpent.php
│   │   └── routes.php
│   │
│   ├── Notification/
│   │   ├── Controllers/
│   │   │   └── NotificationController.php
│   │   ├── Notifications/
│   │   │   ├── RequestSubmittedNotification.php
│   │   │   ├── RequestRecommendedNotification.php
│   │   │   ├── RequestApprovedNotification.php
│   │   │   ├── RequestRejectedNotification.php
│   │   │   ├── RequestPaidNotification.php
│   │   │   ├── RequestCompletedNotification.php
│   │   │   └── BudgetThresholdNotification.php
│   │   └── routes.php
│   │
│   └── Export/
│       ├── Controllers/
│       │   └── ExportController.php
│       ├── Exports/
│       │   ├── FinanceRequestsExport.php
│       │   └── BudgetSummaryExport.php
│       └── routes.php
│
├── Providers/
│   └── ModuleServiceProvider.php   # Registers all module routes, policies, events
│
└── Http/
    └── Middleware/
        └── EnsureActiveUser.php    # Checks user is_active before any request
```

### Module Registration

Create `app/Providers/ModuleServiceProvider.php` that:
1. Loops through all `app/Modules/*/routes.php` files and registers them as API routes
2. Registers all Policies
3. Registers all Event → Listener mappings

Register this provider in `bootstrap/providers.php`.

### Important Model Notes

- Move `User.php` to `app/Modules/User/Models/User.php` and update the namespace. Add `use HasRoles` (Spatie), `use Auditable` (Laravel Auditing), and `use Notifiable` traits.
- `FinanceRequest.php` — add `use Auditable`. Define the status constants as an enum or class constants. Add relationships: `belongsTo` for requester, department, event; `hasMany` for documents and receipts.
- All models should use `$guarded = []` with mass assignment protection handled by Form Request validation instead.

---

## PHASE 4: Core Business Logic

### 4.1 RequestStatusMachine

Create `app/Modules/FinanceRequest/StateMachine/RequestStatusMachine.php`:

This class defines allowed transitions and who can perform them:

```
ALLOWED_TRANSITIONS = [
    'pending'     => ['recommended', 'rejected'],
    'recommended' => ['approved', 'rejected'],
    'approved'    => ['paid'],
    'paid'        => ['completed'],
]

TRANSITION_PERMISSIONS = [
    'recommended' => 'requests.recommend',
    'approved'    => 'requests.approve',
    'rejected'    => 'requests.reject',
    'paid'        => 'requests.mark-paid',
    'completed'   => 'requests.upload-receipt',
]
```

The `transition(FinanceRequest $request, string $newStatus, User $actor)` method:
1. Checks the transition is allowed from current status
2. Checks the actor has the required permission
3. Sets the appropriate `*_by` and `*_at` fields on the request
4. Fires `RequestStatusChanged` event
5. Returns the updated request

### 4.2 ApprovalService

`app/Modules/FinanceRequest/Services/ApprovalService.php`:

- `recommend(FinanceRequest $request, User $teamLead)` — validates team lead belongs to same department, calls state machine
- `approve(FinanceRequest $request, User $admin)` — checks budget availability (does approving this exceed the department's allocated budget for this event?), calls state machine
- `reject(FinanceRequest $request, User $actor, string $reason)` — calls state machine with rejection reason
- `markPaid(FinanceRequest $request, User $admin)` — calls state machine, updates budget spent_amount_kobo
- `complete(FinanceRequest $request, User $actor, Receipt $receipt)` — calls state machine

### 4.3 BudgetService

`app/Modules/Budget/Services/BudgetService.php`:

- `allocate(Event $event, Department $department, int $amountKobo)` — creates or updates budget
- `getRemainingBudget(Budget $budget): int` — returns `allocated_amount_kobo - spent_amount_kobo`
- `canApprove(FinanceRequest $request): bool` — checks if approving would exceed budget
- `recordSpend(Budget $budget, int $amountKobo)` — increments spent_amount_kobo atomically
- `getSummary(Event $event): Collection` — returns all departments with allocated, spent, remaining, percentage used

### 4.4 BudgetImportService

`app/Modules/Budget/Services/BudgetImportService.php`:

Accepts an uploaded Excel file (same format as the Mega Music Festival budget). Uses Maatwebsite Excel to:
1. Read each sheet as a department
2. Extract line items (Item Description, Quantity, Unit Cost, Total)
3. Create a `Budget` record per department with the department total as `allocated_amount_kobo`
4. Optionally create draft `FinanceRequest` records for each line item
5. Return a preview/summary before committing (two-step: preview then confirm)

### 4.5 Event Listeners

When `RequestStatusChanged` is fired:
- `SendStatusNotification`: Sends email (via Resend) and creates database notification for the requester. If status is `pending`, also notify department team_lead and finance_admins.
- `UpdateBudgetSpent`: When status changes to `paid`, increment the department's budget `spent_amount_kobo`. When a paid request is somehow reversed/deleted, decrement it.

---

## PHASE 5: API Controllers & Routes

### Route Structure

All routes are prefixed with `/api` and grouped by module. Each module's `routes.php` defines its routes.

### Auth Routes (`Modules/Auth/routes.php`)

```
POST   /api/auth/register          → AuthController@register
POST   /api/auth/login             → AuthController@login
POST   /api/auth/logout            → AuthController@logout     [auth:sanctum]
GET    /api/auth/me                → AuthController@me         [auth:sanctum]
```

Registration creates a user with `requester` role by default. Login uses Sanctum SPA cookie authentication: the frontend first hits `GET /sanctum/csrf-cookie`, then `POST /api/auth/login`.

### Department Routes (`Modules/Department/routes.php`)

```
GET    /api/departments             → DepartmentController@index       [auth:sanctum]
POST   /api/departments             → DepartmentController@store       [auth:sanctum, permission:departments.manage]
GET    /api/departments/{id}        → DepartmentController@show        [auth:sanctum]
PUT    /api/departments/{id}        → DepartmentController@update      [auth:sanctum, permission:departments.manage]
DELETE /api/departments/{id}        → DepartmentController@destroy     [auth:sanctum, permission:departments.manage]
```

### Event Routes (`Modules/Event/routes.php`)

```
GET    /api/events                  → EventController@index            [auth:sanctum]
POST   /api/events                  → EventController@store            [auth:sanctum, permission:events.manage]
GET    /api/events/{id}             → EventController@show             [auth:sanctum]
PUT    /api/events/{id}             → EventController@update           [auth:sanctum, permission:events.manage]
GET    /api/events/{id}/dashboard   → EventController@dashboard        [auth:sanctum]
```

The `dashboard` endpoint returns: event details, department budgets with spent/remaining, request counts by status, total budget vs total spent.

### Budget Routes (`Modules/Budget/routes.php`)

```
GET    /api/events/{eventId}/budgets          → BudgetController@index     [auth:sanctum]
POST   /api/events/{eventId}/budgets          → BudgetController@store     [auth:sanctum, permission:budgets.create]
PUT    /api/budgets/{id}                      → BudgetController@update    [auth:sanctum, permission:budgets.create]
POST   /api/budgets/{id}/approve              → BudgetController@approve   [auth:sanctum, permission:budgets.approve]
POST   /api/events/{eventId}/budgets/import   → BudgetController@import    [auth:sanctum, permission:budgets.import]
POST   /api/events/{eventId}/budgets/import/confirm → BudgetController@confirmImport [auth:sanctum, permission:budgets.import]
```

### Finance Request Routes (`Modules/FinanceRequest/routes.php`)

```
GET    /api/requests                       → FinanceRequestController@index    [auth:sanctum]
POST   /api/requests                       → FinanceRequestController@store    [auth:sanctum, permission:requests.create]
GET    /api/requests/{id}                  → FinanceRequestController@show     [auth:sanctum]
PUT    /api/requests/{id}                  → FinanceRequestController@update   [auth:sanctum]
DELETE /api/requests/{id}                  → FinanceRequestController@destroy  [auth:sanctum]

POST   /api/requests/{id}/recommend        → RequestApprovalController@recommend   [auth:sanctum, permission:requests.recommend]
POST   /api/requests/{id}/approve          → RequestApprovalController@approve     [auth:sanctum, permission:requests.approve]
POST   /api/requests/{id}/reject           → RequestApprovalController@reject      [auth:sanctum, permission:requests.reject]
POST   /api/requests/{id}/mark-paid        → RequestApprovalController@markPaid    [auth:sanctum, permission:requests.mark-paid]
POST   /api/requests/{id}/receipt          → RequestApprovalController@uploadReceipt [auth:sanctum, permission:requests.upload-receipt]

POST   /api/requests/{id}/documents        → FinanceRequestController@uploadDocument [auth:sanctum]
```

The `index` endpoint must filter based on role:
- `requester`: only own requests
- `team_lead`: own department's requests
- `finance_admin` / `super_admin`: all requests

Support query params: `?event_id=X&department_id=Y&status=pending&request_type=procurement&page=1&per_page=20`

### Notification Routes (`Modules/Notification/routes.php`)

```
GET    /api/notifications                  → NotificationController@index       [auth:sanctum]
PATCH  /api/notifications/read-all         → NotificationController@markAllRead [auth:sanctum]
PATCH  /api/notifications/{id}/read        → NotificationController@markRead    [auth:sanctum]
GET    /api/notifications/unread-count      → NotificationController@unreadCount [auth:sanctum]
```

### Export Routes (`Modules/Export/routes.php`)

```
GET    /api/export/requests                → ExportController@requests         [auth:sanctum, permission:export.requests]
GET    /api/export/budget-summary          → ExportController@budgetSummary    [auth:sanctum, permission:export.budgets]
```

Both support `?event_id=X&department_id=Y` query params. Return Excel files (not CSV) using Maatwebsite Excel.

---

## PHASE 6: API Resource Responses

Use Laravel API Resources for consistent JSON responses. Every response should follow this envelope:

```json
{
    "success": true,
    "data": { ... },
    "message": "Request approved successfully"
}
```

For paginated lists:

```json
{
    "success": true,
    "data": [ ... ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 20,
        "total": 98
    }
}
```

For errors:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "amount": ["The amount field is required."]
    }
}
```

### Key Resource Transformations

- All `*_kobo` fields should be returned as naira values (divide by 100) with a `_kobo` raw field also available
- Dates should be returned in ISO 8601 format
- Include `requester`, `department`, and `event` as nested objects (not just IDs) in detail views
- Include `can` object in detail views showing what actions the authenticated user can perform:

```json
{
    "data": {
        "id": 1,
        "reference": "NYAYA-2026-00001",
        "title": "BRT Bus Hire",
        "amount": 11000000,
        "amount_kobo": 1100000000,
        "status": "pending",
        "requester": { "id": 1, "name": "..." },
        "department": { "id": 3, "name": "Transport" },
        "can": {
            "recommend": true,
            "approve": false,
            "reject": true,
            "mark_paid": false,
            "upload_receipt": false,
            "delete": false
        }
    }
}
```

---

## PHASE 7: Next.js Frontend Adaptation

### 7.1 Create API client

Create `web/lib/api-client.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private async request<T>(path: string, options?: RequestInit): Promise<T> {
        // First, ensure CSRF cookie exists (for Sanctum SPA auth)
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options?.headers,
            },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new ApiError(res.status, error.message, error.errors);
        }

        return res.json();
    }

    // Auth
    async csrfCookie() { return fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' }); }
    async login(email: string, password: string) { await this.csrfCookie(); return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }
    async register(data: RegisterData) { await this.csrfCookie(); return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }); }
    async logout() { return this.request('/api/auth/logout', { method: 'POST' }); }
    async me() { return this.request<{ data: User }>('/api/auth/me'); }

    // Requests
    async getRequests(params?: RequestFilters) { return this.request<PaginatedResponse<FinanceRequest>>(`/api/requests?${new URLSearchParams(params as any)}`); }
    async getRequest(id: number) { return this.request<{ data: FinanceRequestDetail }>(`/api/requests/${id}`); }
    async createRequest(data: CreateRequestData) { return this.request('/api/requests', { method: 'POST', body: JSON.stringify(data) }); }
    async recommendRequest(id: number) { return this.request(`/api/requests/${id}/recommend`, { method: 'POST' }); }
    async approveRequest(id: number) { return this.request(`/api/requests/${id}/approve`, { method: 'POST' }); }
    async rejectRequest(id: number, reason: string) { return this.request(`/api/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }); }
    async markPaid(id: number) { return this.request(`/api/requests/${id}/mark-paid`, { method: 'POST' }); }

    // Departments, Events, Budgets, Notifications, Export — follow same pattern
}

export const api = new ApiClient();
```

### 7.2 Update auth flow

- Replace Firebase Auth hooks with a React context that calls `api.me()` on mount
- Store auth state in React context (not localStorage)
- On login page: call `api.login()` then `api.me()` then redirect based on role
- Middleware (Next.js middleware.ts): check for Sanctum session cookie existence for route protection; the actual auth verification happens server-side on every API call

### 7.3 Update existing pages

Go through each page in `app/(dashboard)/` and replace:
- All Firestore queries with `api.*` calls
- Firebase storage uploads with `fetch` to Laravel file upload endpoints (multipart/form-data)
- Remove all Firebase imports

### 7.4 Add new pages

- `app/(dashboard)/admin/departments/page.tsx` — Department management
- `app/(dashboard)/admin/events/page.tsx` — Event management
- `app/(dashboard)/admin/events/[id]/dashboard/page.tsx` — Event budget dashboard (the Summary view)
- `app/(dashboard)/admin/events/[id]/import/page.tsx` — Budget import from Excel
- `app/(dashboard)/team-lead/page.tsx` — Team lead scoped dashboard

### 7.5 Update types

Update `web/lib/types.ts` to match the new API response shapes. Key changes:
- Add `Department`, `Event`, `Budget` interfaces
- Update `FinanceRequest` to include `reference`, `request_type`, `recommended_by`, `recommended_at`, `quantity`, `unit_cost`, and the `can` object
- Add `role` field to `User` (string, not boolean `isAdmin`)
- All amount fields are numbers in naira (the API handles conversion)

---

## PHASE 8: Testing & Verification

### 8.1 Create Feature Tests

At minimum, create tests for:

```
tests/Feature/
├── Auth/
│   ├── LoginTest.php
│   └── RegisterTest.php
├── FinanceRequest/
│   ├── CreateRequestTest.php
│   ├── ApprovalFlowTest.php        # Test full lifecycle: pending → recommended → approved → paid → completed
│   ├── RejectionFlowTest.php
│   └── RequestFilteringTest.php    # Test role-based filtering
├── Budget/
│   ├── BudgetAllocationTest.php
│   ├── BudgetEnforcementTest.php   # Test that approval fails when budget exceeded
│   └── BudgetImportTest.php
└── Export/
    └── ExportRequestsTest.php
```

### 8.2 Create database seeder for development

`database/seeders/DevelopmentSeeder.php`:

Create sample data matching the Mega Music Festival budget:
- 1 event: "Mega Music Festival 2026"
- 16 departments with team leads
- Budget allocations matching the spreadsheet
- 20+ sample finance requests in various statuses
- Sample users for each role

---

## IMPORTANT CONSTRAINTS

1. **Currency**: All monetary values stored in kobo (integer). Displayed in naira. Currency is NGN. Format using `en-NG` locale on the frontend.

2. **Reference numbers**: Auto-generate on creation with format `NYAYA-{YEAR}-{PADDED_SEQUENCE}` (e.g., `NYAYA-2026-00001`). Use a database sequence or atomic counter.

3. **File uploads**: Store in Laravel's `storage/app/public` directory under `request-documents/` and `receipts/` paths. Max 10MB. Allowed types: PDF, JPEG, PNG, WebP.

4. **Soft deletes**: Use soft deletes on `users`, `events`, `departments`, and `finance_requests`. Never hard-delete financial records.

5. **Audit trail**: Every model change on `FinanceRequest`, `Budget`, and `User` should be logged via Laravel Auditing. The audit log is immutable — no updates or deletes.

6. **Email**: Send notification emails at every status change. Include: request reference, title, amount, old status, new status, actor name, and a link to view the request. Use a clean, simple HTML template.

7. **Do NOT** use `Request` as a model name. Use `FinanceRequest` everywhere.

8. **Do NOT** hardcode user IDs or role checks like `if ($user->id === 1)`. Always use Spatie permissions.

9. **Do NOT** skip validation. Every endpoint must use a Form Request class with proper rules.

10. **Do NOT** return raw Eloquent models from controllers. Always use API Resources.
