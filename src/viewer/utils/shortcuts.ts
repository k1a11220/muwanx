// Lightweight keyboard shortcuts manager for Vue Options API components
// Usage:
// const shortcuts = createShortcuts({
//   onReset: () => this.reset(),
//   onToggleUI: () => this.toggleUIVisibility(),
//   onToggleVRButton: () => this.toggleVRButton(),
//   onNavigateScene: (d) => this.navigateScene(d),
//   onNavigatePolicy: (d) => this.navigatePolicy(d),
//   getHelpVisible: () => this.showHelpDialog,
//   setHelpVisible: (v) => { this.showHelpDialog = v },
// });
// ... later on unmount: shortcuts.detach()

interface ShortcutsOptions {
  target?: EventTarget | null;
  onReset?: () => void;
  onToggleUI?: () => void;
  onToggleVRButton?: () => void;
  onNavigateScene?: (direction: number) => void;
  onNavigatePolicy?: (direction: number) => void;
  getHelpVisible?: () => boolean;
  setHelpVisible?: (visible: boolean) => void;
  onSetVelocityX?: (value: number) => void;
  onSetVelocityY?: (value: number) => void;
  onSetAngularVelocityZ?: (value: number) => void;
  onCycleCameraMode?: () => void;
  onToggleDepthMode?: () => void;
}

export function createShortcuts(options: ShortcutsOptions = {}) {
  const {
    target = typeof document !== 'undefined' ? document : null,
    onReset,
    onToggleUI,
    onToggleVRButton,
    onNavigateScene,
    onNavigatePolicy,
    getHelpVisible,
    setHelpVisible,
    onSetVelocityX,
    onSetVelocityY,
    onSetAngularVelocityZ,
    onCycleCameraMode,
    onToggleDepthMode,
  } = options;

  if (!target || typeof target.addEventListener !== 'function') {
    return { detach() { } };
  }

  // Track currently pressed keys for movement
  const pressedKeys = new Set();

  const handleKeydown = (event) => {
    try {
      // Ignore key events originating from text inputs, textareas or contenteditable elements
      const el = event.target;
      const tag = (el && el.tagName) ? el.tagName.toLowerCase() : '';
      const isEditable = (
        (tag === 'input') ||
        (tag === 'textarea') ||
        (el && el.isContentEditable === true)
      );
      if (isEditable) return;

      if (event.code === 'Backspace') {
        onReset && onReset();
        return;
      }

      const key = event.key;
      if (key === 'i') {
        onToggleUI && onToggleUI();
        return;
      }
      if (key === 'v') {
        onToggleVRButton && onToggleVRButton();
        return;
      }
      if (key === '?') {
        if (getHelpVisible && setHelpVisible) {
          setHelpVisible(!getHelpVisible());
        }
        return;
      }
      if (key === 's') {
        onNavigateScene && onNavigateScene(1);
        return;
      }
      if (key === 'S') {
        onNavigateScene && onNavigateScene(-1);
        return;
      }
      if (key === 'p') {
        onNavigatePolicy && onNavigatePolicy(1);
        return;
      }
      if (key === 'P') {
        onNavigatePolicy && onNavigatePolicy(-1);
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        pressedKeys.add('ArrowUp');
        onSetVelocityX && onSetVelocityX(1.0);
        return;
      }
      if (key === 'ArrowDown') {
        event.preventDefault();
        pressedKeys.add('ArrowDown');
        onSetVelocityX && onSetVelocityX(-1.0);
        return;
      }
      if (key === 'ArrowLeft') {
        event.preventDefault();
        pressedKeys.add('ArrowLeft');
        onSetAngularVelocityZ && onSetAngularVelocityZ(1.0);
        return;
      }
      if (key === 'ArrowRight') {
        event.preventDefault();
        pressedKeys.add('ArrowRight');
        onSetAngularVelocityZ && onSetAngularVelocityZ(-1.0);
        return;
      }
      if (key === 'z' || key === 'Z') {
        onCycleCameraMode && onCycleCameraMode();
        return;
      }
      if (key === 'x' || key === 'X') {
        onToggleDepthMode && onToggleDepthMode();
        return;
      }
    } catch (e) {
      // fail quietly; shortcuts are non-critical
      // console.warn('Shortcut handler error:', e);
    }
  };

  const handleKeyup = (event) => {
    try {
      const key = event.key;

      // Reset velocities when arrow keys are released
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        pressedKeys.delete(key);
        if (!pressedKeys.has('ArrowUp') && !pressedKeys.has('ArrowDown')) {
          onSetVelocityX && onSetVelocityX(0.0);
        }
        return;
      }
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        pressedKeys.delete(key);
        if (!pressedKeys.has('ArrowLeft') && !pressedKeys.has('ArrowRight')) {
          onSetAngularVelocityZ && onSetAngularVelocityZ(0.0);
        }
        return;
      }
    } catch (e) {
      // fail quietly
    }
  };

  target.addEventListener('keydown', handleKeydown);
  target.addEventListener('keyup', handleKeyup);

  return {
    detach() {
      try {
        target.removeEventListener('keydown', handleKeydown);
        target.removeEventListener('keyup', handleKeyup);
      } catch (_) { }
    },
    toggleHelp() {
      if (getHelpVisible && setHelpVisible) {
        setHelpVisible(!getHelpVisible());
      }
    },
  };
}

