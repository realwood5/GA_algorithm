import { defineStore } from 'pinia';  
import type { NewPictureReq, NewPictureRes } from '../types/types';
import apiClient from 'axios';
import axios from 'axios';
import { useUserStore } from "@/stores/user";

const BASE_URL = "http://localhost:8000";
///pictures
apiClient.defaults.baseURL = BASE_URL;


interface PictureDto {
  name: string;
  picture_data: string[][];
  picture_id: string;
  author: {
      user_id: string;
      username: string;
  };
  created_at: string;
  updated_at: string;
}

interface GetPictureRes {
  failed: false;
  picture: PictureDto;
}

//error
interface APIErrorCommon {
  failed: true;
  code: string;
  extra?: any;
}


export const useGridStore = defineStore('grid', {
  state: () => ({
    grid: [] as (string | number | null)[][], //2D array of strings | null| number
    rows: 10, 
    columns: 10, 
    name: "", // Project name
    picture_id: '',
    user_id : '',
  }),

  actions: {
    setName(name: string) {
      // Ime matrice mora biti izmedju 1 i 40
      if (name.length >= 1 && name.length <= 40) {
        this.name = name;
        console.log(`Project name set to: ${this.name}`);
      } else {
        console.error("Project name must be between 3 and 24 characters.");
      }
    },
    

    async initializeGrid(pictureId: string): Promise<{ rows: number; columns: number }> {
      //console.log(pictureId);
      if (pictureId === ":pictureId") {
        // Default grid initialization
        this.grid = Array.from({ length: this.rows }, () =>
          Array.from({ length: this.columns }, () => null)
        );
      } else {
        try {
          const response = await apiClient.get<GetPictureRes>(`/pictures/${pictureId}`);
          if (!response.data.failed) {
            const picture = response.data.picture;
            this.grid = this.transposeGrid(picture.picture_data);
            this.rows = picture.picture_data.length;
            this.columns = picture.picture_data[0]?.length || 0;
            this.name = picture.name;
            this.picture_id = picture.picture_id;
            this.user_id = picture.author.user_id;

          } else {
            console.error("Failed to fetch the picture data.");
          }
        } catch (error) {
          console.error("Error fetching picture data:", error);
        }
      }

      // Return the grid dimensions
      return { rows: this.rows, columns: this.columns };
    },

    updateCell(row: number, col: number, value: string | number | null) {
      
      if (row >= 0 && row < this.rows && col >= 0 && col < this.columns) {
        this.grid[row][col] = value;
      }
    },

    async createPicture() {
      // Create the grid dataa
      const gridData: string[][] = this.grid.map(row =>
        row.map(cell => {
          if (cell === null || cell === undefined) {
            return "#ffffff"; // Default color for null
          } else if (typeof cell === "number") {
            return `#${cell.toString(16).padStart(6, "0")}`; // Convert number to hex
          } else {
            return cell; // Keep string as is
          }
        })
      );
    
      // Transponovana matrica
      const transposedGridData: string[][] = this.transposeGrid(gridData);
    
      const pictureData: NewPictureReq = {
        name: this.name,
        picture_data: transposedGridData, // Use the transposed grid data
      };
    
      console.log("Request Body:", pictureData);
    
      const userStore = useUserStore();
      const token = userStore.token;
    
      console.log("Token:", token);
    
      if (!token) {
        console.error("Authentication required: missing token.");
        throw new Error("Authentication token is missing.");
      }
    
      //"https://raf-pixeldraw.aarsen.me/api/pictures/"
      try {
        console.log("idi na create Picture");
        const response = await axios.post(
          "http://localhost:8000/pictures"
          ,
          pictureData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
           
          }
        );
    
        if (response.data.failed) {
          throw new Error("Failed to save picture.");
        }

        const picture = response.data.data.picture;

       // this.grid = response.data.picture.picture_data;
        this.grid = this.transposeGrid(picture.picture_data);
        this.rows = picture.picture_data.length;
        this.columns = picture.picture_data[0]?.length || 0;
        this.name = picture.name;
        this.user_id = picture.author.user_id;
        this.picture_id = picture.picture_id;

        console.log("Picture created successfully with ID:", this.picture_id);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("API Error:", error.response?.data || error.message);
        } else {
          console.log("upao sam  u kurac");
          console.error("Unexpected Error:", error);
        }
        throw error;
      }
    },
    
    async getPicturesForUserID(user_id : string){
      user_id = this.user_id;
      try {
        const userStore = useUserStore();
        //http://localhost:8000/pictures
        //https://raf-pixeldraw.aarsen.me/api/pictures
        const response = await axios.get("http://localhost:8000/pictures/:pictureId", {
          params: {
            author: user_id, // Filter by the logged-in user
          },
        });

        console.log("API Response:", response.data); // Debugging log

        // Validate response structure
        if (!response.data || !Array.isArray(response.data.pictures)) {
          throw new Error("Unexpected API response format.");
        }

        // Update state with API response
        //this. = response.data.pictures;
        const picture = response.data.picture;
            this.grid = this.transposeGrid(picture.picture_data);
            this.rows = picture.picture_data.length;
            this.columns = picture.picture_data[0]?.length || 0;
            this.name = picture.name;
            this.picture_id = picture.picture_id;
            this.user_id = picture.author.user_id;


      } catch (error) {
        console.error("Error fetching pictures:", error);

        // Reset state on error
        //this.pictures = [];

        if (axios.isAxiosError(error) && error.response) {
          console.error("API Error Response:", error.response.data);
        }
      } finally {
        //this.loading = false;
      }
    },
 
    async updatePicture(pictureId: string, token: string): Promise<void> {
      if (!pictureId) {
        throw 'No pictureId provided. Unable to update the picture.';
      }
    
      const tokenn = useUserStore().token;
      // Transpose the grid before sending it to the backend
      const transposedGrid = this.transposeGridd(this.grid);
    
      try {
        const response = await axios.patch(
          `http://localhost:8000/pictures/${pictureId}`,
          {
            name: this.name,
            pictureData: transposedGrid, // Use the transposed grid here
          },
          {
            headers: {
              Authorization: `Bearer ${tokenn}`,
            },
          }
        );
    
        // Handle the backend response
        if (response.data.failed) {
          const error = response.data.error;
          if (error === 'NOT_YOURS') {
            throw 'You do not have permission to update this picture.';
          } else if (error === 'NO_SUCH_ENTITY') {
            throw 'The picture does not exist.';
          } else if (error === 'INVALID_PICTURE_DATA') {
            throw 'The picture data is invalid.';
          } else {
            throw `An error occurred: ${error}`;
          }
        }
    
        //console.log('Picture updated successfully:', response.data);
      } catch (error) {
        console.error('Error updating picture:', error);
        throw 'Failed to update the picture. Please try again.';
      }
    },
    
    
    
    
    

    // Transponovanje matrice
    transposeGrid(grid: string[][]): string[][] {
      const transposed: string[][] = [];
    
      
      for (let colIndex = 0; colIndex < grid[0].length; colIndex++) {
        const newRow: string[] = [];
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
          newRow.push(grid[rowIndex][colIndex]);
        }
        transposed.push(newRow);
      }
    
      return transposed;
    },


    transposeGridd(grid: (string | number | null)[][]): string[][] {
      if (!grid || grid.length === 0 || grid[0].length === 0) {
        console.error('Invalid grid provided for transposition:', grid);
        return [];
      }
    
      const transposed: string[][] = Array.from({ length: grid[0].length }, () => []);
    
      for (let colIndex = 0; colIndex < grid[0].length; colIndex++) {
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
          // Safely convert to string
          transposed[colIndex][rowIndex] = String(grid[rowIndex][colIndex]);
        }
      }
    
      return transposed;
    }



    
   


    

  },
});
