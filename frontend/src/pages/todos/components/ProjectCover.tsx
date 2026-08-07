import { useRef } from "react";

export default function ProjectCover({
  coverDataUrl,
  projectName,
  onBack,
  onCoverFile,
}: {
  coverDataUrl: string | null;
  projectName: string;
  onBack: () => void;
  onCoverFile: (file: File) => void;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
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
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onCoverFile(file);
          }

          event.target.value = "";
        }}
      />

      {coverDataUrl && (
        <img
          src={coverDataUrl}
          alt={`${projectName} cover`}
          className="h-full w-full object-cover"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/5" />

      <button
        type="button"
        onClick={onBack}
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
  );
}
