// banner.js — banner home Mentari Mod (modded by zVertiXx)
// Script terpisah karena halaman extension MV3 tidak boleh pakai inline script.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Jam & sapaan ──────────────────────────────────────────────
  const clock = document.getElementById("clock");
  const greet = document.getElementById("greet");
  function tick() {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString("id-ID", { hour12: false }).replace(/\./g, ":");
    const h = d.getHours();
    const sapa =
      h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
    const tgl = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
    greet.innerHTML = "";
    const b = document.createElement("b");
    b.textContent = sapa;
    greet.append(b, ` · ${tgl} · jangan lupa forum diskusinya.`);
  }
  tick();
  setInterval(tick, 1000);

  // ── Glitch di nama (acak + tiap hover) ───────────────────────
  const name = document.getElementById("name");
  function glitch(ms = 160) {
    name.classList.add("glitch");
    setTimeout(() => name.classList.remove("glitch"), ms);
  }
  if (!reduce) {
    (function loop() {
      setTimeout(() => {
        glitch(140 + Math.random() * 160);
        loop();
      }, 2200 + Math.random() * 3000);
    })();
  }
  name.addEventListener("mouseenter", () => glitch(350));

  // ── Canvas: jaring partikel interaktif ───────────────────────
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d");
  const spot = document.getElementById("spot");
  const hero = document.querySelector(".hero");
  const COLORS = ["34,211,238", "139,92,246", "244,114,182"];
  let W = 0, H = 0, dpr = 1, points = [], ripples = [];
  const mouse = { x: -9999, y: -9999, active: false, down: false };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(140, (W * H) / 5000));
    points = Array.from({ length: count }, () => {
      const x = Math.random() * W, y = Math.random() * H;
      return {
        x, y, hx: x, hy: y, // posisi "rumah"
        vx: 0, vy: 0,
        drift: Math.random() * Math.PI * 2,
        r: Math.random() * 1.8 + 0.7,
        c: COLORS[Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : 2],
      };
    });
  }

  function step(t) {
    ctx.clearRect(0, 0, W, H);
    const R = 170; // radius pengaruh cursor

    // Fisika: tiap titik ngambang di sekitar rumahnya, didorong cursor
    for (const p of points) {
      p.drift += 0.004;
      const tx = p.hx + Math.cos(p.drift) * 14;
      const ty = p.hy + Math.sin(p.drift * 1.3) * 10;
      p.vx += (tx - p.x) * 0.012;
      p.vy += (ty - p.y) * 0.012;

      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < R) {
          const f = (1 - d / R) * (mouse.down ? -2.4 : 1.6);
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      for (const rp of ripples) {
        const dx = p.x - rp.x, dy = p.y - rp.y;
        const d = Math.hypot(dx, dy) || 1;
        if (Math.abs(d - rp.r) < 30) {
          p.vx += (dx / d) * 2.2 * rp.life;
          p.vy += (dy / d) * 2.2 * rp.life;
        }
      }
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;
    }

    // Garis antar titik
    const LINK = 110;
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        if (Math.abs(dx) > LINK || Math.abs(dy) > LINK) continue;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          let alpha = (1 - d / LINK) * 0.28;
          if (mouse.active) {
            const md = Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y);
            if (md < R * 1.4) alpha += (1 - md / (R * 1.4)) * 0.55;
          }
          ctx.strokeStyle = `rgba(${a.c},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Garis dari cursor ke titik terdekat (efek "nyambung")
    if (mouse.active) {
      for (const p of points) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < R * 1.1) {
          ctx.strokeStyle = `rgba(${p.c},${(1 - d / (R * 1.1)) * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 22);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.3, "rgba(34,211,238,0.6)");
      g.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Titik
    for (const p of points) {
      const glow = mouse.active
        ? Math.max(0, 1 - Math.hypot(p.x - mouse.x, p.y - mouse.y) / R)
        : 0;
      ctx.fillStyle = `rgba(${p.c},${0.55 + glow * 0.45})`;
      ctx.shadowColor = `rgba(${p.c},1)`;
      ctx.shadowBlur = glow * 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + glow * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Gelombang klik
    ripples = ripples.filter((rp) => rp.life > 0.02);
    for (const rp of ripples) {
      rp.r += 7;
      rp.life *= 0.94;
      ctx.strokeStyle = `rgba(34,211,238,${rp.life * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (!reduce) requestAnimationFrame(step);
  }

  // ── Input ─────────────────────────────────────────────────────
  function move(x, y) {
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
    spot.style.setProperty("--mx", x + "px");
    spot.style.setProperty("--my", y + "px");
    // Parallax teks, gerak berlawanan arah cursor
    const px = ((x / W) - 0.5) * -18;
    const py = ((y / H) - 0.5) * -10;
    hero.style.setProperty("--px", px + "px");
    hero.style.setProperty("--py", py + "px");
  }
  function leave() {
    mouse.active = false;
    mouse.down = false;
    spot.style.setProperty("--mx", "-500px");
    spot.style.setProperty("--my", "-500px");
    hero.style.setProperty("--px", "0px");
    hero.style.setProperty("--py", "0px");
  }

  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  document.addEventListener("mouseleave", leave);
  document.addEventListener("mousedown", (e) => {
    mouse.down = true;
    ripples.push({ x: e.clientX, y: e.clientY, r: 4, life: 1 });
    glitch(200);
  });
  document.addEventListener("mouseup", () => (mouse.down = false));
  document.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener("touchend", leave);

  resize();
  step();
})();
