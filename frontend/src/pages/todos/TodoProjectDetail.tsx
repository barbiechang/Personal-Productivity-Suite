import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import StickerLayer, { type StickerLike } from "../calendar/StickerLayer";
import type { Todo } from "../../types/todo";

interface TodoProjectDto {
  id: string;
  name: string;
  description: string | null;
  coverDataUrl: string | null;
}

interface ResourceDto {
  id: string;
  projectId: string;
  label: string;
  url: string | null;
  fileDataUrl: string | null;
  fileName: string | null;
}

const noop = () => {};

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

  const [resLabel, setResLabel] = useState("");
  const [resUrl, setResUrl] = useState("");

  const [loading, setLoading] = useState(true);

  const [pendingImage, setPendingImage] = useState<
    File | { file: File; x: number; y: number } | null
  >(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
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
    ]).then(([projectRes, todosRes, stickersRes, resourcesRes]) => {
      setProject(projectRes.data);
      setTitleDraft(projectRes.data.name);
      setDescDraft(projectRes.data.description ?? "");
      setTodos(todosRes.data);
      setStickers(stickersRes.data);
      setResources(resourcesRes.data);
      setLoading(false);
    });
  }, [projectId]);

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

  const sections = useMemo(() => {
    const map = new Map<string, Todo[]>();

    for (const todo of todos) {
      const key = todo.section || "General";
      const list = map.get(key) ?? [];

      list.push(todo);
      map.set(key, list);
    }

    return [...map.entries()];
  }, [todos]);

  const sectionNames = useMemo(
    () => [...new Set(todos.map((todo) => todo.section || "General"))],
    [todos],
  );

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
      priority: "medium",
    });

    setTodos((prev) => [...prev, res.data]);
    setNewTitle("");
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
      y: Math.min(90, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
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

  if (loading || !project) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            handleCoverFile(file);
          }

          event.target.value = "";
        }}
      />

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

      {/* Full-width cover */}
      <div
        className="
          group/cover
          relative
          -mx-6
          -mt-6
          mb-6
          h-40
          overflow-hidden
          bg-gradient-to-r
          from-pink-100
          to-rose-50
          sm:h-28
        "
      >
        {project.coverDataUrl && (
          <img
            src={project.coverDataUrl}
            alt={`${project.name} cover`}
            className="h-full w-full object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/5" />

        <button
          type="button"
          onClick={() => navigate("/todos")}
          className="
            absolute
            left-4
            top-4
            z-20
            flex
            items-center
            gap-2
            rounded-full
            bg-white/90
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            backdrop-blur-md
            transition
            hover:bg-white
            hover:text-gray-900
          "
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ←
          </span>

          <span>Todo List</span>
        </button>

        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="
            absolute
            bottom-4
            right-4
            z-20
            rounded-lg
            bg-white/90
            px-3
            py-2
            text-xs
            font-medium
            text-gray-600
            opacity-0
            shadow-sm
            backdrop-blur-md
            transition
            hover:bg-white
            hover:text-gray-800
            group-hover/cover:opacity-100
          "
        >
          Change cover
        </button>
      </div>

      <div
        ref={contentRef}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="relative"
      >
        <input
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onBlur={commitTitle}
          className="
            mb-3
            w-full
            border-none
            bg-transparent
            text-2xl
            font-bold
            text-gray-800
            outline-none
          "
        />

        {/* Comment / Description */}
        <div className="mb-6">
          {editingDesc ? (
            <div>
              <textarea
                autoFocus
                value={descDraft}
                onChange={(event) => setDescDraft(event.target.value)}
                rows={5}
                placeholder="Add comment..."
                className="
                  min-h-[164px]
                  w-full
                  resize-y
                  rounded-sm
                  border
                  border-pink-200
                  bg-white
                  px-5
                  py-4
                  font-serif
                  text-[15px]
                  italic
                  leading-7
                  text-gray-600
                  shadow-[0_1px_4px_rgba(0,0,0,0.05)]
                  outline-none
                  placeholder:text-gray-400
                  focus:border-pink-300
                  focus:ring-1
                  focus:ring-pink-100
                "
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelDescriptionEdit}
                  className="
                    rounded-md
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2
                    text-sm
                    text-gray-500
                    transition
                    hover:bg-gray-50
                    hover:text-gray-700
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={commitDescription}
                  className="
                    rounded-md
                    bg-pink-500
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-pink-600
                  "
                >
                  Save
                </button>
              </div>
            </div>
          ) : project.description ? (
            <div className="group/comment relative">
              <button
                type="button"
                onClick={() => setShowDescriptionPopup(true)}
                className="
                  block
                  min-h-[88px]
                  w-full
                  overflow-hidden
                  rounded-sm
                  border
                  border-gray-200
                  bg-white
                  px-5
                  py-4
                  text-left
                  shadow-[0_1px_4px_rgba(0,0,0,0.05)]
                  transition
                  hover:border-pink-200
                  focus:outline-none
                  focus:ring-1
                  focus:ring-pink-100
                "
              >
                <span
                  className="
                    block
                    overflow-hidden
                    whitespace-pre-wrap
                    break-words
                    [display:-webkit-box]
                    [-webkit-box-orient:vertical]
                    [-webkit-line-clamp:5]
                    font-serif
                    text-[15px]
                    italic
                    leading-7
                    text-gray-600
                  "
                >
                  {project.description}
                </span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDescDraft(project.description ?? "");
                  setEditingDesc(true);
                }}
                className="
                  absolute
                  right-3
                  top-3
                  rounded-md
                  bg-white/95
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-gray-500
                  opacity-0
                  shadow-sm
                  transition
                  hover:bg-pink-50
                  hover:text-pink-500
                  group-hover/comment:opacity-100
                  focus:opacity-100
                "
              >
                Edit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDescDraft("");
                setEditingDesc(true);
              }}
              className="
                block
                min-h-[88px]
                w-full
                rounded-sm
                border
                border-gray-200
                bg-white
                px-5
                py-4
                text-left
                font-serif
                text-[15px]
                italic
                text-gray-400
                shadow-[0_1px_4px_rgba(0,0,0,0.05)]
                transition
                hover:border-pink-200
                focus:outline-none
                focus:ring-1
                focus:ring-pink-100
              "
            >
              Add comment...
            </button>
          )}
        </div>

        {/* Add todo */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            list="section-options"
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
            placeholder="Section (optional)"
            className="
              w-36
              rounded-md
              border
              border-gray-300
              px-2
              py-1.5
              text-sm
              outline-none
              focus:border-pink-300
            "
          />

          <datalist id="section-options">
            {sectionNames.map((section) => (
              <option key={section} value={section} />
            ))}
          </datalist>

          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addTodo();
              }
            }}
            placeholder="New task..."
            className="
              min-w-[10rem]
              flex-1
              rounded-md
              border
              border-gray-300
              px-3
              py-2
              text-sm
              outline-none
              focus:border-pink-300
            "
          />

          <button
            type="button"
            onClick={addTodo}
            className="
              rounded-md
              bg-pink-500
              px-4
              py-2
              text-sm
              font-medium
              text-white
              transition-colors
              hover:bg-pink-600
            "
          >
            Add
          </button>

          <button
            type="button"
            onClick={() => addImageInputRef.current?.click()}
            className="
              rounded-md
              border
              border-gray-300
              px-3
              py-2
              text-sm
              transition-colors
              hover:bg-gray-50
            "
          >
            + Add image
          </button>
        </div>

        {/* Links and files */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase italic tracking-wide text-pink-500">
            Links &amp; Files
          </p>

          {resources.length > 0 && (
            <ul className="mb-2 flex flex-col gap-1">
              {resources.map((resource) => (
                <li
                  key={resource.id}
                  className="
                    group
                    flex
                    items-center
                    gap-2
                    rounded-md
                    px-1
                    py-1
                    text-sm
                    hover:bg-gray-50
                  "
                >
                  <span className="text-gray-400">
                    {resource.url ? "🔗" : "📎"}
                  </span>

                  <a
                    href={resource.url ?? resource.fileDataUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    download={
                      resource.fileDataUrl
                        ? (resource.fileName ?? undefined)
                        : undefined
                    }
                    className="flex-1 truncate text-blue-600 hover:underline"
                  >
                    {resource.label}
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteResource(resource.id)}
                    className="
                      hidden
                      text-xs
                      text-red-400
                      hover:text-red-600
                      group-hover:inline
                    "
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={resLabel}
              onChange={(event) => setResLabel(event.target.value)}
              placeholder="Label (optional)"
              className="
                w-32
                rounded-md
                border
                border-gray-300
                px-2
                py-1.5
                text-sm
                outline-none
                focus:border-pink-300
              "
            />

            <input
              value={resUrl}
              onChange={(event) => setResUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addResourceLink();
                }
              }}
              placeholder="Paste a link..."
              className="
                min-w-[10rem]
                flex-1
                rounded-md
                border
                border-gray-300
                px-2
                py-1.5
                text-sm
                outline-none
                focus:border-pink-300
              "
            />

            <button
              type="button"
              onClick={addResourceLink}
              className="
                rounded-md
                bg-pink-500
                px-3
                py-1.5
                text-sm
                font-medium
                text-white
                transition-colors
                hover:bg-pink-600
              "
            >
              Add link
            </button>

            <button
              type="button"
              onClick={() => resFileInputRef.current?.click()}
              className="
                rounded-md
                border
                border-gray-300
                px-3
                py-1.5
                text-sm
                transition-colors
                hover:bg-gray-50
              "
            >
              + Add file
            </button>
          </div>
        </div>

        {/* Todo sections */}
        {sections.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks yet.</p>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2">
            {sections.map(([section, sectionTodos]) => (
              <div
                key={section}
                className="
                    mb-4
                    break-inside-avoid
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    p-3
                  "
              >
                <p className="mb-2 text-xs font-semibold uppercase italic tracking-wide text-pink-500">
                  {section}
                </p>

                <ul className="overflow-hidden rounded-md">
                  {sectionTodos.map((todo, index) => (
                    <li
                      key={todo.id}
                      className={`
                            group
                            flex
                            items-center
                            gap-3
                            px-2
                            py-2
                            ${index % 2 === 1 ? "bg-pink-50/60" : "bg-white"}
                            ${index > 0 ? "border-t border-gray-100" : ""}
                          `}
                    >
                      <input
                        type="checkbox"
                        checked={todo.isDone}
                        onChange={() => toggleTodo(todo)}
                        className="accent-pink-500"
                      />

                      <span
                        className={`
                              flex-1
                              text-sm
                              ${
                                todo.isDone
                                  ? "text-gray-400 line-through"
                                  : "text-gray-700"
                              }
                            `}
                      >
                        {todo.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="
                              hidden
                              text-xs
                              text-red-400
                              hover:text-red-600
                              hover:underline
                              group-hover:inline
                            "
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

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
            />
          </div>
        </div>
      </div>

      {/* Full description popup */}
      {showDescriptionPopup && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/30
            p-4
            backdrop-blur-[2px]
          "
          onMouseDown={() => setShowDescriptionPopup(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="description-popup-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="
              flex
              max-h-[80vh]
              w-full
              max-w-2xl
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2
                id="description-popup-title"
                className="text-lg font-semibold text-gray-800"
              >
                💬 Description ⋆. 𐙚 ˚
              </h2>

              <button
                type="button"
                onClick={() => setShowDescriptionPopup(false)}
                aria-label="Close comment"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-2xl
                  leading-none
                  text-gray-400
                  transition
                  hover:bg-gray-100
                  hover:text-gray-700
                "
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <p
                className="
                  whitespace-pre-wrap
                  break-words
                  font-serif
                  text-[16px]
                  italic
                  leading-8
                  text-gray-600
                "
              >
                {project.description}
              </p>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowDescriptionPopup(false);
                  setDescDraft(project.description ?? "");
                  setEditingDesc(true);
                }}
                className="
                  rounded-lg
                  border
                  border-pink-200
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-pink-500
                  transition
                  hover:bg-pink-50
                "
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setShowDescriptionPopup(false)}
                className="
                  rounded-lg
                  bg-pink-500
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-pink-600
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
