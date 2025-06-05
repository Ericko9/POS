// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const barangRoutes = require('./routes/barang');
const kategoriRoutes = require('./routes/kategori');
const supplierRoutes = require('./routes/supplier');
const kasirRoutes = require('./routes/kasir');
const notaRoutes = require('./routes/nota');
const returRoutes = require('./routes/retur');
const dashboardRoutes = require('./routes/dashboard');
const analisisRoutes = require('./routes/analisis');
const profilRoutes = require('./routes/profil');

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://pos-ericko.vercel.app',
    'https://pos-ericko.vercel.app/',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/kasir', kasirRoutes);
app.use('/api/nota', notaRoutes);
app.use('/api/retur', returRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analisis', analisisRoutes);
app.use('/api/profil', profilRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});