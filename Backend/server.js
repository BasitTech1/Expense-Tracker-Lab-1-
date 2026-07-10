import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv';
import transactionRoutes from './routes/transactionRoutes.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT

// Middleware
app.use(express.json());

// Database connection
connectDB();

app.use(cors({
    origin: [
        'http://127.0.0.1:5501',
        'http://localhost:5501',
        'http://127.0.0.1:5502',
        'http://localhost:5502',
        'http://127.0.0.1:5503',
        'http://localhost:5503',
        'http://127.0.0.1:5504',
        'http://localhost:5504',
        'http://127.0.0.1:5505',
        'http://localhost:5505',
        
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// Handle unhandled routes (404) - FIXED
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});