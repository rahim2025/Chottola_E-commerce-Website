# Chottola E-commerce Website

A full-stack MERN (MongoDB, Express, React, Node.js) e-commerce platform for selling imported food, bakery items, frozen foods, and specialty products.

## 🚀 Live Demo

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## ✨ Features

### ✅ Completed Features

#### 🔐 Authentication & Security
- [x] User registration with email verification
- [x] Secure login with JWT tokens
- [x] Password hashing with bcrypt
- [x] Role-based access control (Admin, User)
- [x] Protected routes and middleware
- [x] CORS protection
- [x] Rate limiting
- [x] XSS protection
- [x] SQL injection prevention
- [x] Helmet security headers

#### 🛍️ Product Management
- [x] Complete CRUD operations for products
- [x] Product categorization
- [x] Multi-image upload with Cloudinary
- [x] Product variants and attributes
- [x] SKU and barcode support
- [x] Stock management
- [x] Price and discount management
- [x] Featured products
- [x] Product ratings and reviews
- [x] Bulk product operations (Admin)

#### 🔍 Advanced Search & Filtering
- [x] Full-text search across products
- [x] Search by name, brand, description, tags, SKU
- [x] Real-time search suggestions
- [x] Multi-select category filtering
- [x] Multi-select brand filtering
- [x] Price range filtering
- [x] Stock availability filter
- [x] Rating filter
- [x] Featured products filter
- [x] 9 sorting options:
  - Newest/Oldest
  - Price: Low to High/High to Low
  - Name: A-Z/Z-A
  - Popularity (most purchased)
  - Highest rated
  - Biggest discount
- [x] URL state management for filters
- [x] Debounced search (300ms)
- [x] Performance-optimized with MongoDB indexes

#### 🛒 Shopping Cart & Checkout
- [x] Add/remove products from cart
- [x] Update product quantities
- [x] Real-time price calculations
- [x] Cart persistence (localStorage + backend)
- [x] Cart count badge in navigation
- [x] Authentication-aware cart sync
- [x] Discount and coupon support
- [x] Tax and shipping calculations
- [x] Empty cart state
- [x] Complete checkout process
- [x] Order summary
- [x] Multiple payment methods
- [x] Cash on Delivery (COD) implemented
- [x] Order placement with inventory validation

#### 📦 Order Management
- [x] Order creation with transaction support
- [x] Order history for users
- [x] Order details view
- [x] Order status tracking
- [x] Admin order management
- [x] Order status updates
- [x] Inventory sync on order placement
- [x] Order cancellation
- [x] Shipping information

#### 📊 Category Management
- [x] Category CRUD operations
- [x] Hierarchical categories (parent/child)
- [x] Category slug generation
- [x] Category images
- [x] Featured categories
- [x] Product count per category

#### 👤 User Management
- [x] User profile management
- [x] Update profile information
- [x] Change password
- [x] Order history
- [x] Address management
- [x] Admin user management
- [x] User role assignment

#### ⭐ Reviews & Ratings
- [x] Product reviews
- [x] 5-star rating system
- [x] Review moderation
- [x] Average rating calculation
- [x] Review filtering by rating
- [x] Verified purchase reviews

#### 📱 UI/UX Features
- [x] Responsive design (mobile, tablet, desktop)
- [x] Modern, clean interface
- [x] Tailwind CSS styling
- [x] Loading states and spinners
- [x] Toast notifications
- [x] Error handling
- [x] Form validation
- [x] Pagination
- [x] Quick search in navbar
- [x] Product cards with hover effects
- [x] Image optimization
- [x] Smooth animations and transitions

#### 🎯 Admin Panel Features
- [x] Admin dashboard
- [x] Product management interface
- [x] Category management
- [x] User management
- [x] Order management
- [x] Stock management
- [x] Bulk operations
- [x] Analytics and reports

#### 🏪 Food-Specific Features
- [x] Expiry date tracking
- [x] Batch number management
- [x] Nutritional information
- [x] Allergen warnings
- [x] Ingredient lists
- [x] Storage requirements
- [x] Country of origin
- [x] Certifications (Halal, Organic, etc.)
- [x] Weight and dimensions

#### 🔧 Performance Optimizations
- [x] MongoDB compound indexes
- [x] Aggregation pipelines
- [x] Debounced search inputs
- [x] Lazy loading
- [x] Efficient pagination
- [x] Optimized database queries
- [x] Field projection
- [x] Response caching potential

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router v6
- Context API for state management
- Tailwind CSS for styling
- Axios for API calls
- React Toastify for notifications
- React Icons

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT authentication
- Bcrypt for password hashing
- Cloudinary for image storage
- Express Validator for input validation
- Helmet for security
- CORS enabled

## 📁 Project Structure

```
Chottola/
├── backend/
│   ├── config/         # Database & Cloudinary config
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, admin, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── utils/          # Helper functions
│   ├── .env.example    # Environment variables template
│   ├── package.json
│   └── server.js       # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # React context providers
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── App.jsx
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
└── ARCHITECTURE.md     # Detailed architecture documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Start the server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm start
```

Application will run on `http://localhost:3000`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Reviews
- `POST /api/reviews/:productId` - Create review
- `GET /api/reviews/:productId` - Get product reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## 🔐 Default Admin Credentials

After setting up, create an admin user by registering and manually updating the `role` field in MongoDB to `'admin'`.

## 📱 Mobile Responsive

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🚀 Deployment

### Backend Deployment (Render/Railway/Heroku)
1. Push code to GitHub
2. Connect repository to hosting service
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Build the app: `npm run build`
2. Deploy the `build` folder
3. Set environment variables

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Update backend `.env` with Atlas connection string

## 📊 Development Roadmap

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed development phases and future enhancements.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - Chottola E-Commerce Platform

## 🙏 Acknowledgments

- MongoDB for database
- Express.js for backend framework
- React for frontend library
- Node.js for runtime environment
- Tailwind CSS for styling
- Cloudinary for image hosting

---

**Built with ❤️ for Chottola Packet Food Shop**
