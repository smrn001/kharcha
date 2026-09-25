# Kharcha — Project Guide for AI Agents

## Project

Kharcha is an offline-first personal expense tracker. The entire UI was rewritten
on Expo SDK 57 using **`@expo/ui`** (SwiftUI on iOS, Jetpack Compose on Android).
The previous NativeWind implementation is history — see the `v1.1.5` tag.

Read `docs/prd-v2.md` before implementing major features.

## Tech Stack

- **Framework**: Expo SDK 57 + React Native 0.86 + React 19
- **Routing**: Expo Router (file-based, `app/` directory)
- **UI**: `@expo/ui` (universal components: SwiftUI / Compose) + `react-native-svg`
- **Icons**: `@expo/material-symbols` (Android XML) / SF Symbols (iOS), resolved via `Icon.select`
- **Database**: Expo SQLite (`kharcha.db`, local, offline)
- **Calendars**: `nepali-date-converter` for Bikram Sambat
- **Animations**: React Native Reanimated 4
- **Package manager**: pnpm (pinned via `packageManager` in package.json)
- **TypeScript**: 6.0 (`npx tsc --noEmit`)
- **Linting**: ESLint 9 + `eslint-config-expo`
- **Tests**: Vitest
- **Path aliases**: `@/` → project root (configured in `tsconfig.json`; no `baseUrl`)

There is **no NativeWind, no Tailwind, no `global.css`, no `className` prop, and no
`StyleSheet`-free styling**. Inline `style={{ ... }}` objects are the norm.

## Documentation

IMPORTANT: Never guess APIs, installation instructions, or configuration for third-party libraries. Use **Context7** (via MCP) to retrieve current documentation when working with:

- Expo / Expo Router
- React Native
- `@expo/ui` (universal + jetpack-compose entry points)
- Reanimated
- Expo SQLite

Check the installed package version before implementing version-sensitive configuration. Prefer official documentation.

## Dependencies

Before installing a package:

1. Determine whether React Native or Expo already provides it.
2. Check current documentation (Context7).
3. Check Expo SDK compatibility.
4. Explain why the dependency is necessary.
5. Install the minimum required package.

Do not install packages speculatively.

For Expo/native packages prefer `npx expo install <package>` over `pnpm add <package>` when Expo version compatibility matters.

After changing dependencies run:

```bash
npx expo-doctor
npx expo install --check
```

Do not ignore Expo compatibility warnings.

### pnpm gotchas (this repo already hit them)

- **No hoisting.** A package you `import` must be a *direct* dependency, even if
  some other package depends on it transitively. Otherwise it will not resolve.
- **Config plugins** must import from `expo/config-plugins`, not
  `@expo/config-plugins` (the latter must not be installed directly).
- `pnpm add -g <tool>` needs its global bin dir on `PATH` (see
  `.github/workflows/android-release.yml` for the working recipe).

## Key Conventions

### The Compose composition boundary (Android) — read this first

`@expo/ui` components render as **native** views. On Android they are Compose
composables that must be a descendant of a `Host`:

- **Every** universal view in plain React Native layout needs a `Host`. Use
  `NativeBlock` (`components/native-block.android.tsx`) — it is a `View` on iOS
  and a `Host` on Android, so write `<NativeBlock>` once and it works on both.
- A `Host` holds **exactly one** child.
- Never insert an RN `View` between a `Host` and a Compose view — it breaks the
  composition and throws *"must be rendered as a direct child of a `<Host>`"*.
- Pass `colorScheme={useColorScheme() ?? undefined}` to every `Host` so the
  Material 3 palette (including Android 12+ dynamic wallpaper colors) matches
  the React Native side. `NativeBlock` does this for you.

### `FieldGroup` (settings-style grouped lists)

`FieldGroup` renders a Compose `LazyColumn` on Android and a SwiftUI `Form` on
iOS. Consequences:

- It **is** a scroller. Never nest it inside an RN `ScrollView`, and never put
  an RN `ScrollView` inside it.
- Every **direct** child of a `FieldGroup.Section` becomes one Material
  `ListItem` row. The slot extractor recurses into **fragments and arrays only** —
  a custom component that returns *several* rows collapses into a single row and
  only its first line is visible. Inline the rows, map over an array, or use
  single-row components.
- Row content must be pure universal components (no `NativeBlock`/`Host` inside a
  section — the section is already inside a `Host`). Use
  `TransactionFieldRow` as the reference implementation.
- To get a flat list *without* card tinting, use `ConnectedRow` from
  `components/recent-transactions.tsx`.

### Theme & Colors

- Semantic tokens live in `lib/theme.ts`; consume them via `useTheme()`
  (`background`, `surface`, `surfaceContainer`, `outline`, `secondaryContainer`,
  `onSecondaryContainer`, `text`, `textSecondary`, `border`, `primary`,
  `destructive`, `success`, `warning`). Never hardcode a raw color.
- Platform differences stay inside `useTheme()`: Apple system-semantic values on
  iOS; on Android the tokens are derived from `getMaterialColors()`, so the RN
  canvas uses the same Material 3 palette as the Compose components.
  `getMaterialColors` does not subscribe to system changes; `app/_layout.tsx`
  forces a re-render on foreground to resync.
- `@expo/ui` color props (`textStyle.color`, `Icon color`, `backgroundColor`)
  take plain `string` colors — opaque `DynamicColorIOS` values are NOT supported.
- `spacing`, `radii`, and `fontSizes` constants are exported from `lib/theme.ts`;
  prefer them over arbitrary numbers.

### Project structure

- `app/` — Expo Router routes. Screens with real logic live in `screens/`, and
  the route file is a thin shell that re-exports (or reads params and renders).
- `screens/<name>/index.tsx` + colocated `screens/<name>/components/`
- `components/` — reusable UI shared across screens
- `hooks/` — data/state hooks (`useTransactions`, `useAnalytics`, …)
- `lib/` — pure logic and the SQLite layer (`lib/db/`); `lib/__tests__/`, `lib/db/__tests__/`
- `types/` — shared domain types

### Database architecture

Follow the layer separation: **Screen → Hook → Repository → SQLite**.
Never put raw SQL in a screen or hook. `lib/db/transactions.ts` re-exports the
analytics queries that now live in `lib/db/analytics-queries.ts`.

Schema migrations live in `lib/db/migrations.ts`, gated on `PRAGMA user_version`.
Migrations are transactional and totals-checked: if migrated totals do not match
the source, the whole migration rolls back. v1 backups import without rescaling
amounts (v1 already stored minor units).

### Icons

Never inline `Icon.select` per file — import the shared constants from
`lib/icons.ts` (`CHEVRON_ICON`, `CHECK_ICON`, `SEARCH_ICON`, `X_ICON`,
`PLUS_ICON`, `ARROW_RIGHT_ICON`, `RECEIPT_ICON`, `REFRESH_ICON`, `CALENDAR_ICON`,
`TREND_UP_ICON`, `TREND_DOWN_ICON`, `EQUAL_ICON`, `CHEVRON_DOWN_ICON`,
`CHEVRON_UP_ICON`).

```tsx
import { Icon } from '@expo/ui';
<Icon name={CHECK_ICON} size={20} color={colors.primary} />
```

Category icons are looked up with `categoryIcon(name)` from `lib/category-icons.ts`.

### i18n

`lib/i18n/en.ts` defines the `Dictionary` type; `lib/i18n/ne.ts` is typed
against it, so **both files must be updated together** or `tsc` fails. Use
`t(key, params)` and `plural(n)` from `useI18n()`.

## Verification

Do not claim something works without verification. After significant changes run:

```bash
npx tsc --noEmit
pnpm run lint
pnpm test
npx expo-doctor
```

When debugging runtime problems, inspect Metro output and fix the root cause
instead of suppressing the error. After changing dependency versions or native
config, clear the Metro cache (`pnpm run dev` already passes `-c`) before testing.

## Running the App

- `pnpm run dev` — start the Expo dev server (scan the QR with Expo Go)
- `pnpm run android` / `pnpm run ios` — open on a target directly
- `pnpm run ts:check` / `pnpm run lint` / `pnpm test`
- If the phone cannot reach the computer: `npx expo start --tunnel -c`

## Do NOT

- Add a `Host`-less universal view in plain RN layout — wrap it in `NativeBlock`
- Put a custom multi-row component directly inside a `FieldGroup.Section`
- Nest `FieldGroup` inside a `ScrollView`, or a `ScrollView` inside `FieldGroup`
- Import a transitive package without declaring it as a direct dependency
- Use `StyleSheet.create` for new components — inline `style` objects
- Use React Navigation directly — use Expo Router
- Add dependencies without reading their Expo SDK 57 compatible docs first
- Use web-only APIs (`div`, `span`, `localStorage`, `document`) — this is a native app
- Use `any` to silence TypeScript errors — prefer explicit domain types
- Hardcode colors — use `useTheme()` tokens
- Add a new `Icon.select` constant when one already exists in `lib/icons.ts`
