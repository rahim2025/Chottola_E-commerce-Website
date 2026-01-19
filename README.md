# Chottola E-Commerce Platform

A modern, full-stack e-commerce platform for a packet food shop built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🚀 Features

### Customer Features
- Browse and search products
- Filter products by category, price, and ratings
- Add products to cart and wishlist
- User authentication (register/login)
- Place orders with multiple payment methods
- Track order status
- Write product reviews
- Manage user profile

### Admin Features
- Dashboard with analytics and statistics
- Manage products (CRUD operations)
- Manage categories
- Order management
- User management
- Inventory tracking
- View sales reports

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
