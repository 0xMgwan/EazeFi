const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wallets', require('./routes/wallets'));
app.use('/api/remittances', require('./routes/remittances'));
app.use('/api/sdex', require('./routes/sdex'));
app.use('/api/mpesa', require('./routes/mpesaRemittance')); // Add M-Pesa routes
app.use('/sep24', require('./routes/sep/sep24'));
app.use('/sep31', require('./routes/sep/sep31'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// For traditional hosting environments
if (process.env.NODE_ENV !== 'vercel') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

// Export the Express API for Vercel serverless deployment
module.exports = app;
