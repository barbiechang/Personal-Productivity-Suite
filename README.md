# Personal Productivity Suite

Dashboard / Todo List / Notes / Digital Notebook (Fabric.js pen+eraser+undo/redo+paper styles+autosave) / Calendar / Expense Tracker / File Manager / AI Assistant.

- `frontend/` — React + TypeScript + Vite + Tailwind CSS v4 + Fabric.js + PDF.js
- `backend/` — ASP.NET Core Web API + EF Core + SignalR
- `docker-compose.yml` — PostgreSQL

## Prereqs

- Node.js 20+ (have it)
- .NET SDK 9 — **not installed on this machine**. Install: `brew install --cask dotnet-sdk`, verify `dotnet --version`.
- Docker (for Postgres) — or install Postgres locally and match `backend/src/ProductivitySuite.Api/appsettings.json` connection string.

## Run DB

```bash
docker compose up -d
```

## Run backend

```bash
cd backend/src/ProductivitySuite.Api
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

API at `http://localhost:5080`, Swagger at `/swagger`. `dotnet ef` needs `dotnet tool install --global dotnet-ef` first time.

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
| Digital Notebook | fully working client-side: Fabric.js pen/eraser, undo/redo history stack, blank/lined/grid paper, PDF import as page background (PDF.js), localStorage autosave. Backend `NotebookController` + `NotebookPage` model exist for server persistence — not wired from UI yet |
| Calendar | month grid UI only, no event CRUD wired yet (`CalendarController` ready) |
| Expense Tracker | local-state only (`ExpensesController` ready) |
| File Manager | local-state upload list only (`FilesController` with real disk upload ready, not wired) |
| AI Assistant | UI + `/api/assistant/chat` echo stub — swap in a real LLM call (e.g. Anthropic API) in `AssistantController.cs` |

Next real step: wire Notes/Calendar/Expenses/Files pages to their controllers the same way `TodoList.tsx` does, then add auth if this leaves single-user use.

## Realtime

`NotificationHub` at `/hubs/notifications` broadcasts `todoChanged` / `notebookPageChanged`. Frontend has `useSignalR` hook ready in `frontend/src/hooks/useSignalR.ts` — not yet called from any page.
