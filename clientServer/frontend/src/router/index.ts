import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Homepage.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Galerija from '../views/Galerija.vue'
import PojedinacnaSlika from '../views/PojedinacnaSlika.vue'
import Crtanje from '../views/Crtanje.vue'
import myGallery from '../views/myGallery.vue'


const routes = [
  { path: '/', name: 'Homepage', component: Homepage },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/galerija', name: 'Galerija', component: Galerija },
  { path: '/pojedinacna-slika', name: 'PojedinacnaSlika', component: PojedinacnaSlika },
  { path: "/crtanje/:pictureId", name: 'Crtanje', component: Crtanje },
  { path : '/myGallery', name: 'myGallery', component: myGallery}
  

];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  


});

export default router
