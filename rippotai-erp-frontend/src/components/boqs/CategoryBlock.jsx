import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatINR } from "@/lib/format";
import { ItemRow } from "./ItemRow";

export function CategoryBlock({
  cat,
  items,
  disabled,
  selectedIds,
  onSelectItem,
  onSelectCategory,
  onPatchItem,
  onDeleteItem,
  onDuplicateItem,
  onOpenDetail,
  onAddItem,
  onDeleteCat,
  onRenameCat,
  canRenameCat,
  renamingCategory,
  moveControls,
  moveUp,
  moveDown,
  moving,
  onReorderItems,
  onToggleHide,
  onLockedEdit,
  // Drag the category (header) row by its ⋮⋮ handle — set by the BOQ workspace.
  sortableId,
  dragDisabled,
  hideItems,
}) {
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId || `cat-${cat.id}`, disabled: !sortableId || dragDisabled });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const [collapsed, setCollapsed] = useState(!!cat.collapsed);
  const guarded = (fn) => () => {
    if (disabled) {
      onLockedEdit();
      return;
    }
    fn();
  };

  return (
    <>
      <tr
        ref={setDragRef}
        className="boq-category-row"
        data-testid={`category-row-${cat.code}`}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
          position: "relative",
          zIndex: isDragging ? 5 : undefined,
          opacity: isDragging ? 0.85 : undefined,
          boxShadow: isDragging ? "0 6px 18px rgba(31,69,59,0.18)" : undefined,
        }}
      >
        <td colSpan={10}>
          <div className="flex items-center gap-3">
            {sortableId && (
              <button
                type="button"
                ref={setActivatorNodeRef}
                className="boq-cat-grip rounded p-1 text-[#6B7B7C] hover:bg-[#EAEEF0] disabled:opacity-40"
                style={{ cursor: dragDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab", touchAction: "none" }}
                aria-label={`Drag to move category ${cat.name}`}
                title={dragDisabled ? "BOQ is locked" : "Drag to move this category"}
                disabled={dragDisabled}
                data-testid={`cat-grip-${cat.code}`}
                {...dragAttributes}
                {...dragListeners}
              >
                <GripVertical size={16} aria-hidden />
              </button>
            )}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-1 rounded hover:bg-[#B5C4B6]"
              data-testid={`cat-collapse-${cat.code}`}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            <div className="w-8 h-8 rounded bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center">
              {cat.code}
            </div>
            <div className="flex flex-1 items-center gap-2">
              <h3 className="text-[18px] text-[#333333]">{cat.name}</h3>
              {onRenameCat && (
                <button
                  type="button"
                  className="rounded p-1 hover:bg-[#B5C4B6] disabled:opacity-40"
                  aria-label={`Rename category ${cat.name}`}
                  title={canRenameCat ? "Rename category" : "BOQ edit permission is required"}
                  disabled={!canRenameCat || renamingCategory}
                  onClick={guarded(() => onRenameCat(cat))}
                >
                  <Pencil size={15} aria-hidden />
                </button>
              )}
            </div>
            <div className="text-[11.5px] text-[#B5C4B6]">
              {items.length} items
            </div>
            <div className="text-[13px] font-semibold text-[#333333] min-w-[120px] text-right">
              SUBTOTAL {formatINR(cat.subtotal || 0)}
            </div>
            <input
              type="checkbox"
              onChange={(e) => onSelectCategory(cat.id, e.target.checked)}
              title="Select all in category"
              className="ml-1"
            />
            {moveControls && (
              <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Rearrange ${cat.name}`}>
                <button
                  type="button"
                  className="rounded border p-1 hover:bg-[#EAEEF0] disabled:opacity-40"
                  aria-label={`Move category ${cat.name} up`}
                  title="Move category up"
                  disabled={moving || !moveUp}
                  onClick={moveUp}
                >
                  <ArrowUp size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className="rounded border p-1 hover:bg-[#EAEEF0] disabled:opacity-40"
                  aria-label={`Move category ${cat.name} down`}
                  title="Move category down"
                  disabled={moving || !moveDown}
                  onClick={moveDown}
                >
                  <ArrowDown size={16} aria-hidden />
                </button>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-[#B5C4B6]"
                  data-testid={`cat-menu-${cat.code}`}
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={guarded(() => onAddItem(cat.id))}>
                  <Plus size={13} className="mr-2" /> Add line
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={guarded(() => onDeleteCat(cat.id))}
                  className="text-[#333333]"
                >
                  <Trash2 size={13} className="mr-2" /> Delete category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
      {!collapsed && !hideItems && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => {
            if (!e.over || e.active.id === e.over.id) return;
            if (disabled) {
              onLockedEdit();
              return;
            }
            const oldIndex = items.findIndex((i) => i.id === e.active.id);
            const newIndex = items.findIndex((i) => i.id === e.over.id);
            onReorderItems(
              cat.id,
              arrayMove(items, oldIndex, newIndex).map((i) => i.id),
            );
          }}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((it, idx) => (
              <ItemRow
                key={it.id}
                item={it}
                sno={idx + 1}
                disabled={disabled}
                selected={selectedIds.has(it.id)}
                onSelect={onSelectItem}
                onPatch={(patch) => onPatchItem(it.id, patch)}
                onDelete={onDeleteItem}
                onDuplicate={onDuplicateItem}
                onOpenDetail={onOpenDetail}
                onToggleHide={onToggleHide}
                onLockedEdit={onLockedEdit}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      {!collapsed && !hideItems && items.length === 0 && (
        <tr>
          <td
            colSpan={10}
            className="text-center py-6 text-[12.5px] text-[#B5C4B6]"
          >
            No items in this category.{" "}
            <button
              className="text-[#333333] font-semibold hover:underline"
              onClick={guarded(() => onAddItem(cat.id))}
            >
              Add line item
            </button>
          </td>
        </tr>
      )}
    </>
  );
}
