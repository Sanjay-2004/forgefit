# ForgeFit — 75 Hard Solo Leveling Edition
## Handout: Current State & Continuation Guide

---

## What This Is

**ForgeFit** (this repo) is a React Native Expo app that implements the **75 Hard challenge** with a **Solo Leveling anime aesthetic** — users complete daily quests, earn XP, level up, and face AI-generated bonus challenges.

**Tech stack:**
- **Frontend:** React Native Expo (`^54.0.0`), Expo Router v6, NativeWind v4, Zustand v5, TypeScript
- **Backend:** Node.js + Express + MongoDB (Mongoose), inside `forgefit/backend/`
- **Auth:** Supabase (email/password + Google OAuth) — already configured, `src/lib/supabase/client.ts` untouched
- **AI:** OpenAI `gpt-4o` for daily bonus challenge generation
- **Photos:** Cloudinary (unsigned uploads via `cloudinary-react-native`)

---

## Current Status

### ✅ Implemented (TypeScript clean; Android bundle builds)

| Layer | What's done |
|---|---|
| Auth | Login (email + Google), sign-up, sign-out (Profile), `AuthProvider` in `app/_layout.tsx` (loads user + challenge once per user, retry screen on connection failure, falls back to persisted data) |
| Onboarding | 6 steps: intro → duration → **start-date picker** → water → daily quests → confirm |
| Dashboard | Quests + XP, water, Cloudinary photo, AI Daily Gate, XP toast, level-up |
| Profile | Rank, XP bar, streaks, calendar, **daily reminder**, **Edit challenge**, **Sign out** |
| Edit challenge | `app/edit-challenge.tsx` + `PATCH /api/challenge/:id` (water target + quests; syncs today's log) |
| Notifications | `src/lib/notifications.ts` — daily local reminder (hour adjustable, minute fixed at 00) |
| Offline | user / challenge / today's log persisted via zustand `persist` + AsyncStorage |
| Backend | 12 REST endpoints, Supabase JWT auth, XP system, OpenAI bonus quests |
| Fixes | API errors surface backend `{error}`; client sends local date (`?date=`) to avoid UTC day bugs; date-based streaks; bonus re-complete returns XP fields |

Backend verified with an in-memory MongoDB and stubbed auth/OpenAI. **Not yet verified with real keys:** Supabase JWT check,
OpenAI, Cloudinary, Google OAuth, and on-device UI.

### ⚠️ Known remaining items
1. Reminder time: only the hour is adjustable.
2. Offline writes are not queued — toggles made while offline are not synced later.
3. Editing a challenge cannot change duration/start date (start a new challenge instead).
4. No automated tests.
5. `CORS_ORIGIN=*` — tighten for production.
6. Two lockfiles exist (`bun.lock`, `package-lock.json`); pick one package manager.

---

## Environment Variables

### Frontend (`forgefit/.env.local`) — create from `.env.example`
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

### Backend (`forgefit/backend/.env`) — create from `backend/.env.example`
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/forgefit
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Settings > API > service_role
OPENAI_API_KEY=sk-...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=4000
CORS_ORIGIN=*
```

---

## External Service Setup Checklist

| Service | What to do | Status |
|---|---|---|
| **Supabase** | Enable Google OAuth: Auth → Providers → Google. Set redirect URL to `forgefit://`. | ⬜ |
| **Supabase** | Get `service_role` key from Settings → API (for backend JWT verification). | ⬜ |
| **MongoDB Atlas** | Create a free cluster, create a DB user, get connection string. | ⬜ |
| **OpenAI** | Get API key from platform.openai.com. | ⬜ |
| **Cloudinary** | Create account → Settings → Upload → Add unsigned upload preset. Copy cloud name + preset name. | ⬜ |

---

## How to Run

```bash
# Backend
cd backend
cp .env.example .env      # fill in values
npm install
npm start                 # port 4000; check /health

# Frontend (repo root, new terminal)
cp .env.example .env.local   # fill in values
npm install
npx expo start -c            # i / a / w, or scan QR with Expo Go
```

---

## File Structure

```
forgefit/
├── app/
│   ├── _layout.tsx              # AuthProvider, ClerkProvider-equivalent for Supabase
│   ├── index.tsx                # Redirects to /(auth)/login (AuthProvider routes onward)
│   ├── edit-challenge.tsx       # Edit water target + quests (modal)
│   ├── onboarding.tsx           # 5-step onboarding wizard
│   ├── level-up.tsx             # Level-up celebration screen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # Email + Google OAuth tabs
│   │   └── sign-up.tsx          # Email registration
│   └── (tabs)/
│       ├── _layout.tsx          # 2 tabs: Quests + Hunter
│       ├── index.tsx            # Dashboard (main screen)
│       └── profile.tsx          # Stats, calendar, streak
├── src/
│   ├── api/
│   │   ├── challenge.ts         # createChallenge, getActiveChallenge
│   │   ├── daily-log.ts         # getToday, toggleTarget, updateWater, uploadPhoto
│   │   ├── bonus-challenges.ts  # generate, completeBonusChallenge
│   │   ├── stats.ts             # getProgressStats
│   │   └── user.ts              # getMe, updateName
│   ├── components/
│   │   ├── gamification/
│   │   │   └── animations.tsx   # XPGainToast, RankUpCelebration (kept from original)
│   │   └── ui/
│   │       ├── RankBadge.tsx
│   │       ├── XPBar.tsx
│   │       ├── QuestItem.tsx    # Animated checkbox row
│   │       ├── WaterTracker.tsx # Tap-to-fill glasses
│   │       ├── BonusChallenge.tsx
│   │       ├── DayCounter.tsx   # SVG ring progress
│   │       ├── ProgressCalendar.tsx
│   │       └── PhotoUpload.tsx  # Cloudinary unsigned upload
│   ├── lib/
│   │   ├── api.ts               # Base fetch() with Supabase Bearer token
│   │   ├── cloudinary.ts        # Cloudinary SDK instance
│   │   ├── supabase/client.ts   # Supabase client (unchanged from original)
│   │   └── utils.ts             # getRankFromXP, getRankColor, getDayNumber, getLevel
│   ├── stores/
│   │   ├── user-store.ts        # userId, name, level, totalXP, rank
│   │   ├── challenge-store.ts   # active challenge
│   │   ├── daily-log-store.ts   # today's log, optimistic updates
│   │   └── onboarding-store.ts  # 5-step wizard state
│   └── types/index.ts           # All types: HunterRank, Challenge, DailyLog, XPResponse, etc.
├── backend/
│   ├── server.js                # Express app entry point
│   ├── middleware/auth.js       # Supabase JWT verification → req.supabaseUserId
│   ├── models/
│   │   ├── User.js              # supabaseId, email, name, level, totalXP, rank
│   │   ├── Challenge.js         # durationDays, startDate, waterTarget, dailyTargets[]
│   │   └── DailyLog.js          # targetsCompleted[], waterIntake, bonusChallenges[]
│   ├── controllers/             # userController, challengeController, dailyLogController,
│   │   ...                      # bonusChallengesController, statsController
│   ├── routes/                  # user, challenge, dailyLog, bonusChallenges, stats
│   └── utils/
│       ├── xp.js                # getLevel(xp), getRank(xp), 150 XP/level
│       └── openai.js            # generateBonusChallenges() → sanitized JSON array
├── tailwind.config.js           # bg.primary=#0A0A1A, neon.cyan=#00f0ff, rank.* colors
└── .env.example                 # Frontend env vars template
```

---

## Key Architecture Decisions

| Decision | Why |
|---|---|
| **Supabase Auth (not Clerk)** | Already installed, Google OAuth already coded, no new packages needed |
| **MongoDB + Express backend** | Separate from Supabase DB; all challenge/daily-log data lives in MongoDB |
| **Backend JWT verification** | `supabase.auth.getUser(token)` with service role key — no `@clerk/express` needed |
| **Optimistic UI** | `useDailyLogStore.optimisticToggleTarget()` updates UI instantly; server response reconciles |
| **XPResponse type** | `toggleTarget` and `completeBonusChallenge` return `{ log, leveledUp, newLevel, newRank, newXP }` — enables instant level-up routing |
| **150 XP/level** | Simple linear system; rank thresholds use existing `RANK_XP_THRESHOLDS` (E=0, D=500, C=1500, B=4000, A=10000, S=25000) |
| **Cloudinary unsigned uploads** | No server-side signature needed; upload preset controls folder/restrictions |

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/user/me` | ✅ | Get or create MongoDB user from Supabase JWT |
| PATCH | `/api/user/me` | ✅ | Update name / avatar |
| POST | `/api/challenge` | ✅ | Create challenge (fails any active one first) |
| GET | `/api/challenge/active` | ✅ | Get current active challenge |
| GET | `/api/daily-log/today?date=YYYY-MM-DD` | ✅ | Get or create today's log (client-local date) |
| PATCH | `/api/daily-log/:id/target/:targetId` | ✅ | Toggle target, returns XPResponse |
| PATCH | `/api/challenge/:id` | ✅ | Update water target / daily quests |
| PATCH | `/api/daily-log/:id/water` | ✅ | Update water intake |
| POST | `/api/daily-log/:id/photo` | ✅ | Save Cloudinary photo URL |
| POST | `/api/bonus-challenges/generate` | ✅ | OpenAI generates 3 side quests |
| PATCH | `/api/bonus-challenges/:id/complete` | ✅ | Complete bonus, returns XPResponse |
| GET | `/api/stats/progress` | ✅ | Calendar days, streak, XP, rank |

---

## Important Patterns

### Getting a Supabase auth token for API calls
```ts
// src/lib/api.ts — used by all src/api/*.ts functions
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### After any XP-earning action (toggle / bonus complete)
```ts
// The backend returns XPResponse — the screen must:
setLog(result.log);
setUser({ totalXP: result.newXP, level: result.newLevel, rank: result.newRank });
if (result.leveledUp) router.push(`/level-up?level=${result.newLevel}&rank=${result.newRank}` as any);
```

### Adding new Expo Router screens
- All screens with `as any` route casts are fine — `typedRoutes: true` in tsconfig enforces known routes, but dynamic routes like `/level-up?level=5` need the cast.

---
