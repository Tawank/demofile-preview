import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Replay } from '@/game/utils/parseDemofile';

export const useGameStore = defineStore('game', () => {
  const tick = ref(0);
  const tickRounded = ref(0);
  const maxTick = ref(0);
  const started = ref(false);
  const replay: Replay[] = [];

  return { tick, tickRounded, maxTick, started, replay };
});
