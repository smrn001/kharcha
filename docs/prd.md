# Kharcha — Product Requirements Document

**Product Name:** Kharcha
**Product Type:** Personal Finance / Expense Tracker
**Platform:** Android & iOS
**Framework:** React Native + Expo
**Document Version:** 1.0
**Status:** Initial Development
**Architecture:** Offline-first

---

## 1. Product Overview

**Kharcha** is a simple, fast, privacy-focused personal expense and income tracking application.

The application allows users to record everyday financial transactions, organize them into categories, understand where their money is going, and view useful spending analytics.

The initial version of Kharcha will be completely **offline-first**. Financial information will be stored locally on the user's device using SQLite.

The application should work without requiring:

* An account
* Internet access
* Cloud storage
* A backend server

Future versions may introduce optional authentication, encrypted cloud synchronization, multi-device synchronization, budgets, recurring transactions, and other financial management features.

The core philosophy of Kharcha is:

> **Open the app → record the expense → continue with your day.**

Recording an expense should take only a few seconds.

---

# 2. Problem Statement

People make many small transactions throughout the day but often do not know where their money is actually going.

Traditional finance applications frequently suffer from several problems:

* Too many features
* Complicated onboarding
* Mandatory accounts
* Dependence on internet connectivity
* Too many steps to record an expense
* Interfaces designed like accounting software
* Poor usability for quick everyday transactions
* Privacy concerns around financial data

Kharcha aims to solve this by providing a lightweight personal finance tracker focused on **speed, simplicity, privacy, and offline availability**.

---

# 3. Product Vision

Kharcha should become a personal financial companion that makes understanding everyday spending effortless.

The application should eventually answer questions such as:

* How much money do I currently have?
* How much did I spend today?
* How much did I spend this week?
* How much did I spend this month?
* Where is most of my money going?
* Which category consumes the most money?
* How much income did I receive?
* Am I spending more than last month?
* What transactions did I make recently?

The application should provide these answers without requiring users to understand accounting terminology.

---

# 4. Product Principles

Every feature should follow several core principles.

## 4.1 Fast

Recording an expense should require minimal interaction.

The user should ideally be able to create a transaction within **5–10 seconds**.

---

## 4.2 Offline First

All essential functionality must work without internet connectivity.

Users must be able to:

* Add transactions
* Edit transactions
* Delete transactions
* Browse transactions
* Search transactions
* View analytics
* Change settings

without internet access.

---

## 4.3 Privacy First

Financial information belongs to the user.

Version 1 stores all financial information locally.

No financial information should leave the device.

---

## 4.4 Simple

Avoid unnecessary financial terminology.

Prefer:

* Income
* Expense
* Balance

instead of accounting terminology.

---

## 4.5 Lightweight

Avoid unnecessary dependencies and large libraries.

Use React Native or Expo functionality whenever possible before introducing third-party packages.

---

## 4.6 Mobile First

The interface must feel like a mobile application rather than a web dashboard placed inside a mobile screen.

Interactions should use:

* Bottom navigation
* Sheets
* Modals
* Swipe gestures where appropriate
* Haptic feedback
* Native keyboard behavior
* Touch-friendly controls

---

# 5. Target Users

Kharcha is designed primarily for individuals who want simple personal expense tracking.

Potential users include:

* Students
* Freelancers
* Employees
* Young professionals
* Small business owners tracking personal expenses
* Anyone wanting basic financial awareness

The application does not attempt to replace professional accounting software.

---

# 6. Primary User Journey

The most important user journey is recording an expense.

```text
Open Kharcha
      ↓
Home Screen
      ↓
Tap "+"
      ↓
Enter Amount
      ↓
Select Category
      ↓
Optional Description
      ↓
Save
      ↓
Transaction Stored Locally
      ↓
Balance + Analytics Update
```

The entire interaction should require as few taps as possible.

---

# 7. Technology Stack

## Core

* React Native
* Expo
* TypeScript

## Navigation

* Expo Router

## Styling

* NativeWind

## Component System

* React Native Reusables

## Icons

* Lucide React Native

## Animation

* React Native Reanimated

## Local Database

* Expo SQLite

## Future Native Features

Potential Expo modules:

* Expo Local Authentication
* Expo Notifications
* Expo Camera
* Expo Image Picker
* Expo Haptics
* Expo File System
* Expo Sharing
* Expo Secure Store

Dependencies should only be introduced when their functionality is required.

---

# 8. Application Architecture

Suggested project architecture:

```text
kharcha/
│
├── app/
│   ├── _layout.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── transactions.tsx
│   │   ├── analytics.tsx
│   │   └── settings.tsx
│   │
│   ├── transaction/
│   │   ├── add.tsx
│   │   └── [id].tsx
│   │
│   └── category/
│       └── index.tsx
│
├── components/
│   ├── ui/
│   ├── common/
│   ├── transaction/
│   ├── analytics/
│   └── settings/
│
├── constants/
│
├── hooks/
│
├── lib/
│   ├── db/
│   │   ├── database.ts
│   │   ├── migrations.ts
│   │   ├── transactions.ts
│   │   └── categories.ts
│   │
│   ├── currency.ts
│   ├── dates.ts
│   └── utils.ts
│
├── types/
│   ├── transaction.ts
│   ├── category.ts
│   └── settings.ts
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── PRD.md
├── package.json
└── tsconfig.json
```

The exact architecture may evolve as development progresses.

---

# 9. Navigation

The primary navigation should use a bottom tab bar.

Tabs:

```text
Home
Transactions
Analytics
Settings
```

The Add Transaction flow should not require its own permanent tab.

Instead, users should access it through a prominent `+` action.

---

# 10. Home Screen

The Home screen provides an immediate overview of the user's financial situation.

## Header

Display:

* Greeting
* Current date or relevant period
* Optional profile/settings shortcut

Example:

```text
Good morning

Here's your spending overview.
```

Avoid unnecessarily large headers.

---

## Balance Card

Display:

```text
Current Balance

Rs. 42,850

Income      Expenses
Rs. 58,000  Rs. 15,150
```

Balance calculation:

```text
Balance = Total Income - Total Expenses
```

---

## Spending Summary

Provide quick information such as:

```text
Spent Today
Rs. 850

This Week
Rs. 4,320

This Month
Rs. 15,150
```

---

## Recent Transactions

Display approximately the latest five transactions.

Each transaction should display:

* Category icon
* Title
* Category
* Date/time
* Amount
* Income/expense indication

Example:

```text
🍔  Lunch
    Food • Today

                - Rs. 250
```

Income:

```text
💼  Freelance Payment
    Income • Today

              + Rs. 15,000
```

Users should be able to tap:

**View All**

to navigate to Transactions.

---

## Add Transaction Button

The Home screen must provide an obvious way to add a transaction.

Possible implementation:

```text
       +
```

or:

```text
+ Add Transaction
```

This action should always be easily accessible.

---

# 11. Add Transaction

This is one of the most important screens in the application.

The interaction must be extremely fast.

---

## Transaction Type

Allow selection between:

```text
Expense
Income
```

Expense should be selected by default.

---

## Amount

The amount field should be the primary focus.

Example:

```text
Rs.

1,250
```

The numeric keyboard should automatically open when appropriate.

Validation:

* Amount required
* Amount > 0
* Numeric values only
* Reasonable decimal handling

---

## Category

Users must select a category.

Categories should appear as touch-friendly options.

Example:

```text
Food
Transport
Shopping
Bills
Entertainment
Health
Education
Other
```

---

# 12. Default Categories

Kharcha should provide sensible default categories.

## Expense Categories

```text
Food
Transport
Shopping
Bills
Entertainment
Health
Education
Travel
Groceries
Rent
Subscriptions
Personal
Family
Other
```

## Income Categories

```text
Salary
Freelance
Business
Investment
Gift
Refund
Other
```

Each category should have:

* ID
* Name
* Icon
* Transaction type

---

# 13. Transaction Details

Optional transaction fields:

### Title

Example:

```text
Lunch
```

### Note

Example:

```text
Lunch with friends
```

### Date

Default:

```text
Current date
```

Users should be able to select another date.

### Time

Default:

```text
Current time
```

---

# 14. Save Transaction

When the user saves:

1. Validate input.
2. Insert transaction into SQLite.
3. Update calculated totals.
4. Trigger subtle haptic feedback.
5. Close the transaction screen.
6. Return to the previous screen.
7. Reflect the transaction immediately.

The user should not need to manually refresh anything.

---

# 15. Transactions Screen

The Transactions screen displays transaction history.

---

## Transaction List

Transactions should be grouped by date.

Example:

```text
Today

Food                     - Rs. 250
Transport                 - Rs. 100
Freelance              + Rs. 5,000


Yesterday

Shopping                - Rs. 1,200
Coffee                     - Rs. 180
```

Use `FlatList` or another appropriate performant list implementation.

Do not render potentially large transaction histories using a simple `ScrollView` with `.map()`.

---

# 16. Search

Users should be able to search transactions.

Searchable fields:

* Title
* Note
* Category

Search should update results quickly.

---

# 17. Transaction Filters

Provide filters for:

### Type

```text
All
Income
Expense
```

### Date

```text
Today
This Week
This Month
Custom
```

### Category

Allow one or multiple categories.

### Amount

Future enhancement:

```text
Minimum
Maximum
```

---

# 18. Transaction Details Screen

Selecting a transaction should open its details.

Display:

* Amount
* Type
* Category
* Title
* Note
* Date
* Time

Actions:

```text
Edit
Delete
```

---

# 19. Edit Transaction

Users must be able to modify existing transactions.

Editable fields:

* Type
* Amount
* Category
* Title
* Note
* Date
* Time

Changes should immediately affect:

* Balance
* Analytics
* Transaction history

---

# 20. Delete Transaction

Users must be able to delete transactions.

A confirmation should prevent accidental deletion.

Example:

```text
Delete transaction?

This action cannot be undone.

Cancel       Delete
```

---

# 21. Analytics

Analytics should help users understand spending without overwhelming them.

Primary period selector:

```text
Week
Month
Year
```

Default:

```text
Month
```

---

# 22. Monthly Overview

Display:

```text
July 2026

Income
Rs. 58,000

Expenses
Rs. 15,150

Saved
Rs. 42,850
```

---

# 23. Spending by Category

Display how much was spent in each category.

Example:

```text
Food              Rs. 5,200
Transport         Rs. 2,400
Shopping          Rs. 3,100
Bills             Rs. 2,000
Entertainment     Rs. 1,450
Other             Rs. 1,000
```

Include percentage contribution where useful.

---

# 24. Spending Trends

Display spending over time.

Possible visualization:

```text
Amount
  │
  │       ╭─╮
  │   ╭───╯ ╰╮
  │ ╭─╯       ╰─╮
  │─╯            ╰─
  └────────────────
       Days
```

Do not install a large charting library during initial development unless necessary.

A lightweight custom visualization can be considered.

---

# 25. Income vs Expense

Provide a simple comparison:

```text
Income

Rs. 58,000

Expenses

Rs. 15,150
```

The visualization should remain understandable without relying entirely on color.

---

# 26. Comparison

Future analytics can show:

```text
You spent 12% less than last month.
```

or:

```text
Food spending increased by Rs. 1,200.
```

These insights should be generated locally.

---

# 27. Settings

The Settings screen should contain grouped configuration options.

---

## General

```text
Currency
Language
Appearance
```

---

## Preferences

```text
Notifications
Default Transaction Type
Start of Week
```

---

## Security

```text
App Lock
Biometric Unlock
```

---

## Data

```text
Export Data
Import Data
Backup
Reset Data
```

---

## About

```text
About Kharcha
Privacy
Version
Open Source Licenses
```

---

# 28. Currency

The architecture should support multiple currencies.

Initial currencies may include:

```text
NPR — Nepalese Rupee
USD — US Dollar
INR — Indian Rupee
EUR — Euro
GBP — British Pound
```

Default currency may be selected during initial setup or derived from device locale when appropriate.

Currency formatting should be centralized.

Do not manually concatenate currency symbols throughout components.

Example utility:

```text
formatCurrency(1250)

→ Rs. 1,250
```

---

# 29. Appearance

Support:

```text
System
Light
Dark
```

Default:

```text
System
```

The application should automatically respond to system appearance when System is selected.

---

# 30. Database

Use Expo SQLite.

Financial information should remain available after:

* App restart
* Device restart
* Offline periods

---

# 31. Transactions Table

Suggested schema:

```sql
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id TEXT NOT NULL,
    title TEXT,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

Transaction type:

```text
income
expense
```

Money storage should eventually use an integer minor-unit representation where practical rather than relying on floating-point arithmetic for financial calculations.

For example:

```text
Rs. 125.50

→ 12550 minor units
```

The final database implementation should choose and consistently enforce one money representation.

---

# 32. Categories Table

Suggested schema:

```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

---

# 33. Settings Table

Suggested structure:

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

Example:

```text
currency → NPR
theme → system
notifications → true
```

---

# 34. Database Migrations

Database initialization must support migrations.

Suggested structure:

```text
lib/db/

database.ts
migrations.ts
transactions.ts
categories.ts
settings.ts
```

Do not scatter SQL queries throughout UI components.

UI:

```text
Component
    ↓
Repository / DB function
    ↓
SQLite
```

---

# 35. TypeScript Models

Example transaction model:

```ts
type TransactionType = "income" | "expense";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  title?: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}
```

Category:

```ts
interface Category {
  id: string;
  name: string;
  icon?: string;
  type: TransactionType;
  createdAt: string;
}
```

Avoid `any`.

---

# 36. Empty States

Every major screen should have a useful empty state.

Transactions example:

```text
No transactions yet

Start tracking your spending by
adding your first transaction.

[ Add Transaction ]
```

Analytics:

```text
Not enough data yet

Add some transactions and your
spending insights will appear here.
```

Empty states should encourage the next useful action.

---

# 37. Error Handling

Errors should be understandable.

Avoid:

```text
SQLITE_ERROR
```

Prefer:

```text
Couldn't save this transaction.
Please try again.
```

Errors should be logged internally during development.

---

# 38. Loading States

Because most data is local, loading states should generally be extremely short.

Avoid unnecessary full-screen loading indicators.

Prefer:

* Skeletons when useful
* Optimistic UI
* Immediate local updates

---

# 39. Accessibility

Kharcha should support basic accessibility requirements.

Requirements:

* Touch targets should be sufficiently large.
* Icons requiring interaction need accessibility labels.
* Text should remain readable with larger system font settings.
* Important information must not rely exclusively on color.
* Inputs must have understandable labels.
* Screen reader navigation should remain logical.

---

# 40. Performance Requirements

Kharcha should feel responsive even on lower-end devices.

Goals:

* Fast cold start
* Smooth navigation
* Smooth transaction scrolling
* Minimal unnecessary re-renders
* Small dependency footprint
* Low memory consumption

Use:

```text
FlatList
memoization where justified
optimized database queries
lazy loading where appropriate
proper image sizing
```

Avoid premature optimization where no measurable issue exists.

---

# 41. Security

Version 1 stores information locally.

Sensitive settings or cryptographic material introduced later should use appropriate secure storage rather than AsyncStorage.

Future security features may include:

* Biometric authentication
* PIN lock
* Encrypted backups
* Encrypted cloud synchronization

---

# 42. Biometric Lock

Future versions should support:

```text
Face ID
Fingerprint
Device authentication
```

Potential implementation:

```text
expo-local-authentication
```

Expected flow:

```text
Open Kharcha
      ↓
Authentication Required
      ↓
Face ID / Fingerprint
      ↓
Home
```

---

# 43. Notifications

Future notification support may include:

```text
Daily expense reminder
Weekly spending summary
Monthly summary
Budget alerts
```

Example:

```text
Don't forget today's expenses.

You spent Rs. 1,250 today.
```

Notifications should be optional.

---

# 44. Haptic Feedback

Use subtle haptic feedback for important interactions.

Examples:

* Transaction saved
* Transaction deleted
* Important toggle changed
* Successful biometric authentication

Avoid haptics for every tap.

---

# 45. Receipt Photos

Future versions may allow users to attach receipt images.

Flow:

```text
Transaction
    ↓
Attach Receipt
    ↓
Camera / Gallery
    ↓
Store locally
```

Receipt images should not automatically upload anywhere.

---

# 46. Export

Users should eventually be able to export their information.

Supported initial export target:

```text
CSV
```

Possible future formats:

```text
JSON
PDF
```

CSV example:

```csv
date,type,category,title,amount
2026-07-30,expense,Food,Lunch,250
2026-07-30,income,Freelance,Website Project,15000
```

---

# 47. Import

Future versions may allow restoring exported data.

Import must validate:

* File structure
* Transaction types
* Amounts
* Dates
* Categories

Invalid information should not corrupt the local database.

---

# 48. Backup

Potential future backup options:

```text
Local file
Google Drive
iCloud
Kharcha Cloud
```

Cloud backup should remain optional.

---

# 49. Authentication

Version 1:

```text
NO ACCOUNT REQUIRED
```

Future versions may support optional accounts for synchronization.

Potential methods:

```text
Email
Google
Apple
```

Users who do not want an account should still be able to use the local application.

---

# 50. Cloud Synchronization

Future architecture:

```text
Mobile App
    │
    ├── SQLite
    │
    └── Sync Engine
            │
            ▼
          API
            │
            ▼
        PostgreSQL
```

SQLite remains the immediate local source for application interaction.

Cloud synchronization should operate in the background when available.

---

# 51. Conflict Resolution

Future multi-device synchronization must handle cases where the same transaction changes on multiple devices.

Possible strategy:

```text
updated_at
+
version
+
conflict resolution
```

This does not need implementation in V1.

---

# 52. Budgeting

Future versions may allow monthly budgets.

Example:

```text
Monthly Budget

Rs. 30,000

Spent
Rs. 18,500

Remaining
Rs. 11,500
```

Category budgets:

```text
Food
Rs. 6,000 / Rs. 8,000

Transport
Rs. 2,500 / Rs. 4,000
```

---

# 53. Recurring Transactions

Future versions should support recurring transactions.

Examples:

```text
Rent
Netflix
Internet
Salary
Insurance
Subscriptions
```

Possible frequencies:

```text
Daily
Weekly
Monthly
Yearly
Custom
```

---

# 54. Custom Categories

Users should eventually be able to:

* Create categories
* Rename categories
* Select icons
* Reorder categories
* Archive categories

Deleting a category used by existing transactions must be handled safely.

---

# 55. Onboarding

Keep onboarding extremely short.

Possible first-launch flow:

```text
Welcome to Kharcha

Track your money.
Understand your spending.
Your data stays on your device.

[ Get Started ]
```

Then:

```text
Choose Currency

NPR
USD
INR
EUR
GBP
```

Then:

```text
You're ready.

[ Start Tracking ]
```

No account creation should interrupt onboarding.

---

# 56. Design System

Use React Native Reusables as the component foundation.

Common components may include:

```text
Button
Text
Input
Card
Dialog
Sheet
Tabs
Select
Checkbox
Switch
Separator
Avatar
Badge
```

Components should remain editable within the project.

---

# 57. Visual Direction

Kharcha should feel:

* Minimal
* Calm
* Modern
* Fast
* Trustworthy
* Native
* Focused

Avoid turning the application into a highly decorated fintech dashboard.

---

# 58. Spacing

Use a consistent spacing system.

Example:

```text
4
8
12
16
20
24
32
40
48
```

Screen horizontal padding should generally remain consistent.

---

# 59. Corners

Use moderately rounded corners.

Cards, buttons and inputs should feel modern without becoming excessively pill-shaped.

---

# 60. Typography

Typography hierarchy should clearly distinguish:

```text
Screen Title
Section Title
Primary Amount
Body
Secondary Text
Caption
```

Financial amounts should receive strong visual hierarchy.

Example:

```text
Current Balance

Rs. 42,850
```

The amount should visually dominate the card.

---

# 61. Icons

Use Lucide React Native.

Maintain consistent:

* Stroke width
* Icon sizing
* Alignment

Avoid mixing multiple icon libraries unless absolutely necessary.

---

# 62. Motion

Use React Native Reanimated where animation meaningfully improves interaction.

Potential animations:

* Modal transitions
* Transaction insertion
* Tab transitions
* Expanding filters
* Number changes
* Chart transitions

Animations should generally remain subtle and quick.

Avoid animations that delay user interaction.

---

# 63. Theme

Support semantic design tokens.

Example:

```text
background
foreground
card
cardForeground
primary
primaryForeground
secondary
muted
mutedForeground
border
destructive
```

Components should use semantic tokens instead of hardcoded theme-specific colors.

---

# 64. State Management

Do not introduce Redux during initial development.

Use:

* Component state
* React Context where appropriate
* Custom hooks
* SQLite as persistent application data

Introduce a dedicated state management solution only when the application demonstrates a genuine need for one.

---

# 65. Data Flow

Preferred flow:

```text
Screen
  ↓
Hook
  ↓
Repository
  ↓
SQLite
```

Example:

```text
HomeScreen
    ↓
useTransactions()
    ↓
transactionRepository
    ↓
SQLite
```

Screens should not contain raw SQL.

---

# 66. Repository Layer

Example responsibilities:

```text
getTransactions()
getTransactionById()
createTransaction()
updateTransaction()
deleteTransaction()

getCategories()
createCategory()

getMonthlySummary()
getCategorySpending()
```

This makes future synchronization easier.

---

# 67. Date Handling

Store timestamps consistently.

Prefer ISO 8601 where appropriate.

Example:

```text
2026-07-30T14:30:00+05:45
```

Display dates using the user's locale.

Examples:

```text
Today
Yesterday
Jul 28
Jul 20, 2026
```

---

# 68. Financial Calculations

Financial calculations must be deterministic.

Avoid unnecessary floating-point arithmetic for stored money.

Preferred long-term approach:

```text
Rs. 1,250.50
```

stored as:

```text
125050
```

in the smallest supported unit.

Formatting converts it back for display.

---

# 69. MVP Scope

The first usable version must include:

* Offline operation
* SQLite database
* Home dashboard
* Add expense
* Add income
* Transaction categories
* Transaction history
* Search
* Filters
* Edit transaction
* Delete transaction
* Basic analytics
* Currency preference
* Light mode
* Dark mode
* System theme
* Basic settings
* Data persistence

---

# 70. Not Included in MVP

Do NOT prioritize these during the first implementation:

* Authentication
* Backend API
* Cloud synchronization
* Social features
* Bank integrations
* AI financial assistant
* Cryptocurrency tracking
* Investment portfolio tracking
* Complex budgeting
* Receipt OCR
* Shared family accounts
* Web dashboard

These can be evaluated after the core experience works reliably.

---

# 71. Development Phases

## Phase 1 — Foundation

Set up:

```text
Expo
TypeScript
Expo Router
NativeWind
React Native Reusables
Lucide
Reanimated
SQLite
```

Create:

* Project structure
* Navigation
* Themes
* Database initialization
* Migration architecture

---

## Phase 2 — Transaction System

Implement:

* Categories
* Add transaction
* Transaction list
* Transaction details
* Edit
* Delete
* Validation

At the end of this phase, Kharcha should already function as a basic expense tracker.

---

## Phase 3 — Dashboard

Implement:

* Current balance
* Income total
* Expense total
* Recent transactions
* Today spending
* Weekly spending
* Monthly spending

---

## Phase 4 — Search & Filters

Implement:

* Search
* Type filter
* Category filter
* Date filter
* Transaction grouping

---

## Phase 5 — Analytics

Implement:

* Monthly summary
* Income vs expense
* Category spending
* Spending trends
* Period selector

---

## Phase 6 — Settings

Implement:

* Currency
* Theme
* Data management
* About
* App preferences

---

## Phase 7 — Native Features

Introduce selectively:

* Haptics
* Biometrics
* Notifications
* Export/share

---

## Phase 8 — Polish

Focus on:

* Performance
* Accessibility
* Animations
* Empty states
* Error states
* Keyboard handling
* Device testing
* UI consistency

---

# 72. Performance Targets

Kharcha should remain usable on budget Android devices.

Target characteristics:

```text
Fast startup
Smooth 60 FPS interactions where practical
Responsive transaction creation
Smooth scrolling through large histories
Low memory overhead
Minimal unnecessary network activity
```

Since V1 is offline-first, the application should have no dependency on network latency for core interactions.

---

# 73. Testing

Testing should eventually cover:

## Unit Tests

* Currency formatting
* Balance calculations
* Date utilities
* Analytics calculations

## Database Tests

* Create transaction
* Update transaction
* Delete transaction
* Migration behavior
* Category relationships

## UI Tests

Critical flows:

```text
Add Expense
Add Income
Edit Transaction
Delete Transaction
Search Transaction
Filter Transaction
```

---

# 74. Device Testing

Test at minimum:

```text
Small Android phone
Modern Android phone
iPhone
Large-screen phone
```

Pay particular attention to lower-end Android performance.

---

# 75. Edge Cases

Handle:

* No transactions
* Thousands of transactions
* Very large amounts
* Decimal amounts
* Missing optional title
* Missing note
* Deleted category
* Invalid date
* Database migration failure
* App killed during transaction entry
* Device theme changing while app is open
* Device timezone changing

---

# 76. Success Metrics

For the initial version, success is primarily product quality rather than growth.

The MVP is successful if:

1. A user can install Kharcha and start without creating an account.
2. A transaction can be added within seconds.
3. All functionality works offline.
4. Data remains available after restarting the application.
5. Balance calculations remain correct.
6. Transaction history remains responsive with substantial data.
7. Analytics accurately represent stored transactions.
8. The application performs well on lower-end Android hardware.
9. The UI feels consistent across Android and iOS.
10. The application remains understandable without instructions.

---

# 77. Future Roadmap

Possible progression:

```text
Kharcha V1
│
├── Offline Expense Tracking
│
├── V1.1
│   ├── Biometrics
│   ├── Notifications
│   ├── CSV Export
│   └── Custom Categories
│
├── V1.2
│   ├── Budgets
│   ├── Recurring Transactions
│   └── Better Analytics
│
├── V2
│   ├── Optional Accounts
│   ├── Cloud Backup
│   └── Multi-device Sync
│
└── Future
    ├── Shared Wallets
    ├── Receipt Scanning
    ├── Smart Insights
    └── Web Dashboard
```

---

# 78. Final Product Goal

Kharcha should not attempt to become a bank, accounting system, investment platform, or complicated financial management suite.

Its primary job is simple:

> **Help users understand where their money goes.**

Every major product decision should therefore be evaluated against three questions:

1. Does this make recording money easier?
2. Does this make spending easier to understand?
3. Does this preserve the speed and simplicity of Kharcha?

If a feature adds significant complexity without improving one of these areas, it should probably not be part of the core product.
