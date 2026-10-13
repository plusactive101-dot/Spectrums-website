// SPECTRUMS ACOUSTIC SUITE - Audio Engine & Interactive Physics Lab

// -------------------------------------------------------------
// 1. WEB AUDIO API CORE ARCHITECTURE
// -------------------------------------------------------------
let audioCtx = null;
let masterGain = null;
let activeOsc = null;
let activeNoiseNode = null;
let analyserNode = null;
let visualizerAnimationId = null;

let isPlaying = false;
let currentFreq = 440;
let currentWaveform = 'sine';
let currentVolume = 0.25;
let visualizerMode = 'waveform'; // 'waveform' | 'frequency'

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Master Compressor / Limiter for hearing safety
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-3, audioCtx.currentTime);
    limiter.knee.setValueAtTime(6, audioCtx.currentTime);
    limiter.ratio.setValueAtTime(12, audioCtx.currentTime);
    limiter.attack.setValueAtTime(0.003, audioCtx.currentTime);
    limiter.release.setValueAtTime(0.25, audioCtx.currentTime);

    // Master Gain
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);

    // Analyser Node for Visualizer
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 2048;

    // Signal chain: Source -> masterGain -> limiter -> analyser -> destination
    masterGain.connect(limiter);
    limiter.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  updateAudioStatus(true);
}

function updateAudioStatus(active) {
  const dot = document.getElementById('audioStatusDot');
  const text = document.getElementById('audioStatusText');
  if (dot && text) {
    if (active) {
      dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
      text.innerText = "Engine Active";
    } else {
      dot.className = "w-2 h-2 rounded-full bg-slate-500";
      text.innerText = "Engine Standby";
    }
  }
}

// -------------------------------------------------------------
// 2. TONE SYNTHESIZER & FREQUENCY CONTROLS
// -------------------------------------------------------------
function logSliderToFreq(pos) {
  // Maps 0-1000 logarithmic slider to 20 Hz - 20,000 Hz
  const minF = 20;
  const maxF = 20000;
  return minF * Math.pow(maxF / minF, pos / 1000);
}

function freqToLogSlider(f) {
  const minF = 20;
  const maxF = 20000;
  return (Math.log(f / minF) / Math.log(maxF / minF)) * 1000;
}

function updateFrequencyReadout(freq) {
  currentFreq = Math.round(freq * 10) / 10;
  const freqDisplay = document.getElementById('freqDisplay');
  const wavelengthDisplay = document.getElementById('wavelengthDisplay');
  const playBtnText = document.getElementById('playBtnText');

  if (freqDisplay) freqDisplay.innerText = currentFreq.toFixed(1);
  if (playBtnText && !isPlaying) playBtnText.innerText = `START TONE (${Math.round(currentFreq)} Hz)`;
  
  // Wavelength in air (c = 343 m/s)
  const wavelengthMeters = 343 / currentFreq;
  if (wavelengthDisplay) {
    if (wavelengthMeters >= 1) {
      wavelengthDisplay.innerText = `${wavelengthMeters.toFixed(2)} m`;
    } else {
      wavelengthDisplay.innerText = `${(wavelengthMeters * 100).toFixed(1)} cm`;
    }
  }

  if (activeOsc && audioCtx) {
    activeOsc.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.03);
  }
}

function togglePlayTone() {
  if (isPlaying) {
    stopAllAudio();
  } else {
    playTone(currentFreq, currentWaveform);
  }
}

function playTone(freq, waveform = 'sine') {
  initAudio();
  stopActiveSources();

  currentFreq = freq;
  currentWaveform = waveform;
  updateFrequencyReadout(freq);

  // Sync slider
  const slider = document.getElementById('freqSlider');
  if (slider) slider.value = freqToLogSlider(freq);

  activeOsc = audioCtx.createOscillator();
  activeOsc.type = waveform;
  activeOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  activeOsc.connect(masterGain);
  activeOsc.start();
  isPlaying = true;

  updatePlayButtonUI(true);
  startVisualizer();
}

function updatePlayButtonUI(playing) {
  const btn = document.getElementById('playBtn');
  const icon = document.getElementById('playIcon');
  const text = document.getElementById('playBtnText');

  if (btn && icon && text) {
    if (playing) {
      btn.className = "flex-1 py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white mono shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 text-sm";
      icon.className = "fa-solid fa-stop";
      text.innerText = `STOP TONE (${Math.round(currentFreq)} Hz)`;
    } else {
      btn.className = "flex-1 py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white mono shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 text-sm";
      icon.className = "fa-solid fa-play";
      text.innerText = `START TONE (${Math.round(currentFreq)} Hz)`;
    }
  }
}

function stopActiveSources() {
  if (activeOsc) {
    try { activeOsc.stop(); activeOsc.disconnect(); } catch (e) {}
    activeOsc = null;
  }
  if (activeNoiseNode) {
    try { activeNoiseNode.stop(); activeNoiseNode.disconnect(); } catch (e) {}
    activeNoiseNode = null;
  }
}

function stopAllAudio() {
  stopActiveSources();
  isPlaying = false;
  updatePlayButtonUI(false);
  updateAudioStatus(false);
}

function adjustFrequency(delta) {
  let newF = Math.max(20, Math.min(20000, currentFreq + delta));
  const slider = document.getElementById('freqSlider');
  if (slider) slider.value = freqToLogSlider(newF);
  updateFrequencyReadout(newF);
}

function setOctave(multiplier) {
  let newF = Math.max(20, Math.min(20000, currentFreq * multiplier));
  const slider = document.getElementById('freqSlider');
  if (slider) slider.value = freqToLogSlider(newF);
  updateFrequencyReadout(newF);
}

function setWaveform(wave) {
  currentWaveform = wave;
  if (activeOsc) {
    activeOsc.type = wave;
  }
  document.querySelectorAll('.wave-btn').forEach(btn => {
    if (btn.dataset.wave === wave) {
      btn.className = "wave-btn px-2 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white mono transition";
    } else {
      btn.className = "wave-btn px-2 py-2 rounded-lg text-xs font-medium bg-studio-850 hover:bg-studio-800 text-slate-300 mono transition";
    }
  });
}

// Quick Preset Play
function quickPlayPreset(freq, label) {
  playTone(freq, 'sine');
}

// -------------------------------------------------------------
// 3. NOISE GENERATOR (PINK & WHITE)
// -------------------------------------------------------------
function playNoise(type = 'pink') {
  initAudio();
  stopActiveSources();

  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'pink') {
    // Paul Kellet's filtered pink noise algorithm (-3dB/octave)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    // White Noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
  }

  activeNoiseNode = audioCtx.createBufferSource();
  activeNoiseNode.buffer = buffer;
  activeNoiseNode.loop = true;
  activeNoiseNode.connect(masterGain);
  activeNoiseNode.start();
  isPlaying = true;

  updatePlayButtonUI(true);
  const playBtnText = document.getElementById('playBtnText');
  if (playBtnText) playBtnText.innerText = `STOP NOISE (${type.toUpperCase()})`;
  startVisualizer();
}

// -------------------------------------------------------------
// 4. LOGARITHMIC FREQUENCY SWEEPER (20 Hz -> 20,000 Hz)
// -------------------------------------------------------------
function startFrequencySweep() {
  initAudio();
  stopActiveSources();

  const duration = 20; // 20 seconds
  const startF = 20;
  const endF = 20000;

  activeOsc = audioCtx.createOscillator();
  activeOsc.type = 'sine';
  activeOsc.frequency.setValueAtTime(startF, audioCtx.currentTime);
  activeOsc.frequency.exponentialRampToValueAtTime(endF, audioCtx.currentTime + duration);

  activeOsc.connect(masterGain);
  activeOsc.start();
  activeOsc.stop(audioCtx.currentTime + duration);
  isPlaying = true;

  updatePlayButtonUI(true);
  const playBtnText = document.getElementById('playBtnText');
  if (playBtnText) playBtnText.innerText = "SWEEPING 20Hz - 20kHz...";

  startVisualizer();

  // Progress update interval
  const startTime = audioCtx.currentTime;
  const sweepInterval = setInterval(() => {
    if (!isPlaying || !activeOsc) {
      clearInterval(sweepInterval);
      return;
    }
    const elapsed = audioCtx.currentTime - startTime;
    if (elapsed >= duration) {
      clearInterval(sweepInterval);
      stopAllAudio();
      return;
    }
    // Calculate current instantaneous frequency
    const instantaneousF = startF * Math.pow(endF / startF, elapsed / duration);
    updateFrequencyReadout(instantaneousF);
    const slider = document.getElementById('freqSlider');
    if (slider) slider.value = freqToLogSlider(instantaneousF);
  }, 100);
}

// -------------------------------------------------------------
// 5. HTML5 CANVAS REAL-TIME VISUALIZER (OSCILLOSCOPE & SPECTRUM)
// -------------------------------------------------------------
function setVisualizerMode(mode) {
  visualizerMode = mode;
  document.querySelectorAll('.vis-mode-btn').forEach(btn => {
    if (btn.dataset.mode === mode) {
      btn.className = "vis-mode-btn text-[11px] text-violet-400 font-bold";
    } else {
      btn.className = "vis-mode-btn text-[11px] text-slate-500 hover:text-slate-300";
    }
  });
}

function startVisualizer() {
  const canvas = document.getElementById('visualizerCanvas');
  const notice = document.getElementById('visIdleNotice');
  if (!canvas || !analyserNode) return;

  if (notice) notice.style.display = 'none';
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.parentElement.clientHeight * window.devicePixelRatio;
  }
  resize();

  const bufferLength = analyserNode.frequencyBinCount;
  const timeData = new Uint8Array(bufferLength);
  const freqData = new Uint8Array(bufferLength);

  function draw() {
    visualizerAnimationId = requestAnimationFrame(draw);

    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (visualizerMode === 'waveform') {
      analyserNode.getByteTimeDomainData(timeData);

      ctx.lineWidth = 2.5 * window.devicePixelRatio;
      ctx.strokeStyle = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#a855f7';

      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

    } else {
      // Spectrum Analyzer Bars
      analyserNode.getByteFrequencyData(freqData);

      const barCount = 64;
      const barWidth = (canvas.width / barCount);
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const index = Math.floor(Math.pow(i / barCount, 2) * (bufferLength / 2));
        const val = freqData[index] || 0;
        const percent = val / 255;
        const barHeight = percent * (canvas.height * 0.9);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.6, '#a855f7');
        gradient.addColorStop(1, '#f43f5e');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    }
  }

  if (visualizerAnimationId) cancelAnimationFrame(visualizerAnimationId);
  draw();
}

// -------------------------------------------------------------
// 6. FREQUENCY SPECTRUM ANATOMY DATA & EXPLORER
// -------------------------------------------------------------
const spectrumBands = [
  {
    id: "sub-bass",
    name: "Sub-Bass",
    range: "20 - 60 Hz",
    centerFreq: 45,
    color: "from-purple-900 to-indigo-900",
    border: "border-purple-500",
    textCol: "text-purple-400",
    description: "Felt more than heard. Gives physical weight and power to kick drums, sub-bass, and cinematic rumbles. In normal home rooms, 20-60 Hz standing waves are massive (up to 17 meters long) and require deep bass traps.",
    instruments: "Sub-bass synth (808), pipe organ, kick drum sub fundamental, explosion FX.",
    eqAdvice: "High-pass non-bass instruments at 30-40 Hz to clean up headroom. A subtle bump at 45-50 Hz adds visceral chest-thumping energy."
  },
  {
    id: "bass",
    name: "Bass",
    range: "60 - 250 Hz",
    centerFreq: 120,
    color: "from-indigo-900 to-blue-900",
    border: "border-indigo-500",
    textCol: "text-indigo-400",
    description: "The core anchor of musical warmth, rhythm, and body. Where the fundamental notes of bass guitar, cello, and kick thumps live. This is the primary problem zone for room modes in residential studios (80 - 150 Hz boominess).",
    instruments: "Bass guitar, upright bass, kick punch, male vocal fundamentals, floor toms.",
    eqAdvice: "Carve out 100-150 Hz on the bass if the kick drum needs punch, or vice-versa to prevent frequency masking. Keep centered in mono."
  },
  {
    id: "low-mids",
    name: "Low-Mids",
    range: "250 - 500 Hz",
    centerFreq: 350,
    color: "from-blue-900 to-cyan-900",
    border: "border-cyan-500",
    textCol: "text-cyan-400",
    description: "The 'boxiness' and 'mud' territory. Too much energy here causes a muffled, cardboard box sound. Too little makes mixes sound thin, hollow, and cold. Crucial for acoustic guitar body and vocal warmth.",
    instruments: "Acoustic guitar body, snare drum body, piano low registers, warmth of brass.",
    eqAdvice: "A wide, gentle 2 to 3 dB dip around 300 - 400 Hz instantly de-clutters a crowded mix and reveals clarity."
  },
  {
    id: "midrange",
    name: "Midrange",
    range: "500 Hz - 2 kHz",
    centerFreq: 1000,
    color: "from-cyan-900 to-teal-900",
    border: "border-teal-500",
    textCol: "text-teal-400",
    description: "The focal point of human hearing (evolutionarily tuned to speech intelligibility). 1 kHz is the international acoustic benchmark. Contains the core identity of human vocals and lead instruments.",
    instruments: "Lead vocals, electric guitars, keyboards, violin, snare rim, brass.",
    eqAdvice: "Small 1 dB moves here are instantly noticeable. Boosting 1 kHz adds telephone-like horniness; dipping 1 kHz creates a scooped modern pop sound."
  },
  {
    id: "high-mids",
    name: "High-Mids",
    range: "2 - 4 kHz",
    centerFreq: 3000,
    color: "from-teal-900 to-emerald-900",
    border: "border-emerald-500",
    textCol: "text-emerald-400",
    description: "The ear's maximum acoustic sensitivity zone (canal resonance). Controls crunch, bite, and attack on drums. Excessive energy here causes immediate listener fatigue and harshness.",
    instruments: "Vocal consonants, guitar attack, snare snap, piano hammer strike.",
    eqAdvice: "Boost 2.5 - 3 kHz to bring a quiet vocal forward without raising overall volume. Tame harsh guitars around 3.5 kHz."
  },
  {
    id: "presence",
    name: "Presence",
    range: "4 - 6 kHz",
    centerFreq: 5000,
    color: "from-emerald-900 to-amber-900",
    border: "border-amber-500",
    textCol: "text-amber-400",
    description: "Responsible for definition, intimacy, and perceived front-to-back distance in the acoustic soundstage. Boosting presence brings sound right in front of the listener's face.",
    instruments: "Vocal breath, acoustic guitar pick scrape, violin bow friction, synth leads.",
    eqAdvice: "Boost at 5 kHz for high-definition clarity. Watch for vocal sibilance (de-ess between 5 and 7 kHz)."
  },
  {
    id: "brilliance",
    name: "Brilliance / Air",
    range: "6 - 20 kHz",
    centerFreq: 12000,
    color: "from-amber-900 to-rose-900",
    border: "border-rose-500",
    textCol: "text-rose-400",
    description: "The highest octave of human hearing. Gives an open, three-dimensional acoustic atmosphere, shimmer, and 'expensive' high-end studio gloss. Rapidly absorbed by air and room curtains.",
    instruments: "Cymbals (ride/crash), vocal air, synth harmonics, room acoustic reverberation.",
    eqAdvice: "A gentle smooth high-shelf boost at 10 - 12 kHz adds studio air and open acoustic dimension without creating harshness."
  }
];

let activeBandId = "midrange";

function renderSpectrumBands() {
  const container = document.getElementById('spectrumBandsNav');
  if (!container) return;

  container.innerHTML = '';
  spectrumBands.forEach(band => {
    const isSelected = band.id === activeBandId;
    const btn = document.createElement('button');
    btn.onclick = () => selectSpectrumBand(band.id);
    btn.className = `p-3 rounded-xl border text-left transition flex flex-col justify-between ${
      isSelected 
        ? `bg-gradient-to-b ${band.color} ${band.border} ring-2 ring-violet-400/40 shadow-lg` 
        : `bg-studio-900 hover:bg-studio-850 border-studio-800`
    }`;

    btn.innerHTML = `
      <div class="text-[10px] text-slate-400 mono">${band.range}</div>
      <div class="text-xs font-bold text-white mt-1">${band.name}</div>
      <div class="text-[10px] ${band.textCol} mono mt-2 font-semibold">Audit →</div>
    `;
    container.appendChild(btn);
  });

  renderBandDetailCard();
}

function selectSpectrumBand(bandId) {
  activeBandId = bandId;
  renderSpectrumBands();
}

function renderBandDetailCard() {
  const card = document.getElementById('bandDetailCard');
  const band = spectrumBands.find(b => b.id === activeBandId) || spectrumBands[3];
  if (!card) return;

  const wavelength = (343 / band.centerFreq);
  const wavelengthStr = wavelength >= 1 ? `${wavelength.toFixed(2)} meters` : `${(wavelength * 100).toFixed(1)} cm`;

  card.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-studio-800 gap-3">
      <div>
        <div class="text-xs ${band.textCol} mono font-bold uppercase tracking-wider">${band.range} • ${band.name.toUpperCase()}</div>
        <h3 class="text-xl font-bold text-white mt-1">Acoustic Behavior & Mixing Principles</h3>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="playTone(${band.centerFreq})" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs mono transition flex items-center gap-1.5 shadow-md shadow-violet-600/30">
          <i class="fa-solid fa-play"></i>
          <span>Play ${band.centerFreq} Hz Center Tone</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      <div class="space-y-1">
        <div class="text-xs text-slate-400 mono font-semibold">ACOUSTIC PROFILE</div>
        <p class="text-xs text-slate-300 leading-relaxed">${band.description}</p>
      </div>
      <div class="space-y-1">
        <div class="text-xs text-slate-400 mono font-semibold">KEY INSTRUMENTS</div>
        <p class="text-xs text-slate-300 leading-relaxed">${band.instruments}</p>
      </div>
      <div class="space-y-1">
        <div class="text-xs text-slate-400 mono font-semibold">STUDIO EQ RULE OF THUMB</div>
        <p class="text-xs text-slate-300 leading-relaxed">${band.eqAdvice}</p>
        <div class="pt-2 text-[11px] text-cyan-400 mono">Wavelength at center: ${wavelengthStr}</div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 7. STUDIO ROOM MODES & STANDING WAVE CALCULATOR
// -------------------------------------------------------------
let roomUnit = 'meters'; // 'meters' | 'feet'

function setRoomUnit(unit) {
  roomUnit = unit;
  const btnM = document.getElementById('btnMeters');
  const btnF = document.getElementById('btnFeet');

  if (unit === 'meters') {
    if (btnM) btnM.className = "px-3 py-1 rounded bg-violet-600 text-white font-semibold transition";
    if (btnF) btnF.className = "px-3 py-1 rounded text-slate-400 hover:text-white transition";
    
    // Default metric values
    document.getElementById('inputLength').value = 5.0;
    document.getElementById('inputWidth').value = 3.8;
    document.getElementById('inputHeight').value = 2.6;
    document.getElementById('inputLength').max = 15;
    document.getElementById('inputWidth').max = 12;
    document.getElementById('inputHeight').max = 6;
  } else {
    if (btnF) btnF.className = "px-3 py-1 rounded bg-violet-600 text-white font-semibold transition";
    if (btnM) btnM.className = "px-3 py-1 rounded text-slate-400 hover:text-white transition";

    // Default imperial values (feet)
    document.getElementById('inputLength').value = 16.4;
    document.getElementById('inputWidth').value = 12.5;
    document.getElementById('inputHeight').value = 8.5;
    document.getElementById('inputLength').max = 50;
    document.getElementById('inputWidth').max = 40;
    document.getElementById('inputHeight').max = 20;
  }
  calculateRoomModes();
}

function calculateRoomModes() {
  const L = parseFloat(document.getElementById('inputLength').value);
  const W = parseFloat(document.getElementById('inputWidth').value);
  const H = parseFloat(document.getElementById('inputHeight').value);

  const unitSuffix = roomUnit === 'meters' ? 'm' : 'ft';
  document.getElementById('lengthVal').innerText = `${L.toFixed(1)} ${unitSuffix}`;
  document.getElementById('widthVal').innerText = `${W.toFixed(1)} ${unitSuffix}`;
  document.getElementById('heightVal').innerText = `${H.toFixed(1)} ${unitSuffix}`;

  const speedOfSound = roomUnit === 'meters' ? 343 : 1125; // m/s or ft/s

  // Volume & Area
  const volume = L * W * H;
  const surfaceArea = 2 * (L * W + L * H + W * H);

  const volUnit = roomUnit === 'meters' ? 'm³' : 'ft³';
  const areaUnit = roomUnit === 'meters' ? 'm²' : 'ft²';
  document.getElementById('roomVolumeDisplay').innerText = `${volume.toFixed(1)} ${volUnit}`;
  document.getElementById('roomSurfaceDisplay').innerText = `${surfaceArea.toFixed(1)} ${areaUnit}`;

  // Schroeder Frequency estimation (assuming average studio RT60 = 0.3s)
  // fs ~ 2000 * sqrt(RT60 / V_meters)
  const volMetric = roomUnit === 'meters' ? volume : volume * 0.0283168;
  const schroederF = Math.round(2000 * Math.sqrt(0.3 / volMetric));
  document.getElementById('schroederDisplay').innerText = `~${schroederF} Hz`;

  // Calculate Axial Modes up to 4th harmonic
  const modes = [];

  for (let n = 1; n <= 4; n++) {
    modes.push({ dim: 'Length', harmonic: `Mode (${n},0,0)`, freq: (speedOfSound / 2) * (n / L) });
    modes.push({ dim: 'Width', harmonic: `Mode (0,${n},0)`, freq: (speedOfSound / 2) * (n / W) });
    modes.push({ dim: 'Height', harmonic: `Mode (0,0,${n})`, freq: (speedOfSound / 2) * (n / H) });
  }

  // Filter modes below 300 Hz and sort ascending
  const filteredModes = modes
    .filter(m => m.freq <= 300)
    .sort((a, b) => a.freq - b.freq);

  const tbody = document.getElementById('modesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  filteredModes.forEach((mode, idx) => {
    const fRound = Math.round(mode.freq * 10) / 10;
    const wavelengthM = 343 / mode.freq;
    const wavelengthStr = wavelengthM >= 1 ? `${wavelengthM.toFixed(2)} m` : `${Math.round(wavelengthM * 100)} cm`;

    // Check spacing with next mode to detect mode bunching / booming hazard
    const nextMode = filteredModes[idx + 1];
    const isClustered = nextMode && Math.abs(nextMode.freq - mode.freq) <= 4.0;

    const tr = document.createElement('tr');
    tr.className = `hover:bg-studio-800/80 transition cursor-pointer ${isClustered ? 'bg-amber-950/20' : ''}`;
    tr.onclick = () => playTone(fRound, 'sine');

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-bold text-white">
        <span class="text-violet-400">${fRound}</span> Hz
      </td>
      <td class="py-2.5 px-3 text-slate-300">${mode.dim}</td>
      <td class="py-2.5 px-3 text-slate-400">${mode.harmonic}</td>
      <td class="py-2.5 px-3 text-slate-400">${wavelengthStr}</td>
      <td class="py-2.5 px-3">
        ${isClustered 
          ? '<span class="text-amber-400 font-semibold flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Mode Cluster (Boom Hazard)</span>'
          : '<span class="text-slate-400">Resonant Pressure Peak</span>'
        }
      </td>
      <td class="py-2.5 px-3 text-right">
        <button class="px-2 py-1 rounded bg-studio-800 hover:bg-violet-600 text-slate-300 hover:text-white transition text-[11px]">
          Test <i class="fa-solid fa-volume-high ml-1"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// 8. EVENT LISTENERS & INITIALIZATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Frequency Slider Listener
  const freqSlider = document.getElementById('freqSlider');
  if (freqSlider) {
    freqSlider.addEventListener('input', (e) => {
      const f = logSliderToFreq(parseFloat(e.target.value));
      updateFrequencyReadout(f);
    });
  }

  // Volume Slider Listener
  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      currentVolume = parseFloat(e.target.value) / 100;
      document.getElementById('volPercent').innerText = `${e.target.value}%`;
      if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, 0.02);
      }
    });
  }

  // Initialize spectrum explorer
  renderSpectrumBands();

  // Initialize room mode calculator
  calculateRoomModes();

  // Initial readout
  updateFrequencyReadout(440);
});
