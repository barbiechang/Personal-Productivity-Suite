import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import StickerLayer, { type StickerLike } from "../calendar/StickerLayer";
import type { Todo } from "../../types/todo";
import type { ResourceDto, TodoProjectDto } from "./types";
import ProjectCover from "./components/ProjectCover";
import ProjectDescriptionCard from "./components/ProjectDescriptionCard";
import DescriptionPopup from "./components/DescriptionPopup";
import AddMenu from "./components/AddMenu";
import TaskListCard from "./components/TaskListCard";
import LinksAndFilesCard from "./components/LinksAndFilesCard";
import WeeklyView from "./components/WeeklyView";
import TaskModal from "./components/TaskModal";
import LinkModal from "./components/LinkModal";

const noop = () => {};

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function TodoProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<TodoProjectDto | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [stickers, setStickers] = useState<StickerLike[]>([]);
  const [resources, setResources] = useState<ResourceDto[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [resLabel, setResLabel] = useState("");
  const [resUrl, setResUrl] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [loading, setLoading] = useState(true);

  const [pendingImage, setPendingImage] = useState<
    File | { file: File; x: number; y: number } | null
  >(null);

  const addImageInputRef = useRef<HTMLInputElement>(null);
  const resFileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);

    Promise.all([
      api.get<TodoProjectDto>(`/todo-projects/${projectId}`),
      api.get<Todo[]>("/todos", {
        params: { projectId },
      }),
      api.get<StickerLike[]>("/todo-project-stickers", {
        params: { projectId },
      }),
      api.get<ResourceDto[]>("/todo-project-resources", {
        params: { projectId },
      }),
    ])
      .then(([projectRes, todosRes, stickersRes, resourcesRes]) => {
        setProject(projectRes.data);
        setTitleDraft(projectRes.data.name);
        setDescDraft(projectRes.data.description ?? "");
        setTodos(todosRes.data);
        setStickers(stickersRes.data);
        setResources(resourcesRes.data);
        setLoading(false);
      })
      .catch(() => {
        navigate("/todos");
      });
  }, [projectId, navigate]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDescriptionPopup(false);
      }
    }

    if (showDescriptionPopup) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showDescriptionPopup]);

  const sectionNames = useMemo(
    () => [...new Set(todos.map((todo) => todo.section || "General"))],
    [todos],
  );

  const weekdayGroups = useMemo(() => {
    const map = new Map<string, Todo[]>();

    for (const todo of todos) {
      if (!todo.dueDate) continue;

      const day = new Date(todo.dueDate).toLocaleDateString("en-US", {
        weekday: "long",
      });

      const list = map.get(day) ?? [];
      list.push(todo);
      map.set(day, list);
    }

    return WEEKDAYS.map((day) => [day, map.get(day) ?? []] as const);
  }, [todos]);

  async function commitTitle() {
    if (!project || !projectId) return;

    const name = titleDraft.trim() || project.name;

    if (name === project.name) return;

    const res = await api.put<TodoProjectDto>(`/todo-projects/${projectId}`, {
      name,
      description: null,
      coverDataUrl: null,
    });

    setProject((prev) =>
      prev
        ? {
            ...prev,
            name: res.data.name,
          }
        : prev,
    );
  }

  async function commitDescription() {
    if (!project || !projectId) return;

    if (descDraft === (project.description ?? "")) {
      setEditingDesc(false);
      return;
    }

    await api.put(`/todo-projects/${projectId}`, {
      name: project.name,
      description: descDraft,
      coverDataUrl: null,
    });

    setProject((prev) =>
      prev
        ? {
            ...prev,
            description: descDraft,
          }
        : prev,
    );

    setEditingDesc(false);
  }

  function cancelDescriptionEdit() {
    setDescDraft(project?.description ?? "");
    setEditingDesc(false);
  }

  function handleCoverFile(file: File) {
    if (!project || !projectId) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      const res = await api.put<TodoProjectDto>(`/todo-projects/${projectId}`, {
        name: project.name,
        description: null,
        coverDataUrl: dataUrl,
      });

      setProject((prev) =>
        prev
          ? {
              ...prev,
              coverDataUrl: res.data.coverDataUrl,
            }
          : prev,
      );
    };

    reader.readAsDataURL(file);
  }

  async function addTodo() {
    if (!newTitle.trim() || !projectId) return;

    const res = await api.post<Todo>("/todos", {
      projectId,
      title: newTitle.trim(),
      section: newSection.trim() || "General",
      dueDate: newDueDate ? `${newDueDate}T00:00:00Z` : null,
      priority: "medium",
    });

    setTodos((prev) => [...prev, res.data]);
    setNewTitle("");
    setNewSection("");
    setNewDueDate("");
    setShowTaskModal(false);
  }

  async function toggleTodo(todo: Todo) {
    const res = await api.put<Todo>(`/todos/${todo.id}`, {
      ...todo,
      isDone: !todo.isDone,
    });

    setTodos((prev) =>
      prev.map((item) => (item.id === todo.id ? res.data : item)),
    );
  }

  async function deleteTodo(id: string) {
    await api.delete(`/todos/${id}`);

    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function positionFromEvent(clientX: number, clientY: number) {
    const rect = contentRef.current?.getBoundingClientRect();

    if (!rect) {
      return {
        x: 40,
        y: 40,
      };
    }

    return {
      x: Math.min(90, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, ((clientY - rect.top) / rect.height) * 100),
    };
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file || !file.type.startsWith("image/")) return;

    setPendingImage({
      file,
      ...positionFromEvent(event.clientX, event.clientY),
    });
  }

  async function handleImageFile(file: File, x = 40, y = 40) {
    if (!projectId) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const img = new Image();

      img.onload = async () => {
        const aspect = img.naturalWidth / img.naturalHeight;

        const rect = contentRef.current?.getBoundingClientRect();

        const basePx = 90;

        const widthPx = aspect >= 1 ? basePx : basePx * aspect;

        const heightPx = aspect >= 1 ? basePx / aspect : basePx;

        const width = rect ? (widthPx / rect.width) * 100 : 14;

        const height = rect ? (heightPx / rect.height) * 100 : 14;

        const res = await api.post<StickerLike>("/todo-project-stickers", {
          projectId,
          imageDataUrl: reader.result as string,
          x,
          y,
          width,
          height,
        });

        setStickers((prev) => [...prev, res.data]);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!pendingImage) return;

    if (pendingImage instanceof File) {
      handleImageFile(pendingImage);
    } else {
      handleImageFile(pendingImage.file, pendingImage.x, pendingImage.y);
    }

    setPendingImage(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage]);

  async function handleStickerPosition(id: string, x: number, y: number) {
    setStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === id
          ? {
              ...sticker,
              x,
              y,
            }
          : sticker,
      ),
    );

    await api.put(`/todo-project-stickers/${id}`, {
      x,
      y,
    });
  }

  async function handleStickerSize(id: string, width: number, height: number) {
    setStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === id
          ? {
              ...sticker,
              width,
              height,
            }
          : sticker,
      ),
    );

    await api.put(`/todo-project-stickers/${id}`, {
      width,
      height,
    });
  }

  async function handleStickerDelete(id: string) {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id));

    await api.delete(`/todo-project-stickers/${id}`);
  }

  async function addResourceLink() {
    if (!resUrl.trim() || !projectId) return;

    const res = await api.post<ResourceDto>("/todo-project-resources", {
      projectId,
      label: resLabel.trim() || resUrl.trim(),
      url: resUrl.trim(),
    });

    setResources((prev) => [...prev, res.data]);
    setResLabel("");
    setResUrl("");
    setShowLinkModal(false);
  }

  function addResourceFile(file: File) {
    if (!projectId) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const res = await api.post<ResourceDto>("/todo-project-resources", {
        projectId,
        label: resLabel.trim() || file.name,
        fileDataUrl: reader.result as string,
        fileName: file.name,
      });

      setResources((prev) => [...prev, res.data]);
      setResLabel("");
    };

    reader.readAsDataURL(file);
  }

  async function deleteResource(id: string) {
    await api.delete(`/todo-project-resources/${id}`);

    setResources((prev) => prev.filter((resource) => resource.id !== id));
  }

  function openTaskModal() {
    setNewTitle("");
    setNewSection("");
    setNewDueDate("");
    setShowTaskModal(true);
  }

  function openLinkModal() {
    setResLabel("");
    setResUrl("");
    setShowLinkModal(true);
  }

  if (loading || !project) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    // Bottom padding leaves room to drag stickers below the content.
    <div className="pb-64">
      <input
        ref={addImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            setPendingImage(file);
          }

          event.target.value = "";
        }}
      />

      <input
        ref={resFileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            addResourceFile(file);
          }

          event.target.value = "";
        }}
      />

      <ProjectCover
        coverDataUrl={project.coverDataUrl}
        projectName={project.name}
        onBack={() => navigate("/todos")}
        onCoverFile={handleCoverFile}
      />

      <div
        ref={contentRef}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="relative"
      >
        <ProjectDescriptionCard
          titleDraft={titleDraft}
          onTitleChange={setTitleDraft}
          onTitleBlur={commitTitle}
          description={project.description}
          editingDesc={editingDesc}
          descDraft={descDraft}
          onDescChange={setDescDraft}
          onStartEdit={() => {
            setDescDraft(project.description ?? "");
            setEditingDesc(true);
          }}
          onCancelEdit={cancelDescriptionEdit}
          onCommitDesc={commitDescription}
          onOpenPopup={() => setShowDescriptionPopup(true)}
        />

        <AddMenu
          onNewTask={openTaskModal}
          onAddImage={() => addImageInputRef.current?.click()}
          onAddFile={() => resFileInputRef.current?.click()}
          onAddLink={openLinkModal}
        />

        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <TaskListCard todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />

          <LinksAndFilesCard resources={resources} onDelete={deleteResource} />
        </div>

        <WeeklyView weekdayGroups={weekdayGroups} />

        {/* Stickers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto">
            <StickerLayer
              containerRef={contentRef}
              stickers={stickers}
              textBoxes={[]}
              onStickerPosition={handleStickerPosition}
              onStickerSize={handleStickerSize}
              onStickerDelete={handleStickerDelete}
              onTextPosition={noop}
              onTextCommit={noop}
              onTextDelete={noop}
              unboundedY
            />
          </div>
        </div>
      </div>

      {showDescriptionPopup && (
        <DescriptionPopup
          description={project.description ?? ""}
          onClose={() => setShowDescriptionPopup(false)}
          onEdit={() => {
            setShowDescriptionPopup(false);
            setDescDraft(project.description ?? "");
            setEditingDesc(true);
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          title={newTitle}
          onTitleChange={setNewTitle}
          section={newSection}
          onSectionChange={setNewSection}
          sectionOptions={sectionNames}
          dueDate={newDueDate}
          onDueDateChange={setNewDueDate}
          onCancel={() => setShowTaskModal(false)}
          onSubmit={addTodo}
        />
      )}

      {showLinkModal && (
        <LinkModal
          label={resLabel}
          onLabelChange={setResLabel}
          url={resUrl}
          onUrlChange={setResUrl}
          onCancel={() => setShowLinkModal(false)}
          onSubmit={addResourceLink}
        />
      )}
    </div>
  );
}
