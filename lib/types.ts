export type UserRole = 'requester' | 'admin';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';

export type RequestCategory = 'travel' | 'supplies' | 'events' | 'utilities' | 'personnel' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  amount: number;
  purpose: string;
  category: RequestCategory;
  description?: string;
  status: RequestStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  documents?: RequestDocument[];
  receipt?: Receipt;
}

export interface RequestDocument {
  id: string;
  request_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  type: 'supporting' | 'invoice' | 'quote';
  uploaded_by?: string;
  uploaded_at: string;
}

export interface Receipt {
  id: string;
  request_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  request_id?: string;
  action: string;
  user_id?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  request_id?: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
