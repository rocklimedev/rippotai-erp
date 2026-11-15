// Info line under a document's page title:
// "BOQ-2026-105 · Project: PRJ-009 · Aurum Offices · v3 · Updated 14 Nov 2026"
import { useGetRecordContextQuery } from "@/api/doc-flow/record-context.api";
import { useGetDocReviewsQuery } from "@/api/doc-flow/doc-flow.api";
import { docCode, fmtDay, projectLabel } from "./codes";

export function useRecordContext(type, id) {
  const skip = !type || !id;
  const ctx = useGetRecordContextQuery({ type, id }, { skip });
  const reviews = useGetDocReviewsQuery({ type, id }, { skip });
  return { ctx: ctx.data, reviews: reviews.data, isLoading: ctx.isLoading, isError: ctx.isError };
}

export const currentVersion = (ctx, reviews) => {
  const fileV = ctx?.files?.find((f) => f.current)?.version;
  const n = ctx?.version ?? reviews?.state?.snapshotVersion ?? (fileV ? parseInt(String(fileV).replace(/\D/g, ""), 10) || null : null);
  return n || 1;
};

/** "v3", or the file's own label for uploads ("V2", "R1"). */
export function versionLabel(ctx, reviews) {
  const file = ctx?.files?.find((f) => f.current)?.version;
  if (file != null && file !== "") return /^\d+$/.test(String(file)) ? `v${file}` : String(file);
  return `v${currentVersion(ctx, reviews)}`;
}

export function recordInfo(ctx, reviews) {
  if (!ctx) return null;
  const code = docCode(ctx.type, ctx.number, ctx.project?.code);
  return [
    code,
    ctx.project ? `Project: ${projectLabel(ctx.project)}` : null,
    versionLabel(ctx, reviews),
    ctx.updated_at ? `Updated ${fmtDay(ctx.updated_at)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function useRecordInfo(type, id) {
  const { ctx, reviews } = useRecordContext(type, id);
  return recordInfo(ctx, reviews);
}
