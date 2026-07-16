import React, { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  useGetLibraryCategoriesQuery,
  useAddBoqCategoryMutation,
  useAddTemplateCategoryMutation,
} from "../../api/boq.api";

export function AddCategoryPanel({
  open,
  onClose,
  boqId,
  mode = "boq", // "boq" | "template"
  existingCategories,
  onAdded,
}) {
  const [q, setQ] = useState("");

  const { data: categories = [] } = useGetLibraryCategoriesQuery(undefined, {
    skip: !open,
  });

  const [addBoqCategory] = useAddBoqCategoryMutation();
  const [addTemplateCategory] = useAddTemplateCategoryMutation();

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );

  const add = async (category) => {
    try {
      const payload = {
        library_category_id: category.id,
        name: category.name,
        include_items: true,
      };
      if (mode === "template") {
        await addTemplateCategory({ templateId: boqId, ...payload }).unwrap();
      } else {
        await addBoqCategory({ boqId, ...payload }).unwrap();
      }
      toast.success("Category added");
      onAdded();
    } catch (error) {
      toast.error("Failed to add");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] bg-white">
        <SheetHeader>
          <SheetTitle className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-normal">
            Library Categories
          </SheetTitle>
          <div className="text-[16px] font-bold text-[#333333]">
            Add category
          </div>
        </SheetHeader>

        <div className="mt-4 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
          />
          <input
            className="bc-input pl-8"
            placeholder="Search categories…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {filtered.map((category) => {
            const included = existingCategories.has(
              category.name.toLowerCase().trim(),
            );
            return (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#B5C4B6] hover:bg-[#EAEEF0]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1F453B] text-white text-[13px] font-bold flex items-center justify-center">
                  {category.sort_order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif-bc text-[15px] text-[#333333]">
                    {category.name}
                  </div>
                  <div className="text-[11.5px] text-[#B5C4B6]">
                    Library category
                  </div>
                </div>
                {included ? (
                  <span className="text-[11px] font-semibold text-[#333333] flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Included
                  </span>
                ) : (
                  <button
                    onClick={() => add(category)}
                    className="h-8 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold"
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
