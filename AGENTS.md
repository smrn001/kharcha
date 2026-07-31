# Kharcha — Project Guide for AI Agents

## Project

Kharcha is an offline-first personal expense tracker.

Read `docs/prd.md` before implementing major features.

## Tech Stack

- **Framework**: Expo SDK 57 + React Native 0.86 + React 19
- **Routing**: Expo Router (file-based, `app/` directory)
- **Styling**: NativeWind v4 (Tailwind CSS v3, `className` prop)
- **UI Library**: React Native Reusables (shadcn-style components in `components/ui/`)
- **Icons**: Lucide React Native
- **Database**: Expo SQLite
- **Animations**: React Native Reanimated v4
- **TypeScript**: 7.0 (native Go port); `npx tsc` = TS 7, `npx tsc6` = TS 6 for eslint compatibility
- **Linting**: ESLint 9 with `eslint-config-expo`
- **Path aliases**: `@/` → project root (configured in `tsconfig.json`)

## Documentation

IMPORTANT: Never guess APIs, installation instructions, or configuration for third-party libraries. Use **Context7** (via MCP) to retrieve current documentation when working with:

- Expo / Expo Router
- React Native
- NativeWind
- React Native Reusables
- Reanimated
- Expo SQLite
- Lucide React Native

Check the installed package version before implementing version-sensitive configuration. Prefer official documentation.

## Dependencies

Before installing a package:

1. Determine whether React Native or Expo already provides it.
2. Check current documentation (Context7).
3. Check Expo SDK compatibility.
4. Explain why the dependency is necessary.
5. Install the minimum required package.

Do not install packages speculatively.

For Expo/native packages prefer `npx expo install <package>` over `npm install <package>` when Expo version compatibility matters.

After changing dependencies run:

```bash
npx expo-doctor
npx expo install --check
```

Do not ignore Expo compatibility warnings.

## Key Conventions

### Expo Router
- Routes live in `app/` (e.g., `app/index.tsx` = `/`, `app/settings.tsx` = `/settings`)
- Root layout: `app/_layout.tsx` — wraps all screens
- Use `<Stack />` for navigation, `<Tabs />` for tab bars
- `headerShown: false` in screen options to hide default header

### Styling with NativeWind
- Use `className` prop instead of `StyleSheet`
- Import `global.css` in root layout
- CSS variables are defined in `global.css` as HSL values
- Access theme colors via CSS variable utility classes: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`
- Use `cn()` from `@/lib/utils` for conditional class merging
- NativeWind transforms `className` via JSX runtime — all components get automatic style processing
- Use `cssInterop` and `remapProps` from `nativewind` for third-party components that need custom className props
- Dark mode: use `useColorScheme()` from `nativewind`; requires `darkMode: "class"` in tailwind.config.js
- Platform modifiers: `ios:`, `android:`, `web:`, `native:`
- Flex defaults differ from web: RN default `flexDirection` is `column`, not `row` — always be explicit
- Avoid conditional-only styles (e.g. `dark:text-white` without `text-black`) — RN has issues with conditional style application
- Use `vars()` from `nativewind` to set CSS variables at runtime: `style={vars({ "--brand-color": "red" })}`
- Colors: use `platformColor()` from `nativewind/theme` for native system colors in `tailwind.config.js`
- Units: `vw`/`vh` polyfilled from `Dimensions.get('window')`; `rem` defaults to 14 on native, 16 on web

### React Native Reusables
- Components live in `components/ui/` — add new ones with `npx rnr add <component-name>`
- Uses `@rn-primitives` under the hood (accessible UI primitives)
- PortalHost must be rendered in root layout (already done in `app/_layout.tsx`)
- Usage: `import { Button } from "@/components/ui/button"`
- All components support the `className` prop via NativeWind

### Expo SQLite
```tsx
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

// Wrap app in provider (add to layout)
<SQLiteProvider databaseName="kharcha.db">
  <Stack />
</SQLiteProvider>

// Use in components
const db = useSQLiteContext();
const rows = await db.getAllAsync("SELECT * FROM ...");
```

### Database architecture
Follow the layer separation: Screen → Hook → Repository → SQLite.
Never put raw SQL directly inside screen components.

### Icons
```tsx
import { Camera, Home, Plus, Wallet } from "lucide-react-native";
// size, color, strokeWidth props supported
```

### Animations (Reanimated)
```tsx
import Animated, { FadeIn } from "react-native-reanimated";
<Animated.View entering={FadeIn}>...</Animated.View>
```

## Verification

Do not claim something works without verification. After significant changes run:

```bash
npm run ts:check
npm run lint
npx expo-doctor
```

When debugging runtime problems, inspect Metro output and fix the root cause instead of suppressing the error. After changing dependency versions or native config, clear the Metro cache (`npx expo start --clear`) before testing.

## Running the App
- `npm start` — start Expo dev server
- `npm run ts:check` — run TypeScript 7 type-checking
- `npm run lint` — run ESLint

## Do NOT
- Use `StyleSheet.create` — use NativeWind `className` instead
- Import from `react-native` for styling — use `@/lib/utils` `cn()` helper
- Add dependencies without reading their official Expo SDK 57 compatible docs first
- Use React Navigation directly — use Expo Router
- Call `verifyInstallation()` from `nativewind` globally — must be inside a component
- Mix `dp` and `px` units in `calc()` — use consistent unit types
- Use web-only APIs (`div`, `span`, `localStorage`, `document`, etc.) — this is a native app
- Use `any` to silence TypeScript errors — prefer explicit domain types
