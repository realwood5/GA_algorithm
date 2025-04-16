<!-- src/components/GetStartedButton.vue -->
<template>
    <div class="get-started-container">
      <router-link to="/login" class="get-started-button">
        Get Started
      </router-link>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GetStartedButton'
  }
  </script>
  
  <style scoped>
  .get-started-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  
  .get-started-button {
    padding: 12px 24px;
    background-color: #163143; 
    color: white;
    border: none;
    border-radius: 10px;
    text-decoration: none; 
    font-size: 25px;
    transition: background-color 0.5s ease;
  }
  
  .get-started-button:hover {
    background-color: #264d68; 
  }
  </style>
  