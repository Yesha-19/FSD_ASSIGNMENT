Here's the complete file-folder structure for the **SustainaBuy** MERN + AI project, what goes in each file, and a ready-to-run Windows terminal script to scaffold it all.

## 📁 Folder Structure

```
sustainabuy/
├── client/                        → React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                → images, icons, logos
│   │   ├── components/            → reusable UI (Navbar, ProductCard, SearchBar)
│   │   ├── pages/                 → Login, Signup, Search, ProductDetail, Dashboard, Admin
│   │   ├── context/                → AuthContext.js (JWT/user state)
│   │   ├── services/                → api.js (axios calls to backend)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                         → Node + Express backend
│   ├── config/
│   │   └── db.js                  → MongoDB connection setup
│   ├── models/
│   │   ├── User.js                → user schema (name, email, password, role)
│   │   ├── Product.js             → product schema (name, ingredients, ecoScore, packaging)
│   │   └── History.js             → saved user search/product history
│   ├── routes/
│   │   ├── authRoutes.js          → /register, /login
│   │   ├── productRoutes.js       → /search, /:id/score
│   │   └── historyRoutes.js       → /history (get/save)
│   ├── controllers/
│   │   ├── authController.js      → JWT logic (bcrypt, token generation)
│   │   ├── productController.js   → search logic, calls AI microservice
│   │   └── historyController.js   → save/fetch user history
│   ├── middleware/
│   │   └── authMiddleware.js      → JWT verification middleware
│   ├── .env                       → PORT, MONGO_URI, JWT_SECRET
│   ├── server.js                  → app entry point
│   └── package.json
│
├── ai-service/                     → Python AI microservice
│   ├── data/
│   │   └── openfoodfacts_sample.csv   → cleaned dataset subset
│   ├── model/
│   │   └── eco_score_model.pkl        → trained sklearn model (exported)
│   ├── train_model.py              → data cleaning + model training script
│   ├── app.py                      → Flask/FastAPI app exposing /predict-score
│   └── requirements.txt            → flask, pandas, scikit-learn, joblib
│
└── README.md                       → project overview, setup instructions
```

