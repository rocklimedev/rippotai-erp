import React, { useMemo, useState } from "react";
import {
  CloudOff,
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
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState, Pill, Segmented, Button as InosButton } from "@/components/inos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ⚠️ Adjust this import path to wherever onedriveApi.js actually lives
// relative to this component (e.g. "../../features/onedrive/onedriveApi").
import {
  useGetOneDriveFilesQuery,
  useCreateOneDriveFolderMutation,
  useUploadOneDriveFileMutation,
  useUploadLargeOneDriveFileMutation,
  useDeleteOneDriveFileMutation,
  useLazyDownloadOneDriveFileQuery,
  useGetOneDriveStatusQuery,
} from "../../api/connectors/onedrive.api";
import {
  useGetDocumentsQuery,
  useLazyDownloadDocumentQuery,
} from "../../api/documents/document.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

/* ------------------------------------------------------------------
 * Brand — centralised until these live in the tailwind theme.
 * ------------------------------------------------------------------ */
const BRAND = "bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white";
const BRAND_TEXT = "text-[var(--brand)]";
const BRAND_SOFT = "bg-[var(--brand-50)] text-[var(--brand)]";

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
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

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

/* ------------------------------------------------------------------
 * INOS source — the project documents stored in INOS itself
 * (DB + local storage). Used when OneDrive isn't connected, or when
 * the user picks "INOS documents". Folder ids:
 *   root                 -> projects
 *   <projectId>          -> phase folders of that project
 *   <projectId>::<phase> -> documents in that phase
 * ------------------------------------------------------------------ */
const phaseOf = (doc) =>
  doc.documentType?.phaseName || doc.category || "General";

function buildInosItems(folderId, projects, docs) {
  const list = Array.isArray(docs) ? docs : docs?.data ?? [];
  const projectList = Array.isArray(projects) ? projects : projects?.data ?? projects?.projects ?? [];
  const toFile = (d) => ({
    id: d.id,
    parentId: d.projectId,
    name: d.filename || d.title,
    title: d.title,
    type: getFileTypeFromMime(d.mime, d.filename || d.title),
    size: formatBytes(d.size),
    modified: formatDate(d.updatedAt || d.updated_at),
    owner: d.uploadedByName || "—",
    starred: false,
    status: d.status,
    source: "inos",
  });

  if (folderId === ROOT) {
    const counts = new Map();
    list.forEach((d) => counts.set(d.projectId, (counts.get(d.projectId) || 0) + 1));
    return {
      folders: projectList.map((p) => ({
        id: p.id,
        parentId: ROOT,
        name: p.name,
        itemCount: counts.get(p.id) || 0,
        modified: formatDate(p.updated_at || p.updatedAt),
        color: "green",
      })),
      files: [],
    };
  }

  const [projectId, phase] = folderId.split("::");
  const projectDocs = list.filter((d) => d.projectId === projectId);
  if (!phase) {
    const byPhase = new Map();
    projectDocs.forEach((d) => {
      const k = phaseOf(d);
      byPhase.set(k, (byPhase.get(k) || 0) + 1);
    });
    return {
      folders: [...byPhase.entries()]
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([name, count]) => ({
          id: `${projectId}::${name}`,
          parentId: projectId,
          name,
          itemCount: count,
          modified: "",
          color: "green",
        })),
      files: [],
    };
  }
  return { folders: [], files: projectDocs.filter((d) => phaseOf(d) === phase).map(toFile) };
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
      return "text-[var(--bad-fg)]";
    case "excel":
      return "text-[var(--ok-fg)]";
    case "image":
      return "text-[var(--lilac-fg)]";
    case "archive":
      return "text-[var(--warn-fg)]";
    default:
      return "text-[var(--text-3)]";
  }
};

const isFolderItem = (item) => item?.itemCount !== undefined;

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
      setError(err?.data?.message || "The folder could not be created.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              BRAND_SOFT,
            )}
          >
            <FolderPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">New folder</p>
            <p className="text-xs text-muted-foreground">
              Create it inside the current location
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new_folder_name">Folder name</Label>
          <Input
            id="new_folder_name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="e.g. Drawings"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || isCreating}
            onClick={submit}
            className={BRAND}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4" />
            )}
            Create folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   UPLOAD MODAL
============================================================ */

function UploadModal({ open, onClose, onUpload, isUploading }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const addFiles = (list) =>
    setFiles((prev) => [...prev, ...Array.from(list || [])]);

  const submit = async () => {
    if (!files.length) return;
    setError("");

    try {
      await onUpload(files);
      setFiles([]);
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Some files could not be uploaded.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
        </DialogHeader>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition",
            dragging
              ? "border-[var(--brand)] bg-[var(--brand-50)]"
              : "border-input hover:border-[var(--sage)] hover:bg-muted/40",
          )}
        >
          <Cloud className={cn("mx-auto h-8 w-8", BRAND_TEXT)} />
          <p className="mt-3 text-sm font-semibold">Drop files here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse from your computer
          </p>
          <Input
            type="file"
            multiple
            className="mt-5 text-xs"
            onChange={(event) => addFiles(event.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Ready to upload
            </p>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
              >
                <File className="h-[17px] w-[17px] shrink-0 text-muted-foreground" />
                <p className="min-w-0 flex-1 truncate text-xs">{file.name}</p>
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-[15px] w-[15px]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!files.length || isUploading}
            onClick={submit}
            className={BRAND}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   WORKSPACE CREATE MODAL
============================================================ */

function CreateWorkspaceModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
        </DialogHeader>

        <div className={cn("rounded-xl p-4", "bg-[var(--brand-50)]")}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                BRAND_SOFT,
              )}
            >
              <FolderTree className="h-[19px] w-[19px]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Custom file workspace</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a personal view over your OneDrive files.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workspace_name">Workspace name</Label>
          <Input
            id="workspace_name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="Workspace name"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} className={BRAND}>
            Create workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   ITEM ACTIONS MENU
   Anchored on the item's own trigger button — replaces the old
   fixed-position "context menu in the corner" pattern with a
   normal anchored dropdown.
============================================================ */

function ItemActionsMenu({
  item,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  isDownloading,
  isDeleting,
  triggerClassName,
}) {
  const folder = isFolderItem(item);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 text-muted-foreground", triggerClassName)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Actions for ${item.name}`}
        >
          <MoreHorizontal className="h-[17px] w-[17px]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48"
        onClick={(event) => event.stopPropagation()}
      >
        {onOpen && (
          <DropdownMenuItem onSelect={() => onOpen(item)}>
            <FolderOpen className="mr-2 h-[14px] w-[14px]" />
            {folder ? "Open" : "Details"}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          disabled={folder || isDownloading}
          onSelect={() => onDownload(item)}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 h-[14px] w-[14px] animate-spin" />
          ) : (
            <Download className="mr-2 h-[14px] w-[14px]" />
          )}
          Download
        </DropdownMenuItem>

        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(item)}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-[14px] w-[14px] animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-[14px] w-[14px]" />
              )}
              {isDeleting ? "Moving to trash..." : "Move to trash"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============================================================
   WORKSPACE ITEM
============================================================ */

function WorkspaceItem({ icon: Icon, label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
        active ? BRAND_SOFT : "text-[var(--text-2)] hover:bg-[var(--sage-50)]",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-[var(--text-3)]">{count}</span>
      )}
      <ChevronRight
        className={cn(
          "h-[13px] w-[13px] opacity-0 transition group-hover:opacity-100",
          active ? BRAND_TEXT : "text-[var(--text-3)]",
        )}
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
  sourceLabel = "OneDrive workspace",
  rootLabel = "My Files",
}) {
  if (collapsed) {
    return (
      <aside className="flex w-[68px] shrink-0 flex-col items-center border-r bg-background py-4">
        <div
          className={cn(
            "mb-5 flex h-9 w-9 items-center justify-center rounded-xl",
            BRAND,
          )}
        >
          <Cloud className="h-[18px] w-[18px]" />
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", currentFolder === ROOT && BRAND_SOFT)}
            onClick={onNavigateRoot}
          >
            <Home className="h-[17px] w-[17px]" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
            <Clock className="h-[17px] w-[17px]" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
            <Star className="h-[17px] w-[17px]" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
            <Users className="h-[17px] w-[17px]" />
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-[255px] shrink-0 flex-col border-r bg-background">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            BRAND,
          )}
        >
          <Cloud className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">INOS Files</p>
          <p className="text-[10px] text-muted-foreground">
            {sourceLabel}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          File system
        </p>

        <div className="space-y-0.5">
          <WorkspaceItem
            icon={Home}
            label={rootLabel}
            active={currentFolder === ROOT}
            onClick={onNavigateRoot}
          />
          <WorkspaceItem icon={Clock} label="Recent" onClick={() => {}} />
          <WorkspaceItem icon={Star} label="Starred" onClick={() => {}} />
          <WorkspaceItem
            icon={Users}
            label="Shared with me"
            onClick={() => {}}
          />
          <WorkspaceItem icon={Trash2} label="Trash" onClick={() => {}} />
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Folders
            </p>
            {rootFoldersLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="space-y-0.5">
            {rootFolders.length === 0 && !rootFoldersLoading && (
              <p className="px-3 py-2 text-[11px] text-muted-foreground">
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

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between px-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                My workspaces
              </p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Custom file views
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-[var(--brand)]"
              onClick={onCreateWorkspace}
            >
              <Plus className="h-[14px] w-[14px]" />
            </Button>
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

    </aside>
  );
}

function SidebarFolder({ id, label, currentFolder, onNavigate }) {
  const active = currentFolder === id;

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition",
        active ? BRAND_SOFT : "text-[var(--text-2)] hover:bg-[var(--sage-50)]",
      )}
    >
      <Folder
        className={cn(
          "h-[15px] w-[15px]",
          active ? BRAND_TEXT : "text-[var(--text-3)]",
        )}
      />
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      <ChevronRight className="h-[13px] w-[13px] text-[var(--text-3)]" />
    </button>
  );
}

/* ============================================================
   BREADCRUMB
   Built from a navigation trail we maintain client-side
   (rather than walking a fully-known folder tree), since the
   API only gives us one folder's children at a time.
============================================================ */

function Breadcrumb({ trail, onNavigateRoot, onNavigateIndex, rootLabel = "My Files" }) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      <button
        type="button"
        onClick={onNavigateRoot}
        className={cn(
          "shrink-0 text-sm font-semibold hover:underline",
          BRAND_TEXT,
        )}
      >
        {rootLabel}
      </button>

      {trail.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight className="h-[14px] w-[14px] shrink-0 text-[var(--text-3)]" />
          <button
            type="button"
            onClick={() => onNavigateIndex(index)}
            className={cn(
              "min-w-0 max-w-[180px] truncate text-sm",
              index === trail.length - 1
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
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

function FolderCard({
  folder,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  isDeleting,
}) {
  return (
    <div
      data-fm-folder={folder.id}
      onClick={() => onSelect(folder)}
      onDoubleClick={() => onOpen(folder)}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-background p-4 transition",
        selected
          ? "border-[var(--brand)] bg-[var(--brand-50)] ring-2 ring-[var(--sage-100)]"
          : "hover:-translate-y-[1px] hover:border-[var(--line-strong)] hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            selected ? BRAND_SOFT : "bg-[var(--sage-50)]",
          )}
        >
          <Folder
            className={BRAND_TEXT}
            size={24}
            fill="currentColor"
            fillOpacity={0.08}
          />
        </div>

        <ItemActionsMenu
          item={folder}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>

      <div className="mt-5">
        <p className="truncate text-sm font-semibold">{folder.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {folder.itemCount} items
          </p>
          <p className="text-[10px] text-muted-foreground">{folder.modified}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FILE CARD
============================================================ */

function FileCard({
  file,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  isDownloading,
  isDeleting,
}) {
  const Icon = getFileIcon(file.type);

  return (
    <div
      onClick={() => onSelect(file)}
      onDoubleClick={() => onOpen(file)}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-background p-4 transition",
        selected
          ? "border-[var(--brand)] bg-[var(--brand-50)] ring-2 ring-[var(--sage-100)]"
          : "hover:-translate-y-[1px] hover:border-[var(--line-strong)] hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
          <Icon size={23} className={getFileColor(file.type)} />
        </div>

        <ItemActionsMenu
          item={file}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-1.5">
          {file.starred && (
            <Star className="h-3 w-3 shrink-0 fill-[var(--gold)] text-[var(--gold)]" />
          )}
          <p className="truncate text-sm font-medium">{file.name}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{file.size}</p>
          <p className="text-[10px] text-muted-foreground">{file.modified}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LIST VIEW
============================================================ */

function ListView({
  folders,
  files,
  selectedId,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  downloadingId,
  deletingId,
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="grid grid-cols-[40px_minmax(300px,1fr)_180px_130px_45px] border-b bg-muted/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <div />
        <div>Name</div>
        <div>Modified</div>
        <div>Size</div>
        <div />
      </div>

      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => onSelect(folder)}
          onDoubleClick={() => onOpen(folder)}
          className={cn(
            "grid cursor-pointer grid-cols-[40px_minmax(300px,1fr)_180px_130px_45px] items-center border-b px-4 py-3 transition hover:bg-muted/40",
            selectedId === folder.id && "bg-[var(--brand-50)]",
          )}
        >
          <Folder className={cn("h-[19px] w-[19px]", BRAND_TEXT)} />
          <div className="flex min-w-0 items-center gap-3">
            <p className="truncate text-sm font-medium">{folder.name}</p>
            <span className="text-[10px] text-muted-foreground">
              {folder.itemCount} items
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{folder.modified}</p>
          <p className="text-xs text-muted-foreground">Folder</p>
          <ItemActionsMenu
            item={folder}
            onOpen={onOpen}
            onDownload={onDownload}
            onRename={onRename}
            onDelete={onDelete}
            isDeleting={deletingId === folder.id}
          />
        </div>
      ))}

      {files.map((file) => {
        const Icon = getFileIcon(file.type);

        return (
          <div
            key={file.id}
            onClick={() => onSelect(file)}
            onDoubleClick={() => onOpen(file)}
            className={cn(
              "grid cursor-pointer grid-cols-[40px_minmax(300px,1fr)_180px_130px_45px] items-center border-b px-4 py-3 transition hover:bg-muted/40",
              selectedId === file.id && "bg-[var(--brand-50)]",
            )}
          >
            <Icon
              className={cn("h-[19px] w-[19px]", getFileColor(file.type))}
            />
            <div className="flex min-w-0 items-center gap-2">
              {file.starred && (
                <Star className="h-3 w-3 shrink-0 fill-[var(--gold)] text-[var(--gold)]" />
              )}
              <p className="truncate text-sm font-medium">{file.name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{file.modified}</p>
            <p className="text-xs text-muted-foreground">{file.size}</p>
            <ItemActionsMenu
              item={file}
              onOpen={onOpen}
              onDownload={onDownload}
              onRename={onRename}
              onDelete={onDelete}
              isDownloading={downloadingId === file.id}
              isDeleting={deletingId === file.id}
            />
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

  const folder = isFolderItem(item);
  const Icon = folder ? Folder : getFileIcon(item.type);

  return (
    <aside className="hidden w-[310px] shrink-0 border-l bg-background xl:block">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Info className={cn("h-4 w-4", BRAND_TEXT)} />
          <p className="text-sm font-semibold">Details</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
            <Icon
              size={38}
              className={folder ? BRAND_TEXT : getFileColor(item.type)}
            />
          </div>
          <p className="mt-4 break-all text-sm font-semibold">{item.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {folder ? `${item.itemCount} items` : item.size}
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <DetailRow label="Location" value={locationLabel} icon={FolderOpen} />
          <DetailRow label="Modified" value={item.modified} />
          {!folder && (
            <>
              <DetailRow label="Owner" value={item.owner} icon={UserRound} />
              <DetailRow label="Size" value={item.size} />
              <DetailRow label="Type" value={item.type?.toUpperCase()} />
            </>
          )}
        </div>

        <div className="mt-8 border-t pt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start">
              <Share2 className="h-[14px] w-[14px]" />
              Share
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              disabled={folder || isDownloading}
              onClick={() => onDownload(item)}
            >
              {isDownloading ? (
                <Loader2 className="h-[14px] w-[14px] animate-spin" />
              ) : (
                <Download className="h-[14px] w-[14px]" />
              )}
              Download
            </Button>
            <Button variant="outline" className="justify-start">
              <Move className="h-[14px] w-[14px]" />
              Move
            </Button>
            <Button variant="outline" className="justify-start">
              <Copy className="h-[14px] w-[14px]" />
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
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 break-all text-xs">
        {Icon && (
          <Icon className="h-[14px] w-[14px] shrink-0 text-muted-foreground" />
        )}
        {value}
      </p>
    </div>
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
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [sort] = useState("name");
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [workspaces, setWorkspaces] = useState([
    { id: "w1", name: "Active Projects", icon: FolderTree, count: 8 },
    { id: "w2", name: "BOQ Workspace", icon: FileSpreadsheet, count: 16 },
    { id: "w3", name: "Site Recce", icon: FileImage, count: 28 },
    { id: "w4", name: "Contracts", icon: Archive, count: 12 },
  ]);

  /* -------------------------------------------------- Source: OneDrive or INOS */

  const navigate = useNavigate();
  const { data: odStatus, isLoading: statusLoading } = useGetOneDriveStatusQuery();
  const oneDriveReady = !!(odStatus?.configured && odStatus?.connected);
  const [sourcePick, setSourcePick] = useState(null);
  const source = sourcePick ?? (oneDriveReady ? "onedrive" : "inos");
  const isInos = source === "inos";

  const switchSource = (next) => {
    setSourcePick(next);
    setPathTrail([]);
    setSelectedItem(null);
  };

  /* -------------------------------------------------- Data — current folder */

  const odQuery = useGetOneDriveFilesQuery(currentFolder, {
    skip: statusLoading || isInos,
  });
  // Sidebar's top-level folder shortcuts — fetched independently of
  // wherever the user is currently browsing.
  const { data: rootData, isFetching: odRootLoading } = useGetOneDriveFilesQuery(
    ROOT,
    { skip: statusLoading || isInos },
  );

  const projectsQuery = useGetProjectsQuery(undefined, { skip: !isInos });
  const docsQuery = useGetDocumentsQuery({}, { skip: !isInos });

  const isLoading = statusLoading || (isInos ? projectsQuery.isLoading || docsQuery.isLoading : odQuery.isLoading);
  const isFetching = isInos ? projectsQuery.isFetching || docsQuery.isFetching : odQuery.isFetching;
  const error = isInos ? projectsQuery.error || docsQuery.error : odQuery.error;
  const refetch = () => {
    if (isInos) {
      projectsQuery.refetch();
      docsQuery.refetch();
    } else odQuery.refetch();
  };

  const { folders: allFolders, files: allFiles } = useMemo(
    () =>
      isInos
        ? buildInosItems(currentFolder, projectsQuery.data, docsQuery.data)
        : normalizeDriveItems(odQuery.data),
    [isInos, currentFolder, projectsQuery.data, docsQuery.data, odQuery.data],
  );

  const rootFolders = useMemo(
    () =>
      isInos
        ? buildInosItems(ROOT, projectsQuery.data, docsQuery.data).folders
        : normalizeDriveItems(rootData).folders,
    [isInos, projectsQuery.data, docsQuery.data, rootData],
  );
  const rootFoldersLoading = isInos ? projectsQuery.isFetching : odRootLoading;

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

  /* -------------------------------------------------- Mutations */

  const [createFolderMutation, { isLoading: isCreatingFolder }] =
    useCreateOneDriveFolderMutation();
  const [uploadFile] = useUploadOneDriveFileMutation();
  const [uploadLargeFile] = useUploadLargeOneDriveFileMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteFile] = useDeleteOneDriveFileMutation();
  const [triggerDownload] = useLazyDownloadOneDriveFileQuery();
  const [triggerDocDownload] = useLazyDownloadDocumentQuery();

  /* -------------------------------------------------- Navigation */

  const resetSelection = () => setSelectedItem(null);

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
    if (isFolderItem(item)) {
      navigateInto(item);
      return;
    }

    setSelectedItem(item);
    setDetailsOpen(true);
  };

  /* -------------------------------------------------- Create folder */

  const createFolder = async (name) => {
    await createFolderMutation({
      folderName: name,
      parentPath: currentFolder,
    }).unwrap();
  };

  /* -------------------------------------------------- Upload */

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

  /* -------------------------------------------------- Download */

  const downloadItem = async (item) => {
    if (isFolderItem(item)) return; // folders aren't downloadable here

    setDownloadingId(item.id);

    try {
      const blob = await (isInos ? triggerDocDownload : triggerDownload)(item.id).unwrap();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Download failed", err);
      toast.error(`Couldn't download ${item.name}${err?.status === 404 || /404/.test(String(err?.error || err?.message || "")) ? " — the file isn't in storage" : ""}.`);
    } finally {
      setDownloadingId(null);
    }
  };

  /* -------------------------------------------------- Delete */

  const deleteItem = async (item) => {
    if (!item) return;

    setDeletingId(item.id);

    try {
      await deleteFile(item.id).unwrap();
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (err) {
      console.warn("Delete failed", err);
    } finally {
      setDeletingId(null);
    }
  };

  /* -------------------------------------------------- Rename (unwired) */

  const renameItem = () => {
    // No rename endpoint is exposed by onedriveApi yet —
    // wire this up once one exists.
  };

  /* -------------------------------------------------- Workspace (local only) */

  const createWorkspace = (name) => {
    setWorkspaces((prev) => [
      ...prev,
      { id: `workspace-${Date.now()}`, name, icon: FolderTree, count: 0 },
    ]);
    setWorkspaceOpen(false);
  };

  /* -------------------------------------------------- Derived labels */

  const rootLabel = isInos ? "INOS projects" : "My Files";
  const currentTitle =
    pathTrail.length > 0 ? pathTrail[pathTrail.length - 1].name : rootLabel;

  const locationLabel =
    pathTrail.length > 0
      ? `${rootLabel} / ${pathTrail.map((c) => c.name).join(" / ")}`
      : rootLabel;
  const canWrite = !isInos;

  /* -------------------------------------------------- Render */

  return (
    <div className="flex h-[calc(100vh-128px)] min-h-[560px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-2)] shadow-[var(--shadow-xs)]">
      <FileSidebar
        sourceLabel={isInos ? "Project documents in INOS" : "OneDrive workspace"}
        rootLabel={rootLabel}
        collapsed={sidebarCollapsed}
        currentFolder={currentFolder}
        onNavigateRoot={navigateToRoot}
        onNavigateFolder={navigateToTopLevelFolder}
        rootFolders={rootFolders}
        rootFoldersLoading={rootFoldersLoading}
        workspaces={workspaces}
        onCreateWorkspace={() => setWorkspaceOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="border-b bg-background">
          <div className="flex items-center gap-3 px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="h-[18px] w-[18px]" />
              ) : (
                <ChevronsLeft className="h-[18px] w-[18px]" />
              )}
            </Button>

            <Separator orientation="vertical" className="h-5" />

            <Breadcrumb
              rootLabel={rootLabel}
              trail={pathTrail}
              onNavigateRoot={navigateToRoot}
              onNavigateIndex={navigateToBreadcrumbIndex}
            />

            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled={pathTrail.length === 0}
                onClick={navigateToRoot}
              >
                <ArrowLeft className="h-[17px] w-[17px]" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled
              >
                <ArrowRight className="h-[17px] w-[17px]" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => refetch()}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isFetching && "animate-spin")}
                />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
            <div className="relative min-w-[250px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search this location..."
                className="h-9 bg-muted/40 pl-9 text-xs"
              />
            </div>

            {oneDriveReady && (
              <Segmented
                value={source}
                onChange={switchSource}
                options={[
                  { value: "inos", label: "INOS documents" },
                  { value: "onedrive", label: "OneDrive" },
                ]}
              />
            )}

            {canWrite && (
              <>
                <Button
                  type="button"
                  onClick={() => setCreateFolderOpen(true)}
                  className={BRAND}
                >
                  <Plus className="h-[15px] w-[15px]" />
                  New
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="h-[15px] w-[15px]" />
                  Upload
                </Button>
              </>
            )}

            <Separator orientation="vertical" className="h-7" />

            <div className="flex rounded-lg border bg-background p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", view === "grid" && BRAND_SOFT)}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", view === "list" && BRAND_SOFT)}
                onClick={() => setView("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9", detailsOpen && BRAND_SOFT)}
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <SidebarIcon className="h-[17px] w-[17px]" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-5">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h1 className="text-lg font-semibold">{currentTitle}</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isLoading
                    ? "Loading..."
                    : `${currentFolders.length + currentFiles.length} items`}
                </p>
              </div>

              {error ? (
                <Pill tone="bad" size="sm">{isInos ? "Documents unavailable" : "OneDrive unavailable"}</Pill>
              ) : isFetching ? (
                <Pill tone="info" size="sm">Syncing…</Pill>
              ) : isInos ? (
                <Pill tone="brand" size="sm">INOS documents</Pill>
              ) : (
                <Pill tone="ok" size="sm">Synced with OneDrive</Pill>
              )}
            </div>

            {!statusLoading && !oneDriveReady && (
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                <span className="inos-icon-tile inos-icon-tile--sm">
                  <CloudOff aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {odStatus?.configured === false ? "OneDrive isn't set up on this server" : "Connect OneDrive"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {odStatus?.configured === false
                      ? "Ask an admin to add the OneDrive site and drive settings. Meanwhile you're browsing the project documents stored in INOS."
                      : "Link your Microsoft account to browse and upload to the shared INOS drive. Meanwhile you're browsing the project documents stored in INOS."}
                  </p>
                </div>
                {odStatus?.configured !== false && (
                  <InosButton size="sm" variant="primary" icon={Cloud} onClick={() => navigate(odStatus?.connectUrl || "/settings/connectors")}>
                    Connect OneDrive
                  </InosButton>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface)]">
                <EmptyState
                  icon={CloudOff}
                  title={isInos ? "Couldn't load documents" : "Couldn't reach OneDrive"}
                  text={`This folder could not be loaded${error?.data?.message ? ` (${error.data.message})` : ""}. ${isInos ? "Try again in a moment." : "Check the OneDrive connection in Settings → Connectors, then try again."}`}
                  action={
                    <InosButton size="sm" icon={RefreshCw} onClick={() => refetch()}>
                      Retry
                    </InosButton>
                  }
                />
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton key={index} className="h-[120px] rounded-xl" />
                ))}
              </div>
            )}

            {!isLoading && !error && (
              <>
                {view === "grid" && (
                  <div>
                    {currentFolders.length > 0 && (
                      <section>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Folders
                          </p>
                          <p className="text-[10px] text-muted-foreground">
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
                              onDownload={downloadItem}
                              onRename={renameItem}
                              onDelete={canWrite ? deleteItem : undefined}
                              isDeleting={deletingId === folder.id}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {currentFiles.length > 0 && (
                      <section className={currentFolders.length ? "mt-8" : ""}>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Files
                          </p>
                          <p className="text-[10px] text-muted-foreground">
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
                              onDownload={downloadItem}
                              onRename={renameItem}
                              onDelete={canWrite ? deleteItem : undefined}
                              isDownloading={downloadingId === file.id}
                              isDeleting={deletingId === file.id}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {view === "list" && (
                  <ListView
                    folders={currentFolders}
                    files={currentFiles}
                    selectedId={selectedItem?.id}
                    onSelect={setSelectedItem}
                    onOpen={openItem}
                    onDownload={downloadItem}
                    onRename={renameItem}
                    onDelete={canWrite ? deleteItem : undefined}
                    downloadingId={downloadingId}
                    deletingId={deletingId}
                  />
                )}

                {!currentFolders.length && !currentFiles.length && (
                  <div className="flex min-h-[420px] items-center justify-center rounded-[var(--r-lg)] border border-dashed border-[var(--line-strong)] bg-[var(--surface)]">
                    <EmptyState
                      icon={FolderOpen}
                      title="This folder is empty"
                      text={canWrite ? "Create a folder or upload files to start organising this workspace." : "Documents uploaded to this project in INOS will appear here."}
                      action={canWrite &&
                        <div className="flex gap-2">
                          <InosButton icon={FolderPlus} onClick={() => setCreateFolderOpen(true)}>
                            New folder
                          </InosButton>
                          <InosButton variant="primary" icon={Upload} onClick={() => setUploadOpen(true)}>
                            Upload
                          </InosButton>
                        </div>
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {detailsOpen && (
        <DetailsPanel
          item={selectedItem}
          locationLabel={locationLabel}
          onClose={() => setDetailsOpen(false)}
          onDownload={downloadItem}
          isDownloading={downloadingId === selectedItem?.id}
        />
      )}

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

      <CreateWorkspaceModal
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        onCreate={createWorkspace}
      />
    </div>
  );
}
