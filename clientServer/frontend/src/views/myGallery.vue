<template>
  <div class="galerija">
    <h1>Galerija</h1>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div class="pictures-grid">
        <div class="picture-card" v-for="picture in pictures" :key="picture.picture_id">
          <h3>{{ picture.name }}</h3>
          
          <div class="picture" @click="goToPicture(picture.picture_id)">
            <div
              class="pixel"
              v-for="(row, rowIndex) in transposedPictureData(picture.picture_data)"
              :key="rowIndex"
              :style="getRowStyle(row, picture.picture_data)"
            >
              <div
                v-for="(color, colIndex) in row"
                :key="colIndex"
                class="pixel-cell"
                :style="{ backgroundColor: color }"
              ></div>
            </div>
          </div>

          <p><strong>Author:</strong> {{ picture.author.username }}</p>
          <p><strong>Time Since Upload:</strong> {{ timeAgo(picture.created_at) }}</p>
          <p><strong>Last Updated:</strong> {{ formatDate(picture.updated_at) }}</p>

          <button class="delete-button" @click="confirmDelete(picture.picture_id)">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

export default {
  setup() {
    const userStore = useUserStore();
    const router = useRouter();

    const pictures = ref([]);
    const loading = ref(false);

    const fetchPictures = async () => {
      loading.value = true;
      try {
        const response = await axios.get("http://localhost:8000/pictures", {
          params: { author: userStore.userId },
        });

        if (!response.data || !Array.isArray(response.data.pictures)) {
          throw new Error("Unexpected API response format.");
        }

        pictures.value = response.data.pictures;
      } catch (error) {
        console.error("Error fetching pictures:", error.message);
        pictures.value = [];
      } finally {
        loading.value = false;
      }
    };

    const goToPicture = (pictureId) => {
      router.push(`/crtanje/${pictureId}`);
    };

    const confirmDelete = (pictureId) => {
      if (confirm("Are you sure you want to delete this picture?")) {
        deletePicture(pictureId);
      }
    };

    const deletePicture = async (pictureId) => {
      const token = userStore.token;

      if (!token) {
        console.error("Authentication required: missing token.");
        throw new Error("Authentication token is missing.");
      }

      try {
        await axios.delete(`http://localhost:8000/pictures/${pictureId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const audio = new Audio('/sound/gta-san-andreas-mission-complete-sound-hq.mp3');
        audio.play();
        alert(`Picture deleted!`);
        pictures.value = pictures.value.filter((p) => p.picture_id !== pictureId);
      } catch (error) {
        console.error("Error deleting picture:", error.message);
      }
    };

    const transposedPictureData = (pictureData) => {
      return pictureData[0].map((_, colIndex) =>
        pictureData.map((row) => row[colIndex])
      );
    };

    const getRowStyle = (row, pictureData) => ({
      display: "flex",
      flexDirection: "row",
      width: "100%",
      height: `${100 / pictureData.length}%`,
    });

    const formatDate = (date) => {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(date).toLocaleDateString(undefined, options);
    };

    const timeAgo = (date) => {
      const now = Date.now();
      const diff = now - new Date(date).getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
      if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    };

    onMounted(fetchPictures);

    return {
      pictures,
      loading,
      goToPicture,
      confirmDelete,
      transposedPictureData,
      getRowStyle,
      formatDate,
      timeAgo,
    };
  },
};
</script>

<style>
.galerija {
  padding: 20px;
}

.pictures-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.picture-card {
  border: 1px solid #000000;
  padding: 10px;
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 500;
  height: 500px;
  background-color: #0ad185ec;
  overflow: hidden;
}

.picture {
  display: block;
  max-width:  100%;
  margin: 0 auto;
  height: 65%;
  cursor: pointer;
}

.picture:hover {
  transform: scale(1.05);
  transition: 0.2s;
}

.pixel {
  width: 100%;
  height: 100%;
}

.pixel-cell {
  flex: 1;
  height: 100%;
  border: 1px solid #e5e5e5;
}

.delete-button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-button:hover {
  background-color: darkred;
}
</style>
