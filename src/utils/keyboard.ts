
export const keys = {
  arrowLeft: { isDown: false },
  arrowRight: { isDown: false },
  arrowUp: { isDown: false },
  arrowDown: { isDown: false },
  w: { isDown: false },
  a: { isDown: false },
  s: { isDown: false },
  d: { isDown: false },
  space: { isDown: false },
  num2: { isDown: false },
  num4: { isDown: false },
  num6: { isDown: false },
  num8: { isDown: false },
};

const press = (e: KeyboardEvent, isDown: boolean) => {
  e.preventDefault();
  const { code } = e;
  switch (code) {
    case 'ArrowLeft':
      keys.arrowLeft.isDown = isDown;
      break;
    case 'ArrowRight':
      keys.arrowRight.isDown = isDown;
      break;
    case 'ArrowUp':
      keys.arrowUp.isDown = isDown;
      break;
    case 'ArrowDown':
      keys.arrowDown.isDown = isDown;
      break;
    case 'Space':
      keys.space.isDown = isDown;
      break;
    case 'Numpad2':
      keys.num2.isDown = isDown;
      break;
    case 'Numpad4':
      keys.num4.isDown = isDown;
      break;
    case 'Numpad6':
      keys.num6.isDown = isDown;
      break;
    case 'Numpad8':
      keys.num8.isDown = isDown;
      break;
  }
};

document.addEventListener('keydown', (e) => press(e, true));
document.addEventListener('keyup', (e) => press(e, false));
