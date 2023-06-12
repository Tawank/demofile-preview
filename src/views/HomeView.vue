<template>
  <div class="game-container">
    <div
      v-if="loadingStore.value !== null"
      class="game-loading"
    >
      <div class="game-loading-text">
      {{ loadingStore.text }}
      </div>
      <div
        class="game-loading-progress"
        :style="{
          width: '100%',
          backgroundColor: 'grey',
        }"
      >
        <div
          class="game-loading-progress-bar"
          :style="{
            width: `${loadingStore.value}%`,
            height: '30px',
            backgroundColor: 'green',
            transition: 'width 0.05s ease-in-out',
          }"
        ></div>
      </div>
    </div>
    <div class="game-player">
      <input v-model="gameStore.tick" disabled class="game-player-slider" type="range" min="1" :max="gameStore.maxTick" />
      {{ gameStore.tick.toFixed(0) }}
      /
      {{ gameStore.maxTick }}
    </div>
    <canvas ref="canvas" class="game-canvas" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';
import { initGame } from '@/game/main';
import { useGameStore } from '@/stores/game';
import { useLoadingStore } from '@/stores/loading';

const canvas: Ref<HTMLCanvasElement | undefined> = ref();

const gameStore = useGameStore();
const loadingStore = useLoadingStore();

onMounted(async () => {
  if (canvas.value) {
    const scene = await initGame(canvas.value);

    console.log(scene);
  }
});
</script>

<style scoped>
.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.game-player {
  position: absolute;
  z-index: 99;
  bottom: 0;
  left: 300px;
  width: calc(100vw - 600px);
  height: 150px;
}

.game-player-slider {
  width: 100%;
}
</style>
