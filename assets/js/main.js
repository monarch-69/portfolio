/* Ritesh Tiwari · portfolio scripts (no dependencies) */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     BOOT SCREEN: "connect to server, fetch portfolio, run checks"
     ========================================================= */
  window.__bootDone = new Promise((resolve) => {
    const boot = document.getElementById("boot");
    const log = document.getElementById("boot-log");
    const fill = document.getElementById("boot-fill");
    const pctEl = document.getElementById("boot-pct");
    if (!boot || !log) { document.documentElement.classList.remove("is-booting"); return resolve(); }

    // Speeds in milliseconds. Raise them to slow the intro down, lower them to speed it up.
    const PACE = {
      cmdTotal: 1000,  // the whole ssh command types out in about this long
      lineTotal: 450,  // each log line's text types out in about this long
      settle: 400,     // the [ .   ] dots keep spinning this long before [ OK ]
      linePause: 200,  // pause after a line turns [ OK ], before the next one
      fetchTotal: 1200,// the "fetching portfolio" bar fills in about this long
      hold: 1600,      // how long "OPERATIONAL" stays before the screen closes
    };

    const host = location.hostname || "monarch-69.github.io";
    const escB = (x) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const plain = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent; };

    // Use the browser's real network timings when it has them; otherwise plausible ones.
    const nav = (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || {};
    const ms = (v, lo, hi) => (v > 0.5 ? Math.round(v) : Math.round(lo + Math.random() * (hi - lo))) + "ms";
    const dns = ms(nav.domainLookupEnd - nav.domainLookupStart, 8, 24);
    const tcp = ms(nav.connectEnd - nav.connectStart, 18, 48);
    const ttfb = ms(nav.responseStart - nav.requestStart, 30, 90);

    const OK = '<span class="ok">[  OK  ]</span> ';
    const CARET = '<span class="led">▌</span>';
    const CMD = (c) => `<span class="p">$</span> <span class="hi">${escB(c)}</span>`;
    const FINAL = `all systems checked. status: <span class="op">OPERATIONAL</span> <span class="led">●</span>`;

    const steps = [
      { cmd: `ssh visitor@${host}` },
      { m: `resolving ${host} <span class="dim">→</span> 185.199.108.153 <span class="dim">(${dns})</span>`, p: 12 },
      { m: `tcp handshake  SYN <span class="dim">→</span> SYN-ACK <span class="dim">→</span> ACK <span class="dim">(${tcp})</span>`, p: 24 },
      { m: `tls handshake complete, connection encrypted`, p: 34 },
      { m: `GET /portfolio <span class="dim">→</span> 200 OK <span class="dim">(ttfb ${ttfb})</span>`, p: 42 },
      { fetch: true },
      { m: `mounting /about /experience /projects /academics /contact`, p: 92 },
      { m: `system checks: cpu <span class="ok">✓</span>  mem <span class="ok">✓</span>  net <span class="ok">✓</span>  fonts <span class="ok">✓</span>`, p: 100 },
      { final: true },
    ];
    const BAR_W = 20;
    const FETCH_DONE = `${OK}fetching portfolio  <span class="ok">[${"█".repeat(BAR_W)}]</span> 100%`;

    const setPct = (p) => {
      fill.style.width = p + "%";
      pctEl.textContent = Math.round(p) + "%";
    };
    const sleep = (t) => new Promise((r) => setTimeout(r, t));
    const loaded = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
    let skipped = false;
    let lines = [];
    const draw = (extra = "") => (log.innerHTML = lines.join("\n") + extra);

    function finish() {
      if (finish.done) return;
      finish.done = true;
      lines = steps.map((s) =>
        s.cmd ? CMD(s.cmd) : s.fetch ? FETCH_DONE : s.final ? "\n" + FINAL : OK + s.m);
      draw();
      setPct(100);
      const close = () => {
        boot.classList.add(reduceMotion ? "is-done-fast" : "is-done");
        document.documentElement.classList.remove("is-booting");
        setTimeout(() => { boot.remove(); resolve(); }, reduceMotion ? 260 : 620);
      };
      setTimeout(close, skipped ? 250 : 400);
    }

    const skip = () => { skipped = true; finish(); };
    window.addEventListener("keydown", skip, { once: true });
    boot.addEventListener("pointerdown", skip, { once: true });
    setTimeout(skip, 30000); // safety net: never trap the visitor

    // type `text` into the last line, one character at a time
    async function typeLine(prefix, text, totalMs) {
      const t0 = performance.now();
      for (;;) {
        if (finish.done) return false;
        const k = Math.min(text.length, Math.ceil(((performance.now() - t0) / totalMs) * text.length));
        lines[lines.length - 1] = prefix() + '<span class="hi">' + escB(text.slice(0, k)) + "</span>";
        draw(CARET);
        if (k >= text.length) return true;
        await sleep(16);
      }
    }

    // "[ .   ]" → "[ ..  ]" → "[ ... ]" while a step is in progress
    const SPIN = ["[ .    ]", "[ ..   ]", "[ ...  ]", "[ .... ]"];
    let spinStart = 0;
    const wait = () => `<span class="wait">${SPIN[Math.floor((performance.now() - spinStart) / 130) % SPIN.length]}</span> `;
    async function spin(ms, render) {
      const t0 = performance.now();
      while (performance.now() - t0 < ms) {
        if (finish.done) return false;
        lines[lines.length - 1] = render();
        draw();
        await sleep(40);
      }
      return true;
    }

    (async () => {
      if (reduceMotion) { await sleep(500); return finish(); }
      await sleep(350);
      for (const st of steps) {
        if (finish.done) return;

        if (st.cmd) {
          lines.push("");
          if (!(await typeLine(() => '<span class="p">$</span> ', st.cmd, PACE.cmdTotal))) return;
          lines[lines.length - 1] = CMD(st.cmd);
          draw("\n" + CARET);
          await sleep(PACE.linePause + 400);
          continue;
        }

        if (st.fetch) {
          // progress bar tied to the real page load (fonts, scripts, photo)
          let p = 0;
          spinStart = performance.now();
          const bar = () => {
            const n = Math.round((p / 100) * BAR_W);
            return `${wait()}fetching portfolio  <span class="ok">[${"█".repeat(n)}${"░".repeat(BAR_W - n)}]</span> ${p}%`;
          };
          lines.push(bar());
          let isLoaded = false;
          loaded.then(() => (isLoaded = true));
          while (p < 100 && !finish.done) {
            const cap = isLoaded ? 100 : 90;
            p = Math.min(cap, p + 2 + Math.round(Math.random() * 3));
            lines[lines.length - 1] = bar();
            draw();
            setPct(42 + p * 0.48);
            await sleep(PACE.fetchTotal / 28);
            if (p >= 90 && !isLoaded) await Promise.race([loaded, sleep(2500)]).then(() => (isLoaded = true));
          }
          if (finish.done) return;
          lines[lines.length - 1] = FETCH_DONE;
          draw("\n" + CARET);
          await sleep(PACE.linePause);
          continue;
        }

        if (st.final) {
          lines.push("");
          lines.push("");
          if (!(await typeLine(() => "", plain(FINAL).replace(" ●", ""), 800))) return;
          lines[lines.length - 1] = FINAL;
          draw();
          await sleep(PACE.hold);
          continue;
        }

        // a log line: spinning "[ .   ]" while its text types out and settles, then "[  OK  ]"
        spinStart = performance.now();
        lines.push(wait());
        if (!(await typeLine(wait, plain(st.m), PACE.lineTotal))) return;
        if (!(await spin(PACE.settle, () => wait() + '<span class="hi">' + escB(plain(st.m)) + "</span>"))) return;
        lines[lines.length - 1] = OK + st.m;
        draw("\n" + CARET);
        if (st.p) setPct(st.p);
        await sleep(PACE.linePause);
      }
      finish();
    })();
  });


  /* ---------- footer year ---------- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- profile photo fallback ---------- */
  const img = document.getElementById("profile-img");
  const photo = document.querySelector(".photo");
  if (img && photo) {
    const empty = () => photo.classList.add("photo--empty");
    if (img.complete && img.naturalWidth === 0) empty();
    img.addEventListener("error", empty);
  }

  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- current section: sliding nav pill + "cd ~/section" in the prompt ---------- */
  const navLinks = [...document.querySelectorAll(".nav__links a")];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  const pill = document.querySelector(".nav__pill");
  const promptPath = document.querySelector(".prompt-path");
  const promptCmd = document.querySelector(".prompt-cmd");
  let currentId = "";        // "" means the hero, i.e. "~"
  let navLockUntil = 0;      // while a nav click is scrolling, ignore the sections it passes

  function movePill(id) {
    if (!pill) return;
    const link = navLinks.find((a) => a.getAttribute("href") === "#" + id);
    if (!link) { pill.classList.remove("is-on"); return; }
    pill.style.width = link.offsetWidth + "px";
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
    pill.classList.add("is-on");
  }

  // type "cd ~/section" after the prompt, then the prompt's path changes
  let promptRun = 0, promptTimer = null;
  function promptTo(id) {
    clearTimeout(promptTimer);
    const run = ++promptRun;
    const path = id ? "~/" + id : "~";
    const show = promptCmd && getComputedStyle(promptCmd).display !== "none" && !reduceMotion;
    const setPath = () => {
      promptPath.textContent = path;
      promptPath.classList.add("is-changing");
      requestAnimationFrame(() => requestAnimationFrame(() => promptPath.classList.remove("is-changing")));
    };
    if (!show) { if (promptCmd) promptCmd.textContent = ""; return setPath(); }
    const cmd = " cd " + path;
    let k = 0;
    (function step() {
      if (run !== promptRun) return;
      promptCmd.textContent = cmd.slice(0, ++k);
      if (k < cmd.length) { promptTimer = setTimeout(step, 38 + Math.random() * 30); return; }
      promptTimer = setTimeout(() => {          // "press enter": the directory changes
        if (run !== promptRun) return;
        promptCmd.textContent = "";
        setPath();
      }, 280);
    })();
  }

  function setCurrent(id, immediate) {
    if (id === currentId) return;
    currentId = id;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
    movePill(id);
    clearTimeout(promptTimer);
    if (immediate) promptTo(id);
    else promptTimer = setTimeout(() => promptTo(id), 160);   // fast scrolling doesn't spam the prompt
  }

  function detectSection() {
    if (performance.now() < navLockUntil) return;
    const navH = navEl ? navEl.offsetHeight : 0;
    const probe = navH + (window.innerHeight - navH) * 0.35;
    let id = "";
    for (const s of sections) if (s.getBoundingClientRect().top <= probe) id = s.id;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2 && sections.length)
      id = sections[sections.length - 1].id;
    setCurrent(id);
  }
  window.addEventListener("resize", () => movePill(currentId));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(currentId));

  /* ---------- reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const ro = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            obs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => ro.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- projects timeline: alternate sides, filters, hover focus ---------- */
  const ptl = document.querySelector(".ptl");
  const prows = ptl ? [...ptl.querySelectorAll(".prow")] : [];

  // every second *visible* row goes on the other side
  function layoutRows() {
    let i = 0;
    prows.forEach((row) => {
      if (row.classList.contains("is-hidden")) return;
      row.classList.toggle("is-flip", i % 2 === 1);
      i++;
    });
  }
  layoutRows();

  const filters = document.querySelectorAll(".filter");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      prows.forEach((row) => {
        const tags = (row.dataset.tags || "").split(" ");
        row.classList.toggle("is-hidden", !(f === "all" || tags.includes(f)));
      });
      layoutRows();
      requestTick();
    });
  });

  // hover focus: the hovered row eases forward and the rest fade back.
  // Small delays keep it calm when the cursor passes between rows.
  if (ptl && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let enterT = null, leaveT = null;
    const clear = () => prows.forEach((r) => r.classList.remove("is-focus"));
    prows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        clearTimeout(leaveT); clearTimeout(enterT);
        enterT = setTimeout(() => {
          clear();
          row.classList.add("is-focus");
          ptl.classList.add("has-focus");
        }, 90);
      });
      row.addEventListener("mouseleave", () => {
        clearTimeout(enterT);
        leaveT = setTimeout(() => { clear(); ptl.classList.remove("has-focus"); }, 140);
      });
    });
  }
  // keyboard: focusing a project name focuses its row too
  prows.forEach((row) => {
    const n = row.querySelector(".pname");
    if (!n) return;
    n.addEventListener("focus", () => { row.classList.add("is-focus"); ptl.classList.add("has-focus"); });
    n.addEventListener("blur", () => { row.classList.remove("is-focus"); ptl.classList.remove("has-focus"); });
  });

  /* ---------- BibTeX toggle + copy ---------- */
  document.querySelectorAll(".bibtoggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = document.getElementById(btn.getAttribute("aria-controls"));
      if (!el) return;
      const open = el.hasAttribute("hidden");
      el.toggleAttribute("hidden", !open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.querySelectorAll(".bibcopy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.parentElement.querySelector("code");
      try {
        await navigator.clipboard.writeText(code.textContent);
        btn.textContent = "copied";
      } catch {
        btn.textContent = "select + ⌘C";
      }
      setTimeout(() => (btn.textContent = "copy"), 1600);
    });
  });

  /* ---------- nav clicks: land exactly on one section ---------- */
  const navEl = document.querySelector(".nav");
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = navEl ? navEl.offsetHeight : 0;
      const y = id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - navH;
      navLockUntil = performance.now() + 1100;
      setCurrent(id === "#top" ? "" : id.slice(1), true);
      window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", id === "#top" ? location.pathname : id);
    });
  });

  /* ---------- count-up numbers ---------- */
  const counters = document.querySelectorAll(".count");
  const runCount = (el) => {
    const to = +el.dataset.to;
    if (reduceMotion) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { runCount(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else counters.forEach(runCount);

  /* ---------- scroll engine: parallax + experience git graph ---------- */
  const layers = [...document.querySelectorAll("[data-speed], .watermark")].map((el) => ({
    el,
    speed: parseFloat(el.dataset.speed || "-0.25"),
    ref: el.closest("section") || el.parentElement,
  }));
  const graph = document.querySelector(".graph");
  const gnodes = graph ? [...graph.querySelectorAll(".gnode, .graph__stat")] : [];
  const xpProgress = document.querySelector(".xp__progress");
  const pctEl = xpProgress && xpProgress.querySelector(".pct");
  const desktop = window.matchMedia("(min-width: 761px)");

  function onScroll() {
    const vh = window.innerHeight;
    detectSection();

    // parallax: each layer moves relative to its section's top edge
    if (!reduceMotion) {
      for (const L of layers) {
        if (!desktop.matches && L.el.dataset.speed && !L.el.classList.contains("watermark")) {
          L.el.style.transform = "";
          continue;
        }
        const r = L.ref.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;   // off-screen: skip
        L.el.style.transform = `translate3d(0, ${(-r.top * L.speed).toFixed(1)}px, 0)`;
      }
    }

    // git graph: the rail fills as you read, each commit lights up when reached
    if (graph) {
      const r = graph.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
      graph.style.setProperty("--p", p.toFixed(4));
      if (xpProgress) xpProgress.style.setProperty("--p", p.toFixed(4));
      if (pctEl) pctEl.textContent = Math.round(p * 100) + "%";
      const reach = p * r.height;
      for (const n of gnodes) n.classList.toggle("is-on", reduceMotion || n.offsetTop + 18 <= reach);
    }

    // projects timeline: same idea, the rail fills and each project slides in when reached
    if (ptl) {
      const r = ptl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / r.height));
      ptl.style.setProperty("--p", p.toFixed(4));
      const reach = p * r.height;
      for (const row of prows) row.classList.toggle("is-on", reduceMotion || row.offsetTop + 30 <= reach);
    }

    // projects parallax: in each row the name side drifts slower and the card
    // slightly faster than the page, so the two sides separate as they pass.
    // Uses the `translate` property, so it stacks with the reveal/hover transforms.
    if (ptl && !reduceMotion) {
      const on = desktop.matches;
      for (const row of prows) {
        const idEl = row.querySelector(".prow__id"), body = row.querySelector(".prow__body");
        if (!on) { idEl.style.translate = body.style.translate = ""; continue; }
        const r = row.getBoundingClientRect();
        if (r.bottom < -150 || r.top > vh + 150) continue;
        const d = r.top + r.height / 2 - vh / 2;              // distance from screen centre
        const clamp = (v) => Math.max(-70, Math.min(70, v));
        idEl.style.translate = `0 ${clamp(d * -0.08).toFixed(1)}px`;
        body.style.translate = `0 ${clamp(d * 0.05).toFixed(1)}px`;
      }
    }
  }

  let ticking = false;
  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    }
  };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  onScroll();

  /* ---------- 3D tilt on the photo (mouse only) ---------- */
  const tilt = document.querySelector("[data-tilt] .photo__frame");
  if (tilt && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    const host = tilt.parentElement;
    host.style.perspective = "900px";
    host.addEventListener("mousemove", (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg)`;
    });
    host.addEventListener("mouseleave", () => (tilt.style.transform = ""));
  }

  /* ---------- typed terminal intro ---------- */
  const term = document.getElementById("term");
  const script = [
    { cmd: "whoami" },
    { out: '<span class="o">ritesh tiwari · software engineer · mumbai, in</span>' },
    { cmd: "cat focus.txt" },
    { out: '<span class="k">systems</span><span class="o">C++, Rust, kernels, hypervisors</span>' },
    { out: '<span class="k">backend</span><span class="o">Python, FastAPI, Kafka, PostgreSQL</span>' },
    { out: '<span class="k">agents</span><span class="o">LangGraph, RAG, eval harnesses</span>' },
    { cmd: "./status --open-to-work" },
    { out: '<span class="s">true</span> <span class="o">// India or remote</span>' },
  ];

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const PROMPT = '<span class="p">$</span> ';

  function renderStatic() {
    term.innerHTML =
      script.map((l) => (l.cmd ? PROMPT + esc(l.cmd) : l.out)).join("\n") +
      "\n" + PROMPT + '<span class="cursor"></span>';
  }

  // Reserve the terminal's final height up front, so the page below
  // doesn't jump while it types (that would break nav-click scrolling).
  function reserveTermHeight() {
    const ghost = term.cloneNode(false);
    ghost.removeAttribute("id");
    ghost.innerHTML =
      script.map((l) => (l.cmd ? PROMPT + esc(l.cmd) : l.out)).join("\n") + "\n" + PROMPT + " ";
    Object.assign(ghost.style, { position: "absolute", visibility: "hidden", width: term.clientWidth + "px", minHeight: "0" });
    term.parentElement.appendChild(ghost);
    term.style.minHeight = ghost.offsetHeight + "px";
    ghost.remove();
  }

  if (term) {
    reserveTermHeight();
    window.addEventListener("resize", reserveTermHeight);
    if (reduceMotion) {
      renderStatic();
    } else {
      let html = "";
      let i = 0;
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const draw = (extra = "") => (term.innerHTML = html + extra + '<span class="cursor"></span>');

      (async function run() {
        await window.__bootDone;
        await sleep(250);
        for (; i < script.length; i++) {
          const line = script[i];
          if (line.cmd) {
            html += PROMPT;
            for (const ch of line.cmd) {
              html += esc(ch);
              draw();
              await sleep(45 + Math.random() * 55);
            }
            html += "\n";
            draw();
            await sleep(260);
          } else {
            html += line.out + "\n";
            draw();
            await sleep(120);
          }
        }
        html += PROMPT;
        draw();
      })();
    }
  }

  /* ---------- hex "memory dump" rain in the hero ---------- */
  const canvas = document.getElementById("hexrain");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    const HEX = "0123456789abcdef";
    const FONT = 13;
    let cols = [], w = 0, h = 0, dpr = 1, running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colW = FONT * 2.4;
      const n = Math.ceil(w / colW);
      cols = Array.from({ length: n }, (_, k) => ({
        x: k * colW,
        y: Math.random() * h,
        speed: 0.25 + Math.random() * 0.6,
        amber: Math.random() < 0.18,
      }));
    }

    const byte = () => HEX[(Math.random() * 16) | 0] + HEX[(Math.random() * 16) | 0];

    function frame() {
      if (!running) return;
      ctx.fillStyle = "rgba(24,24,24,0.16)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT}px "JetBrains Mono", monospace`;
      for (const c of cols) {
        ctx.fillStyle = c.amber ? "rgba(227,179,65,0.22)" : "rgba(126,231,135,0.16)";
        ctx.fillText(byte(), c.x, c.y);
        c.y += FONT * c.speed;
        if (c.y > h + FONT) c.y = -Math.random() * 200;
      }
      setTimeout(() => requestAnimationFrame(frame), 70);
    }

    // pause the animation when the hero is off-screen (saves battery)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        const was = running;
        running = en.isIntersecting;
        if (running && !was) frame();
      }).observe(canvas);
    }

    window.addEventListener("resize", resize);
    resize();
    frame();
  }
})();
