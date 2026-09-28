# 🌱 SustainaBuy — How to Run This Project

This guide walks you through running SustainaBuy end-to-end on your local machine.
The project has **3 services** that must all be running at the same time:

| Service | Tech | Port |
|---------|------|------|
| Backend API | Node.js + Express + MongoDB | `5000` |
| Frontend UI | React | `3000` |
| AI Score Service | Python + Flask | `5001` |

---

## ✅ Prerequisites

Make sure these are installed before starting:

| Tool | Version | Check command | Download |
|------|---------|---------------|----------|
| Node.js | v18+ | `node -v` | https://nodejs.org |
| npm | v9+ | `npm -v` | (comes with Node.js) |
| Python | v3.9+ | `python --version` | https://python.org |
| MongoDB | v6+ | `mongod --version` | https://www.mongodb.com/try/download/community |
| Git | any | `git --version` | https://git-scm.com |

---

## 📁 Project Structure

```
sustainabuy/
├── server/          ← Node.js backend (API + MongoDB)
├── client/          ← React frontend
└── ai-service/      ← Python Flask AI scoring service
```

---

## 🗄️ STEP 1 — Install and Start MongoDB

MongoDB **must be running before the backend**. Open a terminal as **Administrator**.

### Option A: Windows (using winget)
```powershell
# Install MongoDB Community Server
winget install --id MongoDB.Server -e --accept-package-agreements

# After install, start the service
net start MongoDB
```

### Option B: Already installed — just start the service
```powershell
net start MongoDB
```

### Option C: Verify it's running
```powershell
Get-Service -Name "MongoDB"
# Should show: Running
```

> ⚠️ **If you skip this step**, the backend will fail to connect and login/signup/search will not work.

---

## ⚙️ STEP 2 — Set Up the Backend (server/)

Open a new terminal window.

```bash
# Navigate to the server folder
cd sustainabuy/server

# Install all dependencies
npm install

# Verify the .env file exists and contains:
# MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy
# JWT_SECRET=sustainabuy_super_secret_key_2026
# PORT=5000
```

### Check the .env file
The file `server/.env` should look like this:

```env
MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy
JWT_SECRET=sustainabuy_super_secret_key_2026
PORT=5000
```

> If MONGO_URI still points to Atlas (`mongodb+srv://...`), change it to the local URI above.

---

## 🌱 STEP 3 — Seed the Database (First Time Only)

This loads product data from the CSV file into MongoDB. **Only run this once** (or when you want to reset product data).

```bash
# From the server/ folder
cd sustainabuy/server
npm run seed
```

Expected output:
```
Connected to MongoDB. Reading CSV...
Seeded 2000 products into MongoDB!
```

> This reads from `ai-service/data/cleaned_products.csv` and inserts up to 2000 products.

---

## 🚀 STEP 4 — Start the Backend Server

```bash
# From the server/ folder (keep this terminal open)
cd sustainabuy/server

# Option A: Normal start
npm start

# Option B: Dev mode with auto-restart on file changes (recommended)
npm run dev
```

Expected output:
```
Server running on port 5000
✅ MongoDB connected successfully!
   URI: mongodb://127.0.0.1:27017/sustainabuy
```

> 🔴 If you see `❌ MongoDB connection failed`, make sure Step 1 (MongoDB service) is done.

---

## 🎨 STEP 5 — Start the Frontend (client/)

Open a **new terminal window** (keep the backend terminal running).

```bash
# Navigate to the client folder
cd sustainabuy/client

# Install dependencies (first time only)
npm install

# Start the React development server
npm start
```

Expected output:
```
Compiled successfully!

You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

The browser will open automatically at **http://localhost:3000**.

---

## 🤖 STEP 6 — Start the AI Service (Optional)

The AI service powers the **sustainability score** shown on product detail pages.
The app works without it (products will show `null` for the predicted score).

Open a **new terminal window**.

```bash
# Navigate to the ai-service folder
cd sustainabuy/ai-service

# Create a Python virtual environment (first time only)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Train the model (first time only, generates model files)
python train_model.py

# Start the Flask AI server
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5001
 * Debug mode: on
```

---

## 🧪 STEP 7 — Test the App

Open your browser at **http://localhost:3000** and test:

1. **Sign Up** — Create a new account at `/signup`
2. **Log In** — Log in at `/login` with your new credentials
3. **Search** — Search for a product like `chocolate` or `milk`
4. **Product Detail** — Click any product to see its sustainability score

---

## 🔌 API Endpoints (for testing with Postman/curl)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `http://localhost:5000/api/auth/register` | Sign up | No |
| POST | `http://localhost:5000/api/auth/login` | Log in | No |
| GET | `http://localhost:5000/api/products/search?q=chocolate` | Search products | No |
| GET | `http://localhost:5000/api/products/:id/score` | Get product + AI score | No |
| POST | `http://localhost:5000/api/history` | Save product to history | Yes (JWT) |
| GET | `http://localhost:5000/api/history` | Get user's view history | Yes (JWT) |

### Example: Test login with curl
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"
```

---

## ❗ Common Errors and Fixes

### ❌ `querySrv ECONNREFUSED` or MongoDB connection failed
**Cause:** MongoDB is not running, or `.env` still points to Atlas.
**Fix:**
1. Open an Admin terminal and run: `net start MongoDB`
2. Make sure `server/.env` has: `MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy`

---

### ❌ `Cannot reach the server` on Login/Signup page
**Cause:** The backend (server) is not running.
**Fix:** Run `npm start` inside `sustainabuy/server/`

---

### ❌ Search returns no results (empty list)
**Cause:** The database has not been seeded.
**Fix:** Run `npm run seed` inside `sustainabuy/server/`

---

### ❌ `Module not found` on npm start
**Cause:** Dependencies not installed.
**Fix:** Run `npm install` in the folder showing the error.

---

### ❌ AI score shows `null` on product detail page
**Cause:** AI service (Python Flask) is not running — this is **optional**.
**Fix:** Follow Step 6 to start the AI service, or ignore it (the rest of the app still works).

---

### ❌ Port already in use (EADDRINUSE)
```powershell
# Find what is using the port and kill it
# For port 5000 (backend):
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# For port 3000 (frontend):
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

---

## 🖥️ All Terminals at a Glance

You need **3 terminal windows open simultaneously**:

```
Terminal 1 (Admin):     net start MongoDB
Terminal 2 (server/):   npm start   ← backend on port 5000
Terminal 3 (client/):   npm start   ← frontend on port 3000
Terminal 4 (optional):  python app.py  ← AI service on port 5001
```

---

## 🔁 Switching Back to MongoDB Atlas (Cloud)

If you want to use MongoDB Atlas instead of local MongoDB:

1. Log in to https://cloud.mongodb.com
2. Go to your cluster → **Network Access** → Add your current IP
3. Make sure your cluster is **not paused** (Resume it if needed)
4. Open `server/.env` and swap the lines:

```env
# Comment out local:
# MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy

# Uncomment Atlas:
MONGO_URI=mongodb+srv://yeshakatrodiya988_db_user:mcqaEd23Dlwd059O@cluster0.nzxvxh8.mongodb.net/sustainabuy?retryWrites=true&w=majority
```

5. Restart the backend: `npm start`

---

*Last updated: September 2026*
