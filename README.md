# SmartShield AI 🛡️

> AI-powered parametric insurance platform for gig workers — built for hackathons & production demos.

---

## 🚀 Quick Start

### 1. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App runs at → **http://localhost:5173**

---

### 2. Backend (Python Flask)

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

API runs at → **http://localhost:5000**

> The fraud detection model is **automatically trained and saved** on first startup.

---

### 3. Supabase (Optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Add your keys to `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

---

## 🗂️ Project Structure

```
SS/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── pages/     # 8 app pages
│       ├── components/
│       │   ├── layout/  # Sidebar, Navbar, BottomNav, FAB
│       │   └── ui/      # InsuranceCard, RiskScoreChart, etc.
│       ├── hooks/     # useTheme
│       └── services/  # api.ts (Axios)
│
├── backend/           # Python Flask
│   ├── app.py         # Entry point
│   ├── routes/        # 6 API blueprints
│   ├── services/      # risk_engine, fraud_service, payout_service
│   └── utils/         # mock_data
│
└── supabase/
    └── schema.sql     # Full DB schema
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/risk/live` | Real-time risk data |
| POST | `/trigger/validate` | Validate parametric conditions |
| POST | `/premium/calculate` | AI premium calculation |
| POST | `/claim/trigger` | Trigger a new claim |
| POST | `/fraud/check` | ML fraud detection |
| POST | `/payout/simulate` | Simulate instant payout |
| GET | `/admin/stats` | Platform analytics |

---

## 🤖 AI/ML

### Risk Engine
```
Risk Score = (Zone Risk × 0.4) + (Claim Freq × 0.4) + (Work Inconsistency × 0.2)
Premium    = ₹199 × (1 + RiskScore × 0.8)
```

### Fraud Detection (Random Forest)
- Auto-trains on startup if no saved model
- Input: 5 behavioral features
- Output: fraud probability + decision (approve/review/reject)
- Thresholds: <0.4 approve | 0.4–0.7 review | >0.7 reject

---

## 📱 Features

- ✅ Mobile-first with bottom navigation
- ✅ Collapsible sidebar
- ✅ Dark/light mode
- ✅ Animated 5-step workflow pipeline
- ✅ Live risk monitoring with auto-refresh
- ✅ Fraud analysis with feature sliders
- ✅ Payout simulator with animated flow
- ✅ Admin dashboard with charts
- ✅ Skeleton loaders
- ✅ Framer Motion transitions

---

## 🎯 For Hackathons

Click the **"Simulate Claim"** FAB button to walk through the complete end-to-end claim flow:

1. Select event type & severity
2. Watch the 5-step pipeline animate
3. ML model scores the claim
4. Payout is "credited" with a celebration animation
