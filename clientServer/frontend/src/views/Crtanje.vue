<template>
  <div class="draw-grid-page">
    <div class="main-container">
      <div>
        <h1>Draw on Grid</h1>

        <!-- Tool Panel -->
        <div class="tool-panel">
          <img
            :class="{ active: activeTool === 'pencil' }"
            :src="pencilIcon"
            alt="Pencil"
            @click="setActiveTool('pencil')"
            class="tool-icon"
          />
          <img
            :class="{ active: activeTool === 'eraser' }"
            :src="eraserIcon"
            alt="Eraser"
            @click="setActiveTool('eraser')"
            class="tool-icon"
          />
          <div class="grid-size-control">
            <button @click="decreaseGridSize">-</button>
            <span>{{ gridSize }}</span>
            <button @click="increaseGridSize">+</button>
          </div>
          <input type="color" v-model="currentColor" class="color-picker" />
          <button @click="saveDrawing" class="save-button">Save</button>
          <button v-if="hasPictureId" @click="updateDrawing" class="update-button">Update</button>
        </div>

        <!-- Grid -->
        <div
          class="grid-container"
          @mousedown="startDrawing"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @mousemove="handleMouseMove"
        >
          <div
            v-for="(row, rowIndex) in grid"
            :key="'row-' + rowIndex"
            class="grid-row"
          >
            <div
              v-for="(cell, colIndex) in row"
              :key="'col-' + colIndex"
              class="grid-cell"
              :style="{ backgroundColor: cell || '#fff', ...gridCellStyle }"
              @mousedown="handleCellAction(rowIndex, colIndex)"
              @mouseover="handleCellAction(rowIndex, colIndex)"
            ></div>
          </div>

          <!-- Other Users' Cursors -->
          <div
            v-for="(cursor, userId) in cursors"
            :key="userId"
            class="user-cursor"
            :style="{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              backgroundColor: cursor.color,
            }"
          ></div>
        </div>
      </div>

      <!-- Live Chat -->
      <div class="live-chat">
    <div class="chat-header">Live Chat</div>
    <div class="chat-messages" ref="chatMessages" @scroll="handleScroll">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="chat-message"
      >
        {{ message }}
      </div>
    </div>
    <div class="chat-input">
      <input
        v-model="chatInput"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
    </div>
  </div>
</template>

<script>
import pencilIcon from '@/assets/pencil.png';
import eraserIcon from '@/assets/eraser.png';
import { useGridStore } from '@/stores/gridd';
import { io } from 'socket.io-client';
import { useUserStore } from '@/stores/user';

export default {
  name: 'DrawGridPage',
  data() {
    return {
      isDrawing: false,
      activeTool: 'pencil',
      gridSize: 10,
      currentColor: '#4caf50',
      pencilIcon,
      eraserIcon,
      socket: null,
      cursors: {}, // Reactive cursor tracking
      messages: [],
      chatInput: '',
    };
  },
  computed: {
    grid() {
      const gridStore = useGridStore();
      return gridStore.grid;
    },
    gridCellStyle() {
      const size = `${500 / this.gridSize}px`;
      return {
        width: size,
        height: size,
      };
    },
    hasPictureId() {
      return !!this.$route.params.pictureId;
    },


  },
  methods: {
    startDrawing() {
      this.isDrawing = true;
    },
    stopDrawing() {
      this.isDrawing = false;
    },
    handleCellAction(row, col) {
      const pictureId = this.$route.params.pictureId;
      if (this.isDrawing || event.type === 'mousedown') {
        const gridStore = useGridStore();
        const value = this.activeTool === 'pencil' ? this.currentColor : '#FFFFFF';
        gridStore.updateCell(row, col, value);

        if (this.socket) {
          this.socket.emit('cell_action', {
            pictureId,
            row,
            col,
            val: value,
          });
        }
      }
    },
    setActiveTool(tool) {
      this.activeTool = tool;
    },
    increaseGridSize() {
      const pictureId = this.$route.params.pictureId;
      if (this.gridSize < 24) {
        this.gridSize++;
        this.resizeGrid();
      }
      // Emit grid size change to server
      if (this.socket) {
        this.socket.emit('grid_size_change', {
          pictureId,
          gridSize: this.gridSize,
        });
      }
    },
    decreaseGridSize() {
      const pictureId = this.$route.params.pictureId;
      if (this.gridSize > 1) {
        this.gridSize--;
        this.resizeGrid();
      }
      // Emit grid size change to server
      if (this.socket) {
        this.socket.emit('grid_size_change', {
          pictureId,
          gridSize: this.gridSize,
        });
      }
    },
    resizeGrid() {
      const gridStore = useGridStore();
      const newGrid = Array.from({ length: this.gridSize }, (_, rowIndex) =>
        Array.from({ length: this.gridSize }, (_, colIndex) =>
          gridStore.grid[rowIndex]?.[colIndex] || null
        )
      );

      gridStore.grid = newGrid;
      gridStore.rows = this.gridSize;
      gridStore.columns = this.gridSize;
    },
    saveDrawing() {
      const gridStore = useGridStore();
      const name = prompt('Enter a name for your project:');
      if (name) {
        gridStore.setName(name);
        
        const audio = new Audio('/sound/gta-san-andreas-mission-complete-sound-hq.mp3');
        audio.play();


        alert(`Project "${name}" saved!`);
        
      }
      gridStore.createPicture();
    },

    async updateDrawing() {
      const gridStore = useGridStore();
      const pictureId = this.$route.params.pictureId;

      try {
        await gridStore.updatePicture(pictureId, useUserStore().token);
        const audio = new Audio('/sound/gta-san-andreas-mission-complete-sound-hq.mp3');
        audio.play();
        alert('Picture updated successfully!');

      } catch (error) {
        alert(error); // Display the error message thrown by `updatePicture`
      }
    },
  
    handleMouseMove(event) {
      const pictureId = this.$route.params.pictureId;

      if (this.socket) {
        this.socket.emit('mouse_event', {
          pictureId, // Include pictureId
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    initializeSocket() {
      const pictureId = this.$route.params.pictureId; // Retrieve pictureId from route params

      console.log(`Initializing socket for pictureId: ${pictureId}`);

      this.socket = io('http://localhost:8000');

      // Join the room for the specific picture
      this.socket.emit('join_room', { pictureId });

      // Listen for room-related events
      this.socket.on('joined_room', (data) => {
        console.log(`Joined room: ${data.pictureId}`);
      });

      this.socket.on('mouse_update', (data) => {
        this.cursors[data.id] = {
          x: data.x,
          y: data.y,
          color: data.color || this.getRandomColor(),
        };
      });

      this.socket.on('cell_update', (data) => {
        const gridStore = useGridStore();
        gridStore.updateCell(data.row, data.col, data.val);
      });

      this.socket.on('grid_size_update', (data) => {
        this.gridSize = data.gridSize;
        this.resizeGrid();
      });

      this.socket.on('user_disconnected', (data) => {
        delete this.cursors[data.id];
      });

      // Listen to incoming chat messages
      this.socket.on('receive_message', (data) => {
        this.messages.push(data.message);
      });
    },
    getRandomColor() {
      return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    },
    sendMessage() {
      if (this.chatInput.trim() && this.socket) {
        this.socket.emit('send_message', this.chatInput.trim());
        this.chatInput = '';
      }
    },
    setUsername() {
      const userStore = useUserStore();
      const username = userStore.username || 'Anonymous';
      if (this.socket) {
        this.socket.emit('set_username', { username });
      }
    },

    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages;
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    },
    handleScroll() {
      const chatMessages = this.$refs.chatMessages;
      if (!chatMessages) return;

      const { scrollTop, scrollHeight, clientHeight } = chatMessages;
      // Check if the user is near the bottom of the chat
      this.isAutoScroll = scrollTop + clientHeight >= scrollHeight - 10;
    },




  },
  mounted() {
    const gridStore = useGridStore();
    const pictureId = this.$route.params.pictureId;

    this.initializeSocket();
    this.setUsername();

    gridStore.initializeGrid(pictureId).then(({ rows, columns }) => {
      this.gridSize = rows;
    });

    gridStore.rows = this.gridSize;
    gridStore.columns = this.gridSize;


  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
/* Tool Panel */
.tool-panel {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 20px;
}

/* Cursor Styling */
.user-cursor {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* Grid Styles */
.grid-container {
  display: flex;
  flex-direction: column;
  user-select: none;
  width: 500px;
  height: 500px;
  border: 1px solid #000000;
  overflow: hidden;
}

.grid-row {
  display: flex;
}

.grid-cell {
  border: 1px solid #000000;
  cursor: pointer;
}

/* Tool Panel Styles */
.tool-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.tool-icon.active {
  opacity: 1;
}

.grid-size-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grid-size-control span {
  font-size: 16px;
  font-weight: bold;
}

.grid-size-control button {
  font-size: 16px;
  width: 30px;
  height: 30px;
  border: 1px solid #000000;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.grid-size-control button:hover {
  background-color: #e0e0e0;
}

/* Color Picker */
.color-picker {
  width: 40px;
  height: 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

/* Save Button */
.save-button {
  padding: 5px 10px;
  font-size: 14px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:hover {
  background-color: #0056b3;
}

/* Update Button */
.update-button {
  padding: 5px 10px;
  font-size: 14px;
  color: #fff;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.update-button:hover {
  background-color: #218838;
}





/* Live chat styles */
/* Live chat styles */
.live-chat {
  position: fixed;
  right: 100px;
  top: 100px;
  width: 300px;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  background-color: #292b2f;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.chat-header {
  background-color: #2c2f33;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #40444b;
}

.chat-messages {
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto;
  color: black;
  font-family: 'Courier New', monospace;
  background-color: #f9f9f9;
  border-bottom: 1px solid #dcdcdc;
}

.chat-message {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  color: #333333;
}

.chat-input {
  display: flex;
  background-color: #f4f4f9;
  padding: 8px;
  gap: 8px;
  align-items: center;
}

.chat-input input {
  flex-grow: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  font-family: 'Roboto', sans-serif;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: border-color 0.2s;
}

.chat-input input:focus {
  border-color: #007bff;
}

.chat-input button {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background-color: #4caf50;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s;
}

.chat-input button:hover {
  background-color: #45a049;
}

/* Ultra cool scrollbar for chat messages */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #cccccc;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-track {
  background-color: #f4f4f9;
}



.draw-grid-page{
  background-image: url('/background.jpg');
  background-size: cover; /* Ensures the image covers the entire page */
  background-position: center; /* Centers the image */
  height: 100vh; /* Makes the background cover the full viewport height */
  width: 100%; /* Ensures the background spans the full width */
}












</style>
