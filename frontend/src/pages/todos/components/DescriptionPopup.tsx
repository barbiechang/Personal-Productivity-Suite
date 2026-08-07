export default function DescriptionPopup({
  description,
  onClose,
  onEdit,
}: {
  description: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
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
      onMouseDown={onClose}
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
            onClick={onClose}
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
            {description}
          </p>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onEdit}
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
            onClick={onClose}
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
  );
}
