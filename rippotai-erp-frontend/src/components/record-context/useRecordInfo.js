// Info line under a document's page title: "Aurum Offices · BOQ-2026-105"
import { useGetRecordContextQuery } from '@/api/doc-flow/record-context.api';
import { useGetDocReviewsQuery } from '@/api/doc-flow/doc-flow.api';
import { docCode } from './codes';

export function useRecordContext(type, id) {
  const skip = !type || !id;
  const ctx = useGetRecordContextQuery({ type, id }, { skip });
  const reviews = useGetDocReviewsQuery({ type, id }, { skip });
  return { ctx: ctx.data, reviews: reviews.data, isLoading: ctx.isLoading, isError: ctx.isError };
}

export const currentVersion = (ctx, reviews) => {
  const fileV = ctx?.files?.find((f) => f.current)?.version;
  const n =
    ctx?.version ??
    reviews?.state?.snapshotVersion ??
    (fileV ? parseInt(String(fileV).replace(/\D/g, ''), 10) || null : null);
  return n || 1;
};

/** "v3", or the file's own label for uploads ("V2", "R1"). */
export function versionLabel(ctx, reviews) {
  const file = ctx?.files?.find((f) => f.current)?.version;
  if (file != null && file !== '') return /^\d+$/.test(String(file)) ? `v${file}` : String(file);
  return `v${currentVersion(ctx, reviews)}`;
}

/** Line under a document's title: "Kapoor Farmhouse · PS-PRJ-003" (project name and document code only). */
export function recordInfo(ctx) {
  if (!ctx) return null;
  const code = docCode(ctx.type, ctx.number, ctx.project?.code);
  return [ctx.project?.name, code].filter(Boolean).join(' · ') || null;
}

export function useRecordInfo(type, id) {
  const { ctx } = useRecordContext(type, id);
  return recordInfo(ctx);
}
