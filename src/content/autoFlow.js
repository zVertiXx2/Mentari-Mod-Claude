// autoFlow.js — alur otomatis setelah quiz selesai
//  - PRE_TEST selesai  -> tampilkan nilai, lalu pindah ke forum diskusi pertemuan yang sama
//  - POST_TEST selesai -> tampilkan nilai, lalu kirim kuesioner pertemuan yang sama
// Bisa dimatikan lewat localStorage:
//   mentari_flow_pretest_forum = "0"   |   mentari_flow_posttest_kuesioner = "0"
(function () {
  if (window.MentariFlow) return;

  const BASE = "https://mentari.unpam.ac.id/api";
  const PENDING_KEY = "mentari_flow_pending";
  const DONE_KEY = "mentari_flow_done";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const Flow = {
    isOn(key) {
      return localStorage.getItem(key) !== "0";
    },

    token() {
      const raw = localStorage.getItem("mentari_auth_token");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return raw;
      }
    },

    async api(path, options = {}) {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token()}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },

    // Cari pertemuan (section) yang berisi quiz ini + forum & kuesioner di pertemuan itu
    async locate(courseCode, quizId) {
      const det = await this.api(`/user-course/${courseCode}`);
      for (const section of det?.data || []) {
        const items = section.sub_section || [];
        const item = items.find((i) => String(i.id) === String(quizId));
        if (!item) continue;
        return {
          section,
          item,
          forum: items.find((i) => i.kode_template === "FORUM_DISKUSI"),
          kuesioner: items.find(
            (i) => i.kode_template === "KUESIONER" || i.tipe === "QUESIONER",
          ),
        };
      }
      return null;
    },

    async grade(quizId) {
      try {
        const r = await this.api(`/quiz/peserta/${quizId}`);
        return r?.quiz?.grade ?? null;
      } catch (e) {
        return null;
      }
    },

    // Kalau forum cuma punya 1 topik, langsung ke topiknya (tempat tombol AI muncul)
    async forumUrl(courseCode, forumId) {
      const base = `https://mentari.unpam.ac.id/u-courses/${courseCode}/forum/${forumId}`;
      try {
        const r = await this.api(`/forum/topic/${forumId}`);
        const topics = (r?.topics || []).filter(
          (t) => String(t.id_trx_course_sub_section) === String(forumId),
        );
        if (topics.length === 1) return `${base}/topics/${topics[0].id}`;
      } catch (e) {}
      return base;
    },

    // Contoh: /u-courses/20261-05TPLK001-22TIF0243/kuesioner/PERTEMUAN_9
    kuesionerUrl(courseCode, kuesionerItem, section) {
      return `https://mentari.unpam.ac.id/u-courses/${courseCode}/kuesioner/${section.kode_section}`;
    },

    async submitKuesioner(courseCode, sectionCode) {
      const detail = await this.api(`/kuesioner/${courseCode}/${sectionCode}`);
      const questions = detail?.kuesioner || [];
      if (!questions.length) throw new Error("Pertanyaan kuesioner kosong");
      await this.api(`/kuesioner/submit`, {
        method: "POST",
        body: JSON.stringify({
          kode_section: sectionCode,
          kode_course: courseCode,
          kuesioner: questions.map((q) => ({ id_kuesioner: q.id, jawaban: 1 })),
        }),
      });
    },

    markDone(quizId) {
      const done = JSON.parse(sessionStorage.getItem(DONE_KEY) || "[]");
      if (done.includes(String(quizId))) return false;
      done.push(String(quizId));
      sessionStorage.setItem(DONE_KEY, JSON.stringify(done.slice(-30)));
      return true;
    },

    // Dipanggil SETELAH quiz dipastikan selesai.
    // Balikin { message, redirect } — pemanggil yang menampilkan pesan & melakukan redirect.
    async afterQuizEnd(args) {
      try {
        return await this._afterQuizEnd(args);
      } catch (e) {
        return { message: `(alur lanjutan gagal: ${e?.message || e})`, redirect: null };
      }
    },

    async _afterQuizEnd({ courseCode, quizId, onStatus = () => {} }) {
      if (!courseCode || !quizId) return { message: "", redirect: null };
      if (!this.markDone(quizId)) return { message: "", redirect: null };

      onStatus("Mengecek nilai & pertemuan...");
      const [ctx, grade] = await Promise.all([
        this.locate(courseCode, quizId).catch(() => null),
        this.grade(quizId),
      ]);
      const nilai = grade !== null && grade !== undefined ? `Nilai: ${grade}` : "Quiz selesai";
      if (!ctx) return { message: nilai, redirect: null };

      const type = ctx.item.kode_template;

      if (type === "PRE_TEST" && this.isOn("mentari_flow_pretest_forum")) {
        if (!ctx.forum?.id) return { message: `${nilai} (forum belum tersedia)`, redirect: null };
        const url = await this.forumUrl(courseCode, ctx.forum.id);
        return { message: `${nilai} — pindah ke forum diskusi...`, redirect: url };
      }

      if (type === "POST_TEST" && this.isOn("mentari_flow_posttest_kuesioner")) {
        if (!ctx.kuesioner) return { message: `${nilai} (kuesioner tidak ada di pertemuan ini)`, redirect: null };
        const url = this.kuesionerUrl(courseCode, ctx.kuesioner, ctx.section);
        if (ctx.kuesioner.completion === true)
          return { message: `${nilai} — kuesioner sudah diisi sebelumnya, membuka halaman kuesioner...`, redirect: url };
        try {
          onStatus("Post test selesai, mengirim kuesioner...");
          await this.submitKuesioner(courseCode, ctx.section.kode_section);
          return { message: `${nilai} — kuesioner terkirim, membuka halaman kuesioner...`, redirect: url };
        } catch (e) {
          // Tetap dibuka supaya bisa dicek / diisi manual
          return { message: `${nilai} — kuesioner gagal dikirim (${e.message}), buka halaman kuesioner untuk isi manual...`, redirect: url };
        }
      }

      return { message: nilai, redirect: null };
    },

    // ── Jalur manual: user klik tombol "Selesai Quiz" bawaan Mentari ─────────
    toast(msg, ok = true) {
      let el = document.getElementById("mentari-flow-toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "mentari-flow-toast";
        el.style.cssText =
          "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:10px 16px;border-radius:12px;font:600 13px system-ui,sans-serif;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:90vw;";
        document.body.appendChild(el);
      }
      el.style.background = ok ? "#2e7d32" : "#c62828";
      el.textContent = msg;
    },

    async runPending() {
      let p;
      try {
        p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
      } catch (e) {}
      if (!p || Date.now() - p.t > 3 * 60 * 1000) {
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }
      if (this._running) return;
      this._running = true;

      // Tunggu sampai server menandai quiz selesai (maks ~30 detik)
      for (let i = 0; i < 15; i++) {
        await sleep(2000);
        const ctx = await this.locate(p.courseCode, p.quizId).catch(() => null);
        if (ctx?.item?.completion === true) {
          sessionStorage.removeItem(PENDING_KEY);
          this._running = false;
          const res = await this.afterQuizEnd({
            courseCode: p.courseCode,
            quizId: p.quizId,
            onStatus: (m) => this.toast(m),
          });
          if (res.message) this.toast(res.message);
          if (res.redirect) setTimeout(() => (location.href = res.redirect), 2500);
          return;
        }
      }
      sessionStorage.removeItem(PENDING_KEY);
      this._running = false;
    },

    watchManualFinish() {
      document.addEventListener(
        "click",
        (e) => {
          const m = location.pathname.match(/\/u-courses\/([^/]+)\/exam\/([^/?#]+)/);
          if (!m) return;
          const btn = e.target.closest("button");
          if (!btn) return;
          const label = btn.textContent.trim().toLowerCase();
          const isFinish =
            label.includes("selesai") || btn.querySelector('svg[data-testid="DoneAllIcon"]');
          if (!isFinish) return;
          sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify({ courseCode: m[1], quizId: m[2], t: Date.now() }),
          );
          // Kalau halaman tidak reload (SPA), jalankan dari sini
          setTimeout(() => this.runPending(), 500);
        },
        true,
      );
    },
  };

  window.MentariFlow = Flow;
  Flow.watchManualFinish();
  // Kalau tadi halaman reload/pindah setelah klik "Selesai", lanjutkan di sini
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Flow.runPending());
  } else {
    Flow.runPending();
  }
})();
