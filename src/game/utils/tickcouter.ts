const tickCounterCurrent = document.querySelector('.tick-counter-container .tick-counter-current') as HTMLElement | null;
const tickCounterMax = document.querySelector('.tick-counter-container .tick-counter-max') as HTMLElement | null;

export function tickCounterCurrentSet(tick: number) {
  if (!tickCounterCurrent) return;

  tickCounterCurrent.textContent = tick.toString();
}

export function tickCounterMaxSet(tick: number) {
  if (!tickCounterMax) return;

  tickCounterMax.textContent = tick.toString();
}
