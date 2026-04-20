// Solid fill status badges — no gradients, no translucent rgba backgrounds.
// Colors match the brand spec in colors.md exactly.

interface BadgeConfig {
  bg: string;
  color: string;
  label: string;
  pulse?: boolean;
}

const CONFIG: Record<string, BadgeConfig> = {
  // ── Finance Request statuses (Tier 2) ──────────────────────────────────────
  submitted:        { bg: '#3D2A0A', color: '#FBBF24', label: 'Submitted',       pulse: true },
  finance_reviewed: { bg: '#1A2F4D', color: '#60A5FA', label: 'Finance Reviewed' },
  finance_rejected: { bg: '#3D1F1F', color: '#F87171', label: 'Finance Rejected' },
  satgo_approved:   { bg: '#3D2D0F', color: '#D4A843', label: 'SATGO Approved'  },
  satgo_rejected:   { bg: '#3D1F1F', color: '#F87171', label: 'SATGO Rejected'  },
  approval_expired: { bg: '#3D2A0A', color: '#FB923C', label: 'Approval Expired' },
  partial_payment:  { bg: '#2E1F4D', color: '#B794F4', label: 'Partial Payment',  pulse: true },
  paid:             { bg: '#123D2A', color: '#34D399', label: 'Paid'            },
  receipted:        { bg: '#0F3D38', color: '#2DD4BF', label: 'Receipted'       },
  refund_pending:   { bg: '#3D2A0A', color: '#FB923C', label: 'Refund Pending',  pulse: true },
  refund_completed: { bg: '#0F3D38', color: '#2DD4BF', label: 'Refund Done'     },
  completed:        { bg: '#0F4E1E', color: '#8EDC9E', label: 'Completed'       },

  // ── Internal Request statuses (Tier 1) ────────────────────────────────────
  draft:            { bg: '#1A0F4D', color: '#A89FB8', label: 'Draft'           },
  approved:         { bg: '#123D2A', color: '#34D399', label: 'Approved'        },
  needs_revision:   { bg: '#3D2A0A', color: '#FCD34D', label: 'Needs Revision'  },
  rejected:         { bg: '#3D1F1F', color: '#F87171', label: 'Rejected'        },

  // ── Event statuses ────────────────────────────────────────────────────────
  planning:         { bg: '#1A2F4D', color: '#60A5FA', label: 'Planning'        },
  active:           { bg: '#123D2A', color: '#34D399', label: 'Active'          },
  cancelled:        { bg: '#3D1F1F', color: '#F87171', label: 'Cancelled'       },
  closed:           { bg: '#1A0F4D', color: '#A89FB8', label: 'Closed'          },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? {
    bg:    '#1A0F4D',
    color: '#A89FB8',
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-body ${className}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: cfg.color, animation: 'pulseDot 2s ease-in-out infinite' }}
        />
      )}
      {cfg.label}
    </span>
  );
}
