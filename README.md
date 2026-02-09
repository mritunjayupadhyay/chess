# My Monorepo

A monorepo with **Next.js** (Cloudflare) + **NestJS** (EC2) sharing types, constants, and validation logic.

## Structure

```
my-monorepo/
├── apps/
│   ├── web/                    # Next.js → Cloudflare Pages
│   └── api/                    # NestJS  → EC2
├── packages/
│   └── shared/                 # Shared code (types, constants, validators)
│       └── src/
│           ├── types/          # Interfaces (IUser, ICreateUserRequest, etc.)
│           ├── constants/      # Constants (USER_ROLES, ERROR_MESSAGES, etc.)
│           └── validators/     # Validation functions (validateCreateUser, etc.)
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Setup

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install all dependencies
pnpm install

# Run both apps in dev mode
pnpm dev

# Run individually
pnpm dev:web   # Next.js on http://localhost:3000
pnpm dev:api   # NestJS  on http://localhost:4000
```

## What's Shared

| What       | Example                            | Why Share?                           |
|------------|------------------------------------|--------------------------------------|
| Types      | `IUser`, `ICreateUserRequest`      | Same shape on frontend & backend     |
| Constants  | `USER_ROLES`, `ERROR_MESSAGES`     | Single source of truth               |
| Validators | `validateCreateUser()`             | Same rules on both sides             |

## Deployment

- **Frontend (Cloudflare Pages):** Auto-deploys on push. Set root to `/` and build command to `pnpm install && pnpm build:web`.
- **Backend (EC2):** Pull repo, `pnpm install && pnpm build:api`, then `cd apps/api && node dist/main`.

## Environment Variables

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=https://your-ec2-api-url.com
```

### Backend (`apps/api/.env`)
```
PORT=4000
FRONTEND_URL=https://your-cloudflare-frontend.com
```
