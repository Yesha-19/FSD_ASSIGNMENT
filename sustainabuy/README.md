# SustainaBuy

SustainaBuy is a sustainable product recommendation and nutrition scoring application that helps users discover healthier and more eco-friendly products. The project combines a React frontend, a Node.js/Express backend, and a Python AI service for product score prediction.

## Current Status

### Completed / Implemented

The following parts are already in place in the current codebase:

- Project structure for frontend, backend, and AI service is created.
- MongoDB connection setup is configured in the backend.
- User model and authentication flow are implemented.
- Register and login APIs are working with JWT-based authentication.
- Product model and product search API are implemented.
- Product score API is integrated with the Python AI microservice.
- User history save/get routes are implemented with protected access.
- AI prediction service is built using Flask.
- CSV-based product data seeding script is included.
- Python model loading and prediction logic for nutrition scoring is ready.

### In Progress / Not Fully Completed

These areas are not fully completed yet based on the current project state:

- Frontend UI pages and full user experience are still being built.
- Product detail and dashboard flow are not fully wired up in the client app.
- Admin or advanced product management features are not fully implemented.
- Deployment and production configuration are still pending.

## Current Tech Stack

### Frontend
- React.js
- JavaScript
- Axios for API communication

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS and dotenv

### AI / Data Service
- Python
- Flask
- NumPy
- pandas
- scikit-learn
- joblib

### Database / Data
- MongoDB Atlas / MongoDB
- CSV dataset for product data import

## Project Architecture

- client/ — React frontend application
- server/ — Express backend with APIs and MongoDB logic
- ai-service/ — Python AI microservice for nutrition score prediction

## Main Functional Flow

1. User registers or logs in through the backend API.
2. Product search retrieves matching items from MongoDB.
3. Product details are sent to the AI microservice.
4. The AI service predicts a nutrition score based on product attributes.
5. User product history is saved and retrieved securely.

## Notes

This project currently has a strong backend and AI foundation in place, while the frontend experience and final end-to-end product flow are still under development.

---

This README reflects the current implementation status of the codebase as it exists in the repository.
