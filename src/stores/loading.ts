import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loading', () => {
  const text = ref<string | null>(null);
  const value = ref<number | null>(null);

  const set = (_text: string | null = null, _value: number | null = null) => {
    text.value = _text;
    value.value = _value;
  }

  return { text, value, set };
});
