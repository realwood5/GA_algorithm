import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { setupWebSocket } from './websocket';
import authRoutes from './routes/auth';
import pictureRoutes from './routes/pictures';
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/pictures', pictureRoutes);

console.log("Picture routes loaded");

// /pictures
// Setup WebSocket
setupWebSocket(io);

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server listening on portt ${PORT}`));
