<template>
  <div class="register-page">
    <h1>Register</h1>
    <form @submit.prevent="handleRegister">
      <label>
        Username:
        <input v-model="form.username" type="text" required />
      </label>
      <label>
        Password:
        <input v-model="form.password" type="password" required />
      </label>
      <label>
        Confirm Password:
        <input v-model="form.confirmPassword" type="password" required />
      </label>
      <button type="submit">Register</button>
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
      confirmPassword: "",
    });
    const errorMessage = ref("");
    const userStore = useUserStore();
    const router = useRouter();

    const validate = () => {
      const { username, password, confirmPassword } = form.value;

      if (!username || username.length < 2 || username.length > 32) {
        return "Username must be between 2 and 32 characters.";
      }
      
      if (!password || password.length < 8 || password.length > 128) {
        return "Password must be between 8 and 128 characters.";
      }

      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }

      return null;
    };

    const handleRegister = async () => {
      const validationError = validate();
      if (validationError) {
        errorMessage.value = validationError;
        return;
      }

      try {
        errorMessage.value = ""; // Reset error message
        await userStore.register({
          username: form.value.username,
          password: form.value.password,
        });
        router.push("/login"); // Redirect 
        const audio = new Audio('/sound/gta-san-andreas-mission-complete-sound-hq.mp3');
        audio.play();

      } catch (error) {
        errorMessage.value =
          error.code === "DUPLICATE_USERNAME"
            ? "Username is already taken."
            : error.code === "LOGGED_IN"
            ? "You are already logged in."
            : "An error occurred.";
      }
    };

    return {
      form,
      errorMessage,
      handleRegister,
    };
  },
};
</script>

<style scoped>
.register-page {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
  
}

h1 {
  text-align: center;
  color: #4caf50; 
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

label {
  font-size: 14px;
  color: #333;
}

input {
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

input:focus {
  border-color: #4caf50;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #45a049;
}

button:focus {
  outline: none;
}

.error {
  color: #f44336; 
  font-size: 14px;
  text-align: center;
}
</style>
