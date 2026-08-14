const cors = require('cors');
const express = require('express');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const theatreRoutes = require('./routes/theatres');
const showRoutes = require('./routes/shows');
const reservationRoutes = require('./routes/reservations');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('Theater Booking API is running'));
app.use('/auth', authRoutes);
app.use('/theatres', theatreRoutes);
app.use('/shows', showRoutes);
app.use('/reservations', reservationRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
