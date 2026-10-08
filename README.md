# 🌱 SustainaBuy — Full Stack Web Application

A full-stack, role-based product recommendation and analytics web app. SustainaBuy lets users search for food products, view dynamically computed health scores based on nutrition logic, track product history, discover healthier alternatives, and provides powerful dashboard ecosystems for Customers, Producers, and Administrators.

---

## 🗂️ Project Structure

```
FSD_ASSIGNMENT/
└── sustainabuy/
    ├── client/        ← React React-Router based frontend (port 3000)
    └── server/        ← Node.js + Express + MongoDB backend (port 5000)
```

*(Note: Previous AI Python backend has been deprecated in favor of a fast, Node-based dynamically derived scoring heuristic)*

---

## ✨ Current Features

| Feature | Description |
|---------|-------------|
| 🔐 Role-Based Access Control | JWT-based auth supporting three distinct roles: `Customer`, `Producer`, and `Admin` |
| 🔍 Product Search | Real-time querying to search food products stored in the MongoDB data store |
| 📊 Health Scoring & Validation | Derives actionable "Health Scores" (0-100) dynamically from raw nutrition grades |
| 🌿 Healthier Alternatives | Automatically recommends and calculates score differences for top alternatives in the same category |
| ⭐ Ratings & Reviews | Customers can submit interactive star ratings and comments on products |
| 🚀 Producer Hub | Dedicated interface for producers to add, edit, and delete products, plus view Recharts visual analytics |
| 🛠️ Admin Panel | Dedicated control center for admin users to manage user roles and overarching system records |
| 💾 Customer Dashboard | Personal area to revisit saved products, with charts (Recharts) exploring rating/nutrition trends |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v7
- **Data visualization:** Recharts (Interactive charting)
- **HTTP Client:** Axios

### Backend
- **Server:** Node.js + Express 5
- **Database:** MongoDB & Mongoose
- **Security:** JWT (JSON Web Tokens) & bcryptjs
- **Utilities:** `csv-parser` for database seeding

---

## ⚙️ Prerequisites

Make sure these are installed locally on your system:

- **Node.js** v18+ (`node -v`)
- **npm** v9+ (`npm -v`)
- **MongoDB** v6+ running locally (`mongod --version`)

---

## 🚀 How to Run

> You will need **2 terminal windows** to launch the full-stack suite (Client + Server).

### Step 1 — Start MongoDB

This project uses a local MongoDB database. Start the daemon appropriately. 

Open an **Administrator** PowerShell terminal and run:
```powershell
net start MongoDB
```

**(If running manually, point `--dbpath` to your data dir handling port 27017).*

### Step 2 — Start the Backend

Open a terminal window and run:

```powershell
cd "c:\Users\YESHA\source\repos\GitHub\FSD_ASSIGNMENT\sustainabuy\server"
npm install
npm run dev
```

The server binds to **http://localhost:5000**.

Ensure `FSD_ASSIGNMENT/sustainabuy/server/.env` is set up:
```env
PORT=5000
JWT_SECRET=sustainabuy_super_secret_key_2026
MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy
```

**Seeding (First-time setup only):**
You can seed the application using:
```powershell
npm run seed        # Imports base product dataset from CSV
npm run seed:admin  # Provisions initial admin account if needed
```

### Step 3 — Start the Frontend

Open a second terminal window and run:

```powershell
cd "c:\Users\YESHA\source\repos\GitHub\FSD_ASSIGNMENT\sustainabuy\client"
npm install
npm start
```

Your browser will automatically open to `http://localhost:3000`.

*(For a production test, you can run `npm run build && npx serve -s build -l 3000`)*

---

## 🔌 Core API Structure

**Authentication (`/api/auth`)**
- `POST /register` – Register with role-choice.
- `POST /login` – Retrieves JWT payload identifying the user.

**Products (`/api/products`)**
- `GET /search?q=` – Query active products.
- `GET /:id/score` – Fetch product details, derived score, and nutrition metrics.
- `GET /:id/alternatives` – Retrieve healthier recommendations.
- `POST /` & `PATCH /:id` & `DELETE /:id` – Producer product management.

**Reviews (`/api/reviews`)**
- `GET /product/:productId` – Fetch all reviews/ratings for a product.
- `POST /` – Submit or overwrite a customer rating/review.

**History (`/api/history`)**
- `POST /` – Tag product to a customer's logged dashboard history.
- `GET /` – Fetch all logged products + user analytics points.

**Admin (`/api/admin`)**
- Various admin management interactions supporting the `AdminPanel`.

---

## ✅ System Status

- **Fully functional end-to-end flow** with all new RBAC roles and analytic workflows successfully deployed.
- **Python ML dependency removed** - complex Python/C++ build chains are no longer necessary as algorithmic derivations are calculated dynamically and efficiently within the Node backend.
