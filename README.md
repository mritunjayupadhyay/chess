# Chess Monorepo

A full-stack multiplayer chess platform built with **Next.js** (frontend) and **NestJS** (backend), with real-time gameplay over **Socket.IO**. The monorepo uses **pnpm workspaces** and **Turborepo** to share code between apps.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Monorepo                           │
│                                                         │
│  ┌──────────────┐   Socket.IO    ┌──────────────┐      │
│  │   apps/web   │ ◄────────────► │   apps/api   │      │
│  │  (Next.js)   │   WebSocket    │  (NestJS)    │      │
│  │  Port 3000   │                │  Port 4000   │      │
│  └──────┬───────┘                └──────┬───────┘      │
│         │ imports                        │ imports      │
│         ▼                               ▼              │
│  ┌─────────────────────────────────────────────┐       │
│  │             packages/shared                  │       │
│  │   Types, Constants, Validators               │       │
│  └──────────────────┬──────────────────────────┘       │
│                     │ imports                           │
│                     ▼                                   │
│  ┌─────────────────────────────────────────────┐       │
│  │           packages/chess-logic               │       │
│  │   Piece movement rules, FEN, Notation        │       │
│  │   (zero external dependencies)               │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                                    ┌───────────┐
                                    │ PostgreSQL │
                                    └───────────┘
```

## Project Structure

```
chess-monorepo/
├── apps/
│   ├── web/                     # Next.js 15 frontend (Cloudflare Pages)
│   │   └── src/
│   │       ├── app/             # App router pages (dashboard, games, multiplayer, profile, leaderboard)
│   │       ├── chess/           # Chess UI: components, hooks, containers, Redux store
│   │       └── lib/             # API client, Socket.IO client, types
│   └── api/                     # NestJS backend (EC2)
│       └── src/
│           ├── game/            # Real-time game: WebSocket gateway, state, rooms
│           ├── games/           # Game persistence (CRUD, pending games)
│           ├── moves/           # Move history storage
│           ├── chess-profiles/  # Player stats and ratings
│           ├── members/         # Organization members
│           ├── users/           # User management
│           └── database/        # Drizzle ORM + PostgreSQL schema
├── packages/
│   ├── shared/                  # Shared types, constants, validators
│   └── chess-logic/             # Pure chess rules engine (no dependencies)
├── turbo.json                   # Turborepo build config
├── pnpm-workspace.yaml          # Workspace definition
└── tsconfig.base.json           # Base TypeScript config
```

## How the Parts Work Together

### `packages/chess-logic` — The Rules Engine

Pure TypeScript library with zero dependencies. It knows how chess works:

- **Piece movement**: Legal moves for each piece (pawn, knight, bishop, rook, king)
- **Castling**: Tracks castling rights and validates castling moves
- **FEN generation**: Converts board state to/from FEN notation
- **Algebraic notation**: Converts moves to standard chess notation (e.g., `Nf3`)
- **Danger detection**: Checks if a square is attacked (used for check/checkmate)

Both the frontend (to show legal moves) and backend (to validate moves) use this package.

### `packages/shared` — The Contract

Defines the shared contract between frontend and backend:

| What       | Examples                                          | Why Shared                                  |
|------------|---------------------------------------------------|---------------------------------------------|
| Types      | `IPlayer`, `IGameRoom`, `IServerGameState`        | Same shape on both sides                    |
| Socket Events | `SOCKET_EVENTS` enum                           | Client and server agree on event names      |
| Constants  | `ROOM_CONSTRAINTS`                                | Consistent game rules                       |
| Validators | `validateCreateUser()`                            | Same validation on frontend and backend     |
| User Types | `IUser`, `IApiResponse<T>`, `UserRole`            | Consistent API contracts                    |

### `apps/api` — The Backend

NestJS server that handles:

- **WebSocket gateway** (`game.gateway.ts`): Handles all real-time Socket.IO events — room creation, joining, moves, resignations, reconnections
- **Game state** (`game-state.service.ts`): Manages in-memory game states during active play
- **Room management** (`room.service.ts`): Lobby system for creating/joining/listing rooms
- **Persistence**: Saves completed games, move history, and player profiles to PostgreSQL via Drizzle ORM
- **REST API**: Endpoints for user data, game history, profiles. Swagger docs at `/api/docs`

### `apps/web` — The Frontend

Next.js 15 app with:

- **Chessboard UI**: Interactive board with drag-and-drop, legal move highlighting
- **Multiplayer lobby**: Create/join rooms, see available games
- **Real-time play**: Socket.IO client syncs moves instantly between players
- **State management**: Redux Toolkit manages multiplayer game state
- **Auth**: Clerk handles authentication
- **Pages**: Dashboard, game history, active game view, profile, leaderboard

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9.0.0 (`npm install -g pnpm`)
- **PostgreSQL** database

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd chess-monorepo

# Install all dependencies across the monorepo
pnpm install
```

### Environment Variables

Create these env files before running:

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# + Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, etc.)
```

**`apps/api/.env`**
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
CHESS_DB_URL=postgres://user:password@localhost:5432/chess
```

### Running in Development

```bash
# Run everything (frontend + backend + shared packages in watch mode)
pnpm dev

# Or run individually
pnpm dev:web    # Next.js on http://localhost:3000
pnpm dev:api    # NestJS  on http://localhost:4000
```

Turborepo handles build ordering — shared packages compile before the apps that depend on them.

### Building for Production

```bash
pnpm build        # Build everything
pnpm build:web    # Build only frontend
pnpm build:api    # Build only backend
```

## Game Flow (How a Multiplayer Game Works)

```
Player A (Browser)              Server (NestJS)              Player B (Browser)
      │                              │                              │
      │──── room:create ────────────►│                              │
      │◄─── room:created ───────────│                              │
      │                              │◄──── room:join ─────────────│
      │                              │────► room:joined ──────────►│
      │◄─── room:updated ──────────│                              │
      │                              │                              │
      │──── game:start ────────────►│                              │
      │◄─── game:started ──────────│────► game:started ──────────►│
      │     (you are white)          │     (you are black)          │
      │                              │                              │
      │──── game:move (e2→e4) ─────►│                              │
      │     validates with           │                              │
      │     chess-logic              │                              │
      │◄─── game:move-result ──────│────► game:move-result ──────►│
      │                              │                              │
      │                              │◄──── game:move (e7→e5) ────│
      │◄─── game:move-result ──────│────► game:move-result ──────►│
      │                              │                              │
      │         ... game continues until checkmate/resign ...       │
      │                              │                              │
      │◄─── game:over ─────────────│────► game:over ─────────────►│
      │     (saves to DB)            │     (updates profiles)       │
```

### Reconnection

If a player disconnects during an active game:
- A **30-second grace period** starts
- The opponent is notified (`opponent:disconnected`)
- If the player reconnects within 30 seconds, the game resumes seamlessly
- If the timer expires, the disconnected player forfeits

## Tech Stack

| Layer        | Technology              | Purpose                        |
|-------------|-------------------------|--------------------------------|
| Frontend    | Next.js 15, React 19    | UI framework                   |
| Styling     | Tailwind CSS 4          | Utility-first CSS              |
| State       | Redux Toolkit           | Client-side game state         |
| Auth        | Clerk                   | Authentication                 |
| Realtime    | Socket.IO               | WebSocket communication        |
| Backend     | NestJS 10               | Server framework               |
| Database    | PostgreSQL + Drizzle ORM| Persistence                    |
| API Docs    | Swagger / OpenAPI       | REST documentation             |
| Chess Rules | Custom TypeScript       | Pure logic, no dependencies    |
| Monorepo    | pnpm + Turborepo        | Workspace & build orchestration|
| Deploy (FE) | Cloudflare Pages        | Frontend hosting               |
| Deploy (BE) | EC2                     | Backend hosting                |

## Deployment

### Frontend (Cloudflare Pages)

Auto-deploys on push. Configure:
- Root directory: `/`
- Build command: `pnpm install && pnpm build:web`
- Output directory: `apps/web/.open-next/cloudflare`

### Backend (EC2)

```bash
git pull
pnpm install
pnpm build:api
cd apps/api && node dist/main
```

## Useful Commands

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build everything
pnpm lint             # Lint all packages
pnpm dev:web          # Start only frontend
pnpm dev:api          # Start only backend
```
