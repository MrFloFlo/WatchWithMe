const rooms = {}; // roomId => { users: [], host: username, videoUrl, isYoutube, type, dockerPort, ... }

// Helper to initialize room if needed
function ensureRoom(roomId) {
    if (!rooms[roomId]) {
        rooms[roomId] = { users: [], host: null, videoUrl: '/sample.mp4', isYoutube: false, type: 'video', dockerPort: 5800 };
    }
}

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('join-room', ({ roomId, username }) => {
            ensureRoom(roomId);

            socket.join(roomId);
            socket.username = username;
            socket.roomId = roomId;

            const room = rooms[roomId];
            room.users.push(username);

            // If no host, assign this user as host
            if (!room.host) {
                room.host = username;
                socket.emit('host-assigned');
            }

            // Notify others
            socket.to(roomId).emit('chat-message', {
                username: 'System',
                message: `${username} joined the room`
            });

            // Send current video info to the new user
            socket.emit('change-video', { videoUrl: room.videoUrl, isYoutube: room.isYoutube });
        });

        socket.on('chat-message', ({ roomId, username, message }) => {
            io.to(roomId).emit('chat-message', { username, message });
        });

        socket.on('video-action', ({ roomId, action, currentTime }) => {
            socket.to(roomId).emit('video-action', { action, currentTime });
        });

        socket.on('request-host', ({ roomId, username }) => {
            const room = rooms[roomId];
            if (!room) return;

            // Notify current host of request (assuming one host)
            io.to(roomId).emit('chat-message', {
                username: 'System',
                message: `${username} requested to be the host.`
            });
            // You could expand this to send a private event to host to approve
        });

        socket.on('change-video', ({ roomId, videoUrl, isYoutube }) => {
            const room = rooms[roomId];
            if (!room) return;

            // Only allow host to change video
            if (socket.username !== room.host) {
                socket.emit('chat-message', { username: 'System', message: 'Only the host can change the video.' });
                return;
            }

            room.videoUrl = videoUrl;
            room.isYoutube = !!isYoutube;

            io.to(roomId).emit('change-video', { videoUrl, isYoutube });
        });

        socket.on('switch-to-docker', ({ roomId }) => {
            const room = rooms[roomId];
            if (!room) return;

            // Only allow host to switch view
            if (socket.username !== room.host) {
                socket.emit('chat-message', { username: 'System', message: 'Only the host can switch to Docker browser.' });
                return;
            }

            room.type = 'docker';

            io.to(roomId).emit('switch-to-docker');
        });

        socket.on('disconnect', () => {
            const { roomId, username } = socket;
            if (roomId && rooms[roomId]) {
                const room = rooms[roomId];
                room.users = room.users.filter(u => u !== username);

                socket.to(roomId).emit('chat-message', {
                    username: 'System',
                    message: `${username} left the room`
                });

                // If host left, assign new host if users remain
                if (room.host === username) {
                    if (room.users.length > 0) {
                        room.host = room.users[0];
                        io.to(roomId).emit('chat-message', {
                            username: 'System',
                            message: `${room.host} is now the host`
                        });
                        // Optionally notify new host privately
                    } else {
                        room.host = null;
                    }
                }
            }
        });

        socket.on('request-host', ({ roomId, username }) => {
            const room = rooms[roomId];
            if (!room) return;

            if (!room.host) {
                // No host yet — assign requester as host immediately
                room.host = username;
                io.to(roomId).emit('chat-message', {
                    username: 'System',
                    message: `${username} is now the host`
                });
                io.to(roomId).emit('host-assigned'); // notify everyone (or just requester)
            } else {
                // Host exists — just notify host request
                io.to(roomId).emit('chat-message', {
                    username: 'System',
                    message: `${username} requested to be the host.`
                });
            }
        });

        socket.on('send-message', ({ room, username, message }) => {
            io.to(room).emit('receive-message', {
                username,
                message,
                timestamp: new Date().toLocaleTimeString()
            });
        });

    });
};
