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
    <div class="game-deaths">
      <div
        v-for="death of deaths"
        :key="death.id"
        class="game-death"
      >
        <span :style="{ color: teamColor(death.attacker?.teamNumber) }">{{ death.attacker?.name }}</span>
        <img :src="`/assets/weapons_ico/${death.weapon}.png`" style="height: 16px; margin: 0px 4px;">
        {{ death.headshot ? '😨' : '' }}
        <span :style="{ color: teamColor(death.victim?.teamNumber) }">{{ death.victim?.name }}</span>
      </div>
    </div>
    <div class="game-player">
      <input
        v-model.number="gameStore.tick"
        class="game-player-slider"
        type="range"
        min="1"
        :max="gameStore.maxTick"
        @input="() => {stateBeforeDrag = gameStore.started; gameStore.started = false}"
        @change="() => gameStore.started = stateBeforeDrag"
      />
      {{ gameStore.tick.toFixed(0) }}
      /
      {{ gameStore.maxTick }}
    </div>
    <canvas ref="canvas" class="game-canvas" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from 'vue';
import { initGame } from '@/game/main';
import { useGameStore } from '@/stores/game';
import { useLoadingStore } from '@/stores/loading';
import { type Death } from '@/game/utils/parseDemofile';

const canvas: Ref<HTMLCanvasElement | undefined> = ref();

const gameStore = useGameStore();
const loadingStore = useLoadingStore();
const stateBeforeDrag = false;
const deaths = ref<Death[]>([]);

onMounted(async () => {
  if (canvas.value) {
    const scene = await initGame(canvas.value);

    console.log(scene);
  }
});

watch(() => gameStore.tickRounded, async (newTick) => {
  deaths.value = gameStore.replay[newTick].deaths;
});

function teamColor(teamNumber: unknown): string | undefined {
  if (teamNumber === 2) return '#fbde1a';
  if (teamNumber === 3) return '#55d2fc';
}

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
  padding: 16px;
  background: #00000044;
  border-radius: 4px 4px 0px 0px;
}

.game-player-slider {
  width: 100%;
}

.game-deaths {
  position: absolute;
  z-index: 99;
  top: 16px;
  right: 16px;
  width: 480px;
}

.game-death {
  background-color: #00000075;
  margin: 6px;
  padding: 3px 12px;
  border-radius: 8px;
}
</style>
