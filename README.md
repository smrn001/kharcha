# Kharcha

**Kharcha** is a simple, fast, privacy-focused personal expense and income tracker.

> Open the app → record the expense → continue with your day.

Fully **offline-first**: all financial data lives in SQLite on your device. No account, no internet, no cloud, no backend.

## Features

- **Quick transaction entry** — expense/income, amount, category, optional title & note, custom date & time, in a few taps
- **Categories** — sensible defaults plus full management: create, rename, pick an icon, safe delete (blocked while in use)
- **Analytics** — summary cards, spending trend, spending by category, and income vs. expense comparison, with previous-period deltas
- **Transactions** — date-grouped history with search and type / date / category / account / amount filters
- **Backup & restore** — offline JSON backup and CSV export via the share sheet; merge-only import that never touches existing data
- **Settings** — currency, language (English / Nepali), calendar (AD / BS), numerals, System / Light / Dark appearance, default transaction type, start-of-week
- **Nepali calendar** — Bikram Sambat dates alongside Gregorian, with localized numerals
- **Cross-platform** — iOS and Android, with native UI on both

## Tech Stack

- **Framework**: Expo SDK 57 + React Native 0.86 + React 19
- **Routing**: Expo Router (file-based, `app/`)
- **UI**: [`@expo/ui`](https://docs.expo.dev/versions/latest/sdk/ui/) — SwiftUI on iOS, Jetpack Compose on Android
- **Icons**: `@expo/material-symbols` (Android) / SF Symbols (iOS)
- **Database**: Expo SQLite (local, offline)
- **Charts**: `react-native-svg`
- **Calendars**: `nepali-date-converter` for Bikram Sambat
- **Animations**: React Native Reanimated 4
- **Language**: TypeScript 6 (strict, no `any`)

Architecture follows **Screen → Hook → Repository → SQLite** — no raw SQL in UI components. See [AGENTS.md](./AGENTS.md) for contributor conventions and [docs/prd-v2.md](./docs/prd-v2.md) for the product spec.

## Getting Started

Requires [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io) (the pnpm version is pinned in `package.json`).

```bash
pnpm install
pnpm run dev      # Expo dev server — scan the QR with Expo Go
pnpm run android  # Android emulator / device
pnpm run ios      # iOS simulator (Mac only)
```

Scan the QR code with [Expo Go](https://expo.dev/go) to run on a physical device. If the phone can't reach your computer, use `npx expo start --tunnel -c`.

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm run dev`     | Start the Expo dev server          |
| `pnpm run android` | Start dev server for Android       |
| `pnpm run ios`     | Start dev server for iOS           |
| `pnpm run ts:check`| Type-check (`tsc --noEmit`)        |
| `pnpm run lint`    | Run ESLint                         |
| `pnpm test`        | Run the Vitest suite               |
| `pnpm run clean`   | Remove `.expo` and `node_modules`  |

## Project Structure

```text
app/                  # Expo Router routes (thin shells)
├── _layout.tsx       # Root layout (database, settings, theme providers)
├── (tabs)/           # Home, Transactions, Analytics, Settings
├── transaction/      # Add / edit / detail routes
└── categories/       # Category list, create, edit routes
screens/              # Screen bodies + colocated components
components/           # Reusable UI (rows, sheets, fields, charts)
hooks/                # Data/state hooks (transactions, analytics, backup, settings, …)
lib/
├── db/               # SQLite repositories (transactions, categories, backup, …)
├── i18n/             # en + ne dictionaries
└── analytics.ts, dates.ts, format.ts, theme.ts, …
docs/prd-v2.md        # Product Requirements Document
```

## Verification

After significant changes:

```bash
pnpm run ts:check
pnpm run lint
pnpm test
npx expo-doctor
```

After changing dependencies or native config, also run `npx expo install --check` and clear the Metro cache (`pnpm run dev` already passes `-c`) before testing.

## Releases

Android releases are automated: pushing a tag like `v2.0.0` runs [.github/workflows/android-release.yml](./.github/workflows/android-release.yml), which type-checks, lints, builds a release APK with EAS, and publishes a [GitHub Release](https://github.com/smrn001/kharcha/releases) with a changelog generated from commit messages. The Android app checks these releases for in-app updates.

### Upgrading across the v1 → v2 UI rewrite

`v1.1.5` is the last NativeWind build; `v2.0.0` is the `@expo/ui` rewrite. The app
database and schema are unchanged, so an in-place update (install over the top,
**do not uninstall first**) migrates your data automatically and keeps it.

## Documentation

- [Product Requirements Document](./docs/prd-v2.md)
- [Expo Docs](https://docs.expo.dev/)
- [`@expo/ui`](https://docs.expo.dev/versions/latest/sdk/ui/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

## Deploy

- **Android**: automated via EAS on tag push (see Releases above); `release-apk` profile in `eas.json`
