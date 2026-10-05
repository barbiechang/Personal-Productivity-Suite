export default function ProjectDescriptionCard({
  titleDraft,
  onTitleChange,
  onTitleBlur,
  description,
  editingDesc,
  descDraft,
  onDescChange,
  onStartEdit,
  onCancelEdit,
  onCommitDesc,
  onOpenPopup,
}: {
  titleDraft: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  description: string | null;
  editingDesc: boolean;
  descDraft: string;
  onDescChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onCommitDesc: () => void;
  onOpenPopup: () => void;
}) {
  return (
    <>
      <input
        value={titleDraft}
        onChange={(event) => onTitleChange(event.target.value)}
        onBlur={onTitleBlur}
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

      <div className="mb-6">
        {editingDesc ? (
          <div>
            <textarea
              autoFocus
              value={descDraft}
              onChange={(event) => onDescChange(event.target.value)}
              rows={5}
              placeholder="💬 Add comment..."
              className="
                min-h-[10.25rem]
                w-full
                resize-y
                rounded-sm
                border
                border-pink-200
                bg-white
                px-5
                py-4
                font-serif
                text-[0.9375rem]
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
                onClick={onCancelEdit}
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
                onClick={onCommitDesc}
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
        ) : description ? (
          <div className="group/comment relative">
            <button
              type="button"
              onClick={onOpenPopup}
              className="
                block
                min-h-[5.5rem]
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
                  text-[0.9375rem]
                  italic
                  leading-7
                  text-gray-600
                "
              >
                {description}
              </span>
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onStartEdit();
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
            onClick={onStartEdit}
            className="
              block
              min-h-[5.5rem]
              w-full
              rounded-sm
              border
              border-gray-200
              bg-white
              px-5
              py-4
              text-left
              font-serif
              text-[0.9375rem]
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
            💬 Add comment...
          </button>
        )}
      </div>
    </>
  );
}
