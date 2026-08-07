import type { Todo } from "../../../types/todo";

export default function WeeklyView({
  weekdayGroups,
}: {
  weekdayGroups: readonly (readonly [string, Todo[]])[];
}) {
  const visibleDays = weekdayGroups.filter(
    ([, dayTodos]) => dayTodos.length > 0
  );

  if (visibleDays.length === 0) return null;

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2 border-b border-gray-200 pb-3">
        <span className="text-lg text-gray-500">📄</span>

        <h2
          className="text-[18px] font-medium text-[#3f3a3b]"
        >
          Weekly view
        </h2>
      </div>

      {/* Responsive Weekly Board */}
      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          2xl:grid-cols-5
        "
      >
        {visibleDays.map(([day, dayTodos], dayIndex) => {
          const isPinkColumn = dayIndex % 2 === 0;

          return (
            <div
              key={day}
              className={`
                min-w-0
                w-full
                rounded-2xl
                p-3
                ${
                  isPinkColumn
                    ? "bg-[#ffe2ea]"
                    : "bg-[#ededed]"
                }
              `}
            >
              {/* Day Header */}
              <div className="mb-3 flex min-w-0 items-center gap-3 px-1">
                <span
                  className={`
                    truncate
                    px-2
                    py-0.5
                    text-[15px]
                    font-medium
                    ${
                      isPinkColumn
                        ? "bg-[#ffcddf] text-[#4f4145]"
                        : "bg-[#e0e0e0] text-[#474443]"
                    }
                  `}
                >
                  {day}
                </span>

                <span
                  className={`
                    shrink-0
                    text-[14px]
                    ${
                      isPinkColumn
                        ? "text-[#d99aae]"
                        : "text-[#aaa6a3]"
                    }
                  `}
                >
                  {dayTodos.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex min-w-0 flex-col gap-2.5">
                {dayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="
                      min-w-0
                      min-h-[92px]
                      rounded-[14px]
                      border
                      border-[#eee9ea]
                      bg-white
                      px-4
                      py-4
                      shadow-[0_2px_8px_rgba(0,0,0,0.035)]
                    "
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        aria-hidden="true"
                      >
                        🎀
                      </span>

                      <p
                        className={`
                          min-w-0
                          flex-1
                          truncate
                          text-[15px]
                          font-medium
                          ${
                            todo.isDone
                              ? "text-gray-400 line-through"
                              : "text-[#494343]"
                          }
                        `}
                      >
                        {todo.title}
                      </p>
                    </div>

                    <div
                      className={`
                        mt-6
                        text-[12px]
                        font-semibold
                        ${
                          todo.isDone
                            ? "text-gray-400"
                            : "text-[#5a5152]"
                        }
                      `}
                    >
                      {todo.isDone ? "Completed" : "Task"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}