import React from "react";
import { MoreHorizontal, Pencil, Trash2, RotateCcw } from "lucide-react";
import { RowMenu } from "@/pages/settings/_admin-ui";

export default function ClientActionsMenu({
  client,
  isDeleted = false,
  saving = false,
  onEdit,
  onDelete,
  onRestore,
}) {
  const items = isDeleted
    ? [{ label: "Restore client", icon: RotateCcw, onClick: onRestore }]
    : [
        { label: "Edit client", icon: Pencil, onClick: onEdit },
        "sep",
        { label: "Delete client", icon: Trash2, onClick: onDelete, danger: true },
      ];

  return (
    <RowMenu
      label={`Actions for ${client?.name || "client"}`}
      icon={MoreHorizontal}
      busy={saving}
      items={items}
    />
  );
}
