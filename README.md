# Kharcha

**Kharcha** is a simple, fast, privacy-focused personal expense and income tracker.

> Open the app → record the expense → continue with your day.

It is built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/), fully **offline-first** — all financial data is stored locally on your device using SQLite. No account, no internet, no cloud, no backend server.

## Features

- 💰 **Quick transaction entry** — expense/income, amount, category, optional title & note, date & time in a few taps
- 🗂️ **Categories** — sensible defaults plus full management: create, rename, choose an icon, and safely delete (blocked while a category is still in use)
- 📊 **Analytics** — income vs. spending trend charts, period summaries, and spending by category (week / month / year)
- 📋 **Transactions list** — search, type/date/category filters, and date-grouped sections
- ⚙️ **Settings** — currency (NPR, USD, INR, EUR, GBP), System/Light/Dark appearance (persisted), default transaction type, and start-of-week preference
- 🌙 **Themes** — custom Indigo/Periwinkle design system with semantic tokens for light and dark
- 📱 **Cross-platform** — iOS, Android, and Web
- 🧠 **Layer separation** — Screen → Hook → Repository → SQLite, no raw SQL in UI components

## Tech Stack

- **Framework**: Expo SDK 56 + React Native + React
- **Routing**: Expo Router (file-based, `app/` directory)
- **Styling**: NativeWind v4 (Tailwind CSS, `className` prop)
- **UI Library**: React Native Reusables (shadcn-style components in `components/ui/`)
- **Icons**: Lucide React Native
- **Database**: Expo SQLite (offline, local)
- **Animations**: React Native Reanimated
- **Language**: TypeScript
- **Path aliases**: `@/` → project root

## Getting Started

```bash
npm install
npm run dev
```

This starts the Expo Dev Server. Open the app in:

- **iOS**: press `i` to launch in the iOS simulator _(Mac only)_
- **Android**: press `a` to launch in the Android emulator
- **Web**: press `w` to run in a browser

You can also scan the QR code with the [Expo Go](https://expo.dev/go) app to test on a physical device.

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start the Expo dev server          |
| `npm run android`    | Start dev server for Android       |
| `npm run ios`        | Start dev server for iOS           |
| `npm run web`        | Start dev server for Web           |
| `npm run ts:check`   | Type-check with `tsc --noEmit`     |
| `npm run lint`       | Run ESLint                         |
| `npm run clean`      | Remove `.expo` and `node_modules`  |

## Project Structure

```text
app/                  # Expo Router file-based routes
├── _layout.tsx       # Root layout (database, settings, theme providers)
├── (tabs)/           # Home, Transactions, Analytics, Settings
├── transaction/      # Add / edit and transaction detail screens
└── categories/       # Category list, create, and edit screens
components/           # Reusable components (form fields, charts, rows, etc.)
├── ui/               # React Native Reusables primitives (button, text, dialogs)
hooks/                # Data hooks: transactions, categories, analytics, settings
lib/
├── db/               # SQLite layer: schema migrations, repositories
└── dates.ts, format.ts, theme.ts, category-icons.ts
docs/prd.md           # Product Requirements Document
```

## Verification

After significant changes run:

```bash
npm run ts:check
npm run lint
npx expo-doctor
```

When debugging runtime issues, inspect Metro output and fix the root cause. After changing dependency versions or native config, clear the Metro cache with `npx expo start --clear`.

## Documentation

- [Product Requirements Document](./docs/prd.md)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)

## Deploy with EAS

The easiest way to deploy the app is with [Expo Application Services (EAS)](https://expo.dev/eas).

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Updates](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

The Web build is also deployable as a static site (configured for Vercel SPA rewrites via `vercel.json`).
