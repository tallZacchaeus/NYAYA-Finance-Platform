/**
 * Laravel Sanctum SPA API client.
 *
 * Uses cookie-based authentication — credentials are always included so the
 * browser sends the session cookie automatically. CSRF protection is handled
 * by fetching /sanctum/csrf-cookie before every mutating request, which sets
 * XSRF-TOKEN; that value is then echoed back as the X-XSRF-TOKEN header.
 */

// Empty string = use relative paths (requests go through Next.js rewrites proxy).
// Set NEXT_PUBLIC_API_URL to a full URL to call the API directly (e.g. in production).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ---------------------------------------------------------------------------
// Types matching Laravel API response shapes
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
  role: string | null;
  roles: string[];
  department_id?: number | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface ApiEvent {
  id: number;
  name: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  status: string | null;
  total_budget: number;
  total_budget_kobo: number | null;
  expected_attendance: number | null;
  created_by: { id: number; name: string } | null;
  created_at: string;
}

export interface Budget {
  id: number;
  event_id: number;
  department: { id: number; name: string };
  allocated: number;
  allocated_kobo: number;
  spent: number;
  spent_kobo: number | null;
  remaining: number;
  remaining_kobo: number;
  percentage_used: number;
  status: string | null;
  notes: string | null;
  approved_by: { id: number; name: string } | null;
  approved_at: string | null;
  created_at: string;
}

export interface RequestDocument {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_at: string;
}

export interface Receipt {
  id: number;
  file_name: string;
  file_type: string;
  /** Actual receipted amount in naira */
  amount: number;
  amount_kobo: number;
  notes: string | null;
  url: string;
  uploaded_by: { id: number; name: string };
  uploaded_at: string;
}

export type FinanceRequestStatus =
  | 'submitted'
  | 'finance_reviewed'
  | 'finance_rejected'
  | 'satgo_approved'
  | 'satgo_rejected'
  | 'approval_expired'
  | 'partial_payment'
  | 'paid'
  | 'receipted'
  | 'refund_pending'
  | 'refund_completed'
  | 'completed';

export type InternalRequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'needs_revision'
  | 'rejected';

export type RejectionCategory =
  | 'over_budget'
  | 'incomplete_documentation'
  | 'wrong_department'
  | 'duplicate'
  | 'policy_violation'
  | 'insufficient_justification'
  | 'other';

export type ReviewAction =
  | 'lead_approve'
  | 'lead_reject'
  | 'lead_revision_request'
  | 'finance_review'
  | 'finance_reject'
  | 'satgo_approve'
  | 'satgo_reject'
  | 'payment_recorded'
  | 'receipt_uploaded'
  | 'refund_confirmed';

export interface RequestType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReviewNote {
  id: number;
  user: { id: number; name: string };
  action: ReviewAction;
  notes: string;
  created_at: string;
}

export interface Payment {
  id: number;
  finance_request_id: number;
  amount: number;
  amount_kobo: number;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'pos' | null;
  payment_reference: string | null;
  payment_date: string;
  notes: string | null;
  recorded_by: { id: number; name: string };
  created_at: string;
}

export interface BankStatement {
  id: number;
  event_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  statement_date: string;
  closing_balance: number | null;
  closing_balance_kobo: number | null;
  notes: string | null;
  uploaded_by: { id: number; name: string };
  created_at: string;
}

export interface InternalRequest {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  amount: number;
  amount_kobo: number;
  unit_cost: number;
  unit_cost_kobo: number;
  quantity: number;
  request_type: RequestType;
  status: InternalRequestStatus;
  department: { id: number; name: string };
  event: { id: number; name: string };
  requester: { id: number; name: string };
  reviewed_by: { id: number; name: string } | null;
  reviewed_at: string | null;
  finance_request_id: number | null;
  review_notes?: ReviewNote[];
  documents?: RequestDocument[];
  can?: {
    edit: boolean;
    submit: boolean;
    review: boolean;
    delete: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface FinanceRequestCan {
  finance_review: boolean;
  satgo_approve: boolean;
  satgo_reject: boolean;
  record_payment: boolean;
  upload_receipt: boolean;
  update: boolean;
  delete: boolean;
}

export interface FinanceRequest {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  amount: number;
  amount_kobo: number;
  unit_cost: number;
  unit_cost_kobo: number;
  quantity: number;
  request_type: RequestType;
  status: FinanceRequestStatus;
  department: { id: number; name: string };
  event: { id: number; name: string };
  requester: { id: number; name: string };

  // Finance review
  finance_reviewed_by: { id: number; name: string } | null;
  finance_reviewed_at: string | null;

  // SATGO approval
  satgo_approved_by: { id: number; name: string } | null;
  satgo_approved_at: string | null;
  approval_expires_at: string | null;

  // Rejection
  rejected_by: { id: number; name: string } | null;
  rejected_at: string | null;
  rejection_category: RejectionCategory | null;
  rejection_reason: string | null;

  // Payment
  total_paid: number;
  total_paid_kobo: number;
  paid_confirmed_by: { id: number; name: string } | null;
  fully_paid_at: string | null;

  // Receipting & variance
  total_receipted: number;
  total_receipted_kobo: number;
  variance: number;
  variance_kobo: number;
  receipted_by: { id: number; name: string } | null;
  receipted_at: string | null;

  // Refund
  refund_amount: number;
  refund_amount_kobo: number;
  refund_completed_at: string | null;

  // Completion
  completed_by: { id: number; name: string } | null;
  completed_at: string | null;

  payments?: Payment[];
  documents?: RequestDocument[];
  receipts?: Receipt[];
  review_notes?: ReviewNote[];
  internal_requests?: InternalRequest[];
  can?: FinanceRequestCan;
  created_at: string;
  updated_at: string;
}

export interface BudgetImportRow {
  department: string;
  allocated_amount_kobo: number;
  allocated_amount: number;
  line_items?: { description: string; quantity: number; unit_cost: number; total: number }[];
}

export interface BudgetImportPreview {
  preview_token: string;
  rows: BudgetImportRow[];
  total_kobo: number;
  total: number;
  warnings?: string[];
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginatedMeta;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Returns the first validation error message for a given field, or null. */
  fieldError(field: string): string | null {
    return this.errors?.[field]?.[0] ?? null;
  }
}

// ---------------------------------------------------------------------------
// CSRF helper
// ---------------------------------------------------------------------------

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf(): Promise<void> {
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Origin: window.location.origin },
  });
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit & { skipCsrf?: boolean } = {},
): Promise<T> {
  const { skipCsrf, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation && !skipCsrf) {
    await ensureCsrf();
  }

  const xsrfToken = getCookie('XSRF-TOKEN');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(fetchOptions.body && !(fetchOptions.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    let body: { message?: string; errors?: Record<string, string[]> } = {};
    try {
      body = await res.json();
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, body.message ?? res.statusText, body.errors);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const api = {
  // Auth
  auth: {
    csrfCookie: () => ensureCsrf(),

    login: (email: string, password: string) =>
      request<ApiResponse<ApiUser>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      request<ApiResponse<ApiUser>>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<ApiResponse<null>>('/api/auth/logout', { method: 'POST' }),

    me: () =>
      request<ApiResponse<ApiUser>>('/api/auth/me', { skipCsrf: true }),
  },

  // Departments
  departments: {
    list: () =>
      request<ApiResponse<Department[]>>('/api/departments'),

    create: (data: { name: string; description?: string }) =>
      request<ApiResponse<Department>>('/api/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: { name?: string; description?: string }) =>
      request<ApiResponse<Department>>(`/api/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    destroy: (id: number) =>
      request<ApiResponse<null>>(`/api/departments/${id}`, { method: 'DELETE' }),
  },

  // Events
  events: {
    list: () =>
      request<ApiResponse<ApiEvent[]>>('/api/events'),

    create: (data: {
      name: string;
      description?: string;
      event_date: string;
      venue?: string;
      total_budget_kobo?: number;
      expected_attendance?: number;
    }) =>
      request<ApiResponse<ApiEvent>>('/api/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<{
      name: string;
      description?: string;
      event_date: string;
      venue?: string;
      total_budget_kobo?: number;
      expected_attendance?: number;
    }>) =>
      request<ApiResponse<ApiEvent>>(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Budgets
  budgets: {
    list: (eventId: number) =>
      request<ApiResponse<Budget[]>>(`/api/events/${eventId}/budgets`),

    allocate: (eventId: number, data: { department_id: number; allocated_amount_kobo: number; notes?: string }) =>
      request<ApiResponse<Budget>>(`/api/events/${eventId}/budgets`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (budgetId: number, data: { allocated_amount_kobo?: number; notes?: string }) =>
      request<ApiResponse<Budget>>(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    approve: (budgetId: number) =>
      request<ApiResponse<Budget>>(`/api/budgets/${budgetId}/approve`, { method: 'POST' }),

    importPreview: (eventId: number, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<ApiResponse<BudgetImportPreview>>(`/api/events/${eventId}/budgets/import`, {
        method: 'POST',
        body: form,
      });
    },

    importConfirm: (eventId: number, previewToken: string) =>
      request<ApiResponse<Budget[]>>(`/api/events/${eventId}/budgets/import/confirm`, {
        method: 'POST',
        body: JSON.stringify({ preview_token: previewToken }),
      }),
  },

  // Finance Requests (Tier 2 — official approval chain)
  financeRequests: {
    list: (params?: {
      event_id?: number;
      department_id?: number;
      status?: FinanceRequestStatus | string;
      request_type_id?: number;
      per_page?: number;
      page?: number;
    }) => {
      const qs = params
        ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
        : '';
      return request<PaginatedResponse<FinanceRequest>>(`/api/finance-requests${qs}`);
    },

    get: (id: number) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}`),

    create: (data: {
      title: string;
      description?: string;
      unit_cost_kobo: number;
      quantity: number;
      department_id: number;
      event_id: number;
      request_type_id: number;
      internal_request_ids?: number[];
    }) =>
      request<ApiResponse<FinanceRequest>>('/api/finance-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: {
      title?: string;
      description?: string;
      unit_cost_kobo?: number;
      quantity?: number;
      request_type_id?: number;
    }) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    destroy: (id: number) =>
      request<ApiResponse<null>>(`/api/finance-requests/${id}`, { method: 'DELETE' }),

    financeReview: (id: number, notes: string) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}/finance-review`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),

    financeReject: (id: number, notes: string, rejection_category: RejectionCategory) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}/finance-reject`, {
        method: 'POST',
        body: JSON.stringify({ notes, rejection_category }),
      }),

    satgoApprove: (id: number, notes: string) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}/satgo-approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),

    satgoReject: (id: number, notes: string, rejection_category: RejectionCategory) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}/satgo-reject`, {
        method: 'POST',
        body: JSON.stringify({ notes, rejection_category }),
      }),

    recordPayment: (id: number, data: {
      amount_kobo: number;
      payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'pos';
      payment_reference?: string;
      payment_date: string;
      notes?: string;
    }) =>
      request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    uploadReceipt: (id: number, file: File, amountKobo: number, notes?: string) => {
      const form = new FormData();
      form.append('file', file);
      form.append('amount_kobo', String(amountKobo));
      if (notes) form.append('notes', notes);
      return request<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}/receipts`, {
        method: 'POST',
        body: form,
      });
    },

    uploadDocument: (id: number, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<ApiResponse<RequestDocument>>(`/api/finance-requests/${id}/documents`, {
        method: 'POST',
        body: form,
      });
    },
  },

  // Internal Requests (Tier 1 — within departments)
  internalRequests: {
    list: (params?: {
      event_id?: number;
      department_id?: number;
      status?: InternalRequestStatus | string;
      per_page?: number;
      page?: number;
    }) => {
      const qs = params
        ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
        : '';
      return request<PaginatedResponse<InternalRequest>>(`/api/internal-requests${qs}`);
    },

    get: (id: number) =>
      request<ApiResponse<InternalRequest>>(`/api/internal-requests/${id}`),

    create: (data: {
      title: string;
      description?: string;
      unit_cost_kobo: number;
      quantity: number;
      department_id: number;
      event_id: number;
      request_type_id: number;
    }) =>
      request<ApiResponse<InternalRequest>>('/api/internal-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: {
      title?: string;
      description?: string;
      unit_cost_kobo?: number;
      quantity?: number;
      request_type_id?: number;
    }) =>
      request<ApiResponse<InternalRequest>>(`/api/internal-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    submit: (id: number) =>
      request<ApiResponse<InternalRequest>>(`/api/internal-requests/${id}/submit`, {
        method: 'POST',
      }),

    review: (id: number, action: 'lead_approve' | 'lead_reject' | 'lead_revision_request', notes: string) =>
      request<ApiResponse<InternalRequest>>(`/api/internal-requests/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      }),

    destroy: (id: number) =>
      request<ApiResponse<null>>(`/api/internal-requests/${id}`, { method: 'DELETE' }),

    uploadDocument: (id: number, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<ApiResponse<RequestDocument>>(`/api/internal-requests/${id}/documents`, {
        method: 'POST',
        body: form,
      });
    },
  },

  // Request Types
  requestTypes: {
    list: () =>
      request<ApiResponse<RequestType[]>>('/api/request-types'),

    create: (data: { name: string; description?: string }) =>
      request<ApiResponse<RequestType>>('/api/request-types', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: { name?: string; description?: string; is_active?: boolean }) =>
      request<ApiResponse<RequestType>>(`/api/request-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    destroy: (id: number) =>
      request<ApiResponse<null>>(`/api/request-types/${id}`, { method: 'DELETE' }),
  },

  // Bank Statements
  bankStatements: {
    list: (eventId: number) =>
      request<ApiResponse<BankStatement[]>>(`/api/events/${eventId}/bank-statements`),

    upload: (eventId: number, file: File, data: { statement_date: string; closing_balance_kobo?: number; notes?: string }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('statement_date', data.statement_date);
      if (data.closing_balance_kobo != null) form.append('closing_balance_kobo', String(data.closing_balance_kobo));
      if (data.notes) form.append('notes', data.notes);
      return request<ApiResponse<BankStatement>>(`/api/events/${eventId}/bank-statements`, {
        method: 'POST',
        body: form,
      });
    },
  },

  // Users
  users: {
    list: () =>
      request<ApiResponse<ApiUser[]>>('/api/users'),

    update: (id: number, data: { name?: string; phone?: string; department_id?: number; role?: string; is_active?: boolean }) =>
      request<ApiResponse<ApiUser>>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
