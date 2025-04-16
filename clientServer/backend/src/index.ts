// import express from 'express';
// import http from 'http';
// import { Server, Socket } from 'socket.io';
// import cors from 'cors';

// // Initialize Express App and HTTP Server
// const app = express();
// const server = http.createServer(app);

// // Enable CORS Middleware for Express
// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type'],
// }));

// // Initialize Socket.IO with CORS support
// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//   },
// });

// // Store user colors in memory
// const userColors: Record<string, string> = {};

// // Generate a random color
// const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

// // Define Express Route
// app.get('/', (req, res) => {
//   res.send('Socket.IO Server Running');
// });

// // Socket.IO Logic
// io.on('connection', (socket: Socket) => {
//   console.log(`User connected: ${socket.id}`);

//   if (!userColors[socket.id]) {
//     userColors[socket.id] = getRandomColor();
//   }

//   // Listen for room joining
//   socket.on('join_room', (data: { pictureId: string }) => {
//     const { pictureId } = data;
//     socket.join(pictureId);
//     console.log(`User ${socket.id} joined room: ${pictureId}`);
    
//     // Inform the user about their room assignment
//     socket.emit('joined_room', { pictureId });
//   });

//   socket.on('mouse_event', (data: { pictureId: string; x: number; y: number }) => {
//     const { pictureId, x, y } = data;
//     console.log(pictureId);

//     socket.to(pictureId).emit('mouse_update', {
//       id: socket.id,
//       x,
//       y,
//       color: userColors[socket.id],
//     });
//   });

//   socket.on('cell_action', (data: { pictureId: string; row: number; col: number; val: string | null }) => {
//     const { pictureId, row, col, val } = data;
//     socket.to(pictureId).emit('cell_update', {
//       id: socket.id,
//       row,
//       col,
//       val,
//     });
//   });

//   socket.on('grid_size_change', (data: { pictureId: string; gridSize: number }) => {
//     const { pictureId, gridSize } = data;
//     socket.to(pictureId).emit('grid_size_update', { gridSize });
//   });

//   socket.on('disconnect', () => {
//     console.log(`User disconnected: ${socket.id}`);
//     delete userColors[socket.id];
//     io.emit('user_disconnected', { id: socket.id });
//   });
// });



// // Start the Server
// const PORT = process.env.PORT || 8000;
// server.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
