import React, { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
} from "@dnd-kit/sortable";
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
  onReorderItems,
  onToggleHide,
  onLockedEdit,
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
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
      <tr className="boq-category-row" data-testid={`category-row-${cat.code}`}>
        <td colSpan={9}>
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed((c) => !c)} className="p-1 rounded hover:bg-[#B5C4B6]" data-testid={`cat-collapse-${cat.code}`}>
              {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className="w-8 h-8 rounded bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center">
              {cat.code}
            </div>
            <h3 className="font-serif-bc text-[18px] text-[#333333] flex-1">{cat.name}</h3>
            <div className="text-[11.5px] text-[#B5C4B6]">{items.length} items</div>
            <div className="text-[13px] font-semibold text-[#333333] min-w-[120px] text-right">
              SUBTOTAL {formatINR(cat.subtotal || 0)}
            </div>
            <input
              type="checkbox"
              onChange={(e) => onSelectCategory(cat.id, e.target.checked)}
              title="Select all in category"
              className="ml-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-[#B5C4B6]" data-testid={`cat-menu-${cat.code}`}>
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={guarded(() => onAddItem(cat.id))}>
                  <Plus size={13} className="mr-2" /> Add line
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={guarded(() => onDeleteCat(cat.id))} className="text-[#333333]">
                  <Trash2 size={13} className="mr-2" /> Delete category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
      {!collapsed && (
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
            onReorderItems(cat.id, arrayMove(items, oldIndex, newIndex).map((i) => i.id));
          }}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
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
      {!collapsed && items.length === 0 && (
        <tr>
          <td colSpan={9} className="text-center py-6 text-[12.5px] text-[#B5C4B6]">
            No items in this category.{" "}
            <button className="text-[#333333] font-semibold hover:underline" onClick={guarded(() => onAddItem(cat.id))}>
              Add line item
            </button>
          </td>
        </tr>
      )}
    </>
  );
}