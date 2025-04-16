<template>
  <div class="homepage">
    <h1>Homepage</h1>
    <h2>Welcome to Our Drawing Platform</h2>
    <p>I carry before me terror and rout and carnage and blood
       and the wrath of all the gods above and below.
       I will infect the standards, the armour, and the weapons of the enemy
       with dire and manifold death. And the place of my destruction shall 
       witness the destruction of my enemies!</p>
    <GetStartedButton />
  </div>
</template>

<script lang="ts">
  import GetStartedButton from '../components/GetStartedButton.vue';

  export default {
    name: 'Homepage',
    components: {
      GetStartedButton,
    },
  };
</script>

<style scoped>
.homepage {
  background-image: url('/thenTheWingedHussarsArrived.jpg'); /* Reference image in public folder */
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
  text-align: center;
  padding: 20px;
}

h1, h2, p {
  margin: 10px 0;
}
</style>
