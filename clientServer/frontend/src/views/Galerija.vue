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
          <p>
            <strong>Author:</strong>
            <span
              class="author-name"
              v-if="picture.author?.user_id"
              @click.stop="goToAuthor(picture.author.user_id)"
            >
              {{ picture.author.username }}
            </span>
            <span v-else>Unknown Author</span>
          </p>
          <p><strong>Time Since Upload:</strong> {{ timeAgo(picture.created_at) }}</p>
          <p><strong>Last Updated:</strong> {{ formatDate(picture.updated_at) }}</p>
          <div class="like-section">
            <button class="like-button" @click="likePicture(picture.picture_id)">Like</button>
            <span>Likes: {{ picture.likes }}</span>
            <button class="comment-button" @click="toggleCommentDropdown(picture.picture_id)">
              Comments
            </button>
          </div>

          <!-- Comment dropdown menu -->
          <div v-if="commentDropdownVisible[picture.picture_id]" class="comment-dropdown">
            <div class="comments-list">
              <div v-for="(comment, index) in picture.comments_jsonb" :key="index" class="comment">
                <strong>{{ comment.username }}:</strong> {{ comment.comment_text }}
              </div>
            </div>
            <textarea
              v-model="newComment[picture.picture_id]"
              placeholder="Write a comment..."
              class="comment-textarea"
            ></textarea>
            <button @click="submitComment(picture.picture_id)" class="submit-comment-button">Comment</button>
          </div>
        </div>
      </div>
      <div class="pagination">
        <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useUserStore } from '@/stores/user';

export default {
  setup() {
    const pictures = ref([]);
    const totalPages = ref(1);
    const totalPictures = ref(0);
    const currentPage = ref(1);
    const perPage = ref(8);
    const loading = ref(false);
    const commentDropdownVisible = ref({}); // Track visibility of dropdowns for each picture
    const newComment = ref({}); // Track new comment for each picture
    const router = useRouter();

    const fetchPictures = async (params = {}) => {
      loading.value = true;
      try {
        const response = await axios.get("http://localhost:8000/pictures", {
          params: {
            page: currentPage.value,
            limit: perPage.value,
            ...params, // Add additional query parameters if provided
          },
        });

        if (
          !response.data ||
          !Array.isArray(response.data.pictures) ||
          typeof response.data.total !== "number"
        ) {
          throw new Error("Unexpected API response format.");
        }

        pictures.value = response.data.pictures.map((picture) => ({
          ...picture,
          author: picture.author || { user_id: null, username: "Unknown" }, // Ensure author has default values
        }));
        totalPictures.value = response.data.total;
        totalPages.value = Math.ceil(totalPictures.value / perPage.value);
      } catch (error) {
        console.error("Error fetching pictures:", error.message);
        pictures.value = [];
        totalPages.value = 1;
      } finally {
        loading.value = false;
      }
    };

    const likePicture = async (pictureId) => {
      try {
        const userStore = useUserStore();
        const userId = userStore.userId;
        const token = userStore.token;

        if (!userId || !token) {
          console.error("User ID and token are required to like a picture.");
          return;
        }

        const response = await axios.patch(
          `http://localhost:8000/pictures/like/${pictureId}`,
          { user_id: userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data.failed) {
          const picture = pictures.value.find((p) => p.picture_id === pictureId);
          if (picture) {
            picture.likes++;
          }
        }
      } catch (error) {
        console.error("Error liking picture:", error.message);
      }
    };

    const toggleCommentDropdown = (pictureId) => {
      commentDropdownVisible.value[pictureId] = !commentDropdownVisible.value[pictureId];
    };

    const submitComment = async (pictureId) => {
      const userStore = useUserStore();
      const userId = userStore.userId;
      const token = userStore.token;

      if (!userId || !token || !newComment.value[pictureId]) {
        console.error("User ID, token, and comment are required.");
        return;
      }

      try {
        const response = await axios.patch(
          `http://localhost:8000/pictures/comment/${pictureId}`,
          {
            user_id: userId,
            comment_text: newComment.value[pictureId],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data.failed) {
          const picture = pictures.value.find((p) => p.picture_id === pictureId);
          if (picture) {
            picture.comments_jsonb.push({
              username: userStore.username,
              comment_text: newComment.value[pictureId],
            });
          }
          newComment.value[pictureId] = '';
        }
      } catch (error) {
        console.error("Error submitting comment:", error.message);
      }
    };

    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
      fetchPictures();
    };

    const goToPicture = (pictureId) => {
      router.push(`/crtanje/${pictureId}`);
    };

    const goToAuthor = async (authorId) => {
      currentPage.value = 1; // Reset pagination to the first page
      await fetchPictures({ author: authorId }); // Fetch pictures for the given author
    };

    const transposedPictureData = (pictureData) => {
      return pictureData[0].map((_, colIndex) => pictureData.map((row) => row[colIndex]));
    };

    const getRowStyle = (row, pictureData) => ({
      display: "flex",
      flexDirection: "row",
      width: "100%",
      height: `${100 / pictureData.length}%`,
    });

    const formatDate = (date) => {
      const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
      return new Date(date).toLocaleDateString(undefined, options);
    };

    const timeAgo = (date) => {
      const now = Date.now();
      const diff = now - new Date(date).getTime();

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
      } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      } else {
        return `${days} day${days !== 1 ? "s" : ""} ago`;
      }
    };

    onMounted(() => {
      fetchPictures();
    });

    return {
      pictures,
      totalPages,
      currentPage,
      loading,
      goToPicture,
      goToAuthor,
      transposedPictureData,
      getRowStyle,
      formatDate,
      timeAgo,
      changePage,
      likePicture,
      toggleCommentDropdown,
      submitComment,
      commentDropdownVisible,
      newComment,
    };
  },
};
</script>


<style>

.author-name {
  color: blue;
  text-decoration: underline;
  cursor: pointer;
}

/* Add styles for the like button and likes count */
.like-section {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.like-button,
.comment-button {
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: rgb(255, 255, 255);
  cursor: pointer;
}

.like-button:hover,
.comment-button:hover {
  background-color: #0056b3;
}

.comment-dropdown {
  background-color: #005fee;
  padding: 10px;
  border: 1px solid #15fa00;
  margin-top: 10px;
  position: absolute;
  z-index: 1000;
  width: 300px;
}

.comments-list {
  max-height: 200px;
  overflow-y: auto;
}

.comment {
  margin-bottom: 5px;
  font-size: 14px;
}

.comment-textarea {
  width: 100%;
  height: 60px;
  margin-top: 10px;
  padding: 5px;
  font-size: 14px;
  resize: none;
}

.submit-comment-button {
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background-color: #28a745;
  color: white;
  margin-top: 5px;
  cursor: pointer;
}

.submit-comment-button:hover {
  background-color: #218838;
}
</style>
