// Manual mock so tests never touch the native RNSound module — Jest picks
// this up automatically for any `require('react-native-sound')` since it
// lives in a root-level __mocks__/ directory. See
// docs/specs/hooks/useBackgroundMusic.md.
class Sound {
  constructor(filename, basePath, callback) {
    this.filename = filename;
    this.basePath = basePath;
    this._volume = 1;
    this._loops = 0;
    this._playing = false;
    if (callback) {
      callback(null);
    }
  }

  static setCategory() {}

  setNumberOfLoops(value) {
    this._loops = value;
    return this;
  }

  getNumberOfLoops() {
    return this._loops;
  }

  setVolume(value) {
    this._volume = value;
    return this;
  }

  getVolume() {
    return this._volume;
  }

  play(onEnd) {
    this._playing = true;
    if (onEnd) {
      onEnd(true);
    }
    return this;
  }

  pause(cb) {
    this._playing = false;
    if (cb) {
      cb();
    }
    return this;
  }

  stop(cb) {
    this._playing = false;
    if (cb) {
      cb();
    }
    return this;
  }

  release() {
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
