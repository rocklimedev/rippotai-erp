import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGetBoqVersionHistoryQuery,
  useLazyCompareBoqVersionsQuery,
} from "../../api/boq.api"; // ← adjust import path
import { formatINR, formatDate, relativeTime } from "@/lib/format";
import { ArrowLeft, GitBranch, ArrowLeftRight, Lock } from "lucide-react";

export default function BoqVersions() {
  const { id } = useParams();
  const nav = useNavigate();
  const [compareId, setCompareId] = useState("");

  const {
    data: versions = [],
    isLoading: isVersionsLoading,
    isError: isVersionsError,
  } = useGetBoqVersionHistoryQuery(id, { skip: !id });

  const [triggerCompare, { data: diff, isFetching: isComparing }] =
    useLazyCompareBoqVersionsQuery();

  const runCompare = () => {
    if (!compareId) return;
    triggerCompare({ id, vs: compareId });
  };

  return (
    <div className="space-y-6" data-testid="boq-versions-page">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => nav(`/boq/${id}`)}
            className="text-[12.5px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={14} /> Back to editor
          </button>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1">
            Versions
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#333333]">
            Version History
          </h1>
        </div>
      </div>

      <section className="bc-card p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Created By</th>
              <th className="px-3 py-3 font-semibold">Created</th>
              <th className="px-3 py-3 font-semibold">Change Note</th>
              <th className="px-3 py-3 font-semibold text-right">
                Final Total
              </th>
              <th className="px-3 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {isVersionsLoading &&
              [1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-[#B5C4B6]">
                  {Array(7)
                    .fill(0)
                    .map((_, j) => (
                      <td key={j} className="px-3 py-4">
                        <div className="bc-skeleton h-4 w-full" />
                      </td>
                    ))}
                </tr>
              ))}

            {!isVersionsLoading && isVersionsError && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[13px] text-[#6B7B7C]"
                >
                  Couldn't load version history.
                </td>
              </tr>
            )}

            {!isVersionsLoading &&
              !isVersionsError &&
              versions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[13px] text-[#6B7B7C]"
                  >
                    No versions yet.
                  </td>
                </tr>
              )}

            {!isVersionsLoading &&
              versions.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-[#B5C4B6] hover:bg-[#EAEEF0]"
                  data-testid={`version-row-${v.version}`}
                >
                  <td className="px-4 py-3 font-semibold text-[#333333] flex items-center gap-2">
                    <GitBranch size={13} /> {v.version}
                    {v.id === id && (
                      <span className="text-[9px] uppercase tracking-widest bg-[#EAEEF0] text-[#333333] px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C] capitalize">
                    {v.status?.replace("_", " ")}
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                    {v.created_by || v.prepared_by || "—"}
                  </td>
                  <td className="px-3 py-3 text-[11.5px] text-[#B5C4B6]">
                    {formatDate(v.created_at)} · {relativeTime(v.created_at)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-[#6B7B7C] max-w-[280px] truncate">
                    {v.revision_note || "—"}
                  </td>
                  <td className="px-3 py-3 text-[13px] font-semibold text-[#333333] text-right">
                    {formatINR(v.final_total || 0)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {v.locked && (
                        <Lock size={12} className="text-[#333333]" />
                      )}
                      <Link
                        to={`/boq/${v.id}`}
                        className="text-[12px] text-[#333333] font-semibold hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      <section className="bc-card p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[13px] font-semibold text-[#333333]">
            Compare current with…
          </div>
          <select
            className="bc-input max-w-xs"
            value={compareId}
            onChange={(e) => setCompareId(e.target.value)}
            data-testid="compare-version-select"
          >
            <option value="">Select a version</option>
            {versions
              .filter((v) => v.id !== id)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.version} — {formatINR(v.final_total || 0)}
                </option>
              ))}
          </select>
          <button
            onClick={runCompare}
            disabled={!compareId || isComparing}
            className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60"
            data-testid="compare-btn"
          >
            <ArrowLeftRight size={14} />{" "}
            {isComparing ? "Comparing…" : "Compare"}
          </button>
        </div>

        {diff && (
          <div className="mt-6 space-y-4" data-testid="diff-result">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#EAEEF0] border border-[#B5C4B6]">
                <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                  {diff.a.version}
                </div>
                <div className="text-[16px] font-bold text-[#333333]">
                  {formatINR(diff.a.final_total)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#EAEEF0] border border-[#B5C4B6]">
                <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                  {diff.b.version}
                </div>
                <div className="text-[16px] font-bold text-[#333333]">
                  {formatINR(diff.b.final_total)}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${diff.delta >= 0 ? "bg-[#EAEEF0] border-[#EAEEF0]" : "bg-[#EAEEF0] border-[#EAEEF0]"}`}
              >
                <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                  Δ Delta
                </div>
                <div
                  className={`text-[16px] font-bold ${diff.delta >= 0 ? "text-[#333333]" : "text-[#333333]"}`}
                >
                  {diff.delta >= 0 ? "+" : ""}
                  {formatINR(diff.delta)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#333333] mb-2">
                  Added ({diff.added.length})
                </div>
                <ul className="text-[12px] space-y-1 max-h-[280px] overflow-y-auto">
                  {diff.added.map((r, i) => (
                    <li
                      key={i}
                      className="p-2 rounded bg-[#EAEEF0] text-[#333333]"
                    >
                      {r.description} · {formatINR(r.amount)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#333333] mb-2">
                  Removed ({diff.removed.length})
                </div>
                <ul className="text-[12px] space-y-1 max-h-[280px] overflow-y-auto">
                  {diff.removed.map((r, i) => (
                    <li
                      key={i}
                      className="p-2 rounded bg-[#EAEEF0] text-[#333333]"
                    >
                      {r.description} · {formatINR(r.amount)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#333333] mb-2">
                  Updated ({diff.updated.length})
                </div>
                <ul className="text-[12px] space-y-1 max-h-[280px] overflow-y-auto">
                  {diff.updated.map((r, i) => (
                    <li
                      key={i}
                      className="p-2 rounded bg-[#EAEEF0] text-[#333333]"
                    >
                      {r.after.description}: {formatINR(r.before.amount)} →{" "}
                      {formatINR(r.after.amount)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
