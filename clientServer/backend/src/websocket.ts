import { Server, Socket } from 'socket.io';

const userColors: Record<string, string> = {};
const userNames: Record<string, string> = {}; 

const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export function setupWebSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    if (!userColors[socket.id]) {
      userColors[socket.id] = getRandomColor();
    }


    socket.on('set_username', ({ username }) => {
      userNames[socket.id] = username; // Store the username for the user
    });

    socket.on('join_room', ({ pictureId }) => {
      socket.join(pictureId);
      socket.emit('joined_room', { pictureId });
    });

    socket.on('mouse_event', ({ pictureId, x, y }) => {
      socket.to(pictureId).emit('mouse_update', {
        id: socket.id, x, y, color: userColors[socket.id],
      });
    });

    socket.on('cell_action', ({ pictureId, row, col, val }) => {
      socket.to(pictureId).emit('cell_update', { id: socket.id, row, col, val });
    });

    socket.on('grid_size_change', ({ pictureId, gridSize }) => {
      socket.to(pictureId).emit('grid_size_update', { gridSize });
    });



    // Handle sending a message
    socket.on('send_message', (message: string) => {

      // console.log(message);

       const username = userNames[socket.id] || 'Anonymous'; // Use 'Anonymous' if username is not set
       const formattedMessage = `${username}: ${message}`;
 
       // Send the message to the same user and others in the room
       socket.emit('receive_message', { message: formattedMessage });  // Send to sender
       socket.to([...socket.rooms]).emit('receive_message', { message: formattedMessage }); // Broadcast to others in the same room


       console.log(formattedMessage);

    });
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      delete userColors[socket.id];
      io.emit('user_disconnected', { id: socket.id });
    });
  });
}
