import http from 'http';
import app from './src/app.js';
import { initSocket } from './src/sockets/index.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// 1. Connect to MongoDB FIRST
await connectDB();

// 2. Create HTTP server
const server = http.createServer(app);

// 3. Initialize Socket.IO on top of the HTTP server
initSocket(server);

// 4. Start listening
server.listen(PORT, () => {
  console.log(`[Server] Samvaad Live running on port ${PORT}`);
});
