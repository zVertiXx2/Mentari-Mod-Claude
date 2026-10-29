// claudeClient.js — satu pintu untuk semua panggilan AI (pengganti Gemini)
// Dimuat paling awal di setiap content script yang butuh AI.
(function () {
  if (window.MentariAI) return;

  const ENDPOINT = "https://api.anthropic.com/v1";
  const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
  const KEY_STORAGE = "claudeApiKey";
  const MODEL_STORAGE = "claude_model";

  function decode(raw) {
    try {
      return atob(raw);
    } catch (e) {
      return raw;
    }
  }

  function headers(apiKey) {
    return {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Wajib kalau request dikirim langsung dari browser
      "anthropic-dangerous-direct-browser-access": "true",
    };
  }

  function saveQuota(h) {
    try {
      const quota = {
        rpm: {
          remaining: parseInt(h.get("anthropic-ratelimit-requests-remaining")),
          limit: parseInt(h.get("anthropic-ratelimit-requests-limit")),
        },
        tpm: {
          remaining: parseInt(h.get("anthropic-ratelimit-tokens-remaining")),
          limit: parseInt(h.get("anthropic-ratelimit-tokens-limit")),
        },
        updated: Date.now(),
      };
      if (!isNaN(quota.rpm.limit)) {
        localStorage.setItem("gemini_quota", JSON.stringify(quota));
        window.dispatchEvent(
          new CustomEvent("gemini-quota-updated", { detail: quota }),
        );
      }
    } catch (e) {}
  }

  window.MentariAI = {
    DEFAULT_MODEL,
    KEY_STORAGE,
    MODEL_STORAGE,

    getKey() {
      const raw = localStorage.getItem(KEY_STORAGE);
      return raw ? decode(raw) : null;
    },

    setKey(key) {
      localStorage.setItem(KEY_STORAGE, btoa(key));
    },

    supportsTemperature(model) {
      return /haiku|sonnet-4-[0-6]|opus-4-[0-6]|claude-3/.test(model);
    },

    getModel() {
      const m = (localStorage.getItem(MODEL_STORAGE) || "").replace(/"/g, "");
      // Sisa setting lama (gemini-*) otomatis dibuang
      return m && m.startsWith("claude") ? m : DEFAULT_MODEL;
    },

    // Kirim satu prompt, balikin teks jawaban.
    // Error yang dilempar punya .status (misal 429 = rate limit).
    // attachments: array content block (document / image) yang ditaruh sebelum prompt
    // webSearch: angka = maksimal jumlah pencarian web (server tool Anthropic, ~$0,01/pencarian)
    async complete(prompt, { maxTokens = 2048, temperature, apiKey, attachments, webSearch, model: modelOverride } = {}) {
      const key = apiKey || this.getKey();
      if (!key) {
        const err = new Error("API Key Claude belum diset");
        err.status = 0;
        throw err;
      }
      const model = modelOverride || this.getModel();
      const body = {
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      };
      if (Array.isArray(attachments) && attachments.length) {
        const blocks = attachments.map((b) => ({ ...b }));
        // Prompt caching: klik berikutnya pada materi yang sama (dalam ~5 menit) jauh lebih murah
        blocks[blocks.length - 1].cache_control = { type: "ephemeral" };
        body.messages[0].content = [...blocks, { type: "text", text: prompt }];
      }
      // Model baru (Sonnet 5, Opus 4.7+, Fable) menolak temperature non-default (error 400)
      // dan sudah otomatis "mikir dulu" (adaptive thinking). Temperature cuma buat model lama.
      if (typeof temperature === "number" && this.supportsTemperature(model))
        body.temperature = temperature;
      // Model dengan adaptive thinking butuh ruang token lebih (token mikir ikut dihitung)
      if (!this.supportsTemperature(model)) body.max_tokens = Math.max(maxTokens, 16000);

      if (webSearch) {
        body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: webSearch }];
      }

      let data;
      // Loop kecil buat stop_reason "pause_turn" (pencarian web yang panjang)
      for (let round = 0; round < 3; round++) {
        const res = await fetch(`${ENDPOINT}/messages`, {
          method: "POST",
          headers: headers(key),
          body: JSON.stringify(body),
        });

        saveQuota(res.headers);

        if (!res.ok) {
          let message = `Claude API ${res.status}`;
          try {
            const e = await res.json();
            if (e?.error?.message) message += `: ${e.error.message}`;
          } catch (_) {}
          if (res.status === 400 && "temperature" in body && /temperature|top_p|sampling/i.test(message)) {
            delete body.temperature;
            body.max_tokens = Math.max(body.max_tokens, 16000);
            continue;
          }
          const err = new Error(message);
          err.status = res.status;
          err.model = model;
          throw err;
        }

        data = await res.json();
        if (data.stop_reason !== "pause_turn") break;
        body.messages = [...body.messages.slice(0, 1), { role: "assistant", content: data.content }];
      }

      const blocks = data.content || [];
      // Kalau ada pencarian, ambil teks SETELAH hasil pencarian terakhir (buang "Saya akan mencari...")
      let start = 0;
      blocks.forEach((b, i) => {
        if (b.type === "web_search_tool_result" || b.type === "server_tool_use") start = i + 1;
      });
      let textBlocks = blocks.slice(start).filter((b) => b.type === "text");
      if (!textBlocks.length) textBlocks = blocks.filter((b) => b.type === "text");
      let text = textBlocks.map((b) => b.text).join("").trim();

      // Pengaman: kalau soal butuh link tapi jawaban nggak nulis URL, tempel URL dari sitasi
      if (webSearch && !/https?:\/\//.test(text)) {
        const urls = [];
        textBlocks.forEach((b) =>
          (b.citations || []).forEach((c) => {
            if (c.url && !urls.includes(c.url)) urls.push(c.url);
          }),
        );
        if (!urls.length) {
          blocks
            .filter((b) => b.type === "web_search_tool_result" && Array.isArray(b.content))
            .forEach((b) => b.content.slice(0, 1).forEach((r) => r.url && urls.push(r.url)));
        }
        if (urls.length) text += `\n\nLink: ${urls.slice(0, 3).join("\n")}`;
      }
      return text;
    },

    // Buat validasi key + daftar model di Settings
    async listModels(apiKey) {
      try {
        const res = await fetch(`${ENDPOINT}/models?limit=100`, {
          headers: headers(apiKey || this.getKey()),
        });
        if (!res.ok) {
          let message = "API key tidak valid atau expired.";
          try {
            const e = await res.json();
            if (e?.error?.message) message = e.error.message;
          } catch (_) {}
          return { ok: false, message };
        }
        const data = await res.json();
        return { ok: true, models: data.data || [] };
      } catch (e) {
        return {
          ok: false,
          message: "Gagal menghubungi server Anthropic. Periksa koneksi internet.",
        };
      }
    },
  };
})();
