import React from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";

import { Card } from "../../hooks/shared";

import {
  useGetPlannerExportViewQuery,
  useListPlannerExportsQuery,
  useRecordPlannerExportMutation,
} from "../../api/documents/project-planner.api";

// NOTE: `getPlannerExportView` assembles the tasks x floors x progress data
// needed to render a PDF, but this codebase doesn't yet expose a route that
// turns that data into an actual PDF file. Wire `handleGenerate` below to
// your real PDF-generation endpoint (or a client-side renderer) once that
// exists — it should return a `file_url`, which is then handed to
// `recordPlannerExport` so it shows up in the history list below.

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function PlannerExportsTab({ projectId, module, moduleLabel }) {
  const { data: exportView } = useGetPlannerExportViewQuery(
    { projectId, module },
    { skip: !projectId || !module },
  );

  const { data: exports, isFetching } = useListPlannerExportsQuery(projectId, {
    skip: !projectId,
  });

  const [recordExport, { isLoading: isRecording }] =
    useRecordPlannerExportMutation();

  const exportList = Array.isArray(exports) ? exports : [];

  const handleGenerate = async () => {
    // Placeholder: replace this with a call to your actual PDF-generation
    // endpoint, which should return a `file_url` for the rendered file.
    // Once that exists, swap the toast below for the real request and
    // pass its `file_url` into `recordExport`.
    toast.info(
      "Hook this button up to your PDF-generation endpoint, then it will log the export below.",
    );
    return;

    // Example once a real endpoint exists:
    // const { file_url } = await generatePlannerPdf({ projectId, module }).unwrap();
    // await recordExport({ projectId, module, file_url }).unwrap();
    // toast.success("Export generated");
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[#333333]">{moduleLabel} Export</h3>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isRecording}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <FileText size={15} />
            Generate PDF
          </button>
        </div>
        <p className="text-xs text-[#6B7B7C]">
          {exportView
            ? `${exportView.tasks?.length || 0} work items across ${
                exportView.floors?.length || 0
              } floors will be included.`
            : "Loading export preview…"}
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold text-[#333333] mb-3">Export History</h3>

        {isFetching ? (
          <p className="text-sm text-[#6B7B7C]">Loading exports…</p>
        ) : exportList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No exports generated yet.
          </p>
        ) : (
          <div className="space-y-2">
            {exportList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
              >
                <div className="text-sm text-[#333333]">
                  <span className="font-medium">{item.module}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDate(item.generated_at)}
                  </span>
                </div>
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F453B]"
                >
                  <Download size={13} />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default PlannerExportsTab;
