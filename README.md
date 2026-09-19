# Kharcha

**Kharcha** is a simple, fast, privacy-focused personal expense and income tracker.

> Open the app → record the expense → continue with your day.

Fully **offline-first**: all financial data lives in SQLite on your device. No account, no internet, no cloud, no backend.

## Features

- **Quick transaction entry** — expense/income, amount, category, optional title & note, custom date & time, in a few taps
- **Categories** — sensible defaults plus full management: create, rename, pick an icon, safe delete (blocked while in use)
- **Analytics** — income vs. spending trends, period summaries, spending by category (week / month / year), previous-period comparison with % changes, and biggest category movers
- **Transactions** — date-grouped history with search and type / date / category filters
- **Backup & restore** — offline JSON backup and CSV export via the share sheet; merge-only import that never touches existing data
- **Settings** — currency (NPR, USD, INR, EUR, GBP), System / Light / Dark appearance, default transaction type, start-of-week
- **Cross-platform** — iOS, Android, and Web

## Tech Stack

- **Framework**: Expo SDK 56 + React Native + React
- **Routing**: Expo Router (file-based, `app/`)
- **Styling**: NativeWind v4 (`className` prop)
- **UI**: React Native Reusables (`components/ui/`)
- **Icons**: Lucide React Native
- **Database**: Expo SQLite (local, offline)
- **Animations**: React Native Reanimated
- **Language**: TypeScript (strict, no `any`)

Architecture follows **Screen → Hook → Repository → SQLite** — no raw SQL in UI components. See [AGENTS.md](./AGENTS.md) for contributor conventions and [docs/prd.md](./docs/prd.md) for the product spec.

## Getting Started

```bash
npm install
npm run dev      # Expo dev server (pick target below)
npm run web      # Web in the browser
npm run android  # Android emulator
npm run ios      # iOS simulator (Mac only)
```

You can also scan the QR code with [Expo Go](https://expo.dev/go) to run on a physical device.

## Scripts

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `npm run dev`      | Start the Expo dev server       |
| `npm run web`      | Start dev server for Web        |
| `npm run android`  | Start dev server for Android    |
| `npm run ios`      | Start dev server for iOS        |
| `npm run ts:check` | Type-check (`tsc --noEmit`)     |
| `npm run lint`     | Run ESLint                      |
| `npm run clean`    | Remove `.expo` and `node_modules` |

## Project Structure

```text
app/                  # Expo Router routes
├── _layout.tsx       # Root layout (database, settings, theme providers)
├── (tabs)/           # Home, Transactions, Analytics, Settings
├── transaction/      # Add / edit / detail screens
└── categories/       # Category list, create, edit screens
components/           # Reusable UI (charts, rows, dialogs, ui/ primitives)
hooks/                # Data hooks (transactions, analytics, backup, settings, …)
lib/
├── db/               # SQLite repositories (transactions, categories, backup, …)
└── dates.ts, format.ts, …
docs/prd.md           # Product Requirements Document
```

## Verification

After significant changes:

```bash
npm run ts:check
npm run lint
npx expo-doctor
```

After changing dependencies or native config, also run `npx expo install --check` and clear Metro cache (`npx expo start --clear`) before testing.

## Releases

Android releases are automated: pushing a tag like `v1.1.5` runs [.github/workflows/android-release.yml](./.github/workflows/android-release.yml), which type-checks, lints, builds a release APK with EAS, and publishes a [GitHub Release](https://github.com/smrn001/kharcha/releases) with a changelog generated from commit messages. The Android app checks these releases for in-app updates.

## Documentation

- [Product Requirements Document](./docs/prd.md)
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)

## Deploy

- **Android**: automated via EAS (see Releases above); `release-apk` profile in `eas.json`
- **Web**: static export, served with SPA rewrites (`vercel.json`)
