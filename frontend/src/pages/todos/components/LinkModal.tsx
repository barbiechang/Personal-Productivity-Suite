export default function LinkModal({
  label,
  onLabelChange,
  url,
  onUrlChange,
  onCancel,
  onSubmit,
}: {
  label: string;
  onLabelChange: (value: string) => void;
  url: string;
  onUrlChange: (value: string) => void;
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
        <h2 className="mb-4 text-lg font-semibold text-gray-800">🔗 Add link</h2>

        <label className="mb-3 block text-xs text-gray-500">
          Label (optional)
          <input
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="e.g. Design file"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-300"
          />
        </label>

        <label className="mb-5 block text-xs text-gray-500">
          URL
          <input
            autoFocus
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            placeholder="https://..."
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
            disabled={!url.trim()}
            className="rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-40"
          >
            Add link
          </button>
        </div>
      </div>
    </div>
  );
}
