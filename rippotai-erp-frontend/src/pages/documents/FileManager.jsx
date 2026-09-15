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
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

/* ------------------------------------------------------------------
 * Brand — centralised until these live in the tailwind theme.
 * ------------------------------------------------------------------ */
const BRAND = "bg-[#1F453B] hover:bg-[#17372f] text-white";
const BRAND_TEXT = "text-[#1F453B]";
const BRAND_SOFT = "bg-[#1F453B]/10 text-[#1F453B]";

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
              ? "border-[#1F453B] bg-[#1F453B]/5"
              : "border-input hover:border-[#1F453B]/40 hover:bg-muted/40",
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

        <div className={cn("rounded-xl p-4", "bg-[#1F453B]/5")}>
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
        <DropdownMenuItem>
          <FolderOpen className="mr-2 h-[14px] w-[14px]" />
          Open
        </DropdownMenuItem>

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

        <DropdownMenuItem>
          <Share2 className="mr-2 h-[14px] w-[14px]" />
          Share
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Copy className="mr-2 h-[14px] w-[14px]" />
          Make a copy
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Move className="mr-2 h-[14px] w-[14px]" />
          Move to
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link2 className="mr-2 h-[14px] w-[14px]" />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => onRename(item)}>
          <Pencil className="mr-2 h-[14px] w-[14px]" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Pin className="mr-2 h-[14px] w-[14px]" />
          Add to workspace
        </DropdownMenuItem>

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
        active ? BRAND_SOFT : "text-slate-600 hover:bg-slate-50",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-slate-400">{count}</span>
      )}
      <ChevronRight
        className={cn(
          "h-[13px] w-[13px] opacity-0 transition group-hover:opacity-100",
          active ? BRAND_TEXT : "text-slate-300",
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
            OneDrive workspace
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
            label="My Files"
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
              className="h-6 w-6 text-muted-foreground hover:text-[#1F453B]"
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

      <div className="border-t p-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className={cn("h-[15px] w-[15px]", BRAND_TEXT)} />
              <span className="text-xs font-medium">Storage</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              42.8 / 100 GB
            </span>
          </div>
          <Progress value={42.8} className="mt-2 h-1.5" />
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
        active ? BRAND_SOFT : "text-slate-600 hover:bg-slate-50",
      )}
    >
      <Folder
        className={cn(
          "h-[15px] w-[15px]",
          active ? BRAND_TEXT : "text-slate-400",
        )}
      />
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      <ChevronRight className="h-[13px] w-[13px] text-slate-300" />
    </button>
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
        type="button"
        onClick={onNavigateRoot}
        className={cn(
          "shrink-0 text-sm font-semibold hover:underline",
          BRAND_TEXT,
        )}
      >
        My Files
      </button>

      {trail.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight className="h-[14px] w-[14px] shrink-0 text-slate-300" />
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
      onClick={() => onSelect(folder)}
      onDoubleClick={() => onOpen(folder)}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-background p-4 transition",
        selected
          ? "border-[#1F453B] bg-[#1F453B]/5 ring-2 ring-[#1F453B]/10"
          : "hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            selected ? BRAND_SOFT : "bg-[#F1F5F3]",
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
          ? "border-[#1F453B] bg-[#1F453B]/5 ring-2 ring-[#1F453B]/10"
          : "hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
          <Icon size={23} className={getFileColor(file.type)} />
        </div>

        <ItemActionsMenu
          item={file}
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
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
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
            selectedId === folder.id && "bg-[#1F453B]/5",
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
              selectedId === file.id && "bg-[#1F453B]/5",
            )}
          >
            <Icon
              className={cn("h-[19px] w-[19px]", getFileColor(file.type))}
            />
            <div className="flex min-w-0 items-center gap-2">
              {file.starred && (
                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
              )}
              <p className="truncate text-sm font-medium">{file.name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{file.modified}</p>
            <p className="text-xs text-muted-foreground">{file.size}</p>
            <ItemActionsMenu
              item={file}
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

  /* -------------------------------------------------- Data — current folder */

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

  /* -------------------------------------------------- Mutations */

  const [createFolderMutation, { isLoading: isCreatingFolder }] =
    useCreateOneDriveFolderMutation();
  const [uploadFile] = useUploadOneDriveFileMutation();
  const [uploadLargeFile] = useUploadLargeOneDriveFileMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteFile] = useDeleteOneDriveFileMutation();
  const [triggerDownload] = useLazyDownloadOneDriveFileQuery();

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

  /* -------------------------------------------------- Delete */

  const deleteItem = async (item) => {
    if (!item) return;

    setDeletingId(item.id);

    try {
      await deleteFile(item.id).unwrap();
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (err) {
      console.error("Delete failed", err);
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

  const currentTitle =
    pathTrail.length > 0 ? pathTrail[pathTrail.length - 1].name : "My Files";

  const locationLabel =
    pathTrail.length > 0
      ? `My Files / ${pathTrail.map((c) => c.name).join(" / ")}`
      : "My Files";

  /* -------------------------------------------------- Render */

  return (
    <div className="flex h-[calc(100vh-32px)] min-h-[700px] overflow-hidden rounded-2xl border bg-muted/20">
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

            <Separator orientation="vertical" className="h-7" />

            <Button type="button" variant="outline">
              <ArrowDownAZ className="h-[15px] w-[15px]" />
              Sort
              <ChevronDown className="h-[13px] w-[13px]" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <ListFilter className="h-[17px] w-[17px]" />
            </Button>

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

              <Badge className="gap-1.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Synced with OneDrive
              </Badge>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertCircle className="h-[18px] w-[18px] shrink-0 text-red-500" />
                <p className="flex-1 text-xs text-red-600">
                  This folder could not be loaded. {error?.data?.message || ""}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
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
                              onDelete={deleteItem}
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
                              onDelete={deleteItem}
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
                    onDelete={deleteItem}
                    downloadingId={downloadingId}
                    deletingId={deletingId}
                  />
                )}

                {!currentFolders.length && !currentFiles.length && (
                  <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-dashed bg-background">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                      <FolderOpen className="h-[30px] w-[30px] text-muted-foreground/60" />
                    </div>
                    <h2 className="mt-4 text-sm font-semibold">
                      This folder is empty
                    </h2>
                    <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
                      Create a folder or upload files to start organizing this
                      workspace.
                    </p>
                    <div className="mt-5 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCreateFolderOpen(true)}
                      >
                        <FolderPlus className="h-[15px] w-[15px]" />
                        New folder
                      </Button>
                      <Button
                        onClick={() => setUploadOpen(true)}
                        className={BRAND}
                      >
                        <Upload className="h-[15px] w-[15px]" />
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
