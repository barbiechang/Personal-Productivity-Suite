import type { Todo } from "../../../types/todo";

export default function TaskListCard({
  todos,
  onToggle,
  onDelete,
}: {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-1/3 overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-[#fff4f7] px-3 py-1.5">
        <h3 className="text-[0.9375rem] font-semibold italic text-[#4b4345]">
          things to do
        </h3>
      </div>

      {/* Empty State */}
      {todos.length === 0 ? (
        <div className="px-3 py-3 text-sm text-gray-400">
          No tasks yet.
        </div>
      ) : (
        <ul className="px-3 py-1.5">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="
                group
                flex
                min-h-[1.625rem]
                items-center
                gap-2
                py-0.5
              "
            >
              <input
                type="checkbox"
                checked={todo.isDone}
                onChange={() => onToggle(todo)}
                className="
                  h-[0.875rem]
                  w-[0.875rem]
                  shrink-0
                  cursor-pointer
                  appearance-none
                  border
                  border-[#555]
                  bg-white
                  checked:bg-[#555]
                  checked:after:flex
                  checked:after:h-full
                  checked:after:items-center
                  checked:after:justify-center
                  checked:after:text-[0.625rem]
                  checked:after:text-white
                  checked:after:content-['✓']
                "
              />

              <span
                className={`
                  flex-1
                  text-[0.8125rem]
                  leading-5
                  ${
                    todo.isDone
                      ? "text-gray-400 line-through"
                      : "text-[#4b4546]"
                  }
                `}
              >
                {todo.title}
              </span>

              <button
                type="button"
                onClick={() => onDelete(todo.id)}
                className="
                  invisible
                  text-[0.625rem]
                  text-gray-400
                  transition
                  hover:text-red-500
                  group-hover:visible
                "
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}