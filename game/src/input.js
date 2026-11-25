// Sizzle & Serve — keyboard and mouse input, kept apart from the loop.
// Keyboard moves the chef; a click sets a walk target (and, on arrival,
// uses the station clicked). E / Space interact, P pauses, R restarts.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    target: null,          // { x, y, station } walk target from a click
    interactPressed: false,
    pausePressed: false,
    restartPressed: false,
    confirmPressed: false,
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 800,
    };
  }

  window.addEventListener('keydown', (event) => {
    const mapped = KEYMAP[event.code];
    if (mapped) {
      input.keys.add(mapped);
      input.target = null;      // keys override a click walk
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.interactPressed = true;
      event.preventDefault();
    }
    if (event.code === 'KeyP' && !event.repeat) input.pausePressed = true;
    if (event.code === 'KeyR' && !event.repeat) input.restartPressed = true;
    if (event.code === 'Enter' && !event.repeat) input.confirmPressed = true;
    if (event.code === 'KeyM' && !event.repeat) input.mutePressed = true;
  });
  window.addEventListener('keyup', (event) => {
    const mapped = KEYMAP[event.code];
    if (mapped) input.keys.delete(mapped);
  });
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const p = toGameCoords(event);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toGameCoords(event);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
    input.mouse.down = true;
    input.target = { x: p.x, y: p.y, station: null };
  });
  canvas.addEventListener('mouseup', () => { input.mouse.down = false; });

  return input;
}

// Edge-triggered flags: read once per frame, then cleared by the loop.
export function consumeFlags(input) {
  const flags = {
    interact: input.interactPressed,
    pause: input.pausePressed,
    restart: input.restartPressed,
    confirm: input.confirmPressed,
    mute: input.mutePressed || false,
  };
  input.interactPressed = false;
  input.pausePressed = false;
  input.restartPressed = false;
  input.confirmPressed = false;
  input.mutePressed = false;
  return flags;
}
