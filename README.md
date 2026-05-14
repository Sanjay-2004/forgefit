# ForgeFit - AI Workout Coach

React Native (Expo) fitness app with anime-inspired gamification.

## Tech Stack
- **Expo SDK 52** with Expo Router v4
- **NativeWind v4** (Tailwind CSS for React Native)
- **Zustand** + **React Query** for state management
- **Supabase** for auth, database, storage
- **OpenAI GPT-4o-mini** for AI coaching

## Getting Started

```bash
bun install
bun start
```

Press `i` for iOS simulator or `a` for Android emulator.

## Project Structure
```
app/           # Expo Router screens (file-based routing)
src/
  components/  # Reusable UI components
  lib/         # Supabase client, utilities
  stores/      # Zustand state stores
  types/       # TypeScript type definitions
  domain/      # Business logic (progression, XP)
  styles/      # Global CSS
supabase/      # Database schema & edge functions
```
