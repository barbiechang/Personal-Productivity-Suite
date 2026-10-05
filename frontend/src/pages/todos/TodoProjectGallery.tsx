import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { api } from "../../lib/api";

interface TodoProjectSummaryDto {
  id: string;
  name: string;
  description: string | null;
  coverDataUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  todoCount: number;
  doneCount: number;
  updatedAt: string;
}

function dateRangeLabel(start: string | null, end: string | null) {
  if (!start) return null;
  const s = format(new Date(start), "MMM d, yyyy");
  if (!end) return s;
  return `${s} → ${format(new Date(end), "MMM d, yyyy")}`;
}

interface TodoProjectDto {
  id: string;
  name: string;
}

interface BannerSettingsDto {
  todoBannerDataUrl: string | null;
  todoBannerIconDataUrl: string | null;
}

function CardMenu({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div data-project-menu className="absolute right-1 top-1 z-20">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(!open);
        }}
        className={`rounded-full bg-white/90 px-2 py-0.5 text-sm text-gray-600 shadow-sm hover:bg-white ${open ? "" : "opacity-0 group-hover:opacity-100"}`}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${danger ? "text-red-500" : "text-gray-700"}`}
    >
      {children}
    </button>
  );
}

function TodoProjectModal({
  initial,
  onClose,
  onSave,
}: {
  initial: TodoProjectSummaryDto | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    coverDataUrl: string | null;
    startDate: string | null;
    endDate: string | null;
  }) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [cover, setCover] = useState<string | null>(
    initial?.coverDataUrl ?? null,
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate?.slice(0, 10) ?? "",
  );
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? "");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setCover(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        coverDataUrl: cover,
        startDate: startDate || null,
        endDate: endDate || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-center text-sm font-semibold text-gray-700">
          {initial ? "Edit project" : "New project"}
        </h3>

        <div className="mb-4 flex justify-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-pink-400 hover:text-pink-500"
          >
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs">+ Cover</span>
            )}
          </button>
        </div>

        <label className="mb-3 block text-xs text-gray-500">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. School Work"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="mb-5 flex gap-2">
          <label className="flex-1 text-xs text-gray-500">
            Start
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex-1 text-xs text-gray-500">
            End
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || submitting}
            className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  menuOpen,
  onToggleMenu,
  onNavigate,
  onEdit,
  onDelete,
}: {
  project: TodoProjectSummaryDto;
  menuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const percent =
    project.todoCount > 0
      ? Math.round((project.doneCount / project.todoCount) * 100)
      : 0;
  const duration = dateRangeLabel(project.startDate, project.endDate);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        onClick={onNavigate}
        className="flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 to-rose-100"
      >
        {project.coverDataUrl ? (
          <img
            src={project.coverDataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-3 text-center font-serif text-sm italic text-gray-400">
            {project.name} ⋆𐙚 ̊.
          </span>
        )}
      </button>

      <CardMenu open={menuOpen} onToggle={onToggleMenu}>
        <MenuItem
          onClick={() => {
            onToggleMenu(false);
            onEdit();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          danger
          onClick={() => {
            onToggleMenu(false);
            onDelete();
          }}
        >
          Delete
        </MenuItem>
      </CardMenu>

      <button
        onClick={onNavigate}
        className="flex flex-col gap-1 px-2 py-2 text-left"
      >
        <p className="truncate text-sm font-medium text-gray-800">
          {project.name} ⋆𐙚 ̊.
        </p>
        {duration && (
          <p className="truncate text-[0.6875rem] text-gray-400">{duration}</p>
        )}
        <p className="text-[0.6875rem] text-gray-400">
          {project.todoCount} task{project.todoCount === 1 ? "" : "s"}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[0.6875rem] text-gray-500">{percent}%</span>
          <div className="h-1 flex-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-pink-400 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </button>
    </div>
  );
}

const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4";

type CoverTarget = { type: "banner" } | { type: "bannerIcon" };

export default function TodoProjectGallery() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<TodoProjectSummaryDto[]>([]);
  const [banner, setBanner] = useState<BannerSettingsDto>({
    todoBannerDataUrl: null,
    todoBannerIconDataUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<
    TodoProjectSummaryDto | "new" | null
  >(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverTargetRef = useRef<CoverTarget | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-project-menu]"))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  async function refresh() {
    setLoading(true);
    const [projectsRes, settingsRes] = await Promise.all([
      api.get<TodoProjectSummaryDto[]>("/todo-projects"),
      api.get<BannerSettingsDto>("/dashboard/settings"),
    ]);
    setProjects(projectsRes.data);
    setBanner(settingsRes.data);
    setLoading(false);
  }

  async function saveProject(data: {
    name: string;
    coverDataUrl: string | null;
    startDate: string | null;
    endDate: string | null;
  }) {
    if (modalTarget && modalTarget !== "new") {
      await api.put(`/todo-projects/${modalTarget.id}`, {
        ...data,
        description: null,
      });
      setModalTarget(null);
      refresh();
    } else {
      const res = await api.post<TodoProjectDto>("/todo-projects", {
        ...data,
        description: null,
      });
      setModalTarget(null);
      navigate(`/todos/${res.data.id}`);
    }
  }

  async function deleteProject(id: string) {
    if (
      !confirm("Delete this project and all its tasks? This cannot be undone.")
    )
      return;
    await api.delete(`/todo-projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function pickCover(target: CoverTarget) {
    coverTargetRef.current = target;
    coverInputRef.current?.click();
  }

  function handleCoverFile(file: File) {
    const target = coverTargetRef.current;
    if (!target) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (target.type === "banner") {
        await api.put("/dashboard/settings", { todoBannerDataUrl: dataUrl });
      } else {
        await api.put("/dashboard/settings", {
          todoBannerIconDataUrl: dataUrl,
        });
      }
      refresh();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCoverFile(file);
          e.target.value = "";
        }}
      />

      <div className="group/banner relative -mx-6 -mt-6 mb-16 h-28 w-[calc(100%+3rem)] bg-gradient-to-r from-pink-100 to-rose-50">
        {banner.todoBannerDataUrl && (
          <img
            src={banner.todoBannerDataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <button
          onClick={() => pickCover({ type: "banner" })}
          className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[0.6875rem] text-gray-600 opacity-0 shadow-sm hover:bg-white group-hover/banner:opacity-100"
        >
          Change banner
        </button>
        <button
          onClick={() => pickCover({ type: "bannerIcon" })}
          className="group/icon absolute -bottom-12 left-6 z-10 flex h-24 w-24 items-end justify-center"
        >
          {banner.todoBannerIconDataUrl ? (
            <img
              src={banner.todoBannerIconDataUrl}
              alt=""
              className="max-h-full max-w-full object-contain drop-shadow-sm"
            />
          ) : (
            <span className="text-5xl leading-none">🐰</span>
          )}
          <span className="absolute -bottom-1 rounded-full bg-white/90 px-2 py-0.5 text-[0.5625rem] text-gray-600 opacity-0 shadow-sm group-hover/icon:opacity-100">
            Change
          </span>
        </button>
      </div>

      <h2 className="mb-4 mt-8 text-xl font-semibold">
        ⋆˙⟡ Todo List Goals. ⊹ ࣪ ˖
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className={GRID_CLASS}>
          <button
            onClick={() => setModalTarget("new")}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-400 hover:text-pink-500"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm">New Project</span>
          </button>

          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              menuOpen={openMenu === project.id}
              onToggleMenu={(o) => setOpenMenu(o ? project.id : null)}
              onNavigate={() => navigate(`/todos/${project.id}`)}
              onEdit={() => setModalTarget(project)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
        </div>
      )}

      {modalTarget && (
        <TodoProjectModal
          initial={modalTarget === "new" ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSave={saveProject}
        />
      )}
    </div>
  );
}
