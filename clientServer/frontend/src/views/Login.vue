<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="username">Username:</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          required
          class="input-field"
        />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          class="input-field"
        />
      </div>
      <button type="submit" class="submit-button">Login</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";

export default {
  setup() {
    const form = ref({
      username: "",
      password: "",
    });
    const errorMessage = ref("");
    const userStore = useUserStore();
    const router = useRouter();

    const handleLogin = async () => {
      try {
        errorMessage.value = ""; // Reset the error message
        await userStore.login(form.value); // login method from the user store
        router.push("/crtanje/:pictureId"); // Redirect
        const audio = new Audio('/sound/gta-san-andreas-mission-complete-sound-hq.mp3');
        audio.play();


      } catch (error) {
        // Handle different error scenarios
        errorMessage.value =
          error.code === "INCORRECT_CREDENTIALS"
            ? "Invalid username or password."
            : error.code === "LOGGED_IN"
            ? "You are already logged in."
            : "An error occurred.";
      }
    };

    return {
      form,
      errorMessage,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
  width: 300px;
}

.form-group {
  margin-bottom: 15px;
  width: 100%;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #4caf50; /* Green color for labels */
}

.input-field {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 2px solid #4caf50;
  border-radius: 5px;
  background-color: #e8f5e9; /* Light green background */
  color: #388e3c; /* Darker green for text */
}

.input-field:focus {
  border-color: #66bb6a; /* Lighter green when focused */
  background-color: #c8e6c9; /* Slightly darker green background */
  outline: none;
}

.submit-button {
  padding: 10px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #388e3c;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
