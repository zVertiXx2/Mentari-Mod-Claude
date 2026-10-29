// neonTheme.js — tema neon buat seluruh halaman Mentari (dark mode)
// modded by zVertiXx
// Matikan: localStorage.setItem("mentari_neon_theme", "0") lalu refresh
(function () {
  if (window.__nxTheme) return;
  window.__nxTheme = true;
  if (localStorage.getItem("mentari_neon_theme") === "0") return;

  const CSS = `
  html.nx-on {
    --nx-bg: #05060f;
    --nx-panel: rgba(13, 15, 34, 0.72);
    --nx-panel-solid: #0c0e22;
    --nx-line: rgba(139, 92, 246, 0.22);
    --nx-line-hi: rgba(139, 92, 246, 0.55);
    --nx-c1: #22d3ee;
    --nx-c2: #8b5cf6;
    --nx-c3: #f472b6;
    --nx-ink: #e6e9ff;
    --nx-dim: rgba(205, 212, 255, 0.55);
  }

  /* ── Background halaman ── */
  html.nx-on body {
    background:
      radial-gradient(1200px 600px at 85% -10%, rgba(139, 92, 246, 0.16), transparent 60%),
      radial-gradient(900px 500px at -10% 110%, rgba(34, 211, 238, 0.10), transparent 60%),
      var(--nx-bg) !important;
    background-attachment: fixed !important;
  }
  html.nx-on body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 20%, transparent 75%);
            mask-image: radial-gradient(ellipse at 50% 0%, #000 20%, transparent 75%);
  }
  html.nx-on #root, html.nx-on #__next { position: relative; z-index: 1; }

  /* ── Panel umum (kartu, sidebar, header) ── */
  html.nx-on .MuiPaper-root:not(.MuiMenu-paper):not(.MuiPopover-paper):not(.MuiDialog-paper) {
    background-color: var(--nx-panel) !important;
    background-image: none !important;
    border: 1px solid var(--nx-line);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  html.nx-on .MuiMenu-paper, html.nx-on .MuiPopover-paper, html.nx-on .MuiDialog-paper {
    background: var(--nx-panel-solid) !important;
    border: 1px solid var(--nx-line-hi);
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.25) !important;
  }

  /* Header atas */
  html.nx-on .nx-header {
    background: linear-gradient(90deg, rgba(34, 211, 238, 0.08), rgba(139, 92, 246, 0.10), rgba(244, 114, 182, 0.06)) !important;
    border: 1px solid var(--nx-line-hi) !important;
    box-shadow: 0 0 24px rgba(139, 92, 246, 0.18);
    position: relative;
    overflow: hidden;
  }
  html.nx-on .nx-header::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; pointer-events: none;
    background: linear-gradient(90deg, transparent, var(--nx-c1), var(--nx-c2), var(--nx-c3), transparent);
    background-size: 200% 100%;
    animation: nx-flow 4s linear infinite;
  }
  html.nx-on .nx-header .nx-modtag {
    margin-left: 12px; padding: 3px 9px; border-radius: 999px;
    font: 700 10px/1.4 ui-monospace, Consolas, monospace; letter-spacing: 1px;
    color: var(--nx-c1); border: 1px solid rgba(34, 211, 238, 0.35);
    background: rgba(34, 211, 238, 0.08); text-shadow: 0 0 6px rgba(34, 211, 238, 0.6);
    white-space: nowrap;
  }
  @keyframes nx-flow { to { background-position: 200% 0; } }

  /* Sidebar daftar matkul */
  html.nx-on .nx-sidebar {
    border-color: var(--nx-line-hi) !important;
    box-shadow: inset 0 0 30px rgba(139, 92, 246, 0.06);
  }
  html.nx-on .nx-sidebar .MuiListItemButton-root,
  html.nx-on .nx-sidebar .MuiListItem-root,
  html.nx-on .nx-sidebar a {
    position: relative;
    border-radius: 10px;
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  html.nx-on .nx-sidebar .MuiListItemButton-root:hover,
  html.nx-on .nx-sidebar .MuiListItem-root:hover,
  html.nx-on .nx-sidebar a:hover {
    background: linear-gradient(90deg, rgba(34, 211, 238, 0.12), transparent) !important;
    transform: translateX(4px);
    box-shadow: inset 2px 0 0 var(--nx-c1);
  }
  html.nx-on .nx-sidebar input { color: var(--nx-ink) !important; }
  html.nx-on .MuiInput-underline:before { border-bottom-color: var(--nx-line-hi) !important; }
  html.nx-on .MuiInput-underline:after { border-bottom-color: var(--nx-c1) !important; }

  /* ── Kartu matkul ── */
  html.nx-on .nx-course {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--nx-line) !important;
    transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s !important;
    transform: perspective(900px) rotateX(var(--nx-rx, 0deg)) rotateY(var(--nx-ry, 0deg));
  }
  html.nx-on .nx-course::before {
    content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0;
    background: radial-gradient(320px circle at var(--nx-mx, 50%) var(--nx-my, 50%), rgba(34, 211, 238, 0.16), rgba(139, 92, 246, 0.08) 40%, transparent 65%);
    transition: opacity .25s;
  }
  html.nx-on .nx-course::after {
    content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; pointer-events: none;
    background: linear-gradient(var(--nx-c1), var(--nx-c2), var(--nx-c3));
    opacity: .7;
  }
  html.nx-on .nx-course:hover {
    border-color: var(--nx-line-hi) !important;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 28px rgba(139, 92, 246, 0.25) !important;
  }
  html.nx-on .nx-course:hover::before { opacity: 1; }
  html.nx-on .nx-course-title {
    background: linear-gradient(90deg, #fff, var(--nx-c1) 45%, var(--nx-c2)) !important;
    -webkit-background-clip: text !important; background-clip: text !important;
    color: transparent !important;
    filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.25));
  }
  html.nx-on .nx-course .nx-label { color: var(--nx-dim) !important; letter-spacing: .3px; }
  html.nx-on .nx-course .nx-chip {
    display: inline-block; padding: 1px 8px; border-radius: 6px;
    background: rgba(139, 92, 246, 0.14); border: 1px solid rgba(139, 92, 246, 0.35);
    color: #ddd6fe !important;
  }
  html.nx-on .nx-course svg { transition: transform .25s, color .25s, filter .25s; }
  html.nx-on .nx-course:hover svg { color: var(--nx-c1) !important; filter: drop-shadow(0 0 6px var(--nx-c1)); transform: rotate(45deg); }

  /* ── Halaman matkul: accordion pertemuan, tab, list ── */
  html.nx-on .MuiAccordion-root {
    border: 1px solid var(--nx-line) !important;
    border-radius: 14px !important;
    margin-bottom: 10px !important;
    overflow: hidden;
    transition: border-color .2s, box-shadow .2s;
  }
  html.nx-on .MuiAccordion-root:before { display: none !important; }
  html.nx-on .MuiAccordion-root.Mui-expanded {
    border-color: var(--nx-line-hi) !important;
    box-shadow: 0 0 22px rgba(139, 92, 246, 0.18);
  }
  html.nx-on .MuiAccordionSummary-root:hover { background: rgba(139, 92, 246, 0.07) !important; }
  html.nx-on .MuiAccordionSummary-expandIconWrapper { color: var(--nx-c1) !important; }
  html.nx-on .MuiTabs-indicator {
    background: linear-gradient(90deg, var(--nx-c1), var(--nx-c2)) !important;
    height: 3px !important; box-shadow: 0 0 10px var(--nx-c2);
  }
  html.nx-on .MuiTab-root.Mui-selected { color: var(--nx-c1) !important; }
  html.nx-on .MuiListItemButton-root:hover { background: rgba(34, 211, 238, 0.07) !important; }
  html.nx-on .MuiLinearProgress-root { background: rgba(139, 92, 246, 0.15) !important; }
  html.nx-on .MuiLinearProgress-bar { background: linear-gradient(90deg, var(--nx-c1), var(--nx-c2)) !important; }
  html.nx-on .MuiChip-root { border-color: var(--nx-line-hi) !important; }
  html.nx-on .MuiDivider-root { border-color: var(--nx-line) !important; }
  html.nx-on .MuiAvatar-root {
    background: linear-gradient(135deg, var(--nx-c1), var(--nx-c2)) !important;
    color: #fff !important;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.4), 0 0 16px rgba(139, 92, 246, 0.5);
  }
  html.nx-on .MuiButton-containedPrimary {
    background-image: linear-gradient(135deg, #06b6d4, #7c3aed);
    box-shadow: 0 0 14px rgba(124, 58, 237, 0.35);
  }
  html.nx-on .MuiButton-outlinedPrimary { border-color: var(--nx-c1); color: var(--nx-c1); }

  /* Scrollbar */
  html.nx-on ::-webkit-scrollbar { width: 8px; height: 8px; }
  html.nx-on ::-webkit-scrollbar-track { background: transparent; }
  html.nx-on ::-webkit-scrollbar-thumb { background: linear-gradient(var(--nx-c1), var(--nx-c2)); border-radius: 8px; }
  html.nx-on ::selection { background: rgba(139, 92, 246, 0.45); color: #fff; }

  /* Muncul bertahap */
  html.nx-on .nx-in { animation: nx-in .5s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--nx-d, 0ms); }
  @keyframes nx-in { from { opacity: 0; transform: translateY(14px); } }

  @media (prefers-reduced-motion: reduce) {
    html.nx-on .nx-in, html.nx-on .nx-header::after { animation: none !important; }
    html.nx-on .nx-course { transform: none !important; }
  }
  `;

  const style = document.createElement("style");
  style.id = "nx-theme-style";
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // ── Deteksi dark mode dari warna background halaman ─────────────
  function isDark() {
    // Baca warna asli Mentari (tema neon dimatikan sebentar biar nggak kebaca warna kita sendiri)
    style.disabled = true;
    try {
      return readDark();
    } finally {
      style.disabled = false;
    }
  }
  function readDark() {
    const els = [document.body, document.querySelector("#root > div"), document.querySelector("main")];
    for (const el of els) {
      if (!el) continue;
      const c = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
      if (!c || (c[3] !== undefined && +c[3] === 0)) continue;
      const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      return lum < 90;
    }
    // Fallback: penanda light mode yang juga dipakai popup
    return !document.querySelector(".css-1yxmbwk");
  }

  // ── Tandai elemen penting (class MUI-nya acak, jadi pakai isi teks) ──
  const own = (el) => el.closest("#token-runner-popup, #mentari-developer-changelog");

  function tagCourses() {
    const labels = [...document.querySelectorAll("p, span, div, h6")].filter(
      (el) => el.childElementCount === 0 && el.textContent.trim() === "Kode Kelas" && !own(el),
    );
    let i = 0;
    labels.forEach((lbl) => {
      const card = lbl.closest(".MuiPaper-root, .MuiCard-root");
      if (!card || card.classList.contains("nx-course")) return;
      // Pastikan ini satu kartu, bukan wadah banyak kartu
      if ((card.textContent.match(/Kode Kelas/g) || []).length !== 1) return;
      card.classList.add("nx-course", "nx-in");
      card.style.setProperty("--nx-d", `${Math.min(i++, 12) * 50}ms`);

      const title = card.querySelector("h1, h2, h3, h4, h5, h6, a, .MuiTypography-h5, .MuiTypography-h6");
      if (title) title.classList.add("nx-course-title");
      card.querySelectorAll("p, span, div").forEach((el) => {
        if (el.childElementCount) return;
        const t = el.textContent.trim();
        if (["Dosen", "Kode Kelas", "SKS", "Hari"].includes(t)) el.classList.add("nx-label");
      });

      // Efek tilt + spotlight ikut cursor
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--nx-mx", `${x * 100}%`);
        card.style.setProperty("--nx-my", `${y * 100}%`);
        card.style.setProperty("--nx-ry", `${(x - 0.5) * 8}deg`);
        card.style.setProperty("--nx-rx", `${(0.5 - y) * 8}deg`);
      });
      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--nx-rx", "0deg");
        card.style.setProperty("--nx-ry", "0deg");
      });
    });
  }

  function tagSidebar() {
    const lbl = [...document.querySelectorAll("p, span, h6, div")].find(
      (el) => el.childElementCount === 0 && el.textContent.trim() === "Courses List",
    );
    const box = lbl?.closest(".MuiPaper-root");
    if (box) box.classList.add("nx-sidebar");
  }

  function tagHeader() {
    const header =
      document.querySelector("header.MuiAppBar-root, .MuiAppBar-root") ||
      [...document.querySelectorAll(".MuiPaper-root")].find(
        (p) => p.getBoundingClientRect().top < 60 && /DASHBOARD/i.test(p.textContent) && !/Courses List/.test(p.textContent),
      );
    if (!header || own(header)) return;
    header.classList.add("nx-header");
    if (!header.querySelector(".nx-modtag")) {
      const anchor = [...header.querySelectorAll("p, span, h6, div")].find(
        (el) => el.childElementCount === 0 && /^DASHBOARD$/i.test(el.textContent.trim()),
      );
      if (anchor) {
        const tag = document.createElement("span");
        tag.className = "nx-modtag";
        tag.textContent = "MOD · zVertiXx";
        anchor.insertAdjacentElement("afterend", tag);
        anchor.parentElement.style.display = "flex";
        anchor.parentElement.style.alignItems = "center";
      }
    }
  }

  let queued = false;
  function apply() {
    queued = false;
    if (!document.body) return;
    const dark = isDark();
    document.documentElement.classList.toggle("nx-on", dark);
    if (!dark) return;
    tagHeader();
    tagSidebar();
    tagCourses();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  const start = () => {
    apply();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    // Ganti tema lewat tombol bulan/matahari Mentari
    setInterval(schedule, 1500);
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
