<div align="center">

# 🪙 Nexora

**Investment & maturity platform — React Native mobile app, React web app, Admin panel, and Node.js backend**

</div>

Nexora is a full-stack investment platform where users choose plans, invest, and receive matured returns. It consists of four projects in one repository:

| Project | Stack | Description |
|---|---|---|
| `backend` | Node.js · Express · MongoDB | REST API, JWT auth, USDT payments, maturity scheduler |
| `web` | React · Vite · TypeScript | Customer-facing web app (plans, wallet, deposits, referrals) |
| `admin` | React · Vite · TypeScript · MUI | Admin panel (users, plans, wallets, returns, payment proofs) |
| `mobile` | React Native | Android/iOS app with the same customer features |

> ⚠️ **Security note:** `.env` files are gitignored and never committed. Copy the `.env.example` files and fill in your own credentials.

---

## 📁 Repository structure

```
nexroprojected/
├── backend/     # Express REST API + MongoDB models + cron jobs
├── web/         # Customer web app (Vite + React)
├── admin/       # Admin panel (Vite + React + MUI)
└── mobile/      # React Native mobile app
```

---

## 🧰 Prerequisites

- **Node.js 20+** and npm
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) (free M0 cluster)
- **Android Studio / Xcode** — only required to run the mobile app
- **Razorpay account** — removed from backend


---

## 🚀 Backend (`backend/`)

The API server. Also runs the daily **maturity scheduler** (auto-credits matured returns).

```bash
cd backend
npm install
cp .env.example .env     # then edit with your values
npm run dev              # development (nodemon, port 5000)
# or
npm start                # production
```

### Environment variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | optional | Server port (default `5000`) |
| `MONGODB_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | Secret used to sign auth tokens |

### Default admin

On first start the backend automatically creates a default admin:

```
Email:    admin@nexora.com
Password: Admin@123
```

**Change this password immediately after your first login.**

### Docker

```bash
cd backend
docker build -t nexora-backend .
docker run -p 5000:5000 --env-file .env nexora-backend
```

---

## 🖥️ Web app (`web/`)

Customer-facing website.

```bash
cd web
npm install
cp .env.example .env     # optional — see below
npm run dev              # http://localhost:5173
npm run build            # production build → dist/
```

### Environment variables (`web/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL, e.g. `https://your-backend.com/api` |
| `VITE_DEMO_MODE` | `true` to run the app with a demo user (no API calls) |

> If `VITE_API_URL` is unset, the web app expects to be served from the same origin as the API.

---

## 🛠️ Admin panel (`admin/`)

Dashboard for managing users, plans, wallets, returns, and payment proofs.

```bash
cd admin
npm install
cp .env.example .env     # optional — see below
npm run dev              # http://localhost:5173
npm run build            # production build → dist/
```

### Environment variables (`admin/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (falls back to `http://localhost:5000/api`) |

Log in with the default admin credentials shown above.

---

## 📱 Mobile app (`mobile/`)

React Native app (Android + iOS).

```bash
cd mobile
npm install

# Start Metro
npm start

# Android (emulator or connected device)
npm run android

# iOS (macOS only — run `bundle exec pod install` first)
npm run ios
```

### API URL

The API base URL is set in [`mobile/src/shared/constants/app.ts`](mobile/src/shared/constants/app.ts) (`AppConstants.API_URL`). Update it to point at your backend.

### Release APK

```bash
cd mobile/android
./gradlew assembleRelease
# Output: mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## ☁️ Deployment

### Backend

The backend is a long-running Node process (needs a persistent host for the maturity cron job and file uploads). Example: deploy `backend/` to a Node 20 service on [Render](https://render.com), [Railway](https://railway.app), or [Code.Run](https://code.run) with the `backend/.env` variables set, then set the start command to `npm start`.

### Web & Admin (static hosting)

Both are plain Vite static builds — host `dist/` on any static CDN (Netlify, Vercel, Cloudflare Pages).

- The `public/_redirects` file provides the SPA fallback (`/* → /index.html`) for client-side routing.
- At build time set `VITE_API_URL` to your deployed backend:

```bash
cd web && VITE_API_URL=https://your-backend.com/api npm run build
cd admin && VITE_API_URL=https://your-backend.com/api npm run build
```

---

## 🔗 Support links

- Official channel: https://t.me/+8tV1IrL6cdw3Zjc1
- Public group: https://t.me/FXwallet0
- Email: fxwallet@gmail.com
- Customer support: @FXwallet70

---

## 📄 License

Private project — all rights reserved.
