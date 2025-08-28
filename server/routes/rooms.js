const express = require('express');
const router = express.Router();
const { requireLogin } = require('./auth');
const { v4: uuidv4 } = require('uuid');

// In-memory room store for demo
const rooms = [
  { id: 'general', name: 'General', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'news', name: 'News', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'friends', name: 'Friends', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'movie-night', name: 'Movie Night', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'action', name: 'Action', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'comedy', name: 'Comedy', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'drama', name: 'Drama', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'horror', name: 'Horror', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
  { id: 'sci-fi', name: 'Sci-Fi', type: 'video', videoUrl: '/sample.mp4', dockerPort: 5800, users: [] },
];


router.get('/', requireLogin, (req, res) => {
  res.render('select_room', {
    username: req.session.username,
    rooms
  });
});

router.post('/create', requireLogin, (req, res) => {
  const { name, type } = req.body;
  const newRoom = {
    id: uuidv4(),
    name,
    type,
    videoUrl: '/sample.mp4',
    dockerPort: 5800,
    users: []
  };
  rooms.push(newRoom);
  res.json({ success: true, roomId: newRoom.id });
});

router.get('/:id', requireLogin, (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.send('Room not found');
  // Add host info from your socket room state (or fallback)
  // For demo, let's assume rooms state is accessible here or you can fetch host info from your rooms data
  const host = room.host || 'No host';

  res.render('showroom', {
    room,
    username: req.session.username,
    host
  });
});

module.exports = router;
