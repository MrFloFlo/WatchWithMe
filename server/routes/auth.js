const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const path = require('path');

const users = {}; // In-memory storage for demo (replace with DB in production)

// Show login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Show register page
router.get('/register', (req, res) => {
  res.render('register');
});


// Preload temporary user "flo" with password "1234"
(async () => {
  let hashedPassword = await bcrypt.hash('1234', 10);
  users['flo'] = { username: 'flo', password: hashedPassword };
  hashedPassword = await bcrypt.hash('1234', 10);
  users['ben'] = { username: 'ben', password: hashedPassword };
})();

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.username = username;
    return res.redirect('/rooms');
  }
  res.send('Login failed. <a href="/login">Try again</a>');
});

// Handle registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.send('User already exists. <a href="/register">Try again</a>');
  }
  const hashed = await bcrypt.hash(password, 10);
  users[username] = { username, password: hashed };
  req.session.username = username;
  res.redirect('/rooms');
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.username) return res.redirect('/login');
  next();
}

module.exports = router;
module.exports.requireLogin = requireLogin;
