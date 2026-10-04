# 🌱 SustainaBuy — Full Stack Assignment

A full-stack sustainability product recommendation web app that lets users search food products, view AI-generated eco/nutrition scores, and track their product history.

---

## 🗂️ Project Structure

```
FSD_ASSIGNMENT/
└── sustainabuy/
    ├── client/        ← React frontend  (port 3000)
    ├── server/        ← Node.js + Express + MongoDB API  (port 5000)
    └── ai-service/    ← Python Flask AI scoring service  (port 5001)
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based user registration & login |
| 🔍 Product Search | Search food products from a seeded MongoDB database |
| 🤖 AI Scoring | Python ML model predicts a nutrition/eco score for each product |
| 📋 Product Detail | View full product info with predicted sustainability score |
| 💾 History | Save products to personal dashboard history (JWT protected) |
| 📊 Dashboard | View all previously saved/searched products |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v7, Axios |
| Backend | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| Database | MongoDB (local or Atlas) |
| AI Service | Python 3, Flask, scikit-learn, pandas, joblib |

---

## ⚙️ Prerequisites

Make sure these are installed:

- **Node.js** v18+ (`node -v`)
- **npm** v9+ (`npm -v`)
- **Python** 3.9+ (`python --version`)
- **MongoDB** v6+ running locally (`mongod --version`)

---

## 🚀 How to Run

> You need **2 terminals** for the app itself, and **1 optional terminal** for the AI service.

### Step 1 — Start MongoDB

This project uses a local MongoDB database.

#### Option A: If MongoDB is already installed

Open an **Administrator** PowerShell terminal and run:

```powershell
net start MongoDB
```

#### Option B: If MongoDB is not installed

```powershell
winget install --id MongoDB.Server -e --accept-package-agreements
```

If needed, run MongoDB manually:

```powershell
& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "C:\data\db" --logpath "C:\data\mongod.log" --port 27017 --bind_ip_all
```

---

### Step 2 — Start the Backend

Open a new terminal and run:

```powershell
cd "c:\Users\YESHA\source\repos\GitHub\FSD_ASSIGNMENT\sustainabuy\server"
npm install
npm start
```

The API runs at **http://localhost:5000**.

Make sure `sustainabuy/server/.env` contains:

```env
PORT=5000
JWT_SECRET=sustainabuy_super_secret_key_2026
MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy
```

First time only, seed the database:

```powershell
npm run seed
```

This loads product data from the cleaned CSV file.

---

### Step 3 — Start the Frontend

Open a second terminal and run:

```powershell
cd "c:\Users\YESHA\source\repos\GitHub\FSD_ASSIGNMENT\sustainabuy\client"
npm install
npm start
```

Open the app in your browser at:

```text
http://localhost:3000
```

If the dev server does not stay stable, use the production build instead:

```powershell
npm run build
npx serve -s build -l 3000
```

---

### Step 4 — Start the AI Service *(optional but recommended)*

Open a third terminal if you want AI predictions to work.

```powershell
cd "c:\Users\YESHA\source\repos\GitHub\FSD_ASSIGNMENT\sustainabuy\ai-service"
py -3.13 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python train_model.py
python app.py
```

The AI service runs at:

```text
http://localhost:5001
```

> If the AI service is not running, the app still works, but the product score will show: **AI service unavailable**.

---

### Verified startup order

Use this order for best results:

1. Start MongoDB
2. Start backend (`server`)
3. Run `npm run seed`
4. Start frontend (`client`)
5. Start AI service (`ai-service`) only if you want live score predictions

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Sign up | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/products/search?q=...` | Search products | No |
| GET | `/api/products/:id/score` | Get product + AI score | No |
| POST | `/api/history` | Save product to history | JWT |
| GET | `/api/history` | Get user's history | JWT |

---

## ✅ Current Status

The application is working for the main full-stack setup.

### Fixed and verified
- MongoDB is working locally
- Backend server runs on port 5000
- Product data can be seeded successfully
- Frontend runs on port 3000
- Search and product retrieval work correctly

### Remaining environment requirement
- The AI prediction service is optional for the app to run, but it still requires a compatible Python + C++ build environment on Windows.
- If NumPy fails to build, the issue is environment-related rather than a project code bug.

> The core app works without the AI service, but live AI predictions require the Python environment to be fixed separately.
