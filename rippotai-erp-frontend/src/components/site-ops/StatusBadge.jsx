import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  // Architect visits
  'Not Scheduled': 'bg-[var(--mist)] text-[var(--muted)]',
  Scheduled: 'bg-[#E7EEEB] text-[#0D3D2F] border-[#C5D6CF]',
  Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  // Snags
  Open: 'bg-amber-50 text-amber-800 border-amber-200',
  'In Progress': 'bg-[#E7EEEB] text-[#0D3D2F] border-[#C5D6CF]',
  Rectified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Closed: 'bg-[var(--mist)] text-[var(--muted)]',
  // RFIs
  OPEN: 'bg-amber-50 text-amber-800 border-amber-200',
  ANSWERED: 'bg-[#E7EEEB] text-[#0D3D2F] border-[#C5D6CF]',
  CLOSED: 'bg-[var(--mist)] text-[var(--muted)]',
  // Mockups
  PROPOSED: 'bg-violet-50 text-violet-800 border-violet-200',
  UNDER_REVIEW: 'bg-[#E7EEEB] text-[#0D3D2F] border-[#C5D6CF]',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  // Quality
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Passed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
  'N/A': 'bg-[var(--mist)] text-[var(--muted)]',
  // Priority
  LOW: 'bg-[var(--mist)] text-[var(--muted)]',
  NORMAL: 'bg-[#E7EEEB] text-[#0D3D2F] border-[#C5D6CF]',
  HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  // Visit types
  Mandatory: 'bg-[#E7EEEB] text-[#0D3D2F] border-[#C5D6CF]',
  'Hold Point': 'bg-orange-50 text-orange-800 border-orange-200',
  'As Required': 'bg-[var(--mist)] text-[var(--muted)]',
  'Mandatory (Critical)': 'bg-red-50 text-red-700 border-red-200',
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'bc-badge border',
        STATUS_STYLES[status] || 'bg-[var(--mist)] text-[var(--muted)]',
        className,
      )}
    >
      {status}
    </span>
  );
}
