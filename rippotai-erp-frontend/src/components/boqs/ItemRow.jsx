import React, { useRef, useState } from "react";
import {
  Copy,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  CheckCircle2,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { formatINR } from "@/lib/format";
import { UNITS } from "../../hooks/constants";
import { useGetUnitsQuery } from "../../api/unit.api";
import { EditableCell } from "./EditableCell";
import { AddUnitModal } from "./AddUnitModal";

export function ItemRow({
  item,
  sno,
  disabled,
  selected,
  onSelect,
  onPatch,
  onDelete,
  onDuplicate,
  onOpenDetail,
  onLockedEdit,
  onToggleHide,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : item.hidden ? 0.45 : 1,
  };

  const isL = item.calc_type === "L";

  const quantity = Number(item.quantity || 0);
  const rate = Number(item.rate || 0);

  const missing = !item.unit || (!isL && (!quantity || !rate));

  const description = item.name || item.notes || "";

  const guardedFire = (fn) => () => {
    if (disabled) {
      onLockedEdit();
      return;
    }

    fn();
  };

  const openMenuRef = useRef(null);

  const openMenu = () => {
    openMenuRef.current?.click();
  };

  // Units are fetched dynamically so newly-created ones show up immediately,
  // falling back to the static constant list if the API hasn't loaded yet.
  const { data: fetchedUnits } = useGetUnitsQuery();
  const [addUnitOpen, setAddUnitOpen] = useState(false);

  const unitOptions =
    fetchedUnits && fetchedUnits.length > 0
      ? fetchedUnits.map((u) => u.code)
      : UNITS;

  // Make sure the item's current unit is always selectable, even if it
  // isn't (yet) in the fetched/static list.
  const allUnitOptions =
    item.unit && !unitOptions.includes(item.unit)
      ? [item.unit, ...unitOptions]
      : unitOptions;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        bg-white 
        border-b 
        border-[#B5C4B6] 
        group 
        ${missing ? "boq-row-attention" : ""}
        ${item.hidden ? "boq-row-hidden" : ""}
      `}
      data-testid={`item-row-${item.id}`}
    >
      {/* ACTION MENU */}

      <td className="boq-cell text-center w-11 relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              ref={openMenuRef}
              tabIndex={0}
              onDoubleClick={openMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                openMenu();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openMenu();
                }
              }}
              className="
                inline-flex 
                items-center 
                justify-center 
                p-1 
                rounded 
                hover:bg-[#EAEEF0]
                focus:bg-[#EAEEF0]
                outline-none
                cursor-context-menu
              "
              data-testid={`item-handle-${item.id}`}
              {...(!disabled ? { ...attributes, ...listeners } : {})}
            >
              <GripVertical size={14} className="text-[#6B7B7C]" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onSelect={() => onSelect(item.id, !selected)}>
              <CheckCircle2 size={13} className="mr-2" />

              {selected ? "Deselect" : "Select"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={guardedFire(() => onDuplicate(item.id))}
            >
              <Copy size={13} className="mr-2" />
              Copy
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={guardedFire(() => onToggleHide(item.id, !item.hidden))}
            >
              {item.hidden ? (
                <>
                  <Eye size={13} className="mr-2" />
                  Show
                </>
              ) : (
                <>
                  <EyeOff size={13} className="mr-2" />
                  Hide
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => onOpenDetail(item)}>
              <Eye size={13} className="mr-2" />
              Details
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={guardedFire(() => onDelete(item.id))}
              className="text-[#333333]"
            >
              <Trash2 size={13} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      {/* SERIAL */}

      <td className="boq-cell text-center text-[#B5C4B6] w-10">{sno}</td>

      {/* DESCRIPTION */}

      <EditableCell
        value={description}
        onChange={(v) =>
          onPatch({
            name: v,
          })
        }
        disabled={disabled}
        onLockedEdit={onLockedEdit}
        testid={`item-desc-${item.id}`}
        className="min-w-[280px]"
      />

      {/* NOTES */}

      <EditableCell
        value={item.notes || ""}
        onChange={(v) =>
          onPatch({
            notes: v,
          })
        }
        disabled={disabled}
        onLockedEdit={onLockedEdit}
        testid={`item-notes-${item.id}`}
        className="min-w-[280px]"
      />

      {/* LOCATION */}

      <EditableCell
        value={item.location || ""}
        onChange={(v) =>
          onPatch({
            location: v,
          })
        }
        disabled={disabled}
        onLockedEdit={onLockedEdit}
        className="w-[120px]"
      />

      {/* UNIT */}

      <td
        className="boq-cell w-[92px]"
        onClick={() => {
          if (disabled) onLockedEdit();
        }}
      >
        {disabled ? (
          <span>{item.unit || "—"}</span>
        ) : (
          <div className="flex items-center gap-1">
            <select
              className="w-full bg-transparent outline-none"
              value={item.unit || ""}
              onChange={(e) =>
                onPatch({
                  unit: e.target.value,
                })
              }
            >
              <option value="" disabled>
                Select
              </option>
              {allUnitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddUnitOpen(true);
              }}
              className="
                shrink-0
                inline-flex
                items-center
                justify-center
                w-5
                h-5
                rounded
                text-[#6B7B7C]
                hover:bg-[#EAEEF0]
                hover:text-[#333333]
              "
              title="Add unit"
              data-testid={`item-add-unit-${item.id}`}
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </td>

      {/* QUANTITY */}

      {isL ? (
        <td className="boq-cell text-center text-[#B5C4B6] w-[80px]">—</td>
      ) : (
        <EditableCell
          value={item.quantity}
          type="number"
          onChange={(v) =>
            onPatch({
              quantity: v,
            })
          }
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          align="right"
          className="w-[80px]"
        />
      )}

      {/* RATE */}

      {isL ? (
        <td className="boq-cell text-[#B5C4B6] italic text-right w-[100px]">
          Lump sum
        </td>
      ) : (
        <EditableCell
          value={item.rate}
          type="number"
          onChange={(v) =>
            onPatch({
              rate: v,
            })
          }
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          align="right"
          className="w-[100px]"
          format={(v) => formatINR(v)}
        />
      )}

      {/* TYPE */}

      <td
        className="boq-cell w-[70px] text-center"
        onClick={() => {
          if (disabled) onLockedEdit();
        }}
      >
        {disabled ? (
          <span className="text-[10.5px] text-[#B5C4B6]">
            {isL ? "L" : "M"}
          </span>
        ) : (
          <button
            onClick={() => {
              onPatch({
                calc_type: isL ? "M" : "L",

                amount: isL
                  ? Math.round(quantity * rate * 100) / 100
                  : Number(item.amount || 0),
              });
            }}
            className="
              text-[10px]
              font-bold
              px-2
              py-0.5
              rounded
              bg-[#EAEEF0]
            "
          >
            {isL ? "L" : "M"}
          </button>
        )}
      </td>

      {/* AMOUNT */}

      {isL ? (
        <EditableCell
          value={item.amount}
          type="number"
          onChange={(v) =>
            onPatch({
              amount: v,
            })
          }
          disabled={disabled}
          onLockedEdit={onLockedEdit}
          align="right"
          className="w-[120px] font-semibold"
          format={(v) => formatINR(v)}
        />
      ) : (
        <td
          className="
            boq-cell 
            text-right 
            font-semibold 
            w-[120px]
          "
        >
          {formatINR(item.amount)}
        </td>
      )}

      {/* Portal-rendered dialog — safe to mount inside a <tr> */}
      <AddUnitModal
        open={addUnitOpen}
        onClose={setAddUnitOpen}
        onCreated={(unit) => onPatch({ unit: unit.code })}
      />
    </tr>
  );
}
