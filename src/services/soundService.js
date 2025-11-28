// Lightweight sound manager for the app
// Usage:
// import playSound, { setMasterVolume, getMasterVolume } from '../services/soundService';
// playSound(src, { volume: 0.8, loop: false, id: 'optional-id', autoplay: true, onEnded })

// audioMap stores entries as: key -> { audio, baseVolume }
const audioMap = new Map();
let masterVolume = 1;

function _createAudio(src, baseVolume = 1, loop = false) {
  const a = new Audio(src);
  a.preload = "auto";
  a.loop = !!loop;
  // set effective volume after creation
  try {
    a.volume = Math.max(0, Math.min(1, baseVolume * masterVolume));
  } catch (err) {
    console.warn("soundService (create):", err);
  }
  return a;
}

function playSound(
  src,
  { volume = 1, loop = false, id = null, autoplay = true, onEnded = null } = {}
) {
  if (!src) return null;
  const key = id || src;
  let entry = audioMap.get(key);
  if (!entry) {
    const audio = _createAudio(src, volume, loop);
    entry = {
      audio,
      baseVolume:
        typeof volume === "number" ? Math.max(0, Math.min(1, volume)) : 1,
    };
    audioMap.set(key, entry);
  } else {
    const { audio } = entry;
    // update baseVolume/loop in case caller changed them
    entry.baseVolume =
      typeof volume === "number"
        ? Math.max(0, Math.min(1, volume))
        : entry.baseVolume;
    try {
      audio.loop = !!loop;
    } catch (err) {
      console.warn("soundService (loop):", err);
    }
    try {
      audio.volume = Math.max(0, Math.min(1, entry.baseVolume * masterVolume));
    } catch (err) {
      console.warn("soundService (volume):", err);
    }
  }

  const { audio } = entry;
  if (typeof onEnded === "function") audio.onended = onEnded;

  if (autoplay) {
    // try to play, swallow/catch promise rejections
    try {
      audio.currentTime = 0;
    } catch (err) {
      console.warn("soundService (currentTime):", err);
    }
    const p = audio.play();
    if (p && p.catch)
      p.catch((err) => {
        console.warn("playSound: playback prevented or failed", err);
      });
  }

  return {
    id: key,
    audio,
    pause: () => {
      try {
        audio.pause();
      } catch (err) {
        console.warn("soundService (pause):", err);
      }
    },
    stop: () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (err) {
        console.warn("soundService (stop):", err);
      }
    },
    setVolume: (v) => {
      try {
        entry.baseVolume = Math.max(0, Math.min(1, v));
        audio.volume = Math.max(
          0,
          Math.min(1, entry.baseVolume * masterVolume)
        );
      } catch (err) {
        console.warn("soundService (setVolume):", err);
      }
    },
  };
}

function preloadSound(src) {
  if (!src) return;
  if (!audioMap.has(src)) {
    const audio = _createAudio(src);
    audioMap.set(src, { audio, baseVolume: 1 });
    try {
      audio.load();
    } catch (err) {
      console.warn("soundService (load):", err);
    }
  }
}

function stopSound(idOrSrc) {
  const entry = audioMap.get(idOrSrc);
  if (entry && entry.audio) {
    try {
      entry.audio.pause();
      entry.audio.currentTime = 0;
    } catch (err) {
      console.warn("soundService (stopSound):", err);
    }
    audioMap.delete(idOrSrc);
  }
}

function stopAllSounds() {
  for (const [k, entry] of audioMap) {
    try {
      entry.audio.pause();
      entry.audio.currentTime = 0;
    } catch (err) {
      console.warn("soundService (stopAll):", err);
    }
    audioMap.delete(k);
  }
}

function setMasterVolume(v) {
  masterVolume =
    typeof v === "number" ? Math.max(0, Math.min(1, v)) : masterVolume;
  // apply to all tracked audios
  for (const [, entry] of audioMap) {
    try {
      entry.audio.volume = Math.max(
        0,
        Math.min(1, entry.baseVolume * masterVolume)
      );
    } catch (e) {}
  }
}

function getMasterVolume() {
  return masterVolume;
}

export {
  playSound,
  preloadSound,
  stopSound,
  stopAllSounds,
  setMasterVolume,
  getMasterVolume,
};
export default playSound;
