import { useEffect, useRef, useState } from "react";

export default function AddMenu({
  onNewTask,
  onAddImage,
  onAddFile,
  onAddLink,
}: {
  onNewTask: () => void;
  onAddImage: () => void;
  onAddFile: () => void;
  onAddLink: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title="Add"
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            bg-pink-400
            text-white
            shadow-sm
            transition-colors
            hover:bg-pink-500
          "
        >
          <span className="text-lg leading-none">+</span>
        </button>

        {open && (
          <div
            className="
              absolute
              left-0
              top-10
              z-30
              w-44
              overflow-hidden
              rounded-lg
              border
              border-gray-200
              bg-white
              py-1
              shadow-lg
            "
          >
            <button
              type="button"
              onClick={() => pick(onNewTask)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-pink-50"
            >
              <span aria-hidden="true">📝</span> New task
            </button>

            <button
              type="button"
              onClick={() => pick(onAddImage)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-pink-50"
            >
              <span aria-hidden="true">🖼️</span> Add image
            </button>

            <button
              type="button"
              onClick={() => pick(onAddFile)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-pink-50"
            >
              <span aria-hidden="true">📎</span> Add file
            </button>

            <button
              type="button"
              onClick={() => pick(onAddLink)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-pink-50"
            >
              <span aria-hidden="true">🔗</span> Add link
            </button>
          </div>
        )}
      </div>

      <span className="text-sm text-gray-400">
        Add a task, image, file, or link
      </span>
    </div>
  );
}
