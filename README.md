# ForgeFit — 75 Hard, Solo Leveling Edition

Expo (React Native) app + Express/MongoDB backend. Complete daily quests, earn XP, rank up
(E → S and beyond), and take on AI-generated bonus quests.

- **Frontend:** Expo SDK 54, Expo Router v6, NativeWind v4, Zustand v5, TypeScript
- **Backend:** Express + MongoDB (Mongoose) in `backend/`
- **Auth:** Supabase (email/password + Google OAuth); backend verifies the Supabase JWT
- **AI:** OpenAI `gpt-4o` for daily bonus quests
- **Photos:** Cloudinary unsigned uploads

## Features

- Onboarding: duration (21–100 days) → start date picker → water target (3L/4L) → daily quests → confirm
- Dashboard: quest checklist with XP, water tracker, progress photo, AI "Daily Gate" bonus quests, level-up screen
- Profile: rank, XP bar, streaks, calendar heatmap, daily reminder (local notification), edit challenge, sign out
- Offline start: user, challenge and today's log are persisted with AsyncStorage

## Environment variables

### Frontend — `.env.local` (copy from `.env.example`)

| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |
| `EXPO_PUBLIC_API_URL` | Backend URL. Simulator: `http://localhost:4000`. Physical phone: `http://<your-mac-LAN-IP>:4000` (`ipconfig getifaddr en0`) |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard → Cloud name |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload presets → Add, signing mode **Unsigned** |

### Backend — `backend/.env` (copy from `backend/.env.example`)

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → create free cluster → Database Access (create user) + Network Access (allow your IP) → Connect → Drivers. Append `/forgefit` as DB name |
| `SUPABASE_URL` | Same as the frontend value |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (**secret**, backend only) |
| `OPENAI_API_KEY` | platform.openai.com → API keys (needs billing/credit) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary dashboard → API Keys |
| `PORT` | `4000` |
| `CORS_ORIGIN` | `*` for dev; set to your app origin in production |

Google login (optional): Supabase → Authentication → Providers → Google (add Google client ID/secret),
and add `forgefit://` to Authentication → URL Configuration → Redirect URLs. Email sign-up works without it.

## Run & test with Expo

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # then fill in values
npm install
npm start                   # expect: "MongoDB connected" + "Server running on port 4000"
curl localhost:4000/health  # {"status":"ok"}

# Terminal 2 — app (repo root)
cp .env.example .env.local  # then fill in values
npm install
npx expo start -c           # -c clears cache; required after any .env change
```

Then press `i` (iOS simulator), `a` (Android emulator), `w` (web), or scan the QR with **Expo Go**
(phone and Mac on the same Wi-Fi; use the LAN IP in `EXPO_PUBLIC_API_URL`).

Type check: `npm run typescript`.

### Manual test checklist

1. Sign up (email) → lands on onboarding; check a `users` doc in Atlas.
2. Finish onboarding → `challenges` doc created, dashboard opens.
3. Tick quests → XP toast; accumulate 150 XP → level-up screen.
4. Tap water glasses; open Daily Gate (needs OpenAI key); complete a bonus quest.
5. Upload a progress photo (needs Cloudinary) and check Cloudinary Media Library.
6. Profile: streak/calendar, toggle Daily reminder (grant permission), Edit challenge, Sign out.
7. Kill the backend and reopen the app: it should open from saved data, or show "Connection lost / Retry".

Debugging: backend terminal (morgan request logs; `401` = Supabase key/URL issue), Metro terminal,
Atlas → Browse Collections, Supabase → Auth → Users.

## Deployment

`backend/Procfile` (`web: node server.js`) works on Railway/Render/Heroku-style hosts. Set the same env vars as
`backend/.env`, restrict `CORS_ORIGIN`, and point `EXPO_PUBLIC_API_URL` at the deployed URL.

## Project layout

```
app/        Expo Router screens: (auth), (tabs), onboarding, level-up, edit-challenge
src/        api/, components/, lib/ (api, supabase, cloudinary, notifications, utils), stores/, types/
backend/    server.js, routes/, controllers/, models/, middleware/auth.js, utils/ (xp, openai)
```
