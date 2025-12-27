# SmartStay Backend Implementation Guide

This guide provides step-by-step instructions to build a fully functional backend for your SmartStay PG/Hostel discovery platform.

## 🏗️ Technology Stack Recommendation

### Option 1: Node.js + Express (Recommended for beginners)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with Prisma ORM) or MongoDB
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3 or Cloudinary
- **Real-time**: Socket.io (for chat)

### Option 2: Python + FastAPI (Modern & Fast)
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT + passlib
- **File Storage**: AWS S3 or local storage

---

## 📁 Backend Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database configuration
│   │   ├── cloudinary.js        # File upload config
│   │   └── jwt.js               # JWT configuration
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Owner.js             # Owner model
│   │   ├── PG.js                # PG listing model
│   │   ├── Review.js            # Review model
│   │   ├── Chat.js              # Chat model
│   │   ├── Notification.js      # Notification model
│   │   └── Verification.js      # Verification document model
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── pgController.js      # PG CRUD operations
│   │   ├── userController.js    # User operations
│   │   ├── ownerController.js   # Owner operations
│   │   ├── adminController.js   # Admin operations
│   │   ├── chatController.js    # Chat operations
│   │   └── searchController.js  # Search & filter logic
│   ├── routes/
│   │   ├── auth.js
│   │   ├── pgs.js
│   │   ├── users.js
│   │   ├── owners.js
│   │   ├── admin.js
│   │   └── chat.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── roleCheck.js         # Role-based access
│   │   └── upload.js            # File upload middleware
│   ├── services/
│   │   ├── emailService.js      # Email notifications
│   │   ├── smsService.js        # SMS notifications
│   │   └── aiService.js         # AI features (mock)
│   └── server.js                # Main application file
├── uploads/                      # Local file storage
├── .env                          # Environment variables
├── package.json
└── README.md
```

---

## 🚀 Step-by-Step Implementation

### Phase 1: Setup & Configuration (Day 1)

#### 1. Initialize Project
```bash
cd backend
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
npm install multer cloudinary socket.io nodemailer
npm install --save-dev nodemon
```

#### 2. Create .env File
```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smartstay
# OR for PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/smartstay

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### 3. Setup Basic Server (src/server.js)
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect Database
connectDB();

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartStay API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pgs', require('./routes/pgs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/owners', require('./routes/owners'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Phase 2: Database Models (Day 2)

#### User Model (src/models/User.js)
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['student', 'owner', 'admin'], 
    default: 'student' 
  },
  profilePicture: { type: String },
  
  // Student-specific fields
  college: { type: String },
  preferences: {
    budget: {
      min: { type: Number, default: 5000 },
      max: { type: Number, default: 15000 }
    },
    maxDistance: { type: Number, default: 5 },
    strictnessTolerance: { 
      type: String, 
      enum: ['strict', 'moderate', 'relaxed'] 
    },
    amenities: [String]
  },
  
  savedPGs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PG' 
  }],
  
  recentlyViewed: [{
    pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' },
    viewedAt: { type: Date, default: Date.now }
  }],
  
  vacancyAlerts: [{
    pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' },
    enabled: { type: Boolean, default: true }
  }],
  
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

#### PG Model (src/models/PG.js)
```javascript
const mongoose = require('mongoose');

const pgSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Basic Info
  name: { type: String, required: true },
  description: { type: String },
  address: {
    full: { type: String, required: true },
    street: { type: String },
    area: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Property Details
  gender: { 
    type: String, 
    enum: ['boys', 'girls', 'any'], 
    required: true 
  },
  roomType: { 
    type: String, 
    enum: ['single', 'double', 'triple', 'quad'],
    required: true 
  },
  
  // Pricing
  rent: { type: Number, required: true },
  deposit: { type: Number, required: true },
  maintenanceCharges: { type: Number, default: 0 },
  electricityCharges: { type: String }, // "Included" or amount
  
  // Availability
  totalBeds: { type: Number, required: true },
  availableBeds: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  lastAvailabilityUpdate: { type: Date, default: Date.now },
  
  // Features
  amenities: [String],
  rules: {
    curfewTime: { type: String },
    guestsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false }
  },
  
  // Ratings
  cleanliness: { type: Number, min: 1, max: 5, default: 3 },
  strictnessLevel: { type: Number, min: 1, max: 5, default: 3 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Media
  images: [String],
  videos: [String],
  
  // Proximity
  nearestCollege: { type: String },
  distanceFromCollege: { type: Number }, // in km
  
  // Community
  whatsappGroupLink: { type: String },
  
  // Verification
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{
    type: { type: String }, // 'trade_license', 'fire_noc', etc.
    url: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Metrics
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'flagged', 'removed'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for search optimization
pgSchema.index({ 'address.city': 1, gender: 1, rent: 1 });
pgSchema.index({ isVerified: 1, status: 1 });

module.exports = mongoose.model('PG', pgSchema);
```

#### Review Model (src/models/Review.js)
```javascript
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  pg: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PG', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  
  // Detailed ratings
  ratings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    food: { type: Number, min: 1, max: 5 },
    safety: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 }
  },
  
  title: { type: String },
  review: { type: String, required: true },
  
  // Reddit-style voting
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voteType: { type: String, enum: ['up', 'down'] }
  }],
  
  // AI Sentiment
  sentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative'] 
  },
  
  isAnonymous: { type: Boolean, default: false },
  isVerifiedStay: { type: Boolean, default: false },
  
  // Moderation
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
```

---

### Phase 3: Authentication (Day 3)

#### Auth Controller (src/controllers/authController.js)
```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'student'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Check user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('savedPGs');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

#### Auth Middleware (src/middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
};

// Role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user.role}' is not authorized` 
      });
    }
    next();
  };
};
```

---

### Phase 4: Core Features (Days 4-7)

#### PG Controller (src/controllers/pgController.js)
```javascript
const PG = require('../models/PG');

// @route   GET /api/pgs
// @desc    Get all PGs with filters
exports.getAllPGs = async (req, res) => {
  try {
    const {
      city,
      gender,
      minRent,
      maxRent,
      amenities,
      verified,
      available,
      maxDistance,
      sortBy,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = { status: 'active' };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (gender) query.gender = gender;
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }
    if (amenities) {
      const amenitiesArray = amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }
    if (verified === 'true') query.isVerified = true;
    if (available === 'true') {
      query.isAvailable = true;
      query.availableBeds = { $gt: 0 };
    }
    if (maxDistance) {
      query.distanceFromCollege = { $lte: Number(maxDistance) };
    }

    // Sorting
    let sort = {};
    if (sortBy === 'price-low') sort.rent = 1;
    else if (sortBy === 'price-high') sort.rent = -1;
    else if (sortBy === 'rating') sort.averageRating = -1;
    else if (sortBy === 'distance') sort.distanceFromCollege = 1;
    else sort.createdAt = -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const pgs = await PG.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name email phone');

    const total = await PG.countDocuments(query);

    res.json({
      success: true,
      count: pgs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: pgs
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @route   POST /api/pgs
// @desc    Create new PG listing (Owner only)
exports.createPG = async (req, res) => {
  try {
    // Add owner from authenticated user
    req.body.owner = req.user.id;

    const pg = await PG.create(req.body);

    res.status(201).json({
      success: true,
      message: 'PG listing created successfully',
      data: pg
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @route   GET /api/pgs/:id
// @desc    Get single PG
exports.getPG = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id)
      .populate('owner', 'name email phone isVerified')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name' }
      });

    if (!pg) {
      return res.status(404).json({ 
        success: false, 
        message: 'PG not found' 
      });
    }

    // Increment view count
    pg.views += 1;
    await pg.save();

    res.json({
      success: true,
      data: pg
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// More methods: updatePG, deletePG, toggleAvailability, etc.
```

---

### Phase 5: Special Features (Days 8-10)

#### Chat System with Socket.io
```javascript
// In server.js
const http = require('http');
const socketio = require('socket.io');

const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  // Join a chat room
  socket.on('joinChat', ({ chatId, userId }) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  // Send message
  socket.on('sendMessage', async ({ chatId, message, senderId }) => {
    // Save message to database
    const newMessage = await Message.create({
      chat: chatId,
      sender: senderId,
      text: message
    });

    // Emit to room
    io.to(chatId).emit('newMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
```

#### Notification System
```javascript
// src/controllers/notificationController.js
exports.sendVacancyAlert = async (pgId) => {
  const pg = await PG.findById(pgId);
  const users = await User.find({
    'vacancyAlerts.pg': pgId,
    'vacancyAlerts.enabled': true
  });

  for (const user of users) {
    await Notification.create({
      user: user._id,
      type: 'vacancy',
      title: 'New Vacancy Alert',
      message: `${pg.name} now has ${pg.availableBeds} beds available!`,
      link: `/pg/${pgId}`
    });

    // Send email/SMS (optional)
    // await sendEmail(user.email, ...);
  }
};
```

---

## 📡 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### PG Listings
- `GET /api/pgs` - Get all PGs (with filters)
- `POST /api/pgs` - Create PG (owner)
- `GET /api/pgs/:id` - Get single PG
- `PUT /api/pgs/:id` - Update PG (owner)
- `DELETE /api/pgs/:id` - Delete PG (owner/admin)
- `PUT /api/pgs/:id/availability` - Toggle availability

### User Operations
- `POST /api/users/saved/:pgId` - Save/unsave PG
- `GET /api/users/saved` - Get saved PGs
- `PUT /api/users/preferences` - Update preferences
- `POST /api/users/alerts/:pgId` - Toggle vacancy alert

### Reviews
- `GET /api/pgs/:pgId/reviews` - Get reviews
- `POST /api/pgs/:pgId/reviews` - Add review
- `PUT /api/reviews/:id/vote` - Upvote/downvote

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/pgs/pending` - Pending verifications
- `PUT /api/admin/pgs/:id/verify` - Verify PG
- `GET /api/admin/reports` - Get flagged content

### Search & Recommendations
- `GET /api/search` - Advanced search
- `GET /api/recommendations` - AI recommendations

---

## 🔧 Testing Your Backend

### Using Postman/Thunder Client

1. **Register a user**:
```
POST http://localhost:5000/api/auth/register
Body: {
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "student"
}
```

2. **Login**:
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "password123"
}
```

3. **Get PGs** (use token from login):
```
GET http://localhost:5000/api/pgs
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

---

## 🔗 Connecting Frontend to Backend

### Update Frontend API Service

Create `frontend/src/services/api.js`:
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

export const pgAPI = {
  getAll: (params) => API.get('/pgs', { params }),
  getOne: (id) => API.get(`/pgs/${id}`),
  create: (data) => API.post('/pgs', data),
  update: (id, data) => API.put(`/pgs/${id}`, data),
};

export default API;
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd backend
npm install

# Start MongoDB (if using MongoDB)
mongod

# Run development server
npm run dev

# In another terminal, run frontend
cd frontend
npm run dev
```

---

## 📚 Additional Resources

- Express.js Documentation: https://expressjs.com/
- Mongoose Documentation: https://mongoosejs.com/
- JWT Authentication: https://jwt.io/
- Socket.io: https://socket.io/
- Cloudinary: https://cloudinary.com/documentation

---

## ✅ Implementation Checklist

- [ ] Setup project structure
- [ ] Configure database
- [ ] Implement authentication
- [ ] Create all models
- [ ] Build CRUD APIs for PGs
- [ ] Implement search & filters
- [ ] Add file upload
- [ ] Create chat system
- [ ] Build notification system
- [ ] Implement admin panel APIs
- [ ] Add verification system
- [ ] Connect frontend
- [ ] Test all endpoints
- [ ] Deploy to production

---

**Estimated Time**: 10-14 days for full implementation

Good luck building your backend! 🎉
