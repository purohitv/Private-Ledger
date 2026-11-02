# Private Ledger — Personal Expense & Wealth Tracker with Analytics

A full-stack financial ledger and expense analytics platform featuring dynamic Chart.js visualizations, category budget tracking, payment mode analytics, and flexible dual-storage (PostgreSQL + zero-config local storage).

---

## Features

- **Dynamic Interactive Charts (Chart.js)**:
  - Monthly spending trends bar chart
  - Category breakdown pie chart with budget thresholds
  - Payment mode distribution (UPI, Cash, Debit Card, Credit Card, Bank Transfer)
  - Budget vs. Actual expenditure comparison
- **Expense Management**:
  - Full CRUD for expenses (title, amount, date, category, payment method, notes)
  - Search, filter by category/payment method, and sort by date/amount
  - Quick summary indicators (Total Spent, Monthly Budget, Savings, Top Category)
- **Custom Category Allocations**:
  - Add, edit, and delete expense categories with custom color palettes and icons
  - Set individual monthly category budgets with real-time budget progress bars
- **User Profile & Multi-Currency**:
  - Guest and personalized user profiles
  - Multi-currency support (INR `₹`, USD `$`, EUR `€`, GBP `£`, JPY `¥`, CAD `$`, AUD `$`, etc.)
- **Dual Storage Architecture**:
  - **Zero-Config Local JSON**: Works out-of-the-box with `data/db.json` without needing any database setup.
  - **PostgreSQL**: Connects automatically when PostgreSQL is available.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Chart.js & React-Chartjs-2, Motion
- **Backend**: Node.js, Express, tsx
- **Database**: PostgreSQL (`pg`) with automatic fallback to JSON file storage
- **Tooling**: Vite 8, TypeScript

---

## Getting Started Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v22 recommended)

### 2. Installation
Clone this repository and install dependencies:

```bash
git clone <YOUR_REPOSITORY_URL>
cd <REPOSITORY_FOLDER>
npm install
```

### 3. Environment Configuration
Create a `.env` file from `.env.example`:

```bash
# On Windows (PowerShell):
copy .env.example .env

# On macOS / Linux:
cp .env.example .env
```

Default configuration in `.env`:
```env
PORT=3000
APP_URL=http://localhost:3000
JWT_SECRET=private_ledger_dev_secret_key_2026
```

### 4. Run the Development Server
```bash
npm run dev
```

The Express API and Vite React frontend run together on port 3000. Open:
**[http://localhost:3000](http://localhost:3000)**

---

## Available Scripts

- `npm run dev` — Starts the Express backend and Vite frontend concurrently.
- `npm run build` — Builds the production React bundle into `dist/`.
- `npm run lint` — Runs TypeScript type check (`tsc --noEmit`).

---

## License
MIT
