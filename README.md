# SustainaBuy Setup and Troubleshooting Guide

This project is a full-stack sustainability app with:
- React frontend in [sustainabuy/client](sustainabuy/client)
- Express + MongoDB backend in [sustainabuy/server](sustainabuy/server)
- Python AI score service in [sustainabuy/ai-service](sustainabuy/ai-service)

## Current verified status

The project is partially working:
- Frontend build succeeds.
- AI prediction service works.
- Backend server starts, but database connection fails.

This means the app is not fully functional yet because the MongoDB layer is currently the main blocker.

---

## Step 1: Install project dependencies

### 1. Frontend

```bash
cd sustainabuy/client
npm install
```

### 2. Backend

```bash
cd sustainabuy/server
npm install
```

### 3. AI service

```bash
cd sustainabuy/ai-service
python -m venv venv
venv\Scripts\activate
pip install flask pandas scikit-learn joblib numpy
```

> The file [sustainabuy/ai-service/requirements.txt](sustainabuy/ai-service/requirements.txt) is currently empty, so install the required packages manually.

---

## Step 2: Fix the MongoDB issue

The server is failing because MongoDB Atlas cannot be reached.

### Root cause

The backend in [sustainabuy/server/config/db.js](sustainabuy/server/config/db.js) tries to connect to MongoDB using the value in [sustainabuy/server/.env](sustainabuy/server/.env).

The actual error is:

```text
MongoDB connection error: querySrv ETIMEOUT _mongodb._tcp.cluster0.nzxvxh8.mongodb.net
```

### Fix checklist

1. Check the MongoDB Atlas cluster status.
2. Confirm your current IP is added to Network Access.
3. Confirm username and password are correct.
4. Confirm the database name is correct.
5. Use the exact MongoDB Atlas connection string format.

### Correct .env example

```env
PORT=5000
JWT_SECRET=sustainabuy_super_secret_key_2026
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sustainabuy?retryWrites=true&w=majority
```

### If MongoDB Atlas is unavailable

Use a local MongoDB database instead:

```env
MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy
```

Then start MongoDB locally before starting the server.

---

## Step 3: Start the AI service

```bash
cd sustainabuy/ai-service
python app.py
```

This should run on:

```text
http://127.0.0.1:5001
```

### Check the AI API manually

```bash
curl -X POST http://localhost:5001/predict-score \
  -H "Content-Type: application/json" \
  -d '{"ingredient_count":5,"packaging":"plastic","energy_100g":100,"fat_100g":5,"sugars_100g":10,"proteins_100g":2,"sodium_100g":1}'
```

Expected result:

```json
{"nutrition_score": 11.81}
```

---

## Step 4: Start the backend server

```bash
cd sustainabuy/server
npm start
```

Expected result:

```text
Server running on port 5000
```

If MongoDB fails, fix that first before continuing.

### Test the server root route

```bash
curl http://localhost:5000/
```

Expected result:

```json
{"status":"SustainaBuy API running"}
```

---

## Step 5: Start the frontend

```bash
cd sustainabuy/client
npm start
```

The app should open in the browser and the pages should be available.

---

## Step 6: Fix known code issues

### Issue 1: Product controller is empty

The file [sustainabuy/server/controllers/productController.js](sustainabuy/server/controllers/productController.js) is empty.

This breaks the product search and score logic because the route in [sustainabuy/server/routes/productRoutes.js](sustainabuy/server/routes/productRoutes.js) depends on it.

### Required fix

Implement the controller with:
- GET /search?q=...
- GET /:id/score
- database lookup and AI score request

### Example logic

```js
const Product = require("../models/Product");
const axios = require("axios");

exports.searchProducts = async (req, res) => {
  const { q } = req.query;
  const filter = q ? { name: { $regex: q, $options: "i" } } : {};
  const products = await Product.find(filter).limit(20);
  res.json(products);
};

exports.getProductScore = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const aiResponse = await axios.post("http://localhost:5001/predict-score", {
    ingredient_count: product.ingredientCount,
    packaging: product.packaging,
    energy_100g: product.energy100g,
    fat_100g: product.fat100g,
    sugars_100g: product.sugars100g,
    proteins_100g: product.proteins100g,
    sodium_100g: product.sodium100g,
  });

  res.json({ product, predictedScore: aiResponse.data.nutrition_score });
};
```

Then update the route file to use the controller methods.

---

### Issue 2: model training data may not exist yet

The AI code expects trained model files in [sustainabuy/ai-service/model](sustainabuy/ai-service/model).

If missing, train the model:

```bash
cd sustainabuy/ai-service
python train_model.py
```

It will create:
- model/eco_score_model.pkl
- model/packaging_encoder.pkl

---

### Issue 3: seed database with product data

The project contains a seeding script at [sustainabuy/server/config/seed.js](sustainabuy/server/config/seed.js).

Run:

```bash
cd sustainabuy/server
node config/seed.js
```

This reads the cleaned CSV and inserts product records into MongoDB.

---

## Step 7: Verify the app end-to-end

Once MongoDB is connected and the controller is implemented, test these flows:

1. Register a user
2. Login a user
3. Search a product
4. Open a product detail page
5. View predicted AI nutrition score
6. Save product to history
7. View dashboard history

### Sample test requests

#### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"pass123"}'
```

#### Search product

```bash
curl "http://localhost:5000/api/products/search?q=milk"
```

#### Product detail score

```bash
curl http://localhost:5000/api/products/<product_id>/score
```

---

## Common errors and fixes

### Error: MongoDB connection timeout

Fix:
- verify Atlas cluster status
- whitelist your IP
- check the connection string
- use local MongoDB if needed

### Error: model file not found

Fix:

```bash
cd sustainabuy/ai-service
python train_model.py
```

### Error: search route not working

Fix:
- implement [sustainabuy/server/controllers/productController.js](sustainabuy/server/controllers/productController.js)
- confirm [sustainabuy/server/routes/productRoutes.js](sustainabuy/server/routes/productRoutes.js) is connected correctly

### Error: frontend cannot connect to backend

Fix:
- check that backend is running on port 5000
- make sure the frontend API base is correct in [sustainabuy/client/src/services/api.js](sustainabuy/client/src/services/api.js)

---

## Recommended execution order

1. Install dependencies
2. Fix MongoDB connection
3. Start MongoDB
4. Run AI service
5. Run backend
6. Run frontend
7. Seed data
8. Test APIs
9. Fix remaining code issues
10. Re-test full flow

---

## Final project status

The project has a strong foundation, and the UI + AI parts are working, but the application is not fully complete until:
- MongoDB is connected
- product controller logic is implemented
- data is seeded
- login/search/history flows are verified end-to-end

Once those are fixed, this app can become a fully working sustainability product recommendation system.

---

## Summary

The biggest issue is the database connectivity. After that, the next most important task is filling in the empty product controller and testing the search and scoring flow. The AI service already works, and the frontend compiles successfully, so the remaining work is mainly backend completion and production readiness.

