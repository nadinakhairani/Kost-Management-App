const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// Import Routes
const kamarRoutes = require('./routes/kamar');
const penghuniRoutes = require('./routes/penghuni');
const listrikRoutes = require('./routes/listrik');
const tahunanRoutes = require('./routes/tahunan');
const laporanRoutes = require('./routes/laporan');
const authRoutes = require('./routes/auth');

// Register Routes
app.use('/api/kamar', kamarRoutes);
app.use('/api/penghuni', penghuniRoutes);
app.use('/api/listrik', listrikRoutes);
app.use('/api/tahunan', tahunanRoutes);
app.use('/api/reports', laporanRoutes);
app.use('/api/auth', authRoutes);

// Fallback for SPA (serve index.html for undefined requests)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` Kost Data Management App is running!`);
    console.log(` Web Server: http://localhost:${PORT}`);
    console.log(`===================================================`);
});
