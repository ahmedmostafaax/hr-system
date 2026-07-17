export type ApprovalStatus = "pending" | "approved" | "rejected";

const colors: Record<ApprovalStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const labels: Record<ApprovalStatus, string> = {
  pending: "في الانتظار",
  approved: "معتمد",
  rejected: "مرفوض",
};

interface ApprovalBadgeProps {
  status: ApprovalStatus | string;
  className?: string;
}

export function ApprovalBadge({ status, className = "" }: ApprovalBadgeProps) {
  const key = (status?.toLowerCase?.() || "pending") as ApprovalStatus;
  const style = colors[key] ?? colors.pending;
  const label = labels[key] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {label}
    </span>
  );
}
