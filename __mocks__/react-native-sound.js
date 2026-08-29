// Manual mock so tests never touch the native RNSound module — Jest picks
// this up automatically for any `require('react-native-sound')` since it
// lives in a root-level __mocks__/ directory. See
// docs/specs/hooks/useBackgroundMusic.md.
//
// It mirrors one behaviour of the real `react-native-sound@0.13.x` that
// `useBackgroundMusic` has to work around: the file loads *asynchronously*
// (the constructor's callback fires on a later tick), and play/pause/stop/
// setVolume/setNumberOfLoops are all no-ops until then. Tests `await` an
// `act()` after mounting, which flushes the microtask the load callback is
// queued on.
class Sound {
  constructor(filename, basePath, callback) {
    this.filename = filename;
    this.basePath = basePath;
    this._volume = 1;
    this._loops = 0;
    this._playing = false;
    this._loaded = false;

    // Match the real signature: `basePath` is optional and may itself be
    // the callback.
    const onLoad = typeof basePath === 'function' ? basePath : callback;
    queueMicrotask(() => {
      this._loaded = true;
      if (onLoad) {
        onLoad(null);
      }
    });
  }

  static setCategory() {}

  isLoaded() {
    return this._loaded;
  }

  setNumberOfLoops(value) {
    this._loops = value;
    return this;
  }

  getNumberOfLoops() {
    return this._loops;
  }

  setVolume(value) {
    if (this._loaded) {
      this._volume = value;
    }
    return this;
  }

  getVolume() {
    return this._volume;
  }

  play(onEnd) {
    if (this._loaded) {
      this._playing = true;
      if (onEnd) {
        onEnd(true);
      }
    } else if (onEnd) {
      onEnd(false);
    }
    return this;
  }

  pause(cb) {
    if (this._loaded) {
      this._playing = false;
    }
    if (cb) {
      cb();
    }
    return this;
  }

  stop(cb) {
    if (this._loaded) {
      this._playing = false;
    }
    if (cb) {
      cb();
    }
    return this;
  }

  release() {
    this._loaded = false;
    return this;
  }

  isPlaying() {
    return this._playing;
  }
}

Sound.MAIN_BUNDLE = 'main';
Sound.DOCUMENT = 'document';
Sound.LIBRARY = 'library';
Sound.CACHES = 'caches';

module.exports = Sound;
