/* CAT — Report chat
 * Slide-in panel that lets the user ask Claude Haiku about the current report.
 *
 * Architecture:
 *   - The panel is injected into <body> as .cat-chat and toggled via .cat-chat--open.
 *   - API calls go to a Cloudflare Worker URL stored in localStorage under
 *     "cat-proxy-url".  On first open the user is prompted for that URL.
 *   - Report context is sourced from sessionStorage ("cat-report-data") when
 *     available; falls back to scraping the visible DOM.
 *   - Streaming is handled via ReadableStream (SSE text/event-stream).
 */

const STORAGE_KEY_PROXY = "cat-proxy-url";
const MODEL              = "claude-haiku-4-5";
const MAX_TOKENS         = 1024;

/* ─── Public mount function ──────────────────────────────────────────────── */

export function mountReportChat(catVideoSrc) {
  const container = buildPanel(catVideoSrc);
  document.body.appendChild(container);

  let isOpen   = false;
  let messages = []; // { role, content }[]

  /* ── DOM refs ───────────────────────────────────────────────────────── */
  const setupScreen = container.querySelector(".cat-chat__setup");
  const chatScreen  = container.querySelector(".cat-chat__chat-screen");
  const setupInput  = container.querySelector(".cat-chat__setup-input");
  const setupBtn    = container.querySelector(".cat-chat__setup-btn");
  const setupError  = container.querySelector(".cat-chat__setup-error");
  const messagesEl  = container.querySelector(".cat-chat__messages");
  const inputEl     = container.querySelector(".cat-chat__input");
  const sendBtn     = container.querySelector(".cat-chat__send");
  const errorBanner = container.querySelector(".cat-chat__error");
  const resetLink   = container.querySelector(".cat-chat__reset-link");

  /* ── Screen switching ───────────────────────────────────────────────── */

  const showSetup = () => {
    setupScreen.hidden = false;
    chatScreen.hidden  = true;
  };

  const showChat = () => {
    setupScreen.hidden = true;
    chatScreen.hidden  = false;
    if (messages.length === 0) renderEmpty();
    setTimeout(() => inputEl.focus(), 80);
  };

  /* ── Setup screen logic ─────────────────────────────────────────────── */

  setupBtn.addEventListener("click", () => {
    const url = setupInput.value.trim();
    if (!url) {
      setupError.textContent = "Paste your Worker URL above.";
      return;
    }
    if (!url.startsWith("http")) {
      setupError.textContent = "URL must start with https://";
      return;
    }
    localStorage.setItem(STORAGE_KEY_PROXY, url);
    setupError.textContent = "";
    showChat();
  });

  setupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); setupBtn.click(); }
  });

  resetLink.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY_PROXY);
    setupInput.value = "";
    messages = [];
    messagesEl.innerHTML = "";
    showSetup();
  });

  /* ── Open / close ───────────────────────────────────────────────────── */

  const open = () => {
    isOpen = true;
    container.classList.add("cat-chat--open");
    const proxyUrl = localStorage.getItem(STORAGE_KEY_PROXY);
    if (proxyUrl) showChat(); else showSetup();
  };

  const close = () => {
    isOpen = false;
    container.classList.remove("cat-chat--open");
  };

  container.querySelector(".cat-chat__close").addEventListener("click", close);

  // Close on backdrop click
  container.addEventListener("click", (e) => {
    if (e.target === container) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) close();
  });

  /* ── Messages ───────────────────────────────────────────────────────── */

  const renderEmpty = () => {
    messagesEl.innerHTML = `
      <div class="cat-chat__empty">
        <div class="cat-chat__empty-icon">🐱</div>
        <p>Ask me anything about this report — findings, fixes, or what to do next.</p>
      </div>
    `;
  };

  const appendMessage = (role, content, streaming = false) => {
    const emptyEl = messagesEl.querySelector(".cat-chat__empty");
    if (emptyEl) emptyEl.remove();

    const msgEl = document.createElement("div");
    msgEl.className = `cat-msg cat-msg--${role}${streaming ? " cat-msg--streaming" : ""}`;
    const bubble = document.createElement("div");
    bubble.className = "cat-msg__bubble";
    bubble.textContent = content;
    msgEl.appendChild(bubble);
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msgEl;
  };

  const showThinking = () => {
    const el = document.createElement("div");
    el.className = "cat-msg cat-msg--assistant";
    el.innerHTML = `<div class="cat-chat__thinking"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  };

  const setError = (msg) => {
    if (msg) {
      errorBanner.textContent = msg;
      errorBanner.classList.add("cat-chat__error--visible");
    } else {
      errorBanner.textContent = "";
      errorBanner.classList.remove("cat-chat__error--visible");
    }
  };

  const setInputDisabled = (disabled) => {
    inputEl.disabled = disabled;
    sendBtn.disabled = disabled || inputEl.value.trim().length === 0;
  };

  /* ── Send / stream ──────────────────────────────────────────────────── */

  const send = async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    const proxyUrl = localStorage.getItem(STORAGE_KEY_PROXY);
    if (!proxyUrl) { showSetup(); return; }

    messages.push({ role: "user", content: text });
    appendMessage("user", text);
    inputEl.value = "";
    inputEl.style.height = "auto";
    setError(null);
    setInputDisabled(true);

    const thinkingEl = showThinking();

    try {
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: buildSystemPrompt(),
          stream: true,
          messages: messages.slice(-12),
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => String(response.status));
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      thinkingEl.remove();

      const msgEl   = appendMessage("assistant", "", true);
      const bubbleEl = msgEl.querySelector(".cat-msg__bubble");
      let fullContent = "";

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") break outer;

          let event;
          try { event = JSON.parse(dataStr); } catch { continue; }

          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            fullContent += event.delta.text;
            bubbleEl.textContent = fullContent;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
          if (event.type === "message_stop") break outer;
        }
      }

      msgEl.classList.remove("cat-msg--streaming");
      messages.push({ role: "assistant", content: fullContent });

    } catch (err) {
      thinkingEl?.remove();
      setError(`Something went wrong: ${err.message}. Check your Worker URL and try again.`);
      messages.pop(); // roll back user message
    } finally {
      setInputDisabled(false);
      inputEl.focus();
    }
  };

  sendBtn.addEventListener("click", send);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

  inputEl.addEventListener("input", () => {
    sendBtn.disabled = inputEl.value.trim().length === 0 || inputEl.disabled;
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  });

  return { open, close };
}

/* ─── System prompt ──────────────────────────────────────────────────────── */

function buildSystemPrompt() {
  let reportContext = "";

  try {
    const raw = sessionStorage.getItem("cat-report-data");
    if (raw) reportContext = JSON.stringify(JSON.parse(raw), null, 2);
  } catch (_) { /* ignore */ }

  if (!reportContext) reportContext = scrapeReportDOM();

  return `You are CAT's analytical assistant — a sharp, knowledgeable analytics expert embedded in the CAT (Companion Analytics Toolkit) report viewer.

Your personality: precise, direct, and helpful. No filler. No hedging. Give concrete answers and actionable next steps. Use short sentences. Speak like an expert colleague, not a help desk.

The user is looking at an analytics audit report generated by CAT. They can ask you about:
- What specific findings mean and why they matter
- How to fix issues (step-by-step GTM / GA4 / consent instructions)
- Priority order for remediation
- Trade-offs or edge cases
- What to do next

REPORT DATA:
\`\`\`json
${reportContext}
\`\`\`

Keep responses tight — under 200 words unless the user asks for more detail. Reference finding titles exactly as they appear. Use inline code for tag names, event names, and field names.`;
}

/* ─── DOM scraper (fallback) ─────────────────────────────────────────────── */

function scrapeReportDOM() {
  const parts = [];

  const title   = document.querySelector(".report-header__title")?.textContent?.trim();
  const summary = document.querySelector(".report-header__summary")?.textContent?.trim();
  if (title)   parts.push(`Report: ${title}`);
  if (summary) parts.push(`Summary: ${summary}`);

  document.querySelectorAll(".finding").forEach((el, i) => {
    const sev = el.dataset.severity ?? "info";
    const t   = el.querySelector(".finding__title")?.textContent?.trim()  ?? "";
    const d   = el.querySelector(".finding__detail")?.textContent?.trim() ?? "";
    const m   = el.querySelector(".finding__meta")?.textContent?.trim()   ?? "";
    parts.push(`\nFinding ${i + 1} [${sev.toUpperCase()}]: ${t}\nDetail: ${d}\nMeta: ${m}`);
  });

  document.querySelectorAll(".recommendation").forEach((el, i) => {
    const h = el.querySelector("h4")?.textContent?.trim() ?? "";
    const p = el.querySelector("p")?.textContent?.trim()  ?? "";
    parts.push(`\nRecommendation ${i + 1}: ${h}. ${p}`);
  });

  document.querySelectorAll(".next-step").forEach((el) => {
    const clone = el.cloneNode(true);
    clone.querySelector(".next-step__check")?.remove();
    parts.push(`Next step: ${clone.textContent.trim()}`);
  });

  return parts.join("\n") || "No structured report data available.";
}

/* ─── Panel HTML ─────────────────────────────────────────────────────────── */

function buildPanel(catVideoSrc) {
  const savedUrl = localStorage.getItem(STORAGE_KEY_PROXY) ?? "";

  const div = document.createElement("div");
  div.className = "cat-chat";
  div.setAttribute("role", "dialog");
  div.setAttribute("aria-label", "Ask CAT about this report");
  div.setAttribute("aria-modal", "true");

  div.innerHTML = `
    <div class="cat-chat__panel">

      <!-- ── Header ── -->
      <div class="cat-chat__header">
        <div class="cat-chat__avatar">
          <video src="${catVideoSrc}" autoplay loop muted playsinline></video>
        </div>
        <div>
          <div class="cat-chat__title">Ask CAT</div>
          <div class="cat-chat__subtitle">Analytics assistant · Haiku</div>
        </div>
        <button class="cat-chat__close" type="button" aria-label="Close chat">
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- ── Setup screen ── -->
      <div class="cat-chat__setup">
        <h3>Connect CAT to Claude</h3>
        <p>
          Paste your <strong>Cloudflare Worker URL</strong> below. The worker proxies
          your question to Claude Haiku — your API key never touches the browser.
        </p>
        <input
          class="cat-chat__setup-input"
          type="url"
          placeholder="https://cat-proxy.your-name.workers.dev"
          value="${savedUrl}"
          autocomplete="off"
          spellcheck="false"
        />
        <p class="cat-chat__setup-error"></p>
        <button class="cat-chat__setup-btn" type="button">Connect</button>
      </div>

      <!-- ── Chat screen ── -->
      <div class="cat-chat__chat-screen" hidden>
        <div class="cat-chat__messages"></div>
        <div class="cat-chat__error"></div>
        <div class="cat-chat__input-row">
          <textarea
            class="cat-chat__input"
            rows="1"
            placeholder="Ask about a finding, fix, or what to do next…"
            aria-label="Message"
          ></textarea>
          <button class="cat-chat__send" type="button" disabled aria-label="Send">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <button class="cat-chat__reset-link" type="button">Change Worker URL</button>
      </div>

    </div>
  `;

  return div;
}
