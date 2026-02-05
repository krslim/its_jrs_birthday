(() => {
  const $ = (id) => document.getElementById(id);

  const video = $("video");
  const togglePlay = $("togglePlay");
  const restart = $("restart");
  const toggleMute = $("toggleMute");
  const bigPlay = $("bigPlay");
  const hint = $("hint");

  // ---- Playback controls ----
  function updateButtons() {
    togglePlay.textContent = video.paused ? "Play" : "Pause";
    toggleMute.textContent = video.muted ? "Unmute" : "Mute";
  }

  async function safePlay(withSound) {
    // Many browsers block autoplay with sound. Start muted; allow unmute via gesture.
    if (withSound) video.muted = false;

    try {
      await video.play();
      hint.textContent = "";
      bigPlay.style.display = "none";
      launchConfetti();
    } catch {
      // If play fails, try muted.
      if (!video.muted) {
        video.muted = true;
        try {
          await video.play();
          hint.textContent = "Playing muted — tap Unmute for sound.";
          bigPlay.style.display = "none";
          launchConfetti();
        } catch {
          hint.textContent = "Tap Play to start the video.";
        }
      } else {
        hint.textContent = "Tap Play to start the video.";
      }
    }

    updateButtons();
  }

  bigPlay.addEventListener("click", () => safePlay(true));

  togglePlay.addEventListener("click", async () => {
    if (video.paused) {
      await safePlay(false);
    } else {
      video.pause();
      updateButtons();
    }
  });

  restart.addEventListener("click", async () => {
    video.currentTime = 0;
    await safePlay(false);
  });

  toggleMute.addEventListener("click", () => {
    video.muted = !video.muted;
    updateButtons();
    hint.textContent = video.muted ? "Sound off." : "Sound on!";
  });

  video.addEventListener("play", updateButtons);
  video.addEventListener("pause", updateButtons);
  video.addEventListener("volumechange", updateButtons);

  // Start muted by default to be safe
  video.muted = true;
  updateButtons();

  // ---- Minimal confetti (no external libs) ----
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  let confetti = [];
  let raf = null;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function launchConfetti() {
    // Don't stack multiple animations.
    if (raf) return;

    const count = 180;
    confetti = [];

    for (let i = 0; i < count; i++) {
      confetti.push({
        x: window.innerWidth * (0.2 + Math.random() * 0.6),
        y: -20 - Math.random() * window.innerHeight * 0.3,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.12 + Math.random() * 0.24,
        life: 280 + Math.random() * 120,
      });
    }

    let frame = 0;

    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of confetti) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.015; // gravity
        p.rot += p.vr;
        p.life -= 1;

        // wrap
        if (p.x < -40) p.x = window.innerWidth + 40;
        if (p.x > window.innerWidth + 40) p.x = -40;

        // draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const hue = Math.floor((p.x + frame * 3) % 360);
        ctx.fillStyle = `hsl(${hue}, 90%, 65%)`;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      confetti = confetti.filter((p) => p.life > 0 && p.y < window.innerHeight + 60);

      if (confetti.length > 0 && frame < 450) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    raf = requestAnimationFrame(tick);
  }
})();
