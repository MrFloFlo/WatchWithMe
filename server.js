// ========== server.js ==========
const express = require('express');
const session = require('express-session');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const authRoutes = require('./server/routes/auth');
const roomRoutes = require('./server/routes/rooms');
const setupSockets = require('./server/sockets');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
}));

// Views
app.set('views', path.join(__dirname, 'client', 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', authRoutes);
app.use('/rooms', roomRoutes);

// Socket.IO
setupSockets(io);

// Start Server
const PORT = process.env.PORT || 3010;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
