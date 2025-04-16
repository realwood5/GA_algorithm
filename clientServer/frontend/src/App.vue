<!-- src/App.vue -->
<template>
  <div id="app">
    <Navbar />
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import Navbar from './components/NavBar.vue';
import { useRouter } from 'vue-router';
import { io, Socket } from 'socket.io-client';

export default defineComponent({
  name: 'App',
  components: {
    Navbar, // dodaj Navbar
  },
  setup() {
    const router = useRouter(); // Properly initialize the router
    let socket: Socket;

    onMounted(() => {
      // Connect to backend server on port 8000
      // socket = io('http://localhost:8000');

      // socket.on('connect', () => {
      //   console.log('Connected to backend server on port 8000');
      //   socket.emit('message', 'Hello from Vue frontend');
      // });

      // socket.on('message', (msg: string) => {
      //   console.log('Received message from server:', msg);
      // });

      // socket.on('disconnect', () => {
      //   console.log('Disconnected from backend server');
      // });
    });

    return {
      router, // Ensure router is available for template and child components
    };
  },
});
</script>

<style>
body {
  margin: 0; 
  padding: 0; 
  display: flex; 
  flex-direction: column; 
  height: 100vh; 
}

#app {
  flex: 1; /* Omoguci menjanje dimenzija */
  display: flex; 
  flex-direction: column; /* Stavi nav bar na prvu kolonu */
}
</style>
