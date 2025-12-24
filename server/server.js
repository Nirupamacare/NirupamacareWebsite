import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow all origins for now (development)
app.use(express.json()); // Parse JSON bodies

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('📥 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Routes
app.use('/api', apiRoutes);

// Root Endpoint Check
app.get('/', (req, res) => {
    res.send('NirupamaCare Backend is Running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
