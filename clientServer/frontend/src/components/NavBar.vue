<template>
  <nav>
    <ul>
      <li><router-link to="/">Homepage</router-link></li>
      <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
      <li v-if="!isLoggedIn"><router-link to="/register">Register</router-link></li>
      <li><router-link to="/galerija">Galerija</router-link></li>
      <li><router-link to="/pojedinacna-slika">Genetic Algorithm</router-link></li>
      
      <!-- ne menjaj redosled-->
      <li v-if="isLoggedIn"><router-link to="/myGallery">My Gallery</router-link></li>
      <li v-if="isLoggedIn"><router-link to="/crtanje/:pictureId">Crtanje</router-link></li>
      <li v-if="isLoggedIn"><button @click="handleLogout">Logout</button></li>
      <li v-if="isLoggedIn" class="greeting">Welcome: {{ username }}</li>

    </ul>
  </nav>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "NavBar",
  setup() {
    const userStore = useUserStore();
    const router = useRouter();
    
    
    const isLoggedIn = computed(() => userStore.isLoggedIn);
    const username = computed(() => userStore.username);  // Extract username

    const handleLogout = async () => {
      try {
        userStore.logout(); // Clear user state in the store in userStore
        await router.push("/Homepage"); 
      } catch (error) {
        console.error("Failed to logout:", error);
      }
    };

    return {
      isLoggedIn,
      username,  // za prikazivanje
      handleLogout,
    };
  },
});
</script>

<style scoped>
nav {
  background-color: #333;
  padding: 1em; 
  position: relative; 
  width: 100%; 
  top: 0; 
}

ul {
  list-style: none;
  display: flex;
  gap: 1em;
  margin: 0;
  padding: 0;
}

li {
  color: white;
}

a {
  color: inherit;
  text-decoration: none;
}

a.router-link-active {
  font-weight: bold;
}

button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1em;
}

button:hover {
  text-decoration: underline;
}

/* Style for the current user: someUser */
.greeting {
  font-weight: bold;
  color: #28a745; 
  font-size: 1.1em; 
  align-self:self-end ; 
  background-color: rgba(0, 0, 0, 0.3); 
  border-radius: 5px;
}
</style>
