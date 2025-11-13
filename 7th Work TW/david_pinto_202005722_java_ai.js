// Hybrid Audio Visualiser with recording + mute support
// -------------------------------------------------------
// Keeps your existing Record button, canvas (#canvaDraw), and gallery/theme logic.
// Adds a modern Web Audio API visualiser (bars + wave hybrid) using the same microphone stream.

var isDarkOn = false;
var value = 1;
let alt1 = "Me and My Mother";
let alt2 = "My brother and a friend playing around";
let alt3 = "My brother and a friend playing around, with a beer";
let alt4 = "My family uwu";
let alt5 = "My brother, again";
let alt6 = "My father and my brother";
let currentalt = alt1;

// --- AUDIO VISUALISER SETUP ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const gainNode = audioCtx.createGain();
const muteBtn = document.getElementById("mute");
const canvas = document.getElementById("canvaDraw");
const canvasCtx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let recording = false;
let isMuted = false;
let source = null;
let mediaRecorder = null;

// Microphone setup
if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    // Create source + analyser chain
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Recorder setup
    mediaRecorder = new MediaRecorder(stream);
    let chunks = [];
    mediaRecorder.ondataavailable = (event) => chunks.push(event.data);

    mediaRecorder.onstop = () => {
      const audio = new Audio();
      audio.setAttribute("controls", "");
      $("#sound-clip").append(audio).append("<br />");
      const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
      audio.src = window.URL.createObjectURL(blob);
      chunks = [];
    };

    // Record button
    $("#record").on("click", () => {
      if (recording) {
        mediaRecorder.stop();
        recording = false;
        $("#record").html("Record");
      } else {
        if (audioCtx.state === "suspended") audioCtx.resume();
        mediaRecorder.start();
        recording = true;
        $("#record").html("Stop");
      }
    });

    // --- VISUALISER CONFIG ---
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      analyser.getByteFrequencyData(freqData);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      // Hybrid waveform + bars visual
      // Bars
      const barWidth = (WIDTH / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i += 2) {
        const barHeight = (freqData[i] / 255) * HEIGHT;
        const hue = 200 - (i / bufferLength) * 200;
        canvasCtx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      // Waveform
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "#fff";
      canvasCtx.beginPath();
      const sliceWidth = WIDTH / bufferLength;
      let wx = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;
        if (i === 0) canvasCtx.moveTo(wx, y);
        else canvasCtx.lineTo(wx, y);
        wx += sliceWidth;
      }
      canvasCtx.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx.stroke();

      // Overlay when muted
      if (isMuted) {
        canvasCtx.fillStyle = "rgba(0,0,0,0.4)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = "rgba(255,255,255,0.8)";
        canvasCtx.font = "bold 14px system-ui";
        canvasCtx.textAlign = "center";
        canvasCtx.fillText("MUTED", WIDTH / 2, HEIGHT / 2 + 5);
      }
    }
    draw();
  }).catch(() => {
    alert("Microphone access failed.");
  });
}

// --- MUTE CONTROL ---
muteBtn.addEventListener("click", () => {
  if (!gainNode) return;
  isMuted = !isMuted;
  gainNode.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
});

// --- EXISTING UI LOGIC ---
document.getElementById("gallery").alt = currentalt;
document.getElementById("galleryText").innerHTML = currentalt;

function LightandDark() {
  if (!isDarkOn) {
    document.getElementById("mode").innerHTML = "Light Mode";
    document.body.style.backgroundColor = "rgb(0, 0, 0)";
    document.getElementById("main").style.backgroundColor = "black";
    document.getElementById("main").style.border = "1rem double rgba(255, 255, 255, 0.86)";
    document.getElementById("mainText").style.color = "white";
    document.getElementById("title").style.color = "white";
    isDarkOn = true;
  } else {
    document.getElementById("mode").innerHTML = "Dark Mode";
    document.body.style.backgroundColor = "rgb(85, 6, 149)";
    document.getElementById("main").style.backgroundColor = "rgb(78, 255, 158)";
    document.getElementById("main").style.border = "1rem double rgb(85, 6, 149)";
    document.getElementById("mainText").style.color = "rgb(91, 91, 91)";
    document.getElementById("title").style.color = "rgb(85, 6, 149)";
    isDarkOn = false;
  }
}

function galleryPlus(imageval) {
  value = value + 1;
  if (value > 6) value = 1;
  currentalt = eval(`alt${value}`);
  document.getElementById("gallery").alt = currentalt;
  document.getElementById("galleryText").innerHTML = currentalt;
  document.getElementById("gallery").src = `david_pinto_202005722_gallery_${value}.jpg`;
}

function galleryMinus(imageval) {
  value = value - 1;
  if (value < 1) value = 6;
  currentalt = eval(`alt${value}`);
  document.getElementById("gallery").alt = currentalt;
  document.getElementById("galleryText").innerHTML = currentalt;
  document.getElementById("gallery").src = `david_pinto_202005722_gallery_${value}.jpg`;
}

document.getElementById("mode").addEventListener("click", LightandDark);
document.getElementById("galleryRight").addEventListener("click", galleryPlus);
document.getElementById("galleryLeft").addEventListener("click", galleryMinus);

// --- Real-time webcam video filter (inserted between section and audio_box) ---
// Put this near the end of your JS file (after DOM elements like #audio_box exist).
(function () {
  // Helper to create elements
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    children.forEach((c) => e.appendChild(c));
    return e;
  }

  // Find insertion point: between the section and #audio_box
  const section = document.querySelector("main section");
  const audioBox = document.getElementById("audio_box");
  const insertBeforeNode = audioBox || section.nextSibling;

  // Container
  const vidContainer = el("div", { id: "video-filter-container", style: "margin:18px auto;max-width:760px;" });

  // UI elements
  const controlsRow = el("div", { class: "vf-controls", style: "display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;" });
  const filterSelect = el("select", { id: "vf-filter" });
  ["normal", "grayscale", "sepia", "invert", "threshold", "brightness", "contrast"].forEach((f) => {
    const o = document.createElement("option"); o.value = f; o.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    filterSelect.appendChild(o);
  });
  const intensityLabel = el("label", { for: "vf-intensity", text: "Intensity" });
  const intensityRange = el("input", { id: "vf-intensity", type: "range", min: "0", max: "100", value: "100" });
  const mirrorBtn = el("button", { id: "vf-mirror", text: "Mirror: Off", type: "button", style: "padding:6px 10px;border-radius:6px;" });
  const snapshotBtn = el("button", { id: "vf-snapshot", text: "Snapshot", type: "button", style: "padding:6px 10px;border-radius:6px;" });

  // Video (hidden) and canvas (visible)
  const videoEl = el("video", { id: "vf-video", autoplay: "", playsinline: "", muted: "" });
  videoEl.style.display = "none"; // hide raw video element
  const canvasEl = el("canvas", { id: "vf-canvas", width: "640", height: "360", style: "width:100%;max-width:640px;border-radius:8px;display:block;margin:8px auto;" });

  // Status / error text
  const status = el("div", { id: "vf-status", text: "Initializing camera...", style: "font-size:0.9rem;color:#333;text-align:center;margin-top:6px;" });

  // Assemble
  controlsRow.appendChild(filterSelect);
  controlsRow.appendChild(intensityLabel);
  controlsRow.appendChild(intensityRange);
  controlsRow.appendChild(mirrorBtn);
  controlsRow.appendChild(snapshotBtn);
  vidContainer.appendChild(controlsRow);
  vidContainer.appendChild(videoEl);
  vidContainer.appendChild(canvasEl);
  vidContainer.appendChild(status);

  // Insert before audio_box (or after section if audio_box missing)
  if (audioBox && audioBox.parentNode) audioBox.parentNode.insertBefore(vidContainer, audioBox);
  else if (section && section.parentNode) section.parentNode.insertBefore(vidContainer, section.nextSibling || null);

  // Canvas context
  const ctx = canvasEl.getContext("2d");
  let streaming = false;
  let mirror = false;

  // Access webcam
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      videoEl.srcObject = stream;
      await videoEl.play();
      // Resize canvas to match video aspect ratio (but keep CSS responsive)
      canvasEl.width = videoEl.videoWidth || 640;
      canvasEl.height = videoEl.videoHeight || 360;
      streaming = true;
      status.textContent = "Camera ready — choose filter";
      requestAnimationFrame(drawFrame);
    } catch (err) {
      console.error("Camera error:", err);
      status.textContent = "Webcam unavailable or permission denied.";
    }
  }

  // Pixel filter helpers
  function applyFilter(imageData, filterName, intensity) {
    const d = imageData.data;
    const len = d.length;
    const t = intensity; // 0..1
    if (filterName === "normal") return imageData;
    if (filterName === "grayscale") {
      for (let i = 0; i < len; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const gray = (0.2126 * r + 0.7152 * g + 0.0722 * b);
        d[i] = r + (gray - r) * t;
        d[i + 1] = g + (gray - g) * t;
        d[i + 2] = b + (gray - b) * t;
      }
    } else if (filterName === "sepia") {
      for (let i = 0; i < len; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const nr = (0.393 * r + 0.769 * g + 0.189 * b);
        const ng = (0.349 * r + 0.686 * g + 0.168 * b);
        const nb = (0.272 * r + 0.534 * g + 0.131 * b);
        d[i] = r + (nr - r) * t;
        d[i + 1] = g + (ng - g) * t;
        d[i + 2] = b + (nb - b) * t;
      }
    } else if (filterName === "invert") {
      for (let i = 0; i < len; i += 4) {
        d[i] = d[i] + (255 - d[i] - d[i]) * t;
        d[i + 1] = d[i + 1] + (255 - d[i + 1] - d[i + 1]) * t;
        d[i + 2] = d[i + 2] + (255 - d[i + 2] - d[i + 2]) * t;
      }
    } else if (filterName === "threshold") {
      // threshold intensity determines cutoff
      for (let i = 0; i < len; i += 4) {
        const gray = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
        const cutoff = 255 * (1 - t * 0.9); // when t small, cutoff large (less black)
        const v = gray >= cutoff ? 255 : 0;
        d[i] = v; d[i + 1] = v; d[i + 2] = v;
      }
    } else if (filterName === "brightness") {
      const amt = (t * 1.4) - 0.2; // range roughly -0.2 .. +1.2
      for (let i = 0; i < len; i += 4) {
        d[i] = Math.min(255, Math.max(0, d[i] + 255 * amt));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + 255 * amt));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + 255 * amt));
      }
    } else if (filterName === "contrast") {
      // simple contrast adjust
      const factor = (259 * (t * 255 + 255)) / (255 * (259 - t * 255));
      for (let i = 0; i < len; i += 4) {
        d[i] = clamp(factor * (d[i] - 128) + 128);
        d[i + 1] = clamp(factor * (d[i + 1] - 128) + 128);
        d[i + 2] = clamp(factor * (d[i + 2] - 128) + 128);
      }
    }
    return imageData;
  }

  function clamp(v) { return Math.max(0, Math.min(255, v)); }

  // Main draw loop
  function drawFrame() {
    if (!streaming) { requestAnimationFrame(drawFrame); return; }
    // Draw video to canvas
    const cw = canvasEl.width;
    const ch = canvasEl.height;
    // If mirror, flip horizontally
    ctx.save();
    if (mirror) {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, 0, 0, cw, ch);
    ctx.restore();

    // Get pixels and apply filter
    try {
      let imageData = ctx.getImageData(0, 0, cw, ch);
      const filter = document.getElementById("vf-filter").value;
      const intensity = document.getElementById("vf-intensity").value / 100;
      imageData = applyFilter(imageData, filter, intensity);
      ctx.putImageData(imageData, 0, 0);
    } catch (err) {
      // sometimes getImageData can throw if canvas tainted (should not happen for webcam)
      // silently ignore
    }

    requestAnimationFrame(drawFrame);
  }

  // Events
  document.getElementById("vf-filter").addEventListener("change", () => {
    status.textContent = "Filter: " + filterSelect.value;
  });

  intensityRange.addEventListener("input", () => {
    // live-adjust, label update
    status.textContent = `Filter: ${filterSelect.value} — Intensity ${intensityRange.value}%`;
  });

  mirrorBtn.addEventListener("click", () => {
    mirror = !mirror;
    mirrorBtn.textContent = `Mirror: ${mirror ? "On" : "Off"}`;
  });

  snapshotBtn.addEventListener("click", () => {
    // create a download of current canvas state
    const dataURL = canvasEl.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `david_pinto_snapshot_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // Start camera
  startCamera();
})();
