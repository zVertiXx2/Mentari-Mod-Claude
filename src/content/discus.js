/**
 * MENTARI MOD - Discus Helper Module
 * Refactored for modularity and code efficiency.
 */

(function () {
  const Config = {
    GEMINI: {
    },
    STORAGE_KEYS: {
      API_KEY: "claudeApiKey",
    },
    MATERI_NOTE: `Materi kuliah dari dosen dilampirkan di atas. Jadikan materi itu acuan utama: pakai istilah, rumus, dan cara penyelesaian yang sama seperti di materi. Kalau diskusinya menanyakan sesuatu yang tidak ada di materi, jawab dengan pengetahuan umum yang tetap sejalan dengan materi.\n\n`,
    PROMPTS: {
      DEFAULT: (content) => `Bacalah diskusi berikut, lalu tuliskan jawaban atau rangkuman yang natural, JANGAN GUNAKAN HURUF TEBAL JANGAN GUNAKAN HURUF TEBAL JANGAN BOLD JANGAN PAKE TANDA BINTANG PLAIN TEXT YG BERSIH. dan mudah dipahami seperti jawaban manusia. jangan gunakan tanda seperti (*/#) atau yg lainnya, hanya plain text yg bersih jangan gunakan bold huruf tebal, italic, underline. dan langsung jawab tanpa mengucapkan (berikut jawabannya) atau sejenisnya. Gunakan bahasa yang natural seperti manusia. Berikan penjelasan yang lengkap dan memadai sesuai konteks diskusi, jangan dibatasi jika membutuhkan penjelasan panjang. Jangan ucapkan "Tentu, ini rangkumannya:" atau semacamnya, langsung jawab saja. Jika terdapat soal atau pertanyaan yang berhubungan dengan bahasa pemrograman atau coding, berikan contoh singkat code nya. jika pertanyaannya bernomor maka buat jawaban bernomor juga, hanya pertanyaan saja\n${content}\n\nJawaban yang natural dan mengalir:`,
      SINGKAT: (content) => `Bacalah diskusi forum kuliah berikut, lalu tulis jawaban seperti mahasiswa yang benar-benar paham materinya dan menjawab dengan gaya bicaranya sendiri.

Aturan:
- Singkat dan jelas: 2 sampai 4 kalimat saja, langsung ke inti jawaban.
- Natural seperti tulisan manusia, bukan seperti AI. Pakai bahasa Indonesia yang santun tapi tidak kaku, variasikan panjang kalimat, dan hindari frasa klise seperti "tentu", "berikut", "secara keseluruhan", "penting untuk dicatat", atau "dengan demikian".
- Jangan ada pembuka atau penutup (termasuk "saya izin menjawab"), langsung jawab.
- Plain text saja: tanpa huruf tebal, miring, tanda bintang, pagar, atau bullet.
- Kalau pertanyaannya bernomor, jawab bernomor dengan satu atau dua kalimat per nomor.
- Kalau soalnya hitungan (matematika, program linear, statistik, dll), abaikan batas kalimat: tulis langkah inti secara ringkas (model atau rumus, perhitungan penting, hasil akhir) tanpa narasi panjang. Hitung sampai benar-benar selesai, jangan menulis "lanjutkan iterasi" tanpa mengerjakannya, dan cek ulang hasil akhir (misalnya dengan titik pojok atau substitusi) sebelum menulis jawaban.
- Kalau berkaitan dengan coding, boleh sertakan contoh kode yang sangat pendek.

Diskusi:
${content}

Jawaban:`,
      REVISE: (mode, prevAnswer) => {
        const modes = {
          shorten: `Ringkas jawaban berikut menjadi lebih singkat, tetap natural dan mudah dipahami, tanpa bullet. Kalau jawaban aslinya bernomor, pertahankan nomornya. Pertahankan semua link/URL apa adanya:\n\n${prevAnswer}`,
          paragraph: `Ubah jawaban berikut menjadi satu paragraf, tetap natural dan mudah dipahami, tanpa bullet atau penomoran. Pertahankan semua link/URL apa adanya:\n\n${prevAnswer}`,
          clarify: `Perjelas dan buat jawaban berikut lebih mudah dipahami, tetap natural dan tidak seperti AI, tanpa bullet. Kalau jawaban aslinya bernomor, pertahankan nomornya. Pertahankan semua link/URL apa adanya:\n\n${prevAnswer}`,
          lengthen: `Perpanjang dan tambahkan detail pada jawaban berikut, tetap natural dan mudah dipahami, tanpa bullet. Kalau jawaban aslinya bernomor, pertahankan nomornya. Pertahankan semua link/URL apa adanya:\n\n${prevAnswer}`,
          singkat: `Tulis ulang jawaban berikut jadi 2 sampai 4 kalimat yang singkat, jelas, dan terdengar seperti tulisan mahasiswa sendiri, bukan AI. Tanpa pembuka, tanpa bullet, tanpa format tebal atau miring. Kalau jawaban aslinya bernomor, pertahankan nomornya dan cukup 1 sampai 2 kalimat per nomor. Pertahankan semua link/URL apa adanya:\n\n${prevAnswer}`,
          numbered: `Ubah jawaban berikut menjadi nomor, tetap natural dan mudah dipahami, tanpa bullet atau paragraf. Pertahankan semua link/URL apa adanya:\n\n${prevAnswer}`
        };
        return modes[mode] || prevAnswer;
      },
      QUESTIONS: (content) => `Bacalah topik diskusi forum kuliah berikut, lalu buat 6 pertanyaan yang bisa diajukan mahasiswa di forum ini.

Aturan:
- Pertanyaan harus sesuai dengan topik diskusi.
- Sederhana dan tidak rumit: satu kalimat pendek, maksimal sekitar 20 kata, pakai bahasa sehari-hari mahasiswa yang tetap sopan.
- Variasikan jenisnya, misalnya minta contoh, tanya perbedaan dua hal, tanya penerapan di kehidupan nyata, atau minta penjelasan istilah.
- Tiap pertanyaan berdiri sendiri dan tidak mengulang pertanyaan yang sudah ada di diskusi.
- Tulis satu pertanyaan per baris, tanpa nomor, bullet, atau format tebal/miring, dan tanpa kalimat pembuka.

Topik diskusi:
${content}

Pertanyaan:`
    }
  };

  const Utils = {
    updateModelLimit(model, isLimited) {
      try {
        const statsKey = "gemini_model_stats";
        const raw = localStorage.getItem(statsKey);
        const stats = raw ? JSON.parse(raw) : {};
        if (!stats[model]) stats[model] = {};
        stats[model].limited = isLimited ? true : false;
        localStorage.setItem(statsKey, JSON.stringify(stats));
      } catch (e) {}
    },
    getApiKey() {
      const stored = localStorage.getItem(Config.STORAGE_KEYS.API_KEY);
      if (stored) return atob(stored);
      alert("API Key Claude tidak ditemukan! Selesaikan di menu Setting.");
      throw new Error("API Key missing");
    },
    // Ubah HTML jadi teks tapi nomor <ol>, bullet, baris baru, dan link tetap ada.
    // (Nomor di <ol> itu cuma tampilan CSS, makanya dulu hilang waktu pakai textContent)
    htmlToText(el) {
      const out = [];
      const BLOCK = /^(P|DIV|H[1-6]|TR|BLOCKQUOTE|PRE|SECTION|ARTICLE|TABLE|FIGURE)$/;
      const walk = (node) => {
        if (node.nodeType === 3) {
          out.push(node.textContent.replace(/\s+/g, " "));
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (/^(SCRIPT|STYLE|BUTTON|SVG|svg)$/.test(tag)) return;
        if (tag === "BR") { out.push("\n"); return; }
        if (tag === "OL" || tag === "UL") {
          let n = parseInt(node.getAttribute("start") || "1", 10) || 1;
          const type = (node.getAttribute("type") || "").toLowerCase();
          [...node.children].forEach((li) => {
            if (li.tagName !== "LI") return walk(li);
            let marker = "- ";
            if (tag === "OL") marker = type === "a" ? String.fromCharCode(96 + n) + ". " : `${n}. `;
            out.push("\n" + marker);
            [...li.childNodes].forEach(walk);
            n++;
          });
          out.push("\n");
          return;
        }
        if (tag === "TD" || tag === "TH") { [...node.childNodes].forEach(walk); out.push(" | "); return; }
        const block = BLOCK.test(tag);
        if (block) out.push("\n");
        [...node.childNodes].forEach(walk);
        if (tag === "A") {
          const href = node.getAttribute("href") || "";
          if (/^https?:/.test(href) && !node.textContent.includes(href)) out.push(` (${href})`);
        }
        if (block) out.push("\n");
      };
      walk(el);
      return out
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    extractContent(root) {
      const selectors = [".ck-content", ".MuiBox-root", ".discussion-content", '[class*="content"]', "div:not([class]):not([id])"];
      for (const s of selectors) {
        const elements = root.querySelectorAll(s);
        for (const el of elements) {
          if (el.textContent.trim().length < 10) continue;
          if (el.querySelector("button, input, select, textarea")) continue;
          return this.htmlToText(el);
        }
      }
      return this.htmlToText(root);
    },
    // Pembuka kalimat: "Saya izin bertanya, ..." / "Saya izin menjawab,"
    PEMBUKA_TANYA: "Saya izin bertanya, ",
    PEMBUKA_JAWAB: "Saya izin menjawab,",
    lowerFirst(text) {
      // Huruf pertama dikecilkan, kecuali singkatan (misal "SQL", "AI")
      return /^[A-Z][A-Z0-9]/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
    },
    addPembukaTanya(q) {
      const clean = q.replace(/^saya izin bertanya,?\s*/i, "").trim();
      return this.PEMBUKA_TANYA + this.lowerFirst(clean);
    },
    stripPembukaJawab(text) {
      return text.replace(/^\s*saya izin menjawab,?\s*/i, "").trim();
    },
    addPembukaJawab(text) {
      return `${this.PEMBUKA_JAWAB}\n${this.stripPembukaJawab(text)}`;
    },
    // Deteksi kebutuhan soal: nomor/huruf & perlu link
    analyze(content) {
      const nums = [...new Set([...content.matchAll(/^\s*(\d{1,2})[.)]\s+\S/gm)].map((m) => +m[1]))].sort((a, b) => a - b);
      const letters = [...new Set([...content.matchAll(/^\s*([a-h])[.)]\s+\S/gim)].map((m) => m[1].toLowerCase()))].sort();
      const needsLink =
        /\b(link|tautan|url|alamat web|website)\b/i.test(content) ||
        /\b(sertakan|cantumkan|lampirkan|tuliskan|berikan)\b[^.\n]{0,40}\b(sumber|referensi|daftar pustaka)\b/i.test(content) ||
        /\b(cari|carilah|temukan|telusuri|cari tahu)\b[^.\n]{0,60}\b(jurnal|artikel|berita|paper|penelitian|studi kasus|contoh kasus|data terbaru)\b/i.test(content);
      return { nums: nums.length >= 2 ? nums : [], letters: letters.length >= 2 ? letters : [], needsLink };
    },
    extraRules(content) {
      const a = this.analyze(content);
      const rules = [];
      if (a.nums.length) {
        rules.push(`Soal ini berisi pertanyaan bernomor ${a.nums.join(", ")}. WAJIB jawab semuanya dengan nomor yang sama, format "1. jawaban" lalu baris baru untuk nomor berikutnya. Jangan ada nomor yang terlewat dan jangan digabung jadi satu paragraf.`);
      } else if (a.letters.length) {
        rules.push(`Soal ini berisi poin ${a.letters.join(", ")}. WAJIB jawab tiap poin dengan huruf yang sama, format "a. jawaban" lalu baris baru untuk poin berikutnya.`);
      }
      if (a.needsLink) {
        rules.push(`Soal ini meminta sumber atau link. Gunakan web_search untuk mencari sumber yang benar-benar ada (cukup 1 sampai 2 kali pencarian), lalu tulis URL lengkapnya (https://...) persis seperti di hasil pencarian. Utamakan sumber terpercaya seperti jurnal (Garuda, SINTA, Google Scholar, ResearchGate, situs jurnal kampus). Sebutkan judul, penulis, dan tahun kalau ada. Jangan mengarang link dan jangan menyuruh orang mencari sendiri.`);
      }
      return { text: rules.length ? `ATURAN TAMBAHAN (lebih penting dari aturan lain):\n- ${rules.join("\n- ")}\n\n` : "", webSearch: a.needsLink ? 3 : 0 };
    },
    isDosen(root) {
      const elements = [...(root?.querySelectorAll('strong, b, [style*="font-weight:bold"], [class*="name"], [class*="user"], [class*="author"], .MuiTypography-root') || [])];
      return elements.some(el => /\b(?:,|\.)\b/i.test(el.textContent.trim()));
    },
    updateQuota(headers) {
      try {
        const quota = {
          rpm: { remaining: parseInt(headers.get('x-ratelimit-remaining-requests')), limit: parseInt(headers.get('x-ratelimit-limit-requests')) },
          tpm: { remaining: parseInt(headers.get('x-ratelimit-remaining-tokens')), limit: parseInt(headers.get('x-ratelimit-limit-tokens')) },
          updated: Date.now()
        };
        if (!isNaN(quota.rpm.limit)) localStorage.setItem("gemini_quota", JSON.stringify(quota));
      } catch (e) {}
    }
  };

  // ─── MATERI LAMPIRAN ─────────────────────────────────────────────────────
  // Ambil file attachment dosen dari API Mentari, lalu ubah jadi content block Claude.
  const Materi = {
    STORAGE_TOGGLE: "mentari_use_materi",
    MAX_FILES: 3,
    MAX_BYTES: 15 * 1024 * 1024,
    MAX_TEXT_CHARS: 120000,
    cache: new Map(),

    isOn() {
      return localStorage.getItem(this.STORAGE_TOGGLE) === "1";
    },
    setOn(v) {
      localStorage.setItem(this.STORAGE_TOGGLE, v ? "1" : "0");
    },

    getIds() {
      const m = location.pathname.match(/\/forum\/([^/]+)\/topics\/([^/?#]+)/);
      return m ? { sectionId: m[1], topicId: m[2] } : null;
    },

    getAuth() {
      try {
        const raw = localStorage.getItem("mentari_auth_token");
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return localStorage.getItem("mentari_auth_token");
      }
    },

    async mentariFetch(url, asBlob = false) {
      const token = this.getAuth();
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asBlob ? res.blob() : res.json();
    },

    async getFileIds(root) {
      const ids = new Set();
      const add = (arr) =>
        Array.isArray(arr) &&
        arr.forEach((f) => {
          const id = typeof f === "string" ? f : f?.id || f?.file || f?.nama_file;
          if (id) ids.add(String(id));
        });

      // 1. Dari link di halaman (kalau ada)
      root?.querySelectorAll('a[href*="/api/file/"]').forEach((a) => {
        const id = a.href.split("/api/file/")[1];
        if (id) ids.add(decodeURIComponent(id.split(/[?#]/)[0]));
      });

      // 2. Dari API forum (cara yang sama dipakai popup Mentari Mod)
      const loc = this.getIds();
      if (loc && !ids.size) {
        try {
          const r = await this.mentariFetch(
            `https://mentari.unpam.ac.id/api/forum/reply/${loc.topicId}`,
          );
          add(r?.files);
          add(r?.root?.files);
          add(r?.topic?.files);
        } catch (e) {}
        if (!ids.size) {
          try {
            const r = await this.mentariFetch(
              `https://mentari.unpam.ac.id/api/forum/topic/${loc.sectionId}`,
            );
            const t = (r?.topics || []).find((x) => String(x.id) === String(loc.topicId));
            add(t?.files);
          } catch (e) {}
        }
      }
      return [...ids].slice(0, this.MAX_FILES);
    },

    toBase64(buf) {
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      }
      return btoa(bin);
    },

    // Pembaca ZIP mini buat PPTX/DOCX (pakai DecompressionStream bawaan browser)
    async readZip(buf) {
      const dv = new DataView(buf);
      let eocd = -1;
      for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
        if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      }
      if (eocd < 0) throw new Error("ZIP rusak");
      const count = dv.getUint16(eocd + 10, true);
      let p = dv.getUint32(eocd + 16, true);
      const dec = new TextDecoder();
      const entries = {};
      for (let n = 0; n < count; n++) {
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        const method = dv.getUint16(p + 10, true);
        const csize = dv.getUint32(p + 20, true);
        const nlen = dv.getUint16(p + 28, true);
        const elen = dv.getUint16(p + 30, true);
        const clen = dv.getUint16(p + 32, true);
        const off = dv.getUint32(p + 42, true);
        const name = dec.decode(new Uint8Array(buf, p + 46, nlen));
        entries[name] = { method, csize, off };
        p += 46 + nlen + elen + clen;
      }
      return {
        names: Object.keys(entries),
        async text(name) {
          const e = entries[name];
          if (!e) return "";
          const lnl = dv.getUint16(e.off + 26, true);
          const lel = dv.getUint16(e.off + 28, true);
          const data = new Uint8Array(buf, e.off + 30 + lnl + lel, e.csize);
          if (e.method === 0) return dec.decode(data);
          const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
          return new Response(stream).text();
        },
      };
    },

    xmlText(xml, tag, paraTag) {
      const decode = (s) =>
        s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
      return xml
        .split(new RegExp(`</${paraTag}>`))
        .map((para) =>
          [...para.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, "g"))].map((m) => decode(m[1])).join(""),
        )
        .filter((t) => t.trim())
        .join("\n");
    },

    async officeText(buf) {
      const zip = await this.readZip(buf);
      const slides = zip.names
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
      if (slides.length) {
        const parts = [];
        for (let i = 0; i < slides.length; i++) {
          const t = this.xmlText(await zip.text(slides[i]), "a:t", "a:p");
          if (t) parts.push(`[Slide ${slides[i].match(/\d+/)[0]}]\n${t}`);
        }
        return { kind: "PPTX", text: parts.join("\n\n") };
      }
      if (zip.names.includes("word/document.xml")) {
        return { kind: "DOCX", text: this.xmlText(await zip.text("word/document.xml"), "w:t", "w:p") };
      }
      throw new Error("format Office tidak didukung");
    },

    async fileToBlock(fileId) {
      const blob = await this.mentariFetch(
        `https://mentari.unpam.ac.id/api/file/${encodeURIComponent(fileId)}`,
        true,
      );
      if (blob.size > this.MAX_BYTES) throw new Error("file terlalu besar (>15 MB)");
      const buf = await blob.arrayBuffer();
      const head = new Uint8Array(buf.slice(0, 4));
      const magic = String.fromCharCode(...head);
      const type = blob.type || "";
      const title = String(fileId).slice(0, 80);

      if (magic === "%PDF" || type.includes("pdf")) {
        return {
          label: "PDF",
          block: { type: "document", title, source: { type: "base64", media_type: "application/pdf", data: this.toBase64(buf) } },
        };
      }
      if (magic.startsWith("PK")) {
        const { kind, text } = await this.officeText(buf);
        if (!text.trim()) throw new Error(`${kind} tidak ada teksnya (mungkin isinya gambar)`);
        return {
          label: kind,
          block: { type: "document", title, source: { type: "text", media_type: "text/plain", data: text.slice(0, this.MAX_TEXT_CHARS) } },
        };
      }
      const img = { "\x89PNG": "image/png", "GIF8": "image/gif" }[magic] ||
        (head[0] === 0xff && head[1] === 0xd8 ? "image/jpeg" : null) ||
        (/^image\/(png|jpeg|gif|webp)$/.test(type) ? type : null);
      if (img) {
        return { label: "Gambar", block: { type: "image", source: { type: "base64", media_type: img, data: this.toBase64(buf) } } };
      }
      if (type.startsWith("text/")) {
        return {
          label: "Teks",
          block: { type: "document", title, source: { type: "text", media_type: "text/plain", data: (await blob.text()).slice(0, this.MAX_TEXT_CHARS) } },
        };
      }
      throw new Error("format belum didukung (PPT/DOC lama? simpan ulang jadi PDF)");
    },

    // Balikin { blocks, info[], errors[] } — di-cache per topik
    async load(root) {
      const key = this.getIds()?.topicId || location.pathname;
      if (this.cache.has(key)) return this.cache.get(key);
      const ids = await this.getFileIds(root);
      const result = { blocks: [], info: [], errors: [] };
      for (const id of ids) {
        try {
          const { label, block } = await this.fileToBlock(id);
          result.blocks.push(block);
          result.info.push(label);
        } catch (e) {
          result.errors.push(e.message);
        }
      }
      this.cache.set(key, result);
      return result;
    },
  };

  const ApiService = {
    // Forum diskusi selalu pakai Sonnet (lebih teliti buat hitungan & jawaban panjang).
    // Ganti lewat Console: localStorage.setItem("mentari_forum_model", "claude-haiku-4-5-20251001")
    FORUM_MODEL_DEFAULT: "claude-sonnet-5",
    forumModel() {
      return localStorage.getItem("mentari_forum_model") || this.FORUM_MODEL_DEFAULT;
    },

    async callGemini(prompt, attachments, opts = {}) {
      const key = Utils.getApiKey();
      const request = (model) =>
        window.MentariAI.complete(prompt, {
          apiKey: key,
          model,
          temperature: 0.7,
          maxTokens: opts.webSearch ? 4000 : 3000,
          attachments,
          webSearch: opts.webSearch || 0,
        });

      let model = this.forumModel();
      try {
        let text;
        try {
          text = await request(model);
        } catch (e) {
          // Model nggak tersedia di akun / sedang sibuk -> balik ke model di Pengaturan
          if (e.status === 404 || e.status === 400 || e.status === 529) {
            console.warn(`[Mentari] ${model} gagal (${e.message}), pakai model Pengaturan`);
            this.lastFallbackReason = e.message;
            model = window.MentariAI.getModel();
            text = await request(model);
          } else {
            throw e;
          }
        }
        Utils.updateModelLimit(model, false);
        this.lastModel = model;
        this.lastFallback = model !== this.forumModel();
        return text || "Tidak ada jawaban.";
      } catch (e) {
        if (e.status === 429) {
          Utils.updateModelLimit(model, true);
          throw new Error("Rate Limit Tercapai! Tunggu sebentar atau ganti Model di menu Pengaturan (Mentari Mod).");
        }
        throw new Error(`Gagal mendapatkan jawaban dari Claude: ${e.message}`);
      }
    }
  };

  const UIRenderer = {
    createButton(type, onClick) {
      const btn = document.createElement("button");
      btn.type = "button";
      if (type === "buat") {
        btn.className = "MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedInfo MuiButton-sizeSmall MuiButton-containedSizeSmall buat-pertanyaan-btn";
        btn.style = "margin-right:2px;min-width:0px;padding:6px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#1e3a8a;color:#fff;border:0;display:flex;align-items:center;gap:4px;";
        btn.innerHTML = `<span class="MuiButton-startIcon" style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg></span><span class="MuiButton-label">Buat Pertanyaan</span>`;
      } else if (type === "singkat") {
        btn.className = "MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-sizeSmall MuiButton-containedSizeSmall jawaban-singkat-btn";
        btn.style = "margin-right:2px;min-width:0px;padding:6px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#f0872d;color:#fff;border:0;display:flex;align-items:center;gap:4px;";
        btn.innerHTML = `<span class="MuiButton-startIcon" style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg></span><span class="MuiButton-label">Jawaban Singkat</span>`;
      } else {
        btn.className = "MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedWarning MuiButton-sizeSmall MuiButton-containedSizeSmall cari-jawaban-btn";
        btn.style = "margin-right:2px;min-width:0px;padding:6px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#41a3f1;color:rgb(255,255,255);border:0;display:flex;align-items:center;gap:4px;";
        btn.innerHTML = `<span class="MuiButton-startIcon" style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span><span class="MuiButton-label">Cari Jawaban</span>`;
      }
      btn.onclick = onClick;
      return btn;
    },

    createMateriToggle(root) {
      const wrap = document.createElement("div");
      wrap.className = "materi-toggle-wrap";
      wrap.style = "display:flex;align-items:center;gap:6px;margin-right:auto;font-size:12px;";
      const btn = document.createElement("button");
      const info = document.createElement("span");
      info.style = "opacity:0.75;";
      btn.style = "padding:6px 10px;border-radius:11px;border:1px solid #79bb7c;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px;";

      const render = () => {
        const on = Materi.isOn();
        btn.textContent = on ? "📎 Pakai Materi: ON" : "📎 Pakai Materi: OFF";
        btn.style.background = on ? "#79bb7c" : "transparent";
        btn.style.color = on ? "#fff" : "#79bb7c";
      };
      const preload = async () => {
        info.textContent = "membaca lampiran...";
        const m = await Materi.load(root);
        if (m.info.length) {
          info.textContent = `${m.info.length} file terbaca (${m.info.join(", ")})`;
        } else {
          info.textContent = "tidak ada lampiran yang bisa dibaca";
        }
        if (m.errors.length) info.title = "Gagal: " + m.errors.join(" | ");
        if (m.errors.length && !m.info.length) info.textContent += " — " + m.errors[0];
      };

      btn.onclick = async () => {
        Materi.setOn(!Materi.isOn());
        render();
        if (Materi.isOn()) await preload();
        else info.textContent = "";
      };
      render();
      if (Materi.isOn()) preload();
      wrap.append(btn, info);
      return wrap;
    },

    showSaranQuestions(saranText, root, replyBtn, onRegenerate) {
      let saranDiv = root.querySelector(".saran-pertanyaan-gemini");
      if (!saranDiv) {
        saranDiv = document.createElement("div");
        saranDiv.className = "saran-pertanyaan-gemini";
        saranDiv.style = "margin:10px 0 0 0;padding:10px;border-radius:18px;border:1px solid rgba(184, 184, 184, 0.3);font-size:13px;display:flex;flex-direction:column;gap:6px;";
        replyBtn.parentElement.parentElement.appendChild(saranDiv);
      }
      const questions = saranText
        .split(/\n+/)
        .map((q) => q.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").replace(/\*\*/g, "").trim())
        .filter((q) => q.length > 5)
        .slice(0, 6)
        .map((q) => Utils.addPembukaTanya(q));

      saranDiv.innerHTML = "";
      const header = document.createElement("div");
      header.style = "display:flex;justify-content:space-between;align-items:center;gap:8px;";
      header.innerHTML = `<b>Pilih 1 pertanyaan:</b>`;
      if (onRegenerate) {
        const regen = document.createElement("button");
        regen.textContent = "Buat Ulang";
        regen.style = "padding:5px 10px;border-radius:9px;background:rgb(66,66,66);color:rgb(225,225,225);border:0;font-size:12px;cursor:pointer;";
        regen.onclick = () => onRegenerate(regen);
        header.appendChild(regen);
      }
      saranDiv.appendChild(header);

      const items = [];
      questions.forEach((q) => {
        const item = document.createElement("div");
        item.textContent = q;
        item.title = "Klik untuk pilih & copy";
        item.style = "padding:10px 12px;border-radius:10px;background:rgba(184,184,184,0.2);border:2px solid transparent;cursor:pointer;word-break:break-word;transition:border-color .15s;";
        item.onclick = async () => {
          items.forEach((el) => {
            el.style.borderColor = "transparent";
            el.style.background = "rgba(184,184,184,0.2)";
          });
          item.style.borderColor = "#79bb7c";
          item.style.background = "rgba(121,187,124,0.18)";
          try {
            await navigator.clipboard.writeText(q);
            status.textContent = "Tersalin! Tinggal paste di kolom balasan.";
          } catch (_) {
            status.textContent = "Gagal copy otomatis, silakan blok dan copy manual.";
          }
        };
        items.push(item);
        saranDiv.appendChild(item);
      });

      const status = document.createElement("div");
      status.style = "font-size:11px;opacity:0.7;text-align:right;min-height:14px;";
      status.textContent = questions.length ? "Klik salah satu untuk pilih." : "Tidak ada pertanyaan, coba Buat Ulang.";
      saranDiv.appendChild(status);
    },

    showJawabanBox(jawaban, replyBtn, root, content, pembuka = false) {
      if (pembuka) jawaban = Utils.addPembukaJawab(jawaban);
      let resultDiv = root.querySelector(".jawaban-gemini");
      if (!resultDiv) {
        resultDiv = document.createElement("div");
        resultDiv.className = "jawaban-gemini";
        resultDiv.style = "margin:10px 0 0 0;padding:10px;border-radius:18px;border:1px solid rgba(184, 184, 184, 0.3);font-size:13px;display:flex;flex-direction:column;gap:8px;text-align:justify;text-justify:inter-word;";
        replyBtn.parentElement.parentElement.appendChild(resultDiv);
      }
      resultDiv.innerHTML = `<b>Jawaban:</b> <span class="jawaban-model" style="font-size:11px;opacity:0.6;"></span><div class="jawaban-text" style='margin-bottom:6px;white-space:pre-line;'></div>`;
      const modelEl = resultDiv.querySelector(".jawaban-model");
      if (ApiService.lastModel) {
        modelEl.textContent = `(${ApiService.lastModel})`;
        if (ApiService.lastFallback) {
          modelEl.textContent += ` ⚠ Sonnet gagal: ${ApiService.lastFallbackReason || "-"}`;
          modelEl.style.color = "#f0872d";
          modelEl.style.opacity = "1";
        }
      }
      resultDiv.querySelector(".jawaban-text").textContent = jawaban;
      
      const btnRow = document.createElement("div");
      btnRow.style = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;";
      
      const copyBtn = document.createElement("button");
      copyBtn.style = "margin-right:0;min-width:0px;padding:6px 10px;line-height:1.2;font-weight:500;border-radius:11px;background:#79bb7c;color:#fff;border:0;display:flex;align-items:center;gap:4px;";
      copyBtn.innerHTML = `<span class="MuiButton-startIcon"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span><span class="MuiButton-label">Copy</span>`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(jawaban);
        copyBtn.querySelector(".MuiButton-label").innerText = "Copied!";
        setTimeout(() => copyBtn.querySelector(".MuiButton-label").innerText = "Copy", 1200);
      };
      btnRow.appendChild(copyBtn);

      const modes = [{m:"singkat", l:"Singkat & Natural"}, {m:"shorten", l:"Ringkas"}, {m:"paragraph", l:"1 Paragraf"}, {m:"clarify", l:"Perjelas"}, {m:"lengthen", l:"Perpanjang"}, {m:"numbered", l:"Nomor"}];
      modes.forEach(({m, l}) => {
        const btn = document.createElement("button");
        btn.style = "margin-right:0;min-width:0px;padding:6px 10px;line-height:1.2;font-weight:500;border-radius:11px;background:rgb(66, 66, 66);color:rgb(225,225,225);border:0";
        btn.innerHTML = `<span class="MuiButton-label">${l}</span>`;
        btn.onclick = async () => {
          btn.disabled = true;
          btn.innerText = "Memproses...";
          try {
            const result = await ApiService.callGemini(Utils.extraRules(content).text.replace(/Gunakan web_search[^.]*\./, "Pertahankan link yang sudah ada.") + Config.PROMPTS.REVISE(m, Utils.stripPembukaJawab(jawaban)));
            this.showJawabanBox(result, replyBtn, root, content, pembuka);
          } catch(e) { alert(e.message); }
          btn.disabled = false;
          btn.innerText = l;
        };
        btnRow.appendChild(btn);
      });
      resultDiv.appendChild(btnRow);
    }
  };

  const App = {
    async handleBuatPertanyaan(btn, root, replyBtn) {
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerText = "Memproses...";
      try {
        const content = Utils.extractContent(root);
        const req = await this.withMateri(Config.PROMPTS.QUESTIONS(content));
        const saran = await ApiService.callGemini(req.prompt, req.attachments);
        UIRenderer.showSaranQuestions(saran, root, replyBtn, () => this.handleBuatPertanyaan(btn, root, replyBtn));
      } catch (e) { alert(e.message); }
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    },

    async withMateri(prompt) {
      if (!Materi.isOn()) return { prompt, attachments: undefined };
      const m = await Materi.load(document);
      if (!m.blocks.length) return { prompt, attachments: undefined };
      return { prompt: Config.MATERI_NOTE + prompt, attachments: m.blocks };
    },

    async handleCariJawaban(btn, root, replyBtn, promptKey = "DEFAULT") {
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerText = "Memproses...";
      try {
        const content = Utils.extractContent(root);
        const extra = Utils.extraRules(content);
        if (extra.webSearch) btn.innerText = "Mencari sumber di web...";
        const req = await this.withMateri(extra.text + Config.PROMPTS[promptKey](content));
        const jawaban = await ApiService.callGemini(req.prompt, req.attachments, { webSearch: extra.webSearch });
        UIRenderer.showJawabanBox(jawaban, replyBtn, root, content, promptKey === "SINGKAT");
      } catch (e) { alert(e.message); }
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    },

    injectButtons() {
      document.querySelectorAll(".MuiStack-root .MuiButton-root.MuiButton-containedSuccess").forEach((replyBtn, index) => {
        if (replyBtn.parentElement.querySelector(".cari-jawaban-btn")) return;
        const root = replyBtn.closest(".MuiPaper-root, .discussion-post, [role='article']") || replyBtn.closest("div");
        
        if (index === 0 || Utils.isDosen(root)) {
          const buatBtn = UIRenderer.createButton("buat", () => this.handleBuatPertanyaan(buatBtn, root, replyBtn));
          replyBtn.parentElement.insertBefore(buatBtn, replyBtn);
        }

        if (index === 0) {
          const toggle = UIRenderer.createMateriToggle(root);
          replyBtn.parentElement.insertBefore(toggle, replyBtn.parentElement.firstChild);
        }

        const cariBtn = UIRenderer.createButton("cari", () => this.handleCariJawaban(cariBtn, root, replyBtn));
        replyBtn.parentElement.insertBefore(cariBtn, replyBtn);

        const singkatBtn = UIRenderer.createButton("singkat", () => this.handleCariJawaban(singkatBtn, root, replyBtn, "SINGKAT"));
        replyBtn.parentElement.insertBefore(singkatBtn, replyBtn);
      });
    },

    init() {
      this.injectButtons();
      new MutationObserver(() => this.injectButtons()).observe(document.body, { childList: true, subtree: true });
    }
  };

  App.init();
})();
