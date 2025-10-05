# FluxPay - Unified Payment Wallet

A comprehensive payment platform that unifies UPI and card payments with intelligent routing, real-time rewards, and analytics.

## 🚀 Features Implemented

### ✅ Core MVP Features
- **User Authentication**: Email/phone login with Supabase Auth
- **Payment Instruments**: Link UPI VPA and cards (tokenized)
- **Merchant Payments**: Process payments via UPI or Card rails (mocked)
- **P2P Payments**: Send money via UPI ID or mobile number
- **Transaction History**: Real-time transaction feed with status updates
- **Intelligent Routing**: Smart payment rail recommendation based on amount and cashback
- **Rewards System**: Automatic cashback and points (UPI: 5%, Card: 2%, P2P: 1%)
- **Analytics Dashboard**: View spending patterns with charts
- **Offers Page**: Active promotional offers
- **Balance Display**: Real-time UPI and card balances
- **MPIN Security**: Mock MPIN confirmation before payments

### 🔒 Security Features
- Row Level Security (RLS) on all tables
- JWT-based authentication
- Mock card tokenization
- MPIN simulation for payment authorization
- Input validation and error handling

## 📊 Database Schema

### Tables
- `profiles`: User profiles with phone numbers
- `linked_banks`: UPI VPA storage
- `linked_cards`: Tokenized card information
- `transactions`: All payment records with rewards
- `rewards_ledger`: Cashback and points tracking

## 🎯 Routing Logic

- **Amount ≤ ₹1000**: Recommends UPI (5% cashback)
- **Amount > ₹1000**: Recommends Card (2% cashback + protection)

## 💰 Rewards

| Payment Type | Cashback | Points |
|-------------|----------|---------|
| UPI Payment | 5% | Equal to cashback |
| Card Payment | 2% | Equal to cashback |
| P2P Transfer | 1% | Equal to cashback |

## Project info

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

**Frontend:**
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui components
- Recharts for analytics

**Backend:**
- Supabase (PostgreSQL + Auth + Realtime)
- Supabase Edge Functions (Deno)
- Mock payment provider APIs

## 📱 Quick Start Demo (≤5 minutes)

1. **Register/Login** → Sign up with email
2. **Link Instruments** → Settings → Add UPI VPA and card
3. **View Dashboard** → See balances and transactions
4. **Make Payment** → Try ₹500 (UPI recommended) and ₹5000 (Card recommended)
5. **Send P2P** → Use test UPI: `test@upi`
6. **View Rewards** → Check cashback and points earned
7. **Analytics** → View spending patterns

## ⚠️ Security Notes

After database migrations, fix these Supabase settings:
1. **OTP Expiry**: [Fix Guide](https://supabase.com/docs/guides/platform/going-into-prod#security)
2. **Leaked Password Protection**: [Fix Guide](https://supabase.com/docs/guides/auth/password-security)

## 📦 MVP Checklist

- ✅ Authentication + onboarding
- ✅ Link UPI & cards
- ✅ P2P & merchant payments
- ✅ Intelligent routing
- ✅ Real-time transactions
- ✅ Rewards system
- ✅ Analytics & offers
- ✅ MPIN + validation
- ✅ 5-min demo ready

## How can I deploy this project?

Deploy to Vercel, Netlify, or any static hosting:

```bash
npm run build
```

The `dist` folder contains the production build.

For Vercel:
1. Push to GitHub
2. Connect repository in Vercel
3. Add environment variables
4. Deploy

Edge functions are automatically deployed by Supabase.




