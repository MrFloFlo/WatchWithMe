const socket = io();

// Join room
socket.emit('join-room', { roomId, username });

let isHost = false;

function updateHostUI(currentHost) {
    const btn = document.getElementById('btnRequestHost');
    if (currentHost === username) {
        isHost = true;
        btn.disabled = true;
        btn.innerText = 'You are the host';
    } else {
        isHost = false;
        btn.disabled = false;
        btn.innerText = 'Request Host';
    }
    // Also update host name display
    const hostNameElem = document.getElementById('hostName');
    if (hostNameElem) hostNameElem.innerText = currentHost;
}

// Chat
function sendChat() {
    const msg = document.getElementById('chatMsg').value.trim();
    if (!msg) return;
    socket.emit('chat-message', { roomId, username, message: msg });
    document.getElementById('chatMsg').value = '';
}

socket.on('chat-message', ({ username: fromUser, message }) => {
    const messages = document.getElementById('messages');

    const div = document.createElement('div');
    div.innerText = `${fromUser}: ${message}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    // Detect host change message
    const match = message.match(/(.+) is now the host/);
    if (match) {
        const newHost = match[1];
        updateHostUI(newHost);
    }
});
document.getElementById('chatMsg').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendChat();
    }
});


// Video sync
const video = document.getElementById('videoPlayer');
if (video) {
    video.addEventListener('play', () => {
        socket.emit('video-action', { roomId, action: 'play', currentTime: video.currentTime });
    });

    video.addEventListener('pause', () => {
        socket.emit('video-action', { roomId, action: 'pause', currentTime: video.currentTime });
    });

    video.addEventListener('seeked', () => {
        socket.emit('video-action', { roomId, action: 'seek', currentTime: video.currentTime });
    });

    socket.on('video-action', ({ action, currentTime }) => {
        if (!video) return;
        if (action === 'play') {
            video.currentTime = currentTime;
            video.play();
        } else if (action === 'pause') {
            video.currentTime = currentTime;
            video.pause();
        } else if (action === 'seek') {
            video.currentTime = currentTime;
        }
    });
}

// CONTROL BAR BUTTONS

document.getElementById('btnRequestHost').addEventListener('click', () => {
    socket.emit('request-host', { roomId, username });
    alert('Host request sent!');
});

document.getElementById('btnUploadVideo').addEventListener('click', () => {
    const url = prompt('Enter URL of the uploaded video file:');
    if (url) {
        socket.emit('change-video', { roomId, videoUrl: url });
    }
});

document.getElementById('btnYoutubeVideo').addEventListener('click', () => {
    const url = prompt('Enter YouTube video URL:');
    if (url) {
        socket.emit('change-video', { roomId, videoUrl: url, isYoutube: true });
    }
});

document.getElementById('btnDockerBrowser').addEventListener('click', () => {
    socket.emit('switch-to-docker', { roomId });
});

// Handle server events for video changes and switching view

socket.on('change-video', ({ videoUrl, isYoutube }) => {
    // Replace video player source or show YouTube embed
    const videoContainer = document.getElementById('videoContainer');
    if (!videoContainer) return;

    if (isYoutube) {
        // Embed YouTube iframe
        videoContainer.innerHTML = `
      <iframe
        id="youtubePlayer"
        width="100%"
        height="100%"
        src="${videoUrl.replace('watch?v=', 'embed/')}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
    } else {
        // Show video player with new source
        videoContainer.innerHTML = `
      <video id="videoPlayer" controls>
        <source src="${videoUrl}" type="video/mp4" />
        Your browser does not support the video tag.
      </video>`;
        setupVideoSync(); // Rebind video events for sync (function below)
    }
});

// Switch to docker iframe view
socket.on('switch-to-docker', () => {
    const videoContainer = document.getElementById('videoContainer');
    if (!videoContainer) return;

    videoContainer.innerHTML = `
    <iframe id="dockerFrame" src="http://localhost:<%= room.dockerPort %>" allowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>`;
});

// Function to rebind video sync events after changing source
function setupVideoSync() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;

    video.addEventListener('play', () => {
        socket.emit('video-action', { roomId, action: 'play', currentTime: video.currentTime });
    });

    video.addEventListener('pause', () => {
        socket.emit('video-action', { roomId, action: 'pause', currentTime: video.currentTime });
    });

    video.addEventListener('seeked', () => {
        socket.emit('video-action', { roomId, action: 'seek', currentTime: video.currentTime });
    });
}

// When host assigned or changes, update the header display
socket.on('host-assigned', () => {
    document.getElementById('hostName').innerText = username; // you became the host
});

socket.on('chat-message', ({ username: fromUser, message }) => {
    const div = document.createElement('div');
    div.innerText = `${fromUser}: ${message}`;
    document.getElementById('messages').appendChild(div);
    // Auto scroll down
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;

    // Detect host change message and update if relevant
    const hostChangeMatch = message.match(/(.+) is now the host/);
    if (hostChangeMatch) {
        const newHost = hostChangeMatch[1];
        document.getElementById('hostName').innerText = newHost;
    }
});

socket.on('host-assigned', () => {
    updateHostUI(username);
});

socket.on('chat-message', ({ message }) => {
    // Detect host change messages like "X is now the host"
    const match = message.match(/(.+) is now the host/);
    if (match) {
        updateHostUI(match[1]);
    }
});

// Also update UI right after joining room if server sends host info:
socket.emit('join-room', { roomId, username }, (roomData) => {
    updateHostUI(roomData.host);
});


// Initial bind for existing video player on page load
setupVideoSync();
