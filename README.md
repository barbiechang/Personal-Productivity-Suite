# Personal Productivity Suite

Dashboard / Todo List / Notes / Digital Notebook (multi-notebook, GoodNotes-style: pressure-sensitive pen/pencil/highlighter, drag-eraser, select/move/resize/rotate, shapes, text, images, zoom/pan, 4 paper styles + custom page size/background, undo/redo, PNG/PDF export, multi-page PDF import-and-annotate) / Calendar / Expense Tracker / File Manager / AI Assistant.

- `frontend/` — React + TypeScript + Vite + Tailwind CSS v4 + Fabric.js + PDF.js + perfect-freehand + jsPDF
- `backend/` — ASP.NET Core Web API + EF Core + SignalR
- `docker-compose.yml` — PostgreSQL (mapped to host port **5433**, not 5432 — avoids clashing with any other local Postgres)

## Prereqs

- Node.js 20+ (have it)
- .NET SDK 10 (have it)
- Docker (for Postgres) — or install Postgres locally and match `backend/src/ProductivitySuite.Api/appsettings.json` connection string (port 5433).

## Run DB

```bash
docker compose up -d
```

## Run backend

```bash
cd backend/src/ProductivitySuite.Api
dotnet restore
dotnet ef database update
dotnet run
```

Migrations (`InitialCreate`, `AddNotebooks`) are already committed under `Migrations/` — `database update` just applies them. API at `http://localhost:5080`, Swagger at `/swagger`. `dotnet ef` needs `dotnet tool install --global dotnet-ef` first time (and `export PATH="$PATH:$HOME/.dotnet/tools"`).

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

App at `http://localhost:5173`. Vite dev server proxies `/api` and `/hubs` to `http://localhost:5080`.

## Status of each module

| Module | State |
|---|---|
| Dashboard | placeholder stat cards, wire to real endpoints later |
| Todo List | full CRUD, hits `/api/todos`, needs backend running |
| Notes | local-state only, no persistence yet — add `/api/notes` wiring same pattern as Todo List |
| Digital Notebook | fully wired to backend: `/notebook` gallery organizes notebooks into optional folders (single level, non-destructive delete — notebooks move back to root) with auto or manually-uploaded cover thumbnails, `/notebook/:id` is the editor. Pressure-sensitive pen/pencil/highlighter (via `perfect-freehand`, real `PointerEvent.pressure` — mouse falls back to constant pressure), real partial/pixel eraser (drag to erase, implemented as a `destination-out` composite stroke that punches through whatever's beneath it — not object deletion), select/move/resize/rotate, rectangle/circle/line/arrow shapes, text boxes, image insert, ctrl+wheel zoom / wheel pan, blank/lined/grid/dot-grid paper + custom page size + background color, per-page undo/redo, debounced autosave to Postgres, add/duplicate/delete/reorder pages, PNG/single-page-PDF/whole-notebook-PDF export, multi-page PDF import (each PDF page becomes a new annotatable notebook page) |
| Calendar | month grid UI only, no event CRUD wired yet (`CalendarController` ready) |
| Expense Tracker | local-state only (`ExpensesController` ready) |
| File Manager | local-state upload list only (`FilesController` with real disk upload ready, not wired) |
| AI Assistant | UI + `/api/assistant/chat` echo stub — swap in a real LLM call (e.g. Anthropic API) in `AssistantController.cs` |

Next real step: wire Notes/Calendar/Expenses/Files pages to their controllers the same way `TodoList.tsx` does, then add auth if this leaves single-user use.

## Realtime

`NotificationHub` at `/hubs/notifications` broadcasts `todoChanged` / `notebookPageChanged`. Frontend has `useSignalR` hook ready in `frontend/src/hooks/useSignalR.ts` — not yet called from any page.
