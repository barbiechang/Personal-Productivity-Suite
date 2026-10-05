import type { ResourceDto } from "../types";

export default function LinksAndFilesCard({
  resources,
  onDelete,
}: {
  resources: ResourceDto[];
  onDelete: (id: string) => void;
}) {
  if (resources.length === 0) return null;

  return (
    <div className="w-1/3 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-[#fff4f7] px-3 py-1.5">
        <h3
          className="text-[0.9375rem] font-semibold italic text-[#4b4345]"
        >
          links & files
        </h3>
      </div>

      {/* Resources */}
      <ul className="px-3 py-1.5">
        {resources.map((resource) => (
          <li
            key={resource.id}
            className="
              group
              flex
              min-h-[1.625rem]
              items-center
              gap-2
              py-0.5
            "
          >
            {/* Minimal icon */}
            <span
              className="
                flex
                h-[0.875rem]
                w-[0.875rem]
                shrink-0
                items-center
                justify-center
                text-[0.6875rem]
                text-[#555]
              "
            >
              {resource.url ? "↗" : "⌑"}
            </span>

            {/* Link / File name */}
            <a
              href={resource.url ?? resource.fileDataUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              download={
                resource.fileDataUrl
                  ? (resource.fileName ?? undefined)
                  : undefined
              }
              className="
                flex-1
                truncate
                text-[0.8125rem]
                leading-5
                text-[#4b4546]
                hover:underline
              "
            >
              {resource.label}
            </a>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(resource.id)}
              className="
                invisible
                text-[0.625rem]
                text-gray-400
                transition
                hover:text-red-500
                group-hover:visible
              "
              aria-label={`Delete ${resource.label}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}