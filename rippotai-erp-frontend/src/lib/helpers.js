// Indian currency formatting: ₹1,25,000
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  const num = Number(amount);
  if (num === 0) return "₹0";
  const absNum = Math.abs(num);
  const [intPart, decPart] = absNum.toFixed(2).split(".");
  let formatted = "";
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  } else {
    formatted = intPart;
  }
  const decStr = decPart === "00" ? "" : `.${decPart}`;
  return `${num < 0 ? "-" : ""}₹${formatted}${decStr}`;
};

// Format date to DD MMM YYYY
export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Format datetime
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

// Status badge config
export const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  pending_approval: {
    label: "Pending Approval",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  returned_for_editing: {
    label: "Returned",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  resubmitted: {
    label: "Resubmitted",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  declined: {
    label: "Declined",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  active: {
    label: "Active",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
  },
  blocked: {
    label: "Blacklisted",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  blacklisted: {
    label: "Blacklisted",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  on_hold: {
    label: "On Hold",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["draft"];
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`;
};

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || STATUS_CONFIG["draft"];
