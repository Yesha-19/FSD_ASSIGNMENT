# SustainaBuy: Why login, signup, and search are failing

## Short answer

The real problem is not the React login form or the signup page itself. The real problem is that the backend cannot connect to MongoDB.

Every feature that needs saved data depends on the database:

- User registration needs MongoDB to create a user
- Login needs MongoDB to find the user and compare the password
- Search needs MongoDB to find products
- Product detail and history also depend on database data

If MongoDB is down or unreachable, the app cannot do any of those actions.

---

## The actual root cause

The server tries to connect to MongoDB during startup in [server/config/db.js](server/config/db.js).

```js
await mongoose.connect(process.env.MONGO_URI);
```

The connection string is stored in [server/.env](server/.env).

This project is currently pointing to an Atlas cluster:

```env
MONGO_URI=mongodb+srv://yeshakatrodiya988_db_user:...@cluster0.nzxvxh8.mongodb.net/sustainabuy?retryWrites=true&w=majority
```

I verified the failure by running:

```bash
cd sustainabuy/server
node config/seed.js
```

And the actual error is:

```bash
Error: querySrv ECONNREFUSED _mongodb._tcp.cluster0.nzxvxh8.mongodb.net
```

This means the app is trying to reach the MongoDB host, but it cannot resolve or connect to it. In plain language: the database is not reachable from this environment.

---

## Why login fails

The login logic is written correctly in [server/controllers/authController.js](server/controllers/authController.js).

```js
const user = await User.findOne({ email });
```

That line only works if MongoDB is connected. The server cannot query the `users` collection if the database connection fails.

So the flow is:

1. Frontend sends login request
2. Backend receives it
3. Backend tries to query MongoDB for the user
4. MongoDB connection is broken
5. The request fails, so the user cannot log in

The same thing happens during signup:

```js
const existingUser = await User.findOne({ email });
const user = await User.create({ ... });
```

Signup fails because the server cannot insert or read the user record in MongoDB.

In short: authentication is failing because the app has no database access, not because the form logic is wrong.

---

## Why search fails

The search route is defined in [server/routes/productRoutes.js](server/routes/productRoutes.js).

```js
const products = await Product.find(filter).limit(20);
```

This query also depends on MongoDB. The system is trying to read products from the `products` collection.

But the database is not connected, so the search route cannot fetch anything. The same root cause applies:

1. Frontend sends `/api/products/search?q=...`
2. Backend tries to query `Product.find(...)`
3. MongoDB is unreachable
4. Search returns an error or empty result

The seed script in [server/config/seed.js](server/config/seed.js) also tries to connect to MongoDB and insert product data from the CSV in [ai-service/data/cleaned_products.csv](ai-service/data/cleaned_products.csv).

Because MongoDB is not reachable, the product database is never populated, so search has nothing useful to show.

---

## Why this is the real problem, not a frontend bug

The frontend is not the main blocker.

The app is calling the backend API correctly:

- [client/src/pages/Login.js](client/src/pages/Login.js)
- [client/src/pages/Signup.js](client/src/pages/Signup.js)
- [client/src/pages/Search.js](client/src/pages/Search.js)
- [client/src/services/api.js](client/src/services/api.js)

The API requests are being sent to the backend, but the backend cannot complete them because the database is unavailable.

So the request flow is:

Frontend -> API request -> Backend -> MongoDB -> database result

And right now the chain stops at MongoDB.

---

## What is happening in simple terms

Imagine the app is a restaurant:

- The frontend is the waiter taking your order
- The backend is the kitchen
- MongoDB is the storage room where user accounts and products are kept

Right now, the storage room is locked and unreachable. So even if the waiter takes the order, the kitchen cannot find the user record or the product list.

That is why login, signup, and search all fail together.

---

## What needs to be fixed

### 1. Fix MongoDB access

The database URI in [server/.env](server/.env) must be valid and reachable.

Check these issues:

- the Atlas cluster is active
- the username and password are correct
- the IP address is whitelisted in MongoDB Atlas
- the cluster is not blocked or deleted
- the network from this machine can reach the database

If you do not want to use Atlas, switch to a local MongoDB URI:

```env
MONGO_URI=mongodb://127.0.0.1:27017/sustainabuy
```

### 2. Start MongoDB before the backend

If using a local system, MongoDB must be running before `npm start`.

### 3. Seed the database

Once the database is reachable, run:

```bash
cd sustainabuy/server
node config/seed.js
```

This inserts sample products from the CSV into MongoDB.

### 4. Restart the backend

Then run:

```bash
cd sustainabuy/server
npm start
```

### 5. Test the app again

- Sign up a new user
- Log in
- Search for a product
- Open a product detail page

---

## Final conclusion

The main issue is not a broken auth form or a bad search query. The real issue is database connectivity.

MongoDB is not reachable, so:

- signup cannot save users
- login cannot find users
- search cannot read products
- the app cannot work end-to-end

This is the exact reason the authentication and product search features are failing.
