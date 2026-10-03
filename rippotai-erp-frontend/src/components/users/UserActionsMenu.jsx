import React from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { RowMenu } from "@/pages/settings/_admin-ui";

export default function UserActionsMenu({
  isSelf,
  isActive,
  saving,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  return (
    <RowMenu
      label="User actions"
      icon={MoreHorizontal}
      busy={saving}
      items={[
        {
          label: "Edit user",
          icon: Pencil,
          onClick: onEdit,
          disabled: isSelf,
          title: isSelf ? "Use Profile Settings to edit your own account" : undefined,
        },
        {
          label: isActive ? "Deactivate" : "Activate",
          icon: Power,
          onClick: onToggleActive,
          disabled: isSelf,
          title: isSelf ? "You can't deactivate your own account" : undefined,
        },
        "sep",
        {
          label: "Delete user",
          icon: Trash2,
          onClick: onDelete,
          danger: true,
          disabled: isSelf,
          title: isSelf ? "You can't delete your own account" : undefined,
        },
      ]}
    />
  );
}
