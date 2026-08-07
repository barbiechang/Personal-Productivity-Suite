export default function TaskModal({
  title,
  onTitleChange,
  section,
  onSectionChange,
  sectionOptions,
  dueDate,
  onDueDateChange,
  onCancel,
  onSubmit,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  section: string;
  onSectionChange: (value: string) => void;
  sectionOptions: string[];
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800">📝 New task</h2>

        <label className="mb-3 block text-xs text-gray-500">
          Task
          <input
            autoFocus
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            placeholder="What needs to get done?"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-300"
          />
        </label>

        <label className="mb-3 block text-xs text-gray-500">
          Section (optional)
          <input
            list="section-options"
            value={section}
            onChange={(event) => onSectionChange(event.target.value)}
            placeholder="e.g. Design"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-300"
          />
          <datalist id="section-options">
            {sectionOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>

        <label className="mb-5 block text-xs text-gray-500">
          Due date (optional)
          <input
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-300"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!title.trim()}
            className="rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-40"
          >
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}
