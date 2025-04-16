import { defineStore } from "pinia";
import apiClient from 'axios';
import { io, Socket } from 'socket.io-client';

// types for state
interface UserState {
  token: string | null;
  isLoggedIn: boolean;
  username: string | null;
  userId: number | null;
  socket: Socket | null;  // Store the socket instance
}

// types for credentials and user details
interface LoginCredentials {
  email: string;
  password: string;
}

interface UserDetails {
  username: string;
  email: string;
  password: string;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: null,
    isLoggedIn: false,
    username: null,
    userId: null,
    socket: null,  // Initialize socket as null
  }),

  actions: {
    async login(credentials: LoginCredentials): Promise<void> {
      try {
        const response = await apiClient.post("http://localhost:8000/auth/login", credentials);
        this.token = response.data.token;
        this.username = response.data.username;
        this.userId = response.data.user_id;
        this.isLoggedIn = true;

        // Greet the user with their username
        console.log(`Hello @${this.username}, welcome to the Pixel Art server`);

        // Establish Socket.IO connection and store it in the state
        this.socket = io('http://localhost:8000'); // Connect to your server (modify if necessary)

        this.socket.on('connect', () => {
          console.log(`User @${this.username} logged in`);
          this.socket?.emit('message', `Hello @${this.username}, welcome to the Pixel Art server`);
        });





      } catch (error) {
        throw error;
      }
    },

    async register(userDetails: UserDetails): Promise<any> {
      try {

        const response = await apiClient.post("http://localhost:8000/auth/register", userDetails);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    logout(): void {
      // Log user out and disconnect their socket
      console.log(`@${this.username} disconnected`);

      // Close the socket connection if it exists
      if (this.socket) {
        this.socket.disconnect();
        console.log('Socket disconnected');
      }

      // Reset user state
      this.token = null;
      this.username = null;
      this.userId = null;
      this.isLoggedIn = false;
      this.socket = null; // Clear the socket
    },
  },
});
