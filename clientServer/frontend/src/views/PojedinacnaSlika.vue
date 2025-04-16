<template>
  <div class="background-image"></div>

  <div class="page-container">
    <div class="content-wrapper">
      <h1>Genetic Algorithm in copying 2d grids</h1>

      <!-- Tool Panel -->
      <div class="tool-panel">
        <img
          :class="{ active: activeTool === 'pencil' }"
          :src="pencilIcon"
          alt="Pencil"
          @click="setActiveTool('pencil')"
          class="tool-icon"
        />
        <img
          :class="{ active: activeTool === 'eraser' }"
          :src="eraserIcon"
          alt="Eraser"
          @click="setActiveTool('eraser')"
          class="tool-icon"
        />
        <div class="grid-size-control">
          <button @click="decreaseGridSize">-</button>
          <span>{{ gridSize }}</span>
          <button @click="increaseGridSize">+</button>
        </div>
        <input type="color" v-model="currentColor" class="color-picker" />
        <button @click="saveDrawing" class="save-button">Save</button>
        <button @click="copyGridData" class="copy-button">Run GA to copy</button>
      </div>

      <!-- Genetic Algorithm Controls -->
      <div class="tool-panel">
        <label>
          Generations:
          <input type="number" v-model.number="generations" min="1" />
        </label>
        <label>
          Mutation Rate:
          <input type="number" v-model.number="mutationRate" step="0.001" min="0" max="1" />
        </label>
        <label>
          Population Size:
          <input type="number" v-model.number="populationSize" min="1" />
        </label>
      </div>

      <!-- Original Grid -->
      <div class="grid-container">
        <div
          class="grid-row"
          v-for="(row, rowIndex) in originalGrid"
          :key="'original-row-' + rowIndex"
        >
          <div
            class="grid-cell"
            v-for="(cell, colIndex) in row"
            :key="'original-col-' + colIndex"
            :style="{ backgroundColor: cell || '#fff', ...gridCellStyle }"
            @mousedown="handleCellAction(rowIndex, colIndex, 'original')"
            @mouseover="handleCellAction(rowIndex, colIndex, 'original')"
          ></div>
        </div>
      </div>

      <!-- New Grid -->
      <div class="grid-container">
        <div
          class="grid-row"
          v-for="(row, rowIndex) in newGrid"
          :key="'new-row-' + rowIndex"
        >
          <div
            class="grid-cell"
            v-for="(cell, colIndex) in row"
            :key="'new-col-' + colIndex"
            :style="{ backgroundColor: cell || '#fff', ...gridCellStyle }"
            @mousedown="handleCellAction(rowIndex, colIndex, 'new')"
            @mouseover="handleCellAction(rowIndex, colIndex, 'new')"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import pencilIcon from '@/assets/pencil.png';
import eraserIcon from '@/assets/eraser.png';
import { useGridStore } from '../stores/gridd';
import { useUserStore } from "@/stores/user";
import axios from 'axios';

export default {
  name: 'DrawGridPage',
  data() {
    return {
      isDrawing: false,
      activeTool: 'pencil',
      gridSize: 5,
      currentColor: '#4caf50',
      pencilIcon,
      eraserIcon,
      pictureId: this.$route.params.pictureId,
      originalGrid: [],
      newGrid: [],
      populationSize: 10000,
      mutationRate: 0.005,
      generations: 10,
    };
  },
  computed: {
    gridCellStyle() {
      const size = `${300 / this.gridSize}px`;
      return {
        width: size,
        height: size,
      };
    },
  },
  methods: {
    startDrawing() {
      this.isDrawing = true;
    },
    stopDrawing() {
      this.isDrawing = false;
    },
    handleCellAction(row, col, gridType) {
      if (this.isDrawing || event.type === 'mousedown') {
        const grid = gridType === 'original' ? this.originalGrid : this.newGrid;
        const value = this.activeTool === 'pencil' ? '#000000' : '#fff';
        grid[row][col] = value;
      }
    },
    setActiveTool(tool) {
      this.activeTool = tool;
    },
    increaseGridSize() {
      if (this.gridSize < 20) {
        this.gridSize++;
        this.resizeGrid();
      }
    },
    decreaseGridSize() {
      if (this.gridSize > 2) {
        this.gridSize--;
        this.resizeGrid();
      }
    },
    resizeGrid() {
      this.initializeGrid();
    },
    saveDrawing() {
      const gridStore = useGridStore();
      const name = prompt('Enter a name for your project:');
      const userStore = useUserStore();

      if (name) {
        gridStore.setName(name);
        alert(`Project "${name}" saved!`);
      }
      gridStore.createPicture();
    },
    copyGridData() {
      this.runGeneticAlgorithm();
    },
    async fetchPictureData(pictureId) {
      try {
        const response = await axios.get(`https://raf-pixeldraw.aarsen.me/api/pictures/${pictureId}`);
        const pictureData = response.data.picture_data;
        this.gridSize = pictureData.length;
        this.resizeGrid();
        this.originalGrid = pictureData;
        this.newGrid = JSON.parse(JSON.stringify(pictureData));
      } catch (error) {
        console.error("Error fetching picture data:", error);
      }
    },
    initializeGrid() {
      const newGrid = Array.from({ length: this.gridSize }, () =>
        Array.from({ length: this.gridSize }, () => '#fff')
      );
      this.originalGrid = newGrid;
      this.newGrid = newGrid.map(row => row.slice());
    },

    generateRandomGrid() {
      return Array.from({ length: this.gridSize }, () =>
        Array.from({ length: this.gridSize }, () => (Math.random() > 0.5 ? '#000000' : '#fff'))
      );
    },

    calculateFitness(grid) {
      let fitness = 0;
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          if (grid[row][col] === this.originalGrid[row][col]) {
            fitness++;
          }
        }
      }
      return fitness / (this.gridSize * this.gridSize);
    },

    selectParents(population) {
      const tournamentSize = 10;
      let tournament = [];
      for (let i = 0; i < tournamentSize; i++) {
        tournament.push(population[Math.floor(Math.random() * population.length)]);
      }
      tournament.sort((a, b) => b.fitness - a.fitness);
      return tournament[0];
    },

    crossover(parent1, parent2) {
      const child = [];
      const crossoverPoint = this.gridSize / 2;

      for (let row = 0; row < this.gridSize; row++) {
        const newRow = [];
        for (let col = 0; col < this.gridSize; col++) {
          if (col < crossoverPoint) {
            newRow.push(parent1[row][col]);
          } else {
            newRow.push(parent2[row][col]);
          }
        }
        child.push(newRow);
      }
      return child;
    },

    mutate(grid) {
      const mutatedGrid = grid.map(row => row.slice());
      const randomRow = Math.floor(Math.random() * this.gridSize);
      const randomCol = Math.floor(Math.random() * this.gridSize);

      if (mutatedGrid[randomRow][randomCol] === '#000') {
        mutatedGrid[randomRow][randomCol] = '#fff';
      } else if (mutatedGrid[randomRow][randomCol] === '#fff') {
        mutatedGrid[randomRow][randomCol] = '#000';
      }
      return mutatedGrid;
    },

    async runGeneticAlgorithm() {
      let population = Array.from({ length: this.populationSize }, () => {
        const grid = this.generateRandomGrid();
        return { grid, fitness: this.calculateFitness(grid) };
      });

      const maxGenerations = this.generations;
      const targetFitness = 1.0;

      const runGeneration = async (generation) => {
        population.sort((a, b) => b.fitness - a.fitness);

        this.newGrid = population[0].grid.map(row => row.slice());

        console.log(`Generation ${generation + 1}: Best fitness = ${population[0].fitness}`);

        if (population[0].fitness === targetFitness || generation >= maxGenerations - 1) {
          console.log("GA completed.");
          return;
        }

        const newGeneration = [];
        while (newGeneration.length < this.populationSize) {
          const parent1 = this.selectParents(population);
          const parent2 = this.selectParents(population);
          let child = this.crossover(parent1.grid, parent2.grid);

          if (Math.random() < this.mutationRate) {
            child = this.mutate(child);
          }

          newGeneration.push({ grid: child, fitness: this.calculateFitness(child) });
        }

        population = newGeneration;

        setTimeout(() => runGeneration(generation + 1), 100);
      };

      runGeneration(0);
    },
  },
  mounted() {
    const gridStore = useGridStore();
    gridStore.rows = this.gridSize;
    gridStore.columns = this.gridSize;
    this.initializeGrid();

    if (this.pictureId) {
      this.fetchPictureData(this.pictureId);
    }
  },
};
</script>

<style scoped>
.page-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('dnaGA.png');
  background-size: cover;
  background-position: center;
  filter: blur(2px);
  opacity: 0.4;
  z-index: -4;
}

.tool-panel {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 20px;
}

.tool-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.tool-icon.active {
  opacity: 1;
}

.grid-size-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grid-size-control span {
  font-size: 16px;
  font-weight: bold;
}

.grid-size-control button {
  font-size: 16px;
  width: 30px;
  height: 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.grid-size-control button:hover {
  background-color: hsl(0, 19%, 41%);
}

.color-picker {
  width: 40px;
  height: 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  padding: 5px 10px;
  font-size: 14px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:hover {
  background-color: #0056b3;
}

.copy-button {
  padding: 5px 10px;
  font-size: 14px;
  color: #fff;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-button:hover {
  background-color: #218838;
}

.grid-container {
  display: flex;
  flex-direction: column;
  user-select: none;
  width: 300px;
  height: 300px;
  border: 1px solid #ccc;
  overflow: hidden;
  margin-bottom: 20px;
}

.grid-row {
  display: flex;
}

.grid-cell {
  border: 1px solid #ccc;
  cursor: pointer;
}
</style>
