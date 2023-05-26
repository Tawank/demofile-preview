import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', () => {
  const tick = ref(0);
  const maxTick = ref(0);
  const started = ref(false);

  return { tick, maxTick, started };
});
