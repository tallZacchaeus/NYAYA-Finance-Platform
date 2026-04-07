# NYAYA Finance Platform

A financial request management platform built with Next.js 14, Firebase, and Firebase session cookies for NYAYA Youth Affairs.

## Features

- **Role-based access**: Requesters and Admins with separate dashboards
- **Request lifecycle**: Submit → Review → Approve/Reject → Mark Paid → Upload Receipt → Complete
- **Email notifications**: Automated emails via Resend at every status change
- **Audit logging**: Full audit trail for all actions
- **In-app notifications**: Real-time notification bell with unread count
- **CSV export**: Admin can export all requests to CSV
- **File uploads**: Supporting documents and payment receipts via Firebase Cloud Storage
- **TypeScript**: Fully typed throughout

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Firebase Firestore |
| Auth | Firebase Auth + Firebase session cookies |
| Storage | Firebase Cloud Storage |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Email | Resend |
| UI Icons | Lucide React |

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

**Firebase (Client-side):**

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase Admin SDK (Server-side — keep secret):**

- `FIREBASE_PROJECT_ID` - Firebase project ID from your service account
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key

**Firebase Session Auth:**

- Server-side session creation requires `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.

**Email:**

- `RESEND_API_KEY` - Your Resend API key
- `EMAIL_FROM` - Sender email address

**App:**

- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g. `http://localhost:3000`)

### 3. Set up Firebase

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** in Native mode
3. Enable **Firebase Authentication** (Email/Password provider)
4. Enable **Cloud Storage**
5. Deploy the security rules:

   ```bash
   firebase deploy --only firestore:rules,storage
   ```

   Or copy the rules manually from `firestore.rules` and `storage.rules` into the Firebase console.

### 4. Firestore Collections

Collections are created automatically as the app runs. The schema is:

| Collection | Purpose |
| --- | --- |
| `users` | User profiles (role, email, name, department) |
| `requests` | Financial request records with status lifecycle |
| `request_documents` | Supporting files uploaded by requesters |
| `receipts` | Payment receipts uploaded after payment |
| `audit_logs` | Immutable audit trail of all actions |
| `notifications` | Per-user in-app notifications |

### 5. Create an admin user

Sign up through the app, then update the user's role directly in Firestore:

1. Open the Firebase console → Firestore
2. Find the document in the `users` collection matching your email
3. Set the `role` field to `"admin"`

### 6. Run development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nyaya-finance-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Registration page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell with sidebar
│   │   ├── requester/
│   │   │   ├── page.tsx            # Requester dashboard
│   │   │   ├── new-request/        # New request form
│   │   │   └── requests/[id]/      # Request detail (requester view)
│   │   └── admin/
│   │       ├── page.tsx            # Admin dashboard
│   │       └── requests/
│   │           ├── page.tsx        # All requests (admin)
│   │           └── [id]/page.tsx   # Request detail with actions
│   ├── api/
│   │   ├── session/                # Firebase session login/logout handlers
│   │   ├── requests/               # CRUD + status endpoints
│   │   ├── export/                 # CSV export
│   │   └── notifications/          # Notification management
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Root redirect
├── components/
│   ├── ui/                         # Button, Input, Badge, Card, Modal
│   ├── layout/                     # Sidebar, Header
│   └── requests/                   # RequestForm, RequestTable, RequestCard, StatusBadge
├── lib/
│   ├── firebase.ts                 # Client-side Firebase init
│   ├── firebase-admin.ts           # Admin SDK (server-side)
│   ├── firestore.ts                # Firestore timestamp utilities
│   ├── auth.ts                     # Firebase session auth helper
│   ├── email.ts                    # Resend email templates
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Utility functions
├── firestore.rules                 # Firestore security rules
├── storage.rules                   # Cloud Storage security rules
└── firebase.json                   # Firebase project config
```

## Request Status Flow

```
pending → approved → paid → completed
        ↘ rejected
```

- **pending**: Submitted, awaiting admin review
- **approved**: Admin approved, awaiting payment
- **rejected**: Admin rejected (with reason)
- **paid**: Payment processed by admin
- **completed**: Receipt uploaded, request fully closed

## File Storage

Files are stored in Firebase Cloud Storage with two paths:

- `request-documents/` — Supporting documents (PDF, JPEG, PNG, WebP; max 10 MB)
- `receipts/` — Payment receipts (PDF, JPEG, PNG, WebP; max 10 MB)

Access is controlled via `storage.rules` — users can only read/write files linked to their own requests.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests` | List requests (filtered by role) |
| POST | `/api/requests` | Create new request |
| GET | `/api/requests/[id]` | Get single request |
| PATCH | `/api/requests/[id]` | Update request |
| DELETE | `/api/requests/[id]` | Delete request |
| POST | `/api/requests/[id]/approve` | Admin: approve |
| POST | `/api/requests/[id]/reject` | Admin: reject with reason |
| POST | `/api/requests/[id]/paid` | Admin: mark as paid |
| POST | `/api/requests/[id]/receipt` | Admin: upload receipt |
| GET | `/api/export` | Admin: download CSV |
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications` | Mark all as read |

## Currency

All amounts are in Nigerian Naira (NGN). The currency formatting uses `en-NG` locale.

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

```bash
npm run build  # Test build locally first
```

> Note: The legacy Supabase schema is preserved in `supabase/schema.sql` for reference only and is not used by the app.
