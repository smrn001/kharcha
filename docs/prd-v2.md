# Kharcha (खर्च) — Product Requirements Document

| | |
|---|---|
| **Product** | Kharcha (खर्च) — offline-first personal finance tracker |
| **Version** | 2.0 (supersedes v1.0) |
| **Date** | September 19, 2026 |
| **Status** | App is built and in use. v2.0 records the as-built baseline and defines the next release. |
| **Primary market** | Nepal |
| **Platforms** | Android (primary), iOS |
| **Stack** | React Native, Expo, TypeScript, Expo SQLite |

---

## 0. How to read this document

### 0.1 What changed from v1.0

1. **Nepal-first.** Bikram Sambat (BS) calendar, lakh/crore number grouping, Nepali language, Nepal-specific categories, wallets, festivals, salary and fiscal-year cycles.
2. **Data model corrected.** Money stored as integer paisa, `local_date` for reliable grouping, accounts, stable category slugs, soft delete, sync-ready columns.
3. **Backup, export and import are core scope**, not polish. An offline app that can lose data is a broken app.
4. **New modules:** accounts and transfers, budgets, recurring transactions, reminders, udharo (lent/borrowed) tracker, savings goals.
5. **Privacy hardening:** Android/iCloud backup leakage, app lock, hide-amounts toggle, honest statement about database encryption.
6. **Measurable success metrics**, test matrix, migration plan and release/distribution plan.
7. **Contradictions from v1.0 removed** (features marked "shipped" but scheduled in later phases, settings listed that did not exist, mixed date formats).

### 0.2 Status legend

| Mark | Meaning |
|---|---|
| ✅ | Built (based on the v1.0 PRD and the owner's description). **Verify** against the app using Appendix F. |
| 🛠 | To be built in v2.0 |
| 🗓 | Planned for a later release |
| 💡 | Exploratory, not committed |

Requirement IDs (e.g. `ADD-3`) are stable so they can be used in issues and tests. Priorities: **P0** must ship, **P1** should ship, **P2** nice to have.

---

## 1. Product overview

Kharcha helps one person see where their money goes — in Nepali rupees, in the calendar and language they actually use, with no account, no server and no internet.

> **Open the app → record the expense → carry on with your day.**

### 1.1 Questions Kharcha must answer instantly

- How much money do I have right now, and where is it (cash, bank, wallet)?
- How much did I spend today, this week, this month (BS or AD)?
- Where is most of my money going?
- Am I spending more than last month, at the same point in the month?
- How much am I allowed to spend for the rest of the month?
- Who owes me money, and whom do I owe?
- Is my data safely backed up?

### 1.2 Non-goals

Kharcha is **not** a bank, payment app, lending platform, accounting system, tax-filing tool, investment platform or business bookkeeping tool. It never moves money and never connects to a bank. It does not require an account, show ads, or send financial data anywhere.

---

## 2. Nepal context

These are product assumptions to validate with real users, not established facts about every user.

| Reality in Nepal | Product implication |
|---|---|
| Everyday spending mixes **cash, mobile wallets (eSewa, Khalti, IME Pay), Fonepay QR and bank apps** | Multiple accounts including Cash and Wallets; very fast entry |
| **Mobile data can be costly and connectivity uneven** outside cities | Offline-first, small download size, zero network dependency |
| **Wide range of Android phones**, many low-end (2–4 GB RAM), often with aggressive battery managers (Xiaomi, Oppo, Vivo, Infinix, Tecno, etc.) | Strict performance budget; reminders that survive battery savers or explain how to allow them |
| **Two calendars:** BS is used for government, salary, bills and daily life; AD for banking apps and international use | Dual calendar with a user-selected primary |
| **Lakh/crore digit grouping** (12,34,567) | Custom number formatter; never rely on default `Intl` behavior |
| **Salary is commonly paid per BS month**; the fiscal year runs from Shrawan 1 to the end of Ashadh | Configurable "period" (BS month, AD month, or custom start day) and fiscal-year analytics |
| **Foreign employment and remittances** are a major income source for many households | Remittance income category; multi-currency deferred but planned |
| **Festival spending spikes** (Dashain, Tihar) | Festival category, event budgets |
| **Informal credit (udharo)**, cooperatives (sahakari) and rotating savings (dhukuti) are common | Udharo tracker, savings-type accounts, dhukuti exploration |
| **Mixed-script typing:** Devanagari, English, and Roman Nepali in the same note | Unicode-safe search; Roman-Nepali aliases for default categories |
| **Bank/wallet SMS alerts** are the main transaction receipts | Paste/share-based import assistant (no SMS-reading permission; see §6.10) |

---

## 3. Goals, metrics and principles

### 3.1 Goals

| # | Goal |
|---|---|
| G1 | Fastest possible way to log a transaction |
| G2 | Numbers that are correct, explainable, and shown in NPR/BS conventions |
| G3 | Zero data loss, including across app updates, migrations and phone changes |
| G4 | Private by default: nothing leaves the device unless the user exports it |
| G5 | Runs smoothly on low-end Android |

### 3.2 Success metrics

Kharcha has no analytics SDK by design. Metrics are measured through test protocols, Play Console Android vitals (OS-level crash/ANR data, no SDK), and owner or tester feedback.

| Metric | Target | How measured |
|---|---|---|
| Time to add an expense (app open → saved) | ≤ 10 s, ≤ 4 taps with remembered defaults | Manual timing protocol on reference devices |
| Time from install to first saved transaction | ≤ 60 s | Manual protocol |
| Cold start on reference low-end device | ≤ 2.5 s | Timed on device |
| Add-screen open latency | ≤ 300 ms | Profiling |
| Scrolling 10,000 transactions | No visible jank; ≥ 55 fps typical | Profiling |
| Query time, 50,000 transactions | p95 < 50 ms for list pages and summaries | Benchmark script |
| Data loss in backup → restore round trip | 0 rows lost or changed | Automated test (§13) |
| Migration success | 100% of test databases migrate with matching totals | Automated test |
| Crash-free sessions | ≥ 99.5% | Play Console vitals |
| Download size (Android) | ≤ 35 MB (revisit as features land) | Build output |

### 3.3 Principles

1. **Fast.** Every feature is judged by whether it slows logging.
2. **Offline-first.** Every core feature works with no network.
3. **Private.** No telemetry, no account, no cloud in v2.0.
4. **Simple.** Say Income, Expense, Balance — not accounting jargon.
5. **Nepali-first, not Nepali-only.** Language, calendar and number formats are user settings; English/AD/western grouping stay fully supported.
6. **Never lose data.** Backups, undo, recently-deleted, and safe migrations beat features.
7. **Explainable numbers.** Every total can be traced to transactions; formulas are documented (§8.9).
8. **Lightweight.** Prefer Expo/React Native built-ins; every dependency must justify itself.

---

## 4. Users

| Persona | Situation | Key needs |
|---|---|---|
| **Owner / primary user** | Builds and uses the app personally | Speed, correctness, no data loss, control |
| **Student living away from family** | Monthly allowance (jeb kharcha), rent, tuition, food | Simple logging, monthly budget, low-end phone friendly |
| **Salaried employee** | Paid once a month on the BS calendar, pays rent, EMI, bills | BS months, salary-day cycle, recurring bills, budgets |
| **Freelancer / remote worker** | Irregular income, some in foreign currency | Income tracking, later multi-currency |
| **Household manager** | Runs ghar kharcha for a family; receives remittance | Categories for groceries/school/festival, udharo, Nepali UI |

Kharcha is a personal tracker. It does not serve shared family accounts or business bookkeeping in v2.0.

---

## 5. Scope by release

| Area | v1 baseline | v2.0 (this release) | v2.1 | v2.2 | v3+ |
|---|---|---|---|---|---|
| Income/expense entry, categories | ✅ | polish | | | |
| Tabs: Home, Transactions, Analytics, Settings | ✅ | ✅ | | | |
| Search, filters, edit, delete | ✅ | + undo, recently deleted | | | |
| Analytics incl. previous-period comparison | ✅ | + BS/custom periods, fiscal year, projection | | | |
| Currency, theme | ✅ | + Nepali formatting | | | + multi-currency |
| JSON backup, CSV export, import | ✅ | hardened, nudges | | | password-protected backup |
| Data model | INTEGER minor units as-built (v1 PRD said REAL — see §10) | 🛠 integer paisa, local_date, accounts, slugs, soft delete | | | sync fields in use |
| Nepali language, BS calendar, lakh/crore | | 🛠 | | | |
| Accounts, opening balance, transfers | | 🛠 | | | |
| Nepal default categories | | 🛠 | | | |
| App lock (PIN/biometric), hide amounts | | 🛠 | | | |
| Budgets | | | 🛠 | | |
| Recurring transactions, reminders | | | 🛠 | | |
| Tags | | | 🛠 | | |
| Udharo tracker, goals, event budgets | | | | 🛠 | |
| Paste-SMS import assistant | | | | 🛠 | |
| Optional encrypted cloud backup/sync | | | | | 🗓 |
| Dhukuti, QR prefill, widgets | | | | | 💡 |

---

## 6. Nepal localization specification

### 6.1 Language

- **P0** Languages: English and Nepali (नेपाली, Devanagari). Default from device locale; switchable in Settings.
- **P0** All user-facing strings live in a dictionary keyed by ID. No hardcoded text in components.
- **P0** Nepali translations must be reviewed by a native speaker before release (Appendix C is a starting glossary, not final copy).
- **P1** Numerals setting: Latin (default) or Devanagari (०१२३४५६७८९). Amount input accepts both and normalizes to Latin internally.
- **P1** Bundle a Devanagari-capable font (e.g. Noto Sans Devanagari or Mukta) **only if** QA shows inconsistent rendering on target devices. Otherwise use system fonts to save size.
- Roman Nepali is not a UI language, but it is supported for search (§6.8).

### 6.2 Calendars

- Dates are **stored in AD** (ISO 8601 and `local_date`). BS is derived for display and input.
- **BS cannot be computed by formula**: month lengths (29–32 days) vary by year. Conversion uses a bundled lookup table or a vetted library. Supported range is limited by the table; verify the range, accuracy and license of any library before adoption.
- **P0** Setting `calendar`: `bs` | `ad` | `both` (both shows the secondary calendar as a subtitle). Default: `bs` when device locale is `ne`, otherwise ask during onboarding.
- **P0** Date picker supports BS and AD, and shows the equivalent date in the other calendar.
- **P0** Period boundaries follow the selected calendar: "This month" means the current BS month (e.g. Ashwin) when BS is selected.
- **P1** Custom cycle start day (e.g. salary day 25): a "month" runs from day N of one month to day N−1 of the next.
- **P1** Year views: BS year (Baisakh–Chaitra), **fiscal year (Shrawan 1 – Ashadh end)**, or AD year.
- **Time zone:** Nepal Standard Time is UTC+05:45 with no daylight saving. Every transaction stores its own UTC offset so travel or working abroad does not corrupt dates.
- BS month reference: Appendix E.

### 6.3 Currency and number formatting

- **P0** Default currency NPR; two decimals (paisa). Supported: NPR, INR, USD, EUR, GBP (single active currency in v2.0; see §9.3).
- **P0** Symbol style per language: English `Rs.` / Nepali `रू`.
- **P0** **Lakh/crore grouping** for NPR and INR (`12,34,567.50`); western grouping (`1,234,567.50`) for USD/EUR/GBP. Implement one central `formatMoney()` that does not depend on device `Intl` support. Test vectors in Appendix B.
- **P0** Negative amounts: minus sign before the symbol (`−Rs. 1,250`), consistent everywhere.
- **P1** Compact format for charts and tight spaces: `1.5K`, `1.5L` (lakh), `2.5Cr` (crore); in Nepali `हजार`, `लाख`, `करोड`.
- **P2** "Amount in words" in Nepali/English beneath the amount field to prevent typos (e.g. `पाँच हजार`).
- **P0** Maximum amount per transaction: Rs. 100 crore. Reject beyond that with a clear message.
- Changing the currency in Settings **does not convert** existing amounts; the app warns about this.

### 6.4 Week and period defaults

- **P0** Week starts on **Sunday** by default (Nepal's working week begins Sunday; Saturday is the weekly holiday). User-configurable.
- Period defaults: `period_type = calendar_month` in the selected calendar.

### 6.5 Default categories

Nepal-specific defaults with Nepali names and Roman-Nepali search aliases are in **Appendix A**. Key additions over v1: Rent, Electricity, Water, Internet & Mobile, Fuel, Festival, Gifts & Social (bhoj, wedding, tika), Religion & Donation, Loan/Kista, Insurance, Tax & Fees; income: Remittance, Bonus/Allowance, Pocket Money, Rent Received, Interest.

### 6.6 Accounts and payment methods

- **P0** During onboarding the user picks which accounts they use: Cash, Bank account, eSewa, Khalti, IME Pay, Cooperative (sahakari) savings, Other wallet. All can be renamed later.
- Account kinds: `cash`, `bank`, `wallet`, `card`, `savings`, `other`.
- Use **generic icons and text labels**, not third-party logos, to avoid trademark issues.
- Fonepay QR and similar are payment networks, not accounts: the user records the expense against the account they paid from.

### 6.7 Festivals

- **P1** Default `festival` expense category and a Festival tag preset (v2.1).
- **P1** Event budgets (v2.2): a budget over a date range and tag, e.g. "Dashain".
- Festival dates follow the lunar calendar and vary each year. **v2.0 does not bundle festival dates**, to avoid shipping wrong data; users create event budgets manually.

### 6.8 Input and search

- **P0** Normalize all text to Unicode NFC before storing or searching.
- **P0** Search is case-insensitive and covers title, note, category (both English and Nepali names) and account.
- **P1** Roman-Nepali aliases for default categories (e.g. `khana`, `bhada`, `bijuli`, `kista`) so typing `khana` finds Food. Aliases are search-only and never shown as category names.
- Free-text notes accept any script and mixed scripts.

### 6.9 Devices and connectivity

- Reference test devices: a 2–3 GB RAM Android phone (Android 9–11 class), a mid-range Android phone (Xiaomi/Samsung class), a modern Android flagship, and one iPhone.
- No feature may require the network. If a future feature does, it must be optional and degrade gracefully.
- **P1** Notification reliability help: an in-app page explaining how to exempt Kharcha from battery optimization on common Android brands.

### 6.10 Legal, privacy and distribution notes

- Kharcha collects and transmits no personal data. State this plainly in the in-app Privacy screen and the store listing.
- Nepal has privacy legislation (the Privacy Act, 2075 / 2018). Because v2.0 collects nothing, exposure is low; obtain local legal advice before adding accounts, cloud sync, analytics or payments.
- Kharcha does not perform regulated financial services (no payments, lending, KYC, bank connectivity). Include a short "not financial advice" note in About.
- **Google Play restricts SMS-reading permissions.** Do not use `READ_SMS` or notification listeners. The SMS import assistant (v2.2) uses paste/share only.
- Verify Google Play Console registration and payout eligibility for developers based in Nepal before planning a Play Store release or any paid tier. Fallback: direct APK distribution.

---

## 7. Navigation and app shell

- **NAV-1 (P0)** ✅ Bottom tabs: **Home, Transactions, Analytics, Settings.**
- **NAV-2 (P0)** ✅ A prominent `+` action opens Add Transaction from Home and Transactions. No permanent Add tab.
- **NAV-3 (P0)** 🛠 "Manage" entry points (Accounts, Categories, Budgets, Recurring, Udharo, Goals) live at the top of Settings and as shortcuts on Home. No new tabs.
- **NAV-4 (P1)** Android hardware back behaves predictably: closes sheets first, then screens; on Home it exits.
- **NAV-5 (P1)** Deep links reserved for future widget/quick-add (`kharcha://add`).

---

## 8. Functional requirements

### 8.1 Onboarding 🛠 (max 3 screens, all skippable)

- **ONB-1 (P0)** Screen 1: Language + calendar (BS/AD) + currency, with sensible preselection.
- **ONB-2 (P0)** Screen 2: "Where is your money?" — pick accounts, optionally enter each opening balance.
- **ONB-3 (P0)** Screen 3: Ready. Offer **"I already have a backup → Restore"** at the start.
- **ONB-4 (P0)** No account creation, ever. Existing v1 users skip onboarding; the migration (§10) creates a default Cash account and prompts later for an opening balance.

### 8.2 Home ✅ / 🛠

- **HOME-1 (P0)** Header greeting and current period label in the selected calendar.
- **HOME-2 (P0)** Balance card: total balance across accounts included in total; income and expense for the current period beneath it. Tap → Accounts.
- **HOME-3 (P0)** Quick stats: spent today, this week, this period.
- **HOME-4 (P1)** 🛠 v2.1 "Left to spend" from the overall budget with left-per-day.
- **HOME-5 (P0)** Latest 5 transactions with **View all**.
- **HOME-6 (P1)** 🛠 v2.1 "Upcoming" list: recurring items due in the next 7 days.
- **HOME-7 (P0)** Backup nudge banner (see BKP-6).
- **HOME-8 (P1)** **Hide amounts** eye toggle that masks all money values app-wide (useful in crowded public places or on shared phones).
- **HOME-9 (P0)** Empty state with a single clear "Add your first transaction" action.

### 8.3 Add / edit transaction ✅ / 🛠

The most important screen. Optimize ruthlessly.

- **ADD-1 (P0)** Type toggle: Expense (default) / Income / Transfer (only if ≥ 2 accounts).
- **ADD-2 (P0)** Amount is the initial focus; numeric keyboard opens immediately. Accepts Latin and Devanagari digits, up to 2 decimals, > 0, ≤ Rs. 100 crore.
- **ADD-3 (P0)** Category chips: last-used first, then by frequency. Selecting a category **remembers the last type, category and account**.
- **ADD-4 (P0)** Account selector defaults to last used.
- **ADD-5 (P0)** Optional title and note. If title is empty, the list displays the category name.
- **ADD-6 (P0)** Date defaults to now; chips for **Today / Yesterday**; full picker supports BS and AD.
- **ADD-7 (P1)** Calculator-style amount input (`250+120`).
- **ADD-8 (P1)** **Save & add another** for batch entry.
- **ADD-9 (P0)** On save: validate → write in one SQLite transaction → subtle haptic → close → totals update everywhere without manual refresh.
- **ADD-10 (P1)** Draft persistence: if the app is killed mid-entry, restore the draft next time.
- **ADD-11 (P0)** Friendly errors ("Couldn't save this transaction. Please try again.") and internal logging (§11.6).
- **ADD-12 (P0)** Transfer mode: from-account, to-account, amount, date; no category; cannot be the same account.
- **ADD-13 (P1)** Tags field (v2.1).

### 8.4 Transactions list ✅ / 🛠

- **TXN-1 (P0)** Grouped by local date with day headings in the selected calendar (Today, Yesterday, then date). Use `SectionList` (or a flattened `FlatList` with header rows). Never `ScrollView` + `.map()`.
- **TXN-2 (P0)** Paginated queries (keyset on `local_date, occurred_at, id`); infinite scroll.
- **TXN-3 (P0)** Each row: category icon, title/category, account, time, signed amount with **+/− and color plus text/icon** (not color alone).
- **TXN-4 (P1)** Day subtotal in each section header.
- **TXN-5 (P0)** Search (§6.8), debounced (~250 ms).
- **TXN-6 (P0)** Filters: type (All/Income/Expense/Transfer), date (Today/Week/Period/Custom), category (multi), account (multi). Filters show as removable chips.
- **TXN-7 (P1)** Filtered-results summary bar: total in, total out, count.
- **TXN-8 (P1)** Sort: newest (default), oldest, largest amount.
- **TXN-9 (P2)** Multi-select for bulk delete and bulk re-categorize.
- **TXN-10 (P1)** Amount min/max filter.

### 8.5 Transaction details, edit, delete, undo

- **DET-1 (P0)** ✅ Details show amount, type, category, account(s), title, note, date/time in both calendars if `both`.
- **DET-2 (P0)** ✅ Edit any field; all totals update immediately.
- **DET-3 (P0)** 🛠 Delete is a **soft delete with a 6-second Undo snackbar**. No blocking confirmation for single delete.
- **DET-4 (P1)** 🛠 **Recently deleted** screen: restore or permanently delete; auto-purge after 30 days.
- **DET-5 (P0)** Bulk or destructive operations (Reset Data) require confirmation (§8.15).

### 8.6 Accounts and transfers 🛠

- **ACC-1 (P0)** Create, rename, reorder, archive accounts. Fields: name, kind, icon, opening balance, "include in total balance".
- **ACC-2 (P0)** Balance = opening balance + income − expense + transfers in − transfers out (excluding soft-deleted).
- **ACC-3 (P0)** Cannot hard-delete an account with transactions; archive it. Archived accounts are hidden from pickers but remain in history.
- **ACC-4 (P0)** Transfers are **excluded from income and expense totals** in every report.
- **ACC-5 (P1)** Account detail screen: balance, recent transactions, monthly in/out.
- **ACC-6 (P1)** "Reconcile" action: user enters the real balance; the app offers to add an adjustment transaction for the difference (category `adjustment`, excluded from spending analytics by default).
- **ACC-7 (P1)** Savings/cooperative accounts can be excluded from "spendable" total.

### 8.7 Categories ✅ / 🛠

- **CAT-1 (P0)** Defaults from Appendix A, identified by stable **slug**; localized display names come from the dictionary.
- **CAT-2 (P0)** Create, rename, choose icon and color, reorder, archive custom categories.
- **CAT-3 (P0)** Categories used by transactions can only be **archived**, never hard-deleted. The `other` category (per type) cannot be deleted or archived.
- **CAT-4 (P2)** Merge two categories (moves all transactions).
- **CAT-5 (P1)** Renaming a default category creates a display override; the slug never changes.

### 8.8 Analytics ✅ / 🛠

Period selector: **Week / Period (month or cycle) / Year**, default Period. "Period" and "Year" follow §6.2.

- **ANA-1 (P0)** Overview card: Income, Expense, Net for the period. If Expense > Income, label shows **Overspent** with the shortfall.
- **ANA-2 (P0)** Spending by category with amount and percentage; top categories first; tap → Transactions filtered to that category and period.
- **ANA-3 (P0)** Trend chart: Week → daily bars; Period → daily bars with optional cumulative line; Year → monthly bars. Zero-fill empty days. Custom-drawn with `react-native-svg`; no heavy chart library.
- **ANA-4 (P0)** Income vs Expense comparison that does not rely on color alone.
- **ANA-5 (P0)** ✅ Comparison with previous period (see §8.9 for exact rules).
- **ANA-6 (P1)** "Biggest changes": top 3 categories by absolute change.
- **ANA-7 (P1)** Average daily spend and projected period-end spend (shown after ≥ 7 days into the period).
- **ANA-8 (P1)** Account filter for analytics.
- **ANA-9 (P1)** Custom date range.
- **ANA-10 (P1)** Rule-based local insights (max 3, dismissible), e.g. "Food is up Rs. 1,200 vs last month". No AI, no network.
- **ANA-11 (P0)** Empty state: "Not enough data yet."

### 8.9 Analytics definitions (single source of truth)

| Term | Definition |
|---|---|
| Income total | Sum of `income` transactions in period (transfers excluded, soft-deleted excluded) |
| Expense total | Sum of `expense` transactions in period |
| **Net** | Income − Expense (labeled "Net", not "Saved") |
| Savings rate | Net ÷ Income; hidden when Income = 0 |
| Total balance | Sum of balances of accounts flagged "include in total" and not archived |
| Average daily spend | Expense ÷ days elapsed so far in the period |
| Projected period-end spend | Average daily spend × total days in period (shown only after 7 days) |
| Category share | Category expense ÷ Expense total; rounded using the largest-remainder method so shares sum to 100% |
| Left to spend | Overall budget − Expense in period |
| Left per day | Left to spend ÷ remaining days in period (min 1) |
| Change % | (Current − Previous) ÷ Previous; **undefined when Previous = 0** → show "New" or "—" |

**Comparison rules.** Default comparison is **to-date**: the current period so far vs the *same number of days* of the previous period (capped to the previous period's length, since BS months differ). A toggle switches to **vs full previous period**. This avoids the misleading "you spent far less than last month" early in every month.

### 8.10 Budgets 🛠 v2.1

- **BUD-1 (P0)** One overall budget per period plus optional per-category budgets.
- **BUD-2 (P0)** Progress bar with amount spent, remaining, and % used; states: normal, ≥ 80% warning, ≥ 100% exceeded (text + icon, not only color).
- **BUD-3 (P0)** Budgets follow the selected period definition (BS month, AD month or custom cycle).
- **BUD-4 (P1)** Local notifications at 80% and 100% (opt-in).
- **BUD-5 (P1)** No rollover in v2.1; copy last period's budgets with one tap.
- **BUD-6 (P2)** Event budgets over a date range and tag (v2.2).

### 8.11 Recurring transactions 🛠 v2.1

- **REC-1 (P0)** Rules: title, type, amount, category, account, frequency, start date, optional end date.
- **REC-2 (P0)** Frequencies: daily, weekly, monthly (by AD day or **by BS day**), yearly (AD or BS), custom interval.
- **REC-3 (P0)** No background jobs required. On app open, generate all due occurrences since the last run (catch-up), each marked with its `recurring_id`.
- **REC-4 (P1)** Per-rule mode: **auto-add** or **ask first** (shows a "Confirm" list on Home).
- **REC-5 (P1)** Edit "this and future" vs "this one only"; pause and resume rules.
- **REC-6 (P0)** Month-end handling: a rule set for day 31 (or BS day 32) posts on the last valid day of shorter months.

### 8.12 Reminders and notifications 🛠 v2.1

- **NOT-1 (P0)** All notifications are local and opt-in.
- **NOT-2 (P1)** Daily "log today's expenses" reminder; default time 9:00 PM, configurable.
- **NOT-3 (P1)** Bill/recurring due-date reminders.
- **NOT-4 (P1)** Budget threshold alerts (BUD-4).
- **NOT-5 (P1)** Backup reminder (BKP-6).
- **NOT-6 (P1)** Notification content respects "hide amounts" (no amounts on the lock screen if enabled).

### 8.13 Udharo (lent/borrowed) tracker 🛠 v2.2

- **UDH-1 (P0)** Entries: direction (I lent / I borrowed), person name (free text), amount, date, optional due date, note.
- **UDH-2 (P0)** Partial repayments; status open/settled; outstanding balance per person.
- **UDH-3 (P1)** Optionally link a repayment to an account and create a matching transaction. Lending/borrowing itself is **not** counted as income/expense; it moves money between "cash" and "receivable/payable".
- **UDH-4 (P1)** Summary card: total owed to me, total I owe.
- **UDH-5 (P2)** Reminder on due date.

### 8.14 Savings goals 🛠 v2.2

- **GOL-1 (P0)** Goal: name, target amount, optional target date, linked savings account (optional).
- **GOL-2 (P0)** Progress from manual contributions or linked account balance; show "needs Rs. X per month".
- **GOL-3 (P2)** Multiple goals; archive completed goals.

### 8.15 Settings ✅ / 🛠

Grouped list. Status per item:

| Group | Items |
|---|---|
| Manage | Accounts 🛠, Categories ✅, Budgets 🛠, Recurring 🛠, Udharo 🛠, Goals 🛠, Tags 🛠, Recently deleted 🛠 |
| General | Language 🛠, Calendar 🛠, Currency ✅, Numerals 🛠, Appearance (System/Light/Dark) ✅ |
| Preferences | Start of week ✅, Period type + cycle start day 🛠, Default transaction type ✅, Notifications 🛠, Haptics ✅ |
| Security | App lock (PIN) 🛠, Biometric unlock 🛠, Lock delay 🛠, Hide amounts 🛠 |
| Data | Export backup (JSON) ✅, Export transactions (CSV) ✅, Import ✅, Backup reminder 🛠, Reset data ✅ (hardened) |
| About | About Kharcha, Privacy, Version, Open-source licenses, Not-financial-advice note |

- **SET-1 (P0)** **Reset Data** first offers to export a backup, then requires a typed confirmation word.
- **SET-2 (P0)** Every setting has a documented key and default (§9.4).

### 8.16 Backup, export and import ✅ / 🛠

- **BKP-1 (P0)** ✅ Full backup as a single JSON file via the system share sheet (Drive, WhatsApp, email, Files). Format in Appendix D.
- **BKP-2 (P0)** ✅ CSV export of transactions (Appendix D).
- **BKP-3 (P0)** ✅ Import of JSON backup or CSV. **Merge-only**: never modifies or deletes existing data.
- **BKP-4 (P0)** 🛠 **Restore** (replace-all) option for a fresh install, with confirmation and an automatic pre-restore backup.
- **BKP-5 (P0)** 🛠 Import validation: structure, schema version, types, amounts > 0, dates, currency. Reports errors per row (CSV) or rejects with an explanation (JSON). Never corrupts the DB (whole import in one SQLite transaction; roll back on failure).
- **BKP-6 (P0)** 🛠 **Backup nudges.** Track `last_backup_at`. Banner after 14 days and ≥ 10 new transactions; stronger prompt after 30 days.
- **BKP-7 (P0)** 🛠 **Duplicate handling:** JSON dedupes by `id`; CSV includes an `id` column and dedupes on it; rows without `id` dedupe by hash of `local_date + amount + type + category + title`.
- **BKP-8 (P0)** 🛠 CSV safety: proper quoting for commas/quotes/newlines; cells starting with `=`, `+`, `-`, `@` (except the numeric amount column) are prefixed with `'` to prevent spreadsheet formula injection; UTF-8 with BOM so Excel reads Nepali text correctly.
- **BKP-9 (P0)** 🛠 Backup file contains `schema_version`, `app_version`, `exported_at` and `currency`; warn on currency mismatch at import.
- **BKP-10 (P2)** Auto-backup to a user-chosen folder (Android Storage Access Framework) on app close or weekly.
- **BKP-11 (P2)** Password-protected backup (requires a vetted crypto library; evaluate).

### 8.17 Security and privacy ✅ / 🛠

- **SEC-1 (P0)** 🛠 App lock with 4–6 digit PIN (stored as a salted hash in Expo Secure Store) plus optional biometric unlock. Lock delay: immediately / 30 s / 1 min / 5 min.
- **SEC-2 (P0)** 🛠 Attempt backoff after repeated wrong PINs.
- **SEC-3 (P0)** 🛠 **Disable Android Auto Backup for the app database** (Expo config `android.allowBackup: false`, or exclusion rules) and exclude the DB from iCloud device backup. This keeps "no financial data leaves the device" true. Users rely on Kharcha's own backup.
- **SEC-4 (P1)** Hide amounts toggle (HOME-8), including notifications.
- **SEC-5 (P1)** Hide content in the recent-apps switcher when app lock is on.
- **SEC-6 (P2)** Evaluate SQLCipher-based database encryption. Until then, the Privacy screen states honestly that the database file is stored unencrypted in app-private storage and protected by the OS sandbox and device lock.
- **SEC-7 (P0)** Store no PINs or secrets in AsyncStorage.

---

## 9. Data architecture

### 9.1 Layers

```
Screen → Hook (e.g. useTransactions) → Repository → SQLite
```

- No raw SQL in components.
- All multi-row writes (transfers, imports, migrations, recurring catch-up) run inside a single SQLite transaction.
- UI refresh after writes uses a small event emitter (or the SQLite change listener) so every screen updates without manual refresh.

### 9.2 Schema (v2)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id                    TEXT PRIMARY KEY,           -- UUID
  name                  TEXT NOT NULL,
  kind                  TEXT NOT NULL CHECK (kind IN ('cash','bank','wallet','card','savings','other')),
  icon                  TEXT,
  opening_balance_minor INTEGER NOT NULL DEFAULT 0, -- paisa
  include_in_total      INTEGER NOT NULL DEFAULT 1,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  archived_at           TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  deleted_at            TEXT
);

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE,                          -- stable key for defaults, NULL for custom
  name        TEXT,                                 -- custom name or user override
  type        TEXT NOT NULL CHECK (type IN ('income','expense')),
  icon        TEXT,
  color       TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT
);

CREATE TABLE transactions (
  id             TEXT PRIMARY KEY,
  type           TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount_minor   INTEGER NOT NULL CHECK (amount_minor > 0),  -- paisa
  account_id     TEXT NOT NULL REFERENCES accounts(id),
  to_account_id  TEXT REFERENCES accounts(id),               -- transfers only
  category_id    TEXT REFERENCES categories(id),             -- NULL for transfers
  title          TEXT,
  note           TEXT,
  local_date     TEXT NOT NULL,   -- 'YYYY-MM-DD' AD, local date at entry; used for grouping/analytics
  occurred_at    TEXT NOT NULL,   -- ISO 8601 UTC, used for ordering
  tz_offset_min  INTEGER NOT NULL DEFAULT 345,               -- +05:45
  recurring_id   TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT,
  CHECK (
    (type = 'transfer' AND to_account_id IS NOT NULL AND category_id IS NULL AND to_account_id <> account_id)
    OR
    (type <> 'transfer' AND category_id IS NOT NULL AND to_account_id IS NULL)
  )
);

CREATE INDEX idx_tx_date     ON transactions(local_date DESC, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_category ON transactions(category_id, local_date)          WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_account  ON transactions(account_id, local_date)           WHERE deleted_at IS NULL;

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

Later-release tables (outline; finalize when built):

- `budgets(id, category_id NULL=overall, amount_minor, period_type, tag_id NULL, start_local_date NULL, end_local_date NULL, created_at, updated_at, deleted_at)`
- `recurring_rules(id, type, amount_minor, category_id, account_id, title, frequency, interval, calendar 'ad'|'bs', day_rule, start_local_date, end_local_date, mode 'auto'|'ask', last_generated_local_date, paused_at, ...)`
- `tags(id, name, ...)` and `transaction_tags(transaction_id, tag_id)`
- `debts(id, direction 'lent'|'borrowed', person_name, principal_minor, opened_local_date, due_local_date, note, settled_at, ...)` and `debt_payments(id, debt_id, amount_minor, local_date, account_id NULL, transaction_id NULL, ...)`
- `goals(id, name, target_minor, target_local_date, account_id NULL, archived_at, ...)`

### 9.3 Money

- Store **integer paisa** (`amount_minor`). Rs. 1,250.50 → `125050`. No floating-point arithmetic on stored money.
- Conversion happens only at input parsing and display (`parseMoney`, `formatMoney`).
- JS safe-integer range comfortably exceeds the Rs. 100 crore cap.
- Single active currency in v2.0 (a `currency` setting). Multi-currency later requires per-transaction `currency` and `fx_rate`; not in v2.0.

### 9.4 Settings keys and defaults

| Key | Default | Notes |
|---|---|---|
| `language` | device locale (`ne`/`en`) | |
| `calendar` | `bs` if `ne`, else prompt | `bs`/`ad`/`both` |
| `currency` | `NPR` | |
| `numerals` | `latin` | `latin`/`devanagari` |
| `theme` | `system` | |
| `week_start` | `sunday` | |
| `period_type` | `calendar_month` | or `custom_cycle` |
| `period_start_day` | `1` | for `custom_cycle` |
| `default_tx_type` | `expense` | |
| `haptics` | `true` | |
| `hide_amounts` | `false` | |
| `app_lock_enabled` | `false` | PIN hash in Secure Store, not here |
| `lock_delay_sec` | `30` | |
| `last_backup_at` | null | |
| `notifications_*` | `false` | per type |
| `onboarding_done` | `false` | |

### 9.5 Dates

- `local_date` (`YYYY-MM-DD`, AD) is what analytics and grouping use. It is the calendar date **as the user experienced it**, so a timezone change never moves a past transaction to another day.
- `occurred_at` (UTC) orders transactions within a day.
- BS values are always derived, never stored.
- Display uses the selected calendar; day headings use Today/Yesterday, then the date.

### 9.6 IDs and sync readiness

- IDs are UUIDs generated on device (e.g. `expo-crypto`).
- `updated_at`, `deleted_at` (soft delete) exist from v2.0 so a future sync layer can be added without another destructive migration. Conflict strategy (future): last-writer-wins on `updated_at` with a per-row `version` added when sync is built.

### 9.7 Migrations

- Versioning via `PRAGMA user_version`.
- Migrations are ordered, idempotent-safe, and run inside a transaction.
- On failure: roll back, keep the previous database untouched, show a recovery screen with a **Export backup** option, and log the error (§11.6).

---

## 10. Migration plan: v1 → v2

The v1 schema stored `amount REAL`, ISO `date`, `category_id TEXT` and no accounts. Migration must preserve every transaction.

1. **Auto pre-migration backup:** write a JSON backup to app-private storage; offer to share it.
2. **Rebuild tables** (SQLite `ALTER TABLE` is limited): create new tables, copy data, drop old, rename, all in one transaction.
3. **Money:** as-built v1 databases already store integer minor units (`amount INTEGER`, values like `25000` for Rs. 250) despite the v1 PRD saying REAL. Migration **must inspect first**: only apply `CAST(ROUND(amount * 100) AS INTEGER)` to rows holding fractional REAL major-unit values; leave integer minor-unit rows untouched. Validate with `typeof(amount)` sampling on real devices before release.
4. **Dates:** derive `local_date` and `tz_offset_min` from the stored `date` (treat values without an offset as NPT, +05:45); keep `occurred_at` as UTC.
5. **Accounts:** create one default `Cash` account (or ask on first launch) and attach all existing transactions. Opening balance = 0 so total balance equals the previous Income − Expense; the app later prompts: "Set your real starting balance".
6. **Categories:** match existing default categories to the new slugs by ID or name; the rest become custom categories. Any transaction whose category is missing is remapped to the `other` category of its type.
7. **Validate:** compare row counts and total income/expense (in paisa, tolerance ±1 paisa per row from rounding) before committing. Any mismatch → roll back.
8. **Set** `user_version = 2`, seed new default categories and settings, and enqueue the onboarding-lite prompts (calendar, language, opening balance).

---

## 11. Non-functional requirements

### 11.1 Performance
Targets in §3.2. Use `SectionList`/`FlatList`, memoization only where profiling justifies it, SQL aggregation (never aggregate large lists in JS), and indexes in §9.2.

### 11.2 Reliability and data integrity
- Every write is atomic. Killing the app mid-save must leave either the old or the new state, never a partial one.
- No silent failures: user sees a plain-language error; developers see a logged detail.
- Balance and analytics are **derived from transactions**, not stored counters, so they cannot drift.

### 11.3 Accessibility
- Touch targets ≥ 48 dp; labels on all icon-only buttons.
- Supports system font scaling without clipped amounts.
- Information never relies on color alone (icons, +/− signs, text states).
- Logical screen-reader order; verify TalkBack behavior in both languages and check that a Nepali text-to-speech voice is available on target devices.

### 11.4 Security and privacy
See §8.17 and §6.10. No network permissions beyond what Expo requires; no analytics or crash-reporting SDKs. Requested Android permissions kept minimal (notifications, biometrics; storage access through system pickers only).

### 11.5 Localization quality
Native-speaker review of Nepali copy; layout checks for longer Devanagari strings; no truncation of amounts in either script; date and number formats verified with Appendix B vectors and BS vectors (§13).

### 11.6 Diagnostics without telemetry
- Local ring-buffer log (last ~200 entries: timestamp, area, error code, no financial values).
- "Report a problem" in About composes an email and attaches the log **only if the user chooses to**.

---

## 12. Technology

| Area | Choice |
|---|---|
| Core | React Native, Expo (pin the current SDK at release time), TypeScript (strict, no `any`) |
| Navigation | Expo Router |
| Styling / components | NativeWind, React Native Reusables, semantic theme tokens |
| Icons | Lucide React Native |
| Animation | React Native Reanimated (subtle, fast) |
| Database | Expo SQLite |
| Charts | Custom with `react-native-svg` |
| Localization | `expo-localization` + a small in-house dictionary (en, ne); no heavy i18n framework unless needed |
| BS conversion | Bundled lookup table or vetted library (check accuracy, year range, license, bundle size) |
| Dates | Small, tree-shakable helper (e.g. date-fns) or in-house utilities |
| Security | `expo-local-authentication`, `expo-secure-store` |
| Files/backup | `expo-file-system`, `expo-sharing`, `expo-document-picker` |
| Notifications | `expo-notifications` (local only) |
| IDs | `expo-crypto` |
| Feedback | `expo-haptics` (sparingly) |
| State | Component state, Context, custom hooks; SQLite is the source of truth. No Redux. |

Dependencies are added only when their feature is being built.

### 12.1 Project structure

```
kharcha/
├── app/                    # Expo Router routes: (tabs)/, transaction/, account/, category/, budget/, ...
├── components/             # ui/, common/, transaction/, analytics/, settings/
├── constants/
├── hooks/
├── i18n/                   # en.ts, ne.ts, aliases.ts
├── lib/
│   ├── db/                 # database.ts, migrations/, repositories per table
│   ├── money.ts            # parseMoney, formatMoney, compact, words
│   ├── calendar/           # ad.ts, bs.ts, periods.ts, fiscal.ts
│   ├── backup/             # exportJson.ts, exportCsv.ts, import.ts, validate.ts
│   ├── analytics/          # aggregates, comparisons, projections
│   └── log.ts
├── types/
├── assets/
└── PRD.md
```

---

## 13. Testing

### 13.1 Unit tests
- `formatMoney` / `parseMoney` (Appendix B vectors), Devanagari digit input, cap enforcement.
- BS ↔ AD conversion (known vectors below), period boundaries for BS months, custom cycles, fiscal year, month-end rules.
- Analytics formulas (§8.9) including zero-previous and short-month comparisons; largest-remainder percentages.
- Balance calculation with transfers, archived accounts, soft-deleted rows.

**BS conversion vectors** (verify against an authoritative Nepali calendar before treating as ground truth):

| AD | BS |
|---|---|
| 2000-01-01 | 2056-09-17 (Poush 17) |
| 2024-04-13 | 2081-01-01 (Baisakh 1) |
| 2025-04-14 | 2082-01-01 (Baisakh 1) |
| 2026-04-14 | 2083-01-01 (Baisakh 1) |

### 13.2 Database tests
- CRUD for all tables; foreign-key and CHECK enforcement (e.g. transfer to same account rejected).
- Migration v1→v2 on fixtures: empty DB, 1 row, 10,000 rows, rows with odd dates, missing categories. Totals must match.
- Migration failure injection: verify rollback leaves v1 untouched.
- Backup → wipe → restore round trip: 0 differences.
- Import: duplicates, invalid rows, huge files, wrong currency, CSV formula-injection strings, newlines/quotes/Devanagari text in notes.

### 13.3 UI/critical flows
Add expense, add income, transfer, edit, delete + undo, restore from recently deleted, search (English, Devanagari, Roman alias), each filter, switch language/calendar mid-session, app lock/unlock, backup and restore.

### 13.4 Device matrix
Low-end Android (2–3 GB), mid-range Android with aggressive battery manager, modern Android, iPhone. Test light/dark, large font sizes, both languages, both calendars, and a 50,000-transaction database.

### 13.5 Edge cases
No transactions; thousands of transactions; very large and decimal amounts; missing title/note; archived category/account; invalid date; leap-year and 32-day BS months; time-zone change while running; theme change while open; app killed during entry or during migration; low storage during backup.

---

## 14. Release and distribution

- **Builds:** EAS Build. AAB for Play Store; APK for direct sharing. Semantic versioning plus build number; short changelog in About.
- **Channels:** direct APK (works immediately), Google Play (verify Nepal-based developer eligibility, §6.10), iOS TestFlight/App Store later if needed.
- **Store listing:** English and Nepali descriptions, screenshots with dummy data in both languages and both calendars.
- **Privacy:** hosted privacy-policy page; Play "Data safety" and Apple privacy labels: no data collected.
- **Updates:** consider OTA updates for JS-only fixes; any release that includes a DB migration must have passed §13.2 migration tests first.
- **Rollout:** staged rollout; keep the previous APK available.

---

## 15. Roadmap

| Release | Theme | Contents |
|---|---|---|
| **v2.0** | Foundation + Nepal | Data model migration, accounts/transfers/opening balance, BS calendar, Nepali UI, lakh/crore, Nepal categories, period/fiscal analytics, projection, app lock, hide amounts, undo, recently deleted, backup hardening and nudges, Android backup exclusion |
| **v2.1** | Planning | Budgets, recurring transactions, reminders, tags |
| **v2.2** | Relationships & goals | Udharo tracker, savings goals, event budgets (Dashain/Tihar), paste-SMS import assistant |
| **v3.0** | Optional cloud & scale | Password-protected/encrypted backup, optional encrypted sync, multi-currency with FX, home-screen widget/quick-add, SQLCipher |
| **Exploratory** | 💡 | Dhukuti tracker, QR (Fonepay/NepalPay-style) merchant prefill, festival calendar data, reports export to PDF, receipt photos |

---

## 16. Risks and open questions

### 16.1 Risks

| Risk | Mitigation |
|---|---|
| Data loss (migration bug, lost phone) | Pre-migration backup, transactional migrations, backup nudges, recently deleted, restore tests |
| BS conversion errors | Verified lookup data, test vectors, isolate in one module, show AD alongside BS when unsure |
| Poor Nepali translation quality | Native-speaker review before release; glossary in Appendix C |
| Reminders killed by OEM battery managers | In-app guidance page; don't make reminders the only safety net |
| Number formatting inconsistent across devices | Own formatter, no dependence on device `Intl`, fixed test vectors |
| Scope creep | Every feature must pass the three questions in §17 |
| Unmaintained BS library | Prefer a bundled data table you control |
| Play Store policy or eligibility issues | Verify early; keep direct APK route |
| Single-developer bus factor | Keep this PRD, migrations and tests current |

### 16.2 Open questions

*Parked for now (shipping continues AD-primary; both platforms keep building): Q2 (calendar default), Q4 (iOS target).*

1. Is Kharcha for personal use only, or will it be released publicly (affects store, legal, support work)?
2. Should BS or AD be the default calendar for new installs?
3. Who will review the Nepali translations?
4. Is iOS a real target, or Android-only for now?
5. Is multi-currency (foreign income, remittance) needed before v3?
6. Should Dhukuti/cooperative tracking be a real feature, and how do people actually run their groups?
7. Should there be any paid tier, and if so how could it be paid for locally (verify feasibility)?

---

## 17. Product decision filter

Every proposed feature must answer yes to at least one, and must not violate the others:

1. Does it make **recording money** easier?
2. Does it make **spending easier to understand**?
3. Does it protect **speed, simplicity, privacy and data safety**?

If it adds significant complexity without improving one of these, it does not belong in the core product.

---

# Appendices

## Appendix A — Default categories (Nepal)

Nepali names are proposals and need native-speaker review. Aliases are search-only.

### Expense

| Slug | English | नेपाली | Roman-Nepali / search aliases |
|---|---|---|---|
| `food` | Food & Dining | खाना | khana, bhojan, momo, chiya, tiffin |
| `groceries` | Groceries | किराना / तरकारी | kirana, tarkari, saaman |
| `rent` | Rent | कोठा भाडा | bhada, kotha, ghar bhada |
| `electricity` | Electricity | बिजुली | bijuli, nea |
| `water` | Water | खानेपानी | pani, khanepani |
| `internet_mobile` | Internet & Mobile | इन्टरनेट / मोबाइल | recharge, data, wifi, ntc, ncell, worldlink |
| `travel` | Travel | यात्रा | yatra, trip, ticket |
| `personal_care` | Personal Care | व्यक्तिगत हेरचाह | salon, parlour |
| `family` | Family & Children | परिवार | ghar, bachcha |
| `gifts_social` | Gifts & Social | उपहार / सामाजिक | upahar, bhoj, bibaha, tika |
| `festival` | Festival | चाडपर्व | dashain, tihar, chadparva |
| `religion_donation` | Religion & Donation | धर्म / दान | daan, puja, mandir |
| `loan_emi` | Loan & EMI | ऋण / किस्ता | kista, rin, emi |
| `insurance` | Insurance | बिमा | bima |
| `tax_fees` | Tax & Fees | कर / शुल्क | kar, shulka |
| `subscriptions` | Subscriptions | सदस्यता | netflix, youtube, spotify |
| `adjustment` | Adjustment | समायोजन | reconcile (system; excluded from spending analytics by default) |
| `other` | Other | अन्य | anya |

### Income

| Slug | English | नेपाली | Aliases |
|---|---|---|---|
| `salary` | Salary | तलब | talab |
| `bonus` | Bonus / Allowance | बोनस / भत्ता | bhatta, dashain bonus |
| `business` | Business | व्यापार / व्यवसाय | byapar, byabasaya |
| `freelance` | Freelance | फ्रिलान्स | project, gig |
| `remittance` | Remittance | रेमिट्यान्स | remit, videsh |
| `rent_received` | Rent Received | भाडा आम्दानी | bhada |
| `interest_dividend` | Interest & Dividend | ब्याज / लाभांश | byaj, labhansh |
| `pocket_money` | Pocket Money | जेब खर्च | jeb kharcha, allowance |
| `gift` | Gift | उपहार | upahar |
| `refund` | Refund / Cashback | फिर्ता | pharta, cashback |
| `other` | Other | अन्य | anya |

Savings and investment outflows are **transfers** to a savings/investment account, not expenses.

## Appendix B — Number formatting test vectors

Lakh/crore grouping (NPR, INR):

| Value (paisa) | English style | Note |
|---|---|---|
| 99900 | Rs. 999 | |
| 100000 | Rs. 1,000 | |
| 1234500 | Rs. 12,345 | |
| 10000000 | Rs. 1,00,000 | 1 lakh |
| 123456750 | Rs. 12,34,567.50 | |
| 1234567800 | Rs. 1,23,45,678 | 1.23 crore |
| 125050 | Rs. 1,250.50 | |
| −125000 | −Rs. 1,250 | |
| 0 | Rs. 0 | |

Western grouping (USD, EUR, GBP): `123456750` → `1,234,567.50`.

Compact: 1,500 → `1.5K`; 1,50,000 → `1.5L`; 2,50,00,000 → `2.5Cr`.

Devanagari numerals: `1234567890` → `१२३४५६७८९०`.

## Appendix C — Nepali UI glossary (starter, needs review)

| English | नेपाली |
|---|---|
| Home | गृहपृष्ठ |
| Transactions | लेनदेन |
| Analytics | विश्लेषण |
| Settings | सेटिङ |
| Income | आम्दानी |
| Expense | खर्च |
| Balance | बाँकी रकम |
| Savings | बचत |
| Budget | बजेट |
| Account | खाता |
| Transfer | ट्रान्सफर |
| Add | थप्नुहोस् |
| Save | सुरक्षित गर्नुहोस् |
| Edit | सम्पादन |
| Delete | मेटाउनुहोस् |
| Cancel | रद्द गर्नुहोस् |
| Undo | पूर्ववत् |
| Today | आज |
| Yesterday | हिजो |
| This week | यो हप्ता |
| This month | यो महिना |
| Backup | ब्याकअप |
| Restore | पुनःस्थापना |
| Owed to me (udharo) | दिएको उधारो |
| I owe (udharo) | लिएको उधारो |
| Fiscal year | आर्थिक वर्ष |

## Appendix D — Backup and export formats

### D.1 JSON backup (schema_version 2)

```json
{
  "format": "kharcha-backup",
  "schema_version": 2,
  "app_version": "2.0.0",
  "exported_at": "2026-09-19T08:00:00.000Z",
  "currency": "NPR",
  "accounts": [ { "id": "...", "name": "Cash", "kind": "cash", "opening_balance_minor": 0 } ],
  "categories": [ { "id": "...", "slug": "food", "type": "expense" } ],
  "transactions": [
    {
      "id": "...", "type": "expense", "amount_minor": 25000,
      "account_id": "...", "category_id": "...", "title": "Lunch", "note": null,
      "local_date": "2026-09-19", "occurred_at": "2026-09-19T06:15:00.000Z", "tz_offset_min": 345
    }
  ]
}
```

Later releases add `budgets`, `recurring_rules`, `tags`, `debts`, `goals`. Importers must ignore unknown fields and reject a `schema_version` newer than the app understands.

### D.2 CSV export

Columns: `id,date,time,type,account,to_account,category,title,note,amount,currency`

- `date` is `local_date` (`YYYY-MM-DD`, AD); `time` is local `HH:mm`.
- `amount` is in major units with two decimals (`250.00`).
- UTF-8 with BOM; quoted per RFC 4180; formula-injection prefixing per BKP-8.

```csv
id,date,time,type,account,to_account,category,title,note,amount,currency
0c1f...,2026-09-19,11:45,expense,Cash,,Food,Lunch,,250.00,NPR
7a9b...,2026-09-19,12:10,income,Bank,,Freelance,Website project,,15000.00,NPR
```

### D.3 Import rules
- Whole import runs in one transaction; any fatal error rolls back.
- Unknown categories fall back to the `other` category for that type; unknown accounts are created (or mapped to the default account after user confirmation).
- Amounts must be > 0 and ≤ cap; dates must parse; types must be valid.

## Appendix E — Bikram Sambat months (reference)

Approximate start dates vary by a day or two between years; use the conversion table for exact values. Month lengths range from 29 to 32 days and differ each year.

| # | BS month | नेपाली | Approx. start (AD) |
|---|---|---|---|
| 1 | Baisakh | बैशाख | mid-April |
| 2 | Jestha | जेठ | mid-May |
| 3 | Ashadh | असार | mid-June |
| 4 | Shrawan | साउन | mid-July (fiscal year begins) |
| 5 | Bhadra | भदौ | mid-August |
| 6 | Ashwin | असोज | mid-September |
| 7 | Kartik | कार्तिक | mid-October |
| 8 | Mangsir | मंसिर | mid-November |
| 9 | Poush | पौष | mid-December |
| 10 | Magh | माघ | mid-January |
| 11 | Falgun | फागुन | mid-February |
| 12 | Chaitra | चैत | mid-March |

## Appendix F — As-built verification checklist

Verified against the app in Phase 0 (Sep 2026). Checked items are confirmed as-built; notes record deviations from this spec.

- [x] Four tabs: Home, Transactions, Analytics, Settings
- [x] Add / edit / delete transaction; income and expense (no transfers yet)
- [x] Default categories present; custom categories allowed (create/edit; delete blocked while in use — no archive, slugs, or colors yet)
- [x] Search and filters on Transactions
- [x] Analytics: period selector, category spending, trend, income vs expense
- [x] Previous-period comparison and "Biggest changes" (compares vs **full** previous period; to-date + toggle per §8.9 not built)
- [x] Currency setting and central formatter (western grouping only; no lakh/crore yet)
- [x] Theme: System / Light / Dark
- [x] JSON backup export, CSV export, JSON/CSV import (merge-only)
- [x] Reset Data (dialog confirmation — typed word + pre-export offer per SET-1 not built)
- [ ] App lock / biometrics — confirmed missing (no Security section in Settings)
- [ ] Notifications — confirmed missing
- [ ] Language setting — confirmed missing
- [ ] Amount storage type — as-built is INTEGER minor units, not REAL (see §10 step 3)
- [ ] Date storage format — ISO UTC `Z` strings, no `local_date`, no UTC offset
- [ ] Android Auto Backup status — not disabled (`allowBackup: false` absent from app config)
- [ ] List component — `SectionList` confirmed, but loads all rows with **no pagination** (TXN-2 outstanding)
