# Rice Mill Supply Chain Management API

This is a comprehensive backend API developed as part of the **Kuteeram Internship Program**. The project implements a supply chain management system for rice mills, connecting buyers, sellers (rice mills), and transportation providers (lorries) through a RESTful API with real-time notifications.

## 📋 Project Overview

The Rice Mill Supply Chain Management API facilitates:

- **Buyers**: Search for rice products, place bids, make payments, and track deliveries
- **Sellers (Rice Mills)**: List rice products, manage inventory, accept/reject orders
- **Lorries**: Accept transportation jobs, update locations, verify pickups, and manage deliveries
- **Real-time communication**: Notifications for order status updates, bids, and payment confirmations

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety and enhanced developer experience
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication and authorization
- **Socket.IO** - Real-time bidirectional communication
- **GeoSpatial Indexing** - Location-based searching and distance calculations
- **bcryptjs** - Password hashing
- **Validator** - Input validation
- **Cookie-parser** - Cookie management

## 📁 Project Structure

```
backend-assign-2/
├── src/
│   ├── buyer/                 # Buyer-related functionality
│   ├── seller/                # Seller-related functionality
│   ├── lorry/                 # Lorry-related functionality
│   ├── models/                # MongoDB schema models
│   ├── middleware/            # Express middleware
│   ├── controllers/           # Main controllers
│   ├── routes/                # API routes
│   ├── config/                # Configuration files
│   ├── constants/             # Application constants
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── index.ts               # Entry point of the application
│   └── socket.ts              # Socket.IO configuration
├── .env                       # Environment variables
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── .gitignore                 # Git ignore rules
```

## 📂 Directory and File Explanations

### `/src` directory

#### `/buyer`

- **buyer.controller.ts**: Implements buyer functionalities like registration, login, product search, bidding, etc.
- **buyer.model.ts**: MongoDB schema for buyer data
- **buyer.routes.ts**: API routes for buyer-related endpoints

#### `/seller`

- **seller.controller.ts**: Manages seller operations like registration, login, product management, order acceptance
- **seller.model.ts**: MongoDB schema for seller data with geospatial indexing
- **seller.routes.ts**: API routes for seller-related endpoints

#### `/lorry`

- **lorry.controller.ts**: Handles lorry agency operations like registration, job acceptance, location updates
- **lorry.model.ts**: MongoDB schema for lorry data with geospatial indexing
- **lorry.routes.ts**: API routes for logistics operations

#### `/models`

- **order.model.ts**: Schema for order data with status tracking
- **product.model.ts**: Schema for rice product data

#### `/middleware`

- **auth.middleware.ts**: JWT verification and user identification
- **buyer.middleware.ts**: Buyer role verification
- **seller.middleware.ts**: Seller role verification
- **lorry.middleware.ts**: Lorry role verification

#### `/controllers`

- **order.controller.ts**: Order status management and payment processing

#### `/routes`

- **order.routes.ts**: Routes for order management

#### `/config`

- **db.ts**: MongoDB connection setup

#### `/constants`

- **index.ts**: Application-wide constants (e.g., transport rates)

#### `/types`

- **index.ts**: TypeScript interfaces and enums for the application

#### `/utils`

- **index.ts**: Utility functions like haversine distance calculation
- **jwt.ts**: JWT generation and cookie management

#### Root Files

- **index.ts**: Express application setup and server initialization
- **socket.ts**: Socket.IO configuration for real-time communication

## 🔒 Authentication Flow

### Buyer Authentication

1. **Registration**:

   - Endpoint: `POST /api/v1/buyer/register`
   - Payload: name, email, phone, password
   - Process:
     - Validate input data
     - Check for existing users
     - Hash password with bcrypt
     - Create buyer record in database
     - Generate JWT token and set cookie
   - Response: User details and success message

2. **Login**:
   - Endpoint: `POST /api/v1/buyer/login`
   - Payload: email/phone, password
   - Process:
     - Find user by email or phone
     - Compare password with bcrypt
     - Generate JWT token and set cookie
   - Response: User details and success message

### Seller Authentication

1. **Registration**:

   - Endpoint: `POST /api/v1/seller/register`
   - Payload: name, email, password, city, location (coordinates), millName
   - Process:
     - Validate all fields
     - Verify email format and password length
     - Hash password with bcrypt
     - Create seller with geospatial data
     - Generate JWT token and set cookie
   - Response: Seller details and success message

2. **Login**:
   - Endpoint: `POST /api/v1/seller/login`
   - Payload: email, password
   - Process:
     - Find seller by email
     - Verify password with bcrypt
     - Generate JWT token and set cookie
   - Response: Seller details and success message

### Lorry Authentication

1. **Registration**:

   - Endpoint: `POST /api/v1/lorry/register`
   - Payload: agencyName, phone, email, password, gps, vehicleNumber, driverName, driverPhone
   - Process:
     - Validate all fields and formats
     - Hash password with bcrypt
     - Create lorry with geospatial data
     - Generate JWT token and set cookie
   - Response: Lorry details and success message

2. **Login**:
   - Endpoint: `POST /api/v1/lorry/login`
   - Payload: email, password
   - Process:
     - Find lorry by email
     - Verify password with bcrypt
     - Generate JWT token and set cookie
   - Response: Lorry details and success message

## 🔄 Business Process Flow

1. **Product Listing**:

   - Sellers add rice products with type, quantity, and price
   - Products initially marked as unavailable
   - Sellers can update product details and mark as available

2. **Order Placement**:

   - Buyers search for products by type and quantity
   - Buyers can find nearby rice mills using geospatial queries
   - Buyers place bids on products with a specified price and quantity
   - System generates OTP for delivery verification
   - Transport cost calculated based on distance

3. **Order Fulfillment**:

   - Sellers accept or reject bids
   - Buyers make payment
   - System finds nearest available lorry for delivery
   - Lorry accepts or rejects the job
   - Lorry updates location during transit
   - Lorry verifies pickup with OTP
   - Buyer confirms delivery completion

4. **Real-time Notifications**:
   - Sellers notified when new bids are placed
   - Buyers notified when orders are accepted
   - Buyers notified when payments are processed
   - Updates on delivery status

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or above recommended)
- npm (comes with Node.js)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Aftab3008/backend-assign-2
cd backend-assign-2
```

2. **Set up environment variables**
   Create a `.env` file in the root directory with:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rice-mill-supply-chain
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES=7  # days
ADMIN_EMAIL=admin@example.com
```

3. **Install dependencies**

```bash
npm install
```

4. **Build and start the server**

```bash
npm run build
npm start
```

For development:

```bash
npm run dev
```

## 📝 API Documentation

For detailed API documentation, refer to the API endpoints listed in the route files:

- `/src/buyer/buyer.routes.ts`
- `/src/seller/seller.routes.ts`
- `/src/lorry/lorry.routes.ts`
- `/src/routes/order.routes.ts`

## 📱 Features

1. **Geospatial Querying**: Find nearby rice mills and lorries
2. **Real-time Communication**: Socket.io for instant notifications
3. **Authentication and Authorization**: JWT-based role system
4. **Order Lifecycle Management**: From bidding to delivery
5. **Location Tracking**: Live updates for transportation
