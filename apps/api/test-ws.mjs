import { io } from 'socket.io-client';

const token = process.argv[2];
if (!token) {
  console.error('Usage: node apps/api/test-ws.mjs <jwt-token> [url]');
  process.exit(1);
}

const url = process.argv[3] ?? 'http://localhost:3000';

console.log(`Connecting to ${url} ...`);

const socket = io(url, { query: { token } });

socket.on('connect', () => {
  console.log(`Connected (socket id: ${socket.id})`);
});

socket.on('newMessage', (data) => {
  console.log('newMessage:', JSON.stringify(data, null, 2));
});

socket.on('messageRead', (data) => {
  console.log('messageRead:', JSON.stringify(data, null, 2));
});

socket.on('disconnect', (reason) => {
  console.log(`Disconnected: ${reason}`);
});

socket.on('connect_error', (err) => {
  console.error(`Connection error: ${err.message}`);
});
