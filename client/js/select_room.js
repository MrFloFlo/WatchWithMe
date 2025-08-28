document.getElementById('createRoomForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const roomName = document.getElementById('roomName').value;

  const response = await fetch('/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: roomName, type: 'video' }) // or 'docker'
  });

  const data = await response.json();
  if (data.success) {
    window.location.href = `/rooms/${data.roomId}`;
  } else {
    alert('Failed to create room.');
  }
});
