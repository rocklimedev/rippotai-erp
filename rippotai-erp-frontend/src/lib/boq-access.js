export function getBoqAccess(boq, user) {
  const isOwner = Boolean(user?.id && boq?.created_by && user.id === boq.created_by);
  return {
    isOwner,
    canSubmit: Boolean(isOwner && user.permissions?.includes("boq:submit") &&
      ["draft", "in_progress"].includes(boq.status)),
    canApprove: Boolean(isOwner && user.permissions?.includes("boq:approve") &&
      boq.status === "awaiting_approval"),
  };
}
