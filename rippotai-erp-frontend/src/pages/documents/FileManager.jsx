import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  Copy,
  Download,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  HardDrive,
  Home,
  Info,
  LayoutGrid,
  LayoutList,
  Link2,
  ListFilter,
  Loader2,
  Sidebar as SidebarIcon,
  MoreHorizontal,
  Move,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Star,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

// ⚠️ Adjust this import path to wherever onedriveApi.js actually lives
// relative to this component (e.g. "../../features/onedrive/onedriveApi").
import {
  useGetOneDriveFilesQuery,
  useCreateOneDriveFolderMutation,
  useUploadOneDriveFileMutation,
  useUploadLargeOneDriveFileMutation,
  useDeleteOneDriveFileMutation,
  useLazyDownloadOneDriveFileQuery,
} from "../../api/connectors/onedrive.api";

/* ============================================================
   INOS FILE MANAGER — wired to onedriveApi (RTK Query)
   ============================================================

   Data no longer lives in local mock state. Instead:

   - useGetOneDriveFilesQuery(folderPath) drives both the main
     explorer content and the sidebar's top-level folder list.
   - Create / upload / delete are RTK Query mutations that
     invalidate the "OneDriveFiles" / "OneDrive" tags, so the
     list refetches itself automatically — no manual state
     patching needed.
   - Download streams a blob via the lazy download query and
     triggers a client-side save.

   NOTE ON SHAPE: the exact JSON your backend/Graph proxy
   returns for `/onedrive/files` isn't specified in the slice,
   so `normalizeDriveItems` below is written defensively to
   handle a few common shapes ({ value: [...] }, { items: [...] },
   or a bare array) and Microsoft-Graph-style driveItem fields
   (`folder`, `file`, `parentReference`, `lastModifiedDateTime`,
   etc). Tweak that one function to match your real payload —
   everything downstream of it stays the same.
*/

const ROOT = "root";

/* ============================================================
   ADAPTERS — turn raw API payloads into UI-shaped objects
============================================================ */

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(iso) {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileTypeFromMime(mimeType = "", name = "") {
  const lowerName = name.toLowerCase();

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";

  if (
    mimeType.includes("spreadsheet") ||
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".csv")
  )
    return "excel";

  if (
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(lowerName)
  )
    return "image";

  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    /\.(zip|rar|7z|tar|gz)$/i.test(lowerName)
  )
    return "archive";

  if (/\.(js|jsx|ts|tsx|py|java|c|cpp|json|html|css)$/i.test(lowerName))
    return "code";

  return "document";
}

// Normalizes a raw getOneDriveFiles response into { folders, files }
// arrays shaped for the UI components below.
function normalizeDriveItems(rawData) {
  if (!rawData) return { folders: [], files: [] };

  const rawItems = Array.isArray(rawData)
    ? rawData
    : (rawData.value ?? rawData.items ?? rawData.files ?? []);

  const folders = [];
  const files = [];

  rawItems.forEach((item) => {
    const isFolder = Boolean(item.folder) || item.itemType === "folder";

    if (isFolder) {
      folders.push({
        id: item.id,
        parentId: item.parentReference?.id ?? item.parentId ?? ROOT,
        name: item.name,
        itemCount: item.folder?.childCount ?? item.itemCount ?? 0,
        modified: formatDate(item.lastModifiedDateTime ?? item.modified),
        color: "green",
      });
    } else {
      files.push({
        id: item.id,
        parentId: item.parentReference?.id ?? item.parentId ?? ROOT,
        name: item.name,
        type: getFileTypeFromMime(
          item.file?.mimeType ?? item.mimeType,
          item.name,
        ),
        size: formatBytes(item.size),
        modified: formatDate(item.lastModifiedDateTime ?? item.modified),
        owner:
          item.lastModifiedBy?.user?.displayName ??
          item.createdBy?.user?.displayName ??
          "—",
        starred: Boolean(item.starred),
      });
    }
  });

  return { folders, files };
}

/* ============================================================
   ICONS
============================================================ */

const getFileIcon = (type) => {
  switch (type) {
    case "pdf":
      return FileText;

    case "excel":
      return FileSpreadsheet;

    case "image":
      return FileImage;

    case "archive":
      return FileArchive;

    case "code":
      return FileCode2;

    default:
      return File;
  }
};

const getFileColor = (type) => {
  switch (type) {
    case "pdf":
      return "text-red-500";

    case "excel":
      return "text-emerald-600";

    case "image":
      return "text-purple-500";

    case "archive":
      return "text-amber-500";

    default:
      return "text-slate-500";
  }
};

/* ============================================================
   BUTTON
============================================================ */

function Button({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "bg-[#1F453B] text-white hover:bg-[#17372F]",

    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",

    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",

    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({ children, active = false, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`
        flex h-9 w-9 items-center justify-center rounded-lg
        transition disabled:cursor-not-allowed disabled:opacity-50
        ${
          active
            ? "bg-[#1F453B]/10 text-[#1F453B]"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/* ============================================================
   MODAL
============================================================ */

function Modal({ open, title, children, onClose, width = "max-w-md" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${width} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

          <IconButton onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ============================================================
   CREATE FOLDER
============================================================ */

function CreateFolderModal({ open, onClose, onCreate, isCreating }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) return;

    setError("");

    try {
      await onCreate(name.trim());
      setName("");
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Couldn't create folder. Try again.");
    }
  };

  return (
    <Modal open={open} title="Create folder" onClose={onClose}>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F453B]/10">
            <FolderPlus size={20} className="text-[#1F453B]" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">New folder</p>

            <p className="text-xs text-slate-400">
              Create it inside the current location
            </p>
          </div>
        </div>

        <label className="mb-2 block text-xs font-semibold text-slate-600">
          Folder name
        </label>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="e.g. Drawings"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
        />

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button disabled={!name.trim() || isCreating} onClick={submit}>
            {isCreating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FolderPlus size={16} />
            )}
            Create folder
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   UPLOAD MODAL
============================================================ */

function UploadModal({ open, onClose, onUpload, isUploading }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const addFiles = (list) => {
    setFiles((prev) => [...prev, ...Array.from(list || [])]);
  };

  const submit = async () => {
    if (!files.length) return;

    setError("");

    try {
      await onUpload(files);
      setFiles([]);
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Some files failed to upload.");
    }
  };

  return (
    <Modal open={open} title="Upload files" onClose={onClose} width="max-w-xl">
      <div className="p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`
            cursor-pointer rounded-xl border-2 border-dashed
            p-10 text-center transition
            ${
              dragging
                ? "border-[#1F453B] bg-[#1F453B]/5"
                : "border-slate-200 hover:border-[#1F453B]/40 hover:bg-slate-50"
            }
          `}
        >
          <Cloud size={32} className="mx-auto text-[#1F453B]" />

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Drop files here
          </p>

          <p className="mt-1 text-xs text-slate-400">
            or click to browse from your computer
          </p>

          <input
            type="file"
            multiple
            className="mt-5 block w-full text-xs"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Ready to upload
            </p>

            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
              >
                <File size={17} />

                <p className="min-w-0 flex-1 truncate text-xs text-slate-700">
                  {file.name}
                </p>

                <span className="text-[10px] text-slate-400">
                  {formatBytes(file.size)}
                </span>

                <button
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button disabled={!files.length || isUploading} onClick={submit}>
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   USER WORKSPACE WIDGET
============================================================ */

function WorkspaceItem({ icon: Icon, label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex w-full items-center gap-3 rounded-lg
        px-3 py-2 text-left transition
        ${
          active
            ? "bg-[#1F453B]/10 text-[#1F453B]"
            : "text-slate-600 hover:bg-slate-50"
        }
      `}
    >
      <Icon size={16} />

      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {label}
      </span>

      {count !== undefined && (
        <span className="text-[10px] text-slate-400">{count}</span>
      )}

      <ChevronRight
        size={13}
        className={`
          opacity-0 transition
          group-hover:opacity-100
          ${active ? "text-[#1F453B]" : "text-slate-300"}
        `}
      />
    </button>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

function FileSidebar({
  collapsed,
  currentFolder,
  onNavigateRoot,
  onNavigateFolder,
  rootFolders,
  rootFoldersLoading,
  workspaces,
  onCreateWorkspace,
}) {
  if (collapsed) {
    return (
      <aside className="flex w-[68px] shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4">
        <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F453B] text-white">
          <Cloud size={18} />
        </div>

        <div className="space-y-2">
          <IconButton active={currentFolder === ROOT} onClick={onNavigateRoot}>
            <Home size={17} />
          </IconButton>

          <IconButton>
            <ClockIcon />
          </IconButton>

          <IconButton>
            <Star size={17} />
          </IconButton>

          <IconButton>
            <Users size={17} />
          </IconButton>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-[255px] shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* BRAND */}

      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F453B] text-white">
          <Cloud size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">INOS Files</p>

          <p className="text-[10px] text-slate-400">OneDrive workspace</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* ====================================================
            MAIN
        ==================================================== */}

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          File system
        </p>

        <div className="space-y-0.5">
          <WorkspaceItem
            icon={Home}
            label="My Files"
            active={currentFolder === ROOT}
            onClick={onNavigateRoot}
          />

          <WorkspaceItem icon={ClockIcon} label="Recent" onClick={() => {}} />

          <WorkspaceItem icon={Star} label="Starred" onClick={() => {}} />

          <WorkspaceItem
            icon={Users}
            label="Shared with me"
            onClick={() => {}}
          />

          <WorkspaceItem icon={Trash2} label="Trash" onClick={() => {}} />
        </div>

        {/* ====================================================
            FOLDER TREE — top-level folders, fetched live
        ==================================================== */}

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Folders
            </p>

            {rootFoldersLoading && (
              <Loader2 size={12} className="animate-spin text-slate-300" />
            )}
          </div>

          <div className="space-y-0.5">
            {rootFolders.length === 0 && !rootFoldersLoading && (
              <p className="px-3 py-2 text-[11px] text-slate-400">
                No folders yet
              </p>
            )}

            {rootFolders.map((folder) => (
              <SidebarFolder
                key={folder.id}
                id={folder.id}
                label={folder.name}
                currentFolder={currentFolder}
                onNavigate={() => onNavigateFolder(folder.id, folder.name)}
              />
            ))}
          </div>
        </div>

        {/* ====================================================
            USER WORKSPACES
        ==================================================== */}

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between px-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                My workspaces
              </p>

              <p className="mt-0.5 text-[9px] text-slate-400">
                Custom file views
              </p>
            </div>

            <button
              onClick={onCreateWorkspace}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#1F453B]"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {workspaces.map((workspace) => (
              <WorkspaceItem
                key={workspace.id}
                icon={workspace.icon}
                label={workspace.name}
                count={workspace.count}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      </div>

      {/* STORAGE */}

      <div className="border-t border-slate-100 p-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={15} className="text-[#1F453B]" />

              <span className="text-xs font-medium text-slate-700">
                Storage
              </span>
            </div>

            <span className="text-[10px] text-slate-400">42.8 / 100 GB</span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#1F453B]"
              style={{
                width: "42.8%",
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   SIDEBAR FOLDER
============================================================ */

function SidebarFolder({ id, label, currentFolder, onNavigate }) {
  const active = currentFolder === id;

  return (
    <button
      onClick={onNavigate}
      className={`
        flex w-full items-center gap-2 rounded-lg px-3 py-2
        text-left text-xs transition
        ${
          active
            ? "bg-[#1F453B]/10 text-[#1F453B]"
            : "text-slate-600 hover:bg-slate-50"
        }
      `}
    >
      <Folder
        size={15}
        className={active ? "text-[#1F453B]" : "text-slate-400"}
      />

      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>

      <ChevronRight size={13} className="text-slate-300" />
    </button>
  );
}

/* ============================================================
   CLOCK ICON
============================================================ */

function ClockIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/* ============================================================
   BREADCRUMB
   Built from a navigation trail we maintain client-side
   (rather than walking a fully-known folder tree), since the
   API only gives us one folder's children at a time.
============================================================ */

function Breadcrumb({ trail, onNavigateRoot, onNavigateIndex }) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      <button
        onClick={onNavigateRoot}
        className="shrink-0 text-sm font-semibold text-[#1F453B] hover:underline"
      >
        My Files
      </button>

      {trail.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight size={14} className="shrink-0 text-slate-300" />

          <button
            onClick={() => onNavigateIndex(index)}
            className={`
              min-w-0 max-w-[180px] truncate
              text-sm
              ${
                index === trail.length - 1
                  ? "font-semibold text-slate-800"
                  : "text-slate-500 hover:text-slate-800"
              }
            `}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================
   FOLDER CARD
============================================================ */

function FolderCard({ folder, selected, onSelect, onOpen, onMenu }) {
  return (
    <div
      onClick={() => onSelect(folder)}
      onDoubleClick={() => onOpen(folder)}
      className={`
        group relative cursor-pointer rounded-xl border
        bg-white p-4 transition
        ${
          selected
            ? "border-[#1F453B] bg-[#1F453B]/5 ring-2 ring-[#1F453B]/10"
            : "border-slate-200 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-sm"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div
          className={`
            flex h-11 w-11 items-center justify-center
            rounded-xl
            ${selected ? "bg-[#1F453B]/10" : "bg-[#F1F5F3]"}
          `}
        >
          <Folder
            size={24}
            className="text-[#1F453B]"
            fill="currentColor"
            fillOpacity={0.08}
          />
        </div>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onMenu(folder);
          }}
        >
          <MoreHorizontal size={17} />
        </IconButton>
      </div>

      <div className="mt-5">
        <p className="truncate text-sm font-semibold text-slate-800">
          {folder.name}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">{folder.itemCount} items</p>

          <p className="text-[10px] text-slate-400">{folder.modified}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FILE CARD
============================================================ */

function FileCard({ file, selected, onSelect, onOpen, onMenu }) {
  const Icon = getFileIcon(file.type);

  return (
    <div
      onClick={() => onSelect(file)}
      onDoubleClick={() => onOpen(file)}
      className={`
        group relative cursor-pointer rounded-xl border
        bg-white p-4 transition
        ${
          selected
            ? "border-[#1F453B] bg-[#1F453B]/5 ring-2 ring-[#1F453B]/10"
            : "border-slate-200 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-sm"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
          <Icon size={23} className={getFileColor(file.type)} />
        </div>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onMenu(file);
          }}
        >
          <MoreHorizontal size={17} />
        </IconButton>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-1.5">
          {file.starred && (
            <Star
              size={12}
              className="shrink-0 fill-amber-400 text-amber-400"
            />
          )}

          <p className="truncate text-sm font-medium text-slate-800">
            {file.name}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">{file.size}</p>

          <p className="text-[10px] text-slate-400">{file.modified}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LIST VIEW
============================================================ */

function ListView({ folders, files, selectedId, onSelect, onOpen, onMenu }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[40px_minmax(300px,1fr)_180px_130px_45px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <div />

        <div>Name</div>

        <div>Modified</div>

        <div>Size</div>

        <div />
      </div>

      {/* FOLDERS */}

      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => onSelect(folder)}
          onDoubleClick={() => onOpen(folder)}
          className={`
            grid cursor-pointer grid-cols-[40px_minmax(300px,1fr)_180px_130px_45px]
            items-center border-b border-slate-100 px-4 py-3
            transition hover:bg-slate-50
            ${selectedId === folder.id ? "bg-[#1F453B]/5" : ""}
          `}
        >
          <Folder size={19} className="text-[#1F453B]" />

          <div className="flex min-w-0 items-center gap-3">
            <p className="truncate text-sm font-medium text-slate-700">
              {folder.name}
            </p>

            <span className="text-[10px] text-slate-400">
              {folder.itemCount} items
            </span>
          </div>

          <p className="text-xs text-slate-500">{folder.modified}</p>

          <p className="text-xs text-slate-400">Folder</p>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onMenu(folder);
            }}
          >
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
      ))}

      {/* FILES */}

      {files.map((file) => {
        const Icon = getFileIcon(file.type);

        return (
          <div
            key={file.id}
            onClick={() => onSelect(file)}
            onDoubleClick={() => onOpen(file)}
            className={`
              grid cursor-pointer grid-cols-[40px_minmax(300px,1fr)_180px_130px_45px]
              items-center border-b border-slate-100 px-4 py-3
              transition hover:bg-slate-50
              ${selectedId === file.id ? "bg-[#1F453B]/5" : ""}
            `}
          >
            <Icon size={19} className={getFileColor(file.type)} />

            <div className="flex min-w-0 items-center gap-2">
              {file.starred && (
                <Star
                  size={12}
                  className="shrink-0 fill-amber-400 text-amber-400"
                />
              )}

              <p className="truncate text-sm font-medium text-slate-700">
                {file.name}
              </p>
            </div>

            <p className="text-xs text-slate-500">{file.modified}</p>

            <p className="text-xs text-slate-400">{file.size}</p>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onMenu(file);
              }}
            >
              <MoreHorizontal size={16} />
            </IconButton>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   DETAILS PANEL
============================================================ */

function DetailsPanel({
  item,
  locationLabel,
  onClose,
  onDownload,
  isDownloading,
}) {
  if (!item) return null;

  const isFolder = item.itemCount !== undefined;

  const Icon = isFolder ? Folder : getFileIcon(item.type);

  return (
    <aside className="hidden w-[310px] shrink-0 border-l border-slate-200 bg-white xl:block">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[#1F453B]" />

          <p className="text-sm font-semibold text-slate-800">Details</p>
        </div>

        <IconButton onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50">
            <Icon
              size={38}
              className={isFolder ? "text-[#1F453B]" : getFileColor(item.type)}
            />
          </div>

          <p className="mt-4 break-all text-sm font-semibold text-slate-800">
            {item.name}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {isFolder ? `${item.itemCount} items` : item.size}
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <DetailRow label="Location" value={locationLabel} icon={FolderOpen} />

          <DetailRow label="Modified" value={item.modified} />

          {!isFolder && (
            <>
              <DetailRow label="Owner" value={item.owner} icon={UserRound} />

              <DetailRow label="Size" value={item.size} />

              <DetailRow label="Type" value={item.type?.toUpperCase()} />
            </>
          )}
        </div>

        <div className="mt-8 border-t border-slate-100 pt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Actions
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start">
              <Share2 size={14} />
              Share
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              disabled={isFolder || isDownloading}
              onClick={() => onDownload(item)}
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download
            </Button>

            <Button variant="outline" className="justify-start">
              <Move size={14} />
              Move
            </Button>

            <Button variant="outline" className="justify-start">
              <Copy size={14} />
              Copy
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 flex items-center gap-2 break-all text-xs text-slate-700">
        {Icon && <Icon size={14} className="shrink-0 text-slate-400" />}

        {value}
      </p>
    </div>
  );
}

/* ============================================================
   CONTEXT MENU
============================================================ */

function ContextMenu({
  item,
  onClose,
  onRename,
  onDelete,
  onDownload,
  isDeleting,
}) {
  if (!item) return null;

  return (
    <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <ContextButton icon={FolderOpen} label="Open" />

      <ContextButton
        icon={Download}
        label="Download"
        onClick={() => onDownload(item)}
      />

      <ContextButton icon={Share2} label="Share" />

      <ContextButton icon={Copy} label="Make a copy" />

      <ContextButton icon={Move} label="Move to" />

      <ContextButton icon={Link2} label="Copy link" />

      <div className="my-1 border-t border-slate-100" />

      <ContextButton icon={Pencil} label="Rename" onClick={onRename} />

      <ContextButton icon={Pin} label="Add to workspace" />

      <div className="my-1 border-t border-slate-100" />

      <ContextButton
        icon={isDeleting ? Loader2 : Trash2}
        label={isDeleting ? "Moving to trash..." : "Move to trash"}
        danger
        onClick={onDelete}
      />
    </div>
  );
}

function ContextButton({ icon: Icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex w-full items-center gap-2 rounded-lg px-3 py-2
        text-left text-xs transition
        ${
          danger
            ? "text-red-500 hover:bg-red-50"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }
      `}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function OneDriveFileManager() {
  // Navigation trail: array of { id, name } for every folder we've
  // drilled into, root excluded. currentFolder (the API folderPath
  // param) is always the last entry, or ROOT if we're at the top.
  const [pathTrail, setPathTrail] = useState([]);

  const currentFolder =
    pathTrail.length > 0 ? pathTrail[pathTrail.length - 1].id : ROOT;

  const [selectedItem, setSelectedItem] = useState(null);
  const [contextItem, setContextItem] = useState(null);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [sort] = useState("name");
  const [downloadingId, setDownloadingId] = useState(null);

  const [workspaces, setWorkspaces] = useState([
    { id: "w1", name: "Active Projects", icon: FolderTree, count: 8 },
    { id: "w2", name: "BOQ Workspace", icon: FileSpreadsheet, count: 16 },
    { id: "w3", name: "Site Recce", icon: FileImage, count: 28 },
    { id: "w4", name: "Contracts", icon: Archive, count: 12 },
  ]);

  /* ==========================================================
     DATA — current folder contents
  ========================================================== */

  const {
    data: currentData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetOneDriveFilesQuery(currentFolder);

  const { folders: allFolders, files: allFiles } = useMemo(
    () => normalizeDriveItems(currentData),
    [currentData],
  );

  // Sidebar's top-level folder shortcuts — fetched independently of
  // wherever the user is currently browsing.
  const { data: rootData, isFetching: rootFoldersLoading } =
    useGetOneDriveFilesQuery(ROOT);

  const rootFolders = useMemo(
    () => normalizeDriveItems(rootData).folders,
    [rootData],
  );

  const currentFolders = useMemo(() => {
    let result = allFolders;

    if (search.trim()) {
      result = result.filter((folder) =>
        folder.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return [...result].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : 0,
    );
  }, [allFolders, search, sort]);

  const currentFiles = useMemo(() => {
    let result = allFiles;

    if (search.trim()) {
      result = result.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return [...result].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : 0,
    );
  }, [allFiles, search, sort]);

  /* ==========================================================
     MUTATIONS
  ========================================================== */

  const [createFolderMutation, { isLoading: isCreatingFolder }] =
    useCreateOneDriveFolderMutation();

  const [uploadFile] = useUploadOneDriveFileMutation();
  const [uploadLargeFile] = useUploadLargeOneDriveFileMutation();
  const [isUploading, setIsUploading] = useState(false);

  const [deleteFile, { isLoading: isDeleting }] =
    useDeleteOneDriveFileMutation();

  const [triggerDownload] = useLazyDownloadOneDriveFileQuery();

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const resetSelection = () => {
    setSelectedItem(null);
    setContextItem(null);
  };

  const navigateToRoot = () => {
    setPathTrail([]);
    resetSelection();
  };

  // Used by the sidebar's top-level shortcuts.
  const navigateToTopLevelFolder = (id, name) => {
    setPathTrail([{ id, name }]);
    resetSelection();
  };

  // Used when drilling into a folder from the explorer.
  const navigateInto = (folder) => {
    setPathTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
    resetSelection();
  };

  const navigateToBreadcrumbIndex = (index) => {
    setPathTrail((prev) => prev.slice(0, index + 1));
    resetSelection();
  };

  const openItem = (item) => {
    const isFolder = item.itemCount !== undefined;

    if (isFolder) {
      navigateInto(item);
      return;
    }

    setSelectedItem(item);
    setDetailsOpen(true);
  };

  /* ==========================================================
     CREATE FOLDER
  ========================================================== */

  const createFolder = async (name) => {
    await createFolderMutation({
      folderName: name,
      parentPath: currentFolder,
    }).unwrap();
  };

  /* ==========================================================
     UPLOAD
  ========================================================== */

  const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB

  const uploadFiles = async (incoming) => {
    setIsUploading(true);

    try {
      await Promise.all(
        incoming.map((file) => {
          const mutate =
            file.size > LARGE_FILE_THRESHOLD ? uploadLargeFile : uploadFile;

          return mutate({ file, folderPath: currentFolder }).unwrap();
        }),
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* ==========================================================
     DOWNLOAD
  ========================================================== */

  const downloadItem = async (item) => {
    if (item.itemCount !== undefined) return; // folders aren't downloadable here

    setDownloadingId(item.id);

    try {
      const blob = await triggerDownload(item.id).unwrap();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloadingId(null);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const deleteItem = async () => {
    if (!contextItem) return;

    try {
      await deleteFile(contextItem.id).unwrap();
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      if (selectedItem?.id === contextItem.id) setSelectedItem(null);
      setContextItem(null);
    }
  };

  /* ==========================================================
     WORKSPACE (local only — no backend endpoint provided)
  ========================================================== */

  const createWorkspace = () => {
    const name = prompt("Workspace name");

    if (!name?.trim()) return;

    setWorkspaces((prev) => [
      ...prev,
      {
        id: `workspace-${Date.now()}`,
        name: name.trim(),
        icon: FolderTree,
        count: 0,
      },
    ]);

    setWorkspaceOpen(false);
  };

  /* ==========================================================
     DERIVED LABELS
  ========================================================== */

  const currentTitle =
    pathTrail.length > 0 ? pathTrail[pathTrail.length - 1].name : "My Files";

  const locationLabel =
    pathTrail.length > 0
      ? `My Files / ${pathTrail.map((c) => c.name).join(" / ")}`
      : "My Files";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="flex h-[calc(100vh-32px)] min-h-[700px] overflow-hidden rounded-2xl border border-slate-200 bg-[#F6F8F7]">
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <FileSidebar
        collapsed={sidebarCollapsed}
        currentFolder={currentFolder}
        onNavigateRoot={navigateToRoot}
        onNavigateFolder={navigateToTopLevelFolder}
        rootFolders={rootFolders}
        rootFoldersLoading={rootFoldersLoading}
        workspaces={workspaces}
        onCreateWorkspace={() => setWorkspaceOpen(true)}
      />

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="border-b border-slate-200 bg-white">
          {/* TOP */}

          <div className="flex items-center gap-3 px-5 py-3">
            <IconButton onClick={() => setSidebarCollapsed((value) => !value)}>
              {sidebarCollapsed ? (
                <ChevronsRight size={18} />
              ) : (
                <ChevronsLeft size={18} />
              )}
            </IconButton>

            <div className="h-5 w-px bg-slate-200" />

            <Breadcrumb
              trail={pathTrail}
              onNavigateRoot={navigateToRoot}
              onNavigateIndex={navigateToBreadcrumbIndex}
            />

            <div className="ml-auto flex items-center gap-1">
              <IconButton
                disabled={pathTrail.length === 0}
                onClick={navigateToRoot}
              >
                <ArrowLeft size={17} />
              </IconButton>

              <IconButton disabled>
                <ArrowRight size={17} />
              </IconButton>

              <IconButton onClick={() => refetch()}>
                <RefreshCw
                  size={16}
                  className={isFetching ? "animate-spin" : ""}
                />
              </IconButton>
            </div>
          </div>

          {/* TOOLBAR */}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3">
            {/* SEARCH */}

            <div className="relative min-w-[250px] flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this location..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-[#1F453B] focus:bg-white focus:ring-2 focus:ring-[#1F453B]/10"
              />
            </div>

            {/* NEW */}

            <Button onClick={() => setCreateFolderOpen(true)}>
              <Plus size={15} />
              New
            </Button>

            {/* UPLOAD */}

            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload size={15} />
              Upload
            </Button>

            <div className="h-7 w-px bg-slate-200" />

            {/* SORT */}

            <Button variant="outline">
              <ArrowDownAZ size={15} />
              Sort
              <ChevronDown size={13} />
            </Button>

            {/* FILTER */}

            <IconButton>
              <ListFilter size={17} />
            </IconButton>

            {/* VIEW */}

            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              <IconButton
                active={view === "grid"}
                onClick={() => setView("grid")}
                className="h-8 w-8"
              >
                <LayoutGrid size={16} />
              </IconButton>

              <IconButton
                active={view === "list"}
                onClick={() => setView("list")}
                className="h-8 w-8"
              >
                <LayoutList size={16} />
              </IconButton>
            </div>

            {/* DETAILS */}

            <IconButton
              active={detailsOpen}
              onClick={() => setDetailsOpen((value) => !value)}
            >
              <SidebarIcon size={17} />
            </IconButton>
          </div>
        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-5">
            {/* LOCATION HEADER */}

            <div className="mb-5 flex items-end justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {currentTitle}
                </h1>

                <p className="mt-1 text-xs text-slate-400">
                  {isLoading
                    ? "Loading..."
                    : `${currentFolders.length + currentFiles.length} items`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced with OneDrive
                </span>
              </div>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertCircle size={18} className="shrink-0 text-red-500" />

                <p className="flex-1 text-xs text-red-600">
                  Couldn't load this folder. {error?.data?.message || ""}
                </p>

                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {/* ==================================================
                LOADING
            ================================================== */}

            {isLoading && (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 size={22} className="animate-spin text-[#1F453B]" />
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* ==================================================
                    GRID
                ================================================== */}

                {view === "grid" && (
                  <div>
                    {/* FOLDERS */}

                    {currentFolders.length > 0 && (
                      <section>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-600">
                            Folders
                          </p>

                          <p className="text-[10px] text-slate-400">
                            {currentFolders.length}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                          {currentFolders.map((folder) => (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              selected={selectedItem?.id === folder.id}
                              onSelect={setSelectedItem}
                              onOpen={openItem}
                              onMenu={setContextItem}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* FILES */}

                    {currentFiles.length > 0 && (
                      <section className={currentFolders.length ? "mt-8" : ""}>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-600">
                            Files
                          </p>

                          <p className="text-[10px] text-slate-400">
                            {currentFiles.length}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                          {currentFiles.map((file) => (
                            <FileCard
                              key={file.id}
                              file={file}
                              selected={selectedItem?.id === file.id}
                              onSelect={setSelectedItem}
                              onOpen={openItem}
                              onMenu={setContextItem}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* ==================================================
                    LIST
                ================================================== */}

                {view === "list" && (
                  <ListView
                    folders={currentFolders}
                    files={currentFiles}
                    selectedId={selectedItem?.id}
                    onSelect={setSelectedItem}
                    onOpen={openItem}
                    onMenu={setContextItem}
                  />
                )}

                {/* ==================================================
                    EMPTY
                ================================================== */}

                {!currentFolders.length && !currentFiles.length && (
                  <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                      <FolderOpen size={30} className="text-slate-300" />
                    </div>

                    <h2 className="mt-4 text-sm font-semibold text-slate-800">
                      This folder is empty
                    </h2>

                    <p className="mt-1 max-w-sm text-center text-xs text-slate-400">
                      Create a folder or upload files to start organizing this
                      workspace.
                    </p>

                    <div className="mt-5 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCreateFolderOpen(true)}
                      >
                        <FolderPlus size={15} />
                        New folder
                      </Button>

                      <Button onClick={() => setUploadOpen(true)}>
                        <Upload size={15} />
                        Upload
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================
          DETAILS
      ====================================================== */}

      {detailsOpen && (
        <DetailsPanel
          item={selectedItem}
          locationLabel={locationLabel}
          onClose={() => setDetailsOpen(false)}
          onDownload={downloadItem}
          isDownloading={downloadingId === selectedItem?.id}
        />
      )}

      {/* ======================================================
          CONTEXT MENU
      ====================================================== */}

      {contextItem && (
        <div className="fixed right-8 top-28 z-[90]">
          <ContextMenu
            item={contextItem}
            onClose={() => setContextItem(null)}
            onRename={() => {
              setContextItem(null);
              // No rename endpoint is exposed by onedriveApi yet —
              // wire this up once one exists.
            }}
            onDelete={deleteItem}
            onDownload={downloadItem}
            isDeleting={isDeleting}
          />
        </div>
      )}

      {/* ======================================================
          MODALS
      ====================================================== */}

      <CreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onCreate={createFolder}
        isCreating={isCreatingFolder}
      />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={uploadFiles}
        isUploading={isUploading}
      />

      {/* ======================================================
          WORKSPACE CREATION
      ====================================================== */}

      {workspaceOpen && (
        <Modal
          open
          title="Create workspace"
          onClose={() => setWorkspaceOpen(false)}
        >
          <div className="p-5">
            <div className="mb-4 rounded-xl bg-[#1F453B]/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F453B]/10">
                  <FolderTree size={19} className="text-[#1F453B]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Custom file workspace
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Create a personal view over your OneDrive files.
                  </p>
                </div>
              </div>
            </div>

            <input
              autoFocus
              placeholder="Workspace name"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1F453B]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = e.currentTarget.value.trim();

                  if (!value) return;

                  setWorkspaces((prev) => [
                    ...prev,
                    {
                      id: `workspace-${Date.now()}`,
                      name: value,
                      icon: FolderTree,
                      count: 0,
                    },
                  ]);

                  setWorkspaceOpen(false);
                }
              }}
            />

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWorkspaceOpen(false)}>
                Cancel
              </Button>

              <Button onClick={createWorkspace}>Create workspace</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
