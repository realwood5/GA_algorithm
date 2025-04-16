// src/axios.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://raf-pixeldraw.aarsen.me/api",
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      throw error.response.data; // Throw the API error
    }
    throw error; // Throw network or other errors
  }
);

export default apiClient;
