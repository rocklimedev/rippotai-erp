export const BRIEF_STATUS_LABELS = {
  DRAFT: "Draft",
  READY_FOR_DESIGN: "Ready for design",
  SIGNED_OFF: "Signed off",
  ARCHIVED: "Archived",
};
export function briefTransitions(status, canApprove) {
  const transitions = {
    DRAFT: ["READY_FOR_DESIGN", "ARCHIVED"],
    READY_FOR_DESIGN: [
      "DRAFT",
      ...(canApprove ? ["SIGNED_OFF"] : []),
      "ARCHIVED",
    ],
    SIGNED_OFF: canApprove ? ["ARCHIVED"] : [],
    ARCHIVED: [],
  };
  return transitions[status] || [];
}
