// Hero boot sequence, reveals, nav highlight, blog reader, 3D board.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

  // ---------- hero: a board that boots as you scroll ----------
  const journey = $('#journey'), stage = $('#stage'), board = $('#board'), nav = $('.nav');
  const frames = $$('.frame'), steps = $$('.steps li');
  const hud = { vcc: $('#hud-vcc'), clk: $('#hud-clk'), cyc: $('#hud-cyc'), stat: $('#hud-stat') };
  const STAT = ['COLD START', 'CLOCK LOCKED', 'ROUTING', 'COMPUTING', 'OUTPUT HIGH'];
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return parent.appendChild(n);
  };
  const PINS = 6, GRID = 8;
  const cellOrder = [...Array(GRID * GRID).keys()].sort((a, b) => rnd(a) - rnd(b));
  let wave, chip, core, traces = [], cells = [], stageNow = -1, cellsOn = -1;

  const build = () => {
    board.replaceChildren(); traces = []; cells = []; cellsOn = -1;
    const W = stage.clientWidth, H = stage.clientHeight, mobile = W < 860;
    board.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const S = Math.min(mobile ? 150 : 230, W * 0.42), h = S / 2, scale = S / 230;
    const cx = mobile ? W / 2 : W * 0.7, cy = mobile ? H * 0.6 : H * 0.48;

    // clock: a square wave along the bottom
    const wy = H - 130, per = 56; let d = `M0 ${wy}`;
    for (let x = 0; x < W; x += per) d += ` V${wy - 14} H${x + per / 2} V${wy} H${x + per}`;
    wave = svg('path', { d, class: 'wave', pathLength: 1 }, board);

    // traces fan out from each side of the chip: straight, 45° bend, straight, via
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy], side) => {
      for (let k = 0; k < PINS; k++) {
        const i = side * PINS + k, t = (k - (PINS - 1) / 2) * (S / (PINS + 1));
        const px = -dy, py = dx, sign = t >= 0 ? 1 : -1, m = (dy ? 0.55 : 1) * scale;
        const far = dy ? 0 : W * (mobile ? 0.12 : dx < 0 ? 0.06 : 0.5); // left side stays short so it never runs under the copy
        const l1 = (20 + rnd(i) * 70) * m, l2 = (20 + rnd(i + 99) * 90) * m, l3 = 60 * m + rnd(i + 7) * far;
        const x0 = cx + dx * h + px * t, y0 = cy + dy * h + py * t;
        const ex = x0 + dx * (l1 + l2 + l3) + px * sign * l2, ey = y0 + dy * (l1 + l2 + l3) + py * sign * l2;
        const pd = `M${x0} ${y0} l${dx * l1} ${dy * l1} l${dx * l2 + px * sign * l2} ${dy * l2 + py * sign * l2} L${ex} ${ey}`;
        const path = svg('path', { d: pd, class: 'trace', pathLength: 1 }, board);
        svg('path', { d: pd, class: 'pulse', pathLength: 1, style: `animation-delay:${-rnd(i + 3) * 2.6}s` }, board);
        traces.push({ path, via: svg('circle', { cx: ex, cy: ey, r: 3, class: 'via' }, board), order: rnd(i + 50) });
      }
    });

    chip = svg('g', {}, board);
    svg('rect', { x: cx - h, y: cy - h, width: S, height: S, rx: 10, class: 'chip' }, chip);
    svg('circle', { cx: cx - h + 14, cy: cy - h + 14, r: 3, class: 'cell on' }, chip);
    const inner = S * 0.6, c = inner / GRID, ox = cx - inner / 2, oy = cy - inner / 2 - S * 0.04;
    for (let j = 0; j < GRID * GRID; j++)
      cells.push(svg('rect', { x: ox + (j % GRID) * c + 1.5, y: oy + Math.floor(j / GRID) * c + 1.5, width: c - 3, height: c - 3, rx: 1.5, class: 'cell' }, chip));
    svg('text', { x: cx, y: cy + h - 12, 'text-anchor': 'middle', class: 'chip-label' }, chip).textContent = 'GH-2026 · CE';
    core = svg('circle', { cx, cy, r: 4, class: 'core' }, board);
  };

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--p', max > 0 ? scrollY / max : 0);
    const p = clamp((scrollY - journey.offsetTop) / (journey.offsetHeight - innerHeight || 1));
    const v = clamp(p / 0.15), c = clamp((p - 0.2) / 0.18), r = clamp((p - 0.4) / 0.2), k = clamp((p - 0.6) / 0.2);
    const lit = p > 0.82;

    chip.style.opacity = v;
    core.style.opacity = 1 - k;
    wave.style.strokeDashoffset = 1 - c;
    traces.forEach(t => {
      const l = clamp(r * 1.7 - t.order * 0.7);
      t.path.style.strokeDashoffset = 1 - l;
      t.via.style.opacity = l >= 1 ? 1 : 0;
    });
    board.style.setProperty('--k', k);
    const on = lit ? cells.length : Math.round(k * cells.length * 0.8);
    if (on !== cellsOn) { cellsOn = on; cellOrder.forEach((idx, j) => cells[idx].classList.toggle('on', j < on)); }
    stage.classList.toggle('lit', lit);
    nav.classList.toggle('dark', !lit);

    const s = Math.min(4, Math.floor(p * 5));
    if (s !== stageNow) {
      stageNow = s;
      frames.forEach((el, i) => el.classList.toggle('on', i === s));
      steps.forEach((el, i) => el.classList.toggle('on', i === s));
      hud.stat.textContent = STAT[s];
    }
    hud.vcc.textContent = (3.3 * v).toFixed(2) + ' V';
    hud.clk.textContent = Math.round(c * 48) + ' MHz';
    hud.cyc.textContent = '0x' + Math.floor(p * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
  };

  addEventListener('resize', () => { build(); onScroll(); });
  addEventListener('scroll', onScroll, { passive: true });
  build(); onScroll();

  // ---------- reveal on scroll ----------
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$('.reveal').forEach(el => {
    el.style.transitionDelay = ([...el.parentNode.children].filter(c => c.classList.contains('reveal')).indexOf(el) % 5) * 70 + 'ms';
    io.observe(el);
  });

  // ---------- nav highlight ----------
  const links = $$('.nav li a');
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  // ---------- blog: cards from posts.json, opened in a reader dialog ----------
  // Post data may come from other sites, so it only ever goes in via textContent.
  const reader = $('#reader');
  const http = u => /^(https?:\/\/|assets\/)/.test(u || '') ? u : ''; // remote URL or our own assets folder
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  // "2026-07-20" → "20 Jul 2026", "2026-05" → "May 2026"
  const when = d => { const [y, m, day] = (d || '').split('-'); return [day && +day, 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m - 1], y].filter(Boolean).join(' '); };
  console.assert(when('2026-07-20') === '20 Jul 2026' && when('2026-05') === 'May 2026' && when('') === '', 'when()');
  // content items: "text" → paragraph, {h: "…"} → subheading, {li: ["…"]} → list
  const block = c => {
    if (typeof c === 'string') return make('p', '', c);
    if (c && c.h) return make('h4', '', c.h);
    const ul = make('ul');
    (c && c.li || []).forEach(t => ul.append(make('li', '', t)));
    return ul;
  };
  const openPost = p => {
    const shots = [{ src: p.image, cap: p.caption }, ...(p.gallery || [])].filter(s => http(s.src));
    const img = $('#reader-img'), cap = $('#reader-cap'), thumbs = $('#reader-thumbs'), src = $('#reader-src');
    const show = i => {
      img.src = shots[i].src;
      cap.textContent = shots[i].cap || (p.source ? 'Photo: ' + p.source : '');
      [...thumbs.children].forEach((t, j) => t.classList.toggle('on', j === i));
    };
    reader.classList.toggle('no-media', !shots.length);
    thumbs.replaceChildren(...(shots.length > 1 ? shots : []).map((s, i) => {
      const b = make('button'); b.setAttribute('aria-label', 'Photo ' + (i + 1));
      const t = make('img'); t.src = s.src; t.alt = ''; b.append(t);
      b.addEventListener('click', () => show(i));
      return b;
    }));
    if (shots.length) show(0);
    $('#reader-kicker').textContent = p.topic || '';
    $('#reader-title').textContent = p.title;
    $('#reader-meta').textContent = [p.source, when(p.date)].filter(Boolean).join('  ·  ');
    const body = (p.content || [p.summary]).filter(Boolean).map(block);
    if (body[0] && body[0].tagName === 'P') body[0].className = 'lead';
    $('#reader-body').replaceChildren(...body);
    src.hidden = !/^https?:\/\//.test(p.url || ''); if (!src.hidden) src.href = p.url;
    reader.showModal();
    reader.scrollTop = 0;
  };
  reader.addEventListener('click', e => { if (e.target === reader) reader.close(); });

  // award rows with data-photo get a static thumbnail
  $$('[data-photo]').forEach(row => {
    const f = make('div', 'ph');
    const t = make('img'); t.src = row.dataset.photo; t.alt = ''; t.loading = 'lazy'; f.append(t);
    row.append(f);
  });
  fetch('posts.json', { cache: 'no-cache' }).then(r => r.json()).then(posts => {
    if (!posts.length) return;
    $('#posts').replaceChildren(...posts.map(p => {
      const feature = p === posts[0];
      const card = make('button', feature ? 'post feature' : 'post');
      const thumb = make('div', 'thumb', p.source || p.topic); // source name shows when there is no image
      if (http(p.image)) { const im = make('img'); im.src = p.image; im.alt = ''; im.loading = 'lazy'; im.onerror = () => im.remove(); thumb.append(im); }
      const body = make('div');
      body.append(make('p', 'label', [p.source || p.topic, when(p.date)].filter(Boolean).join(' · ')), make('h3', '', p.title), make('p', '', p.summary));
      (feature ? body : card).append(make('span', 'go', feature ? 'Read the story →' : '→'));
      card.prepend(thumb, body);
      card.addEventListener('click', () => openPost(p));
      return card;
    }));
  }).catch(() => {}); // no server (file://): the static placeholder cards stay

  // ---------- 3D board: CSS boxes on a tilting plane ----------
  const pcb = $('#pcb'), scene = $('#scene'), hint = $('#hint');
  const part = (cls, x, y, w, d, h, label, tag = 'div') => {
    const n = make(tag, 'part ' + cls);
    n.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${d}px;--h:${h}px`;
    ['top', 'f', 'b', 'l', 'r'].forEach(f => n.append(make('i', f, f === 'top' ? label : '')));
    return pcb.appendChild(n);
  };
  const mcu = part('mcu', 115, 65, 90, 90, 12, 'gh', 'button');
  mcu.setAttribute('aria-label', 'Run the boot sequence');
  part('usb', 0, 85, 34, 50, 16);
  part('cap', 60, 24, 20, 20, 30); part('cap', 60, 176, 20, 20, 30);
  for (let i = 0; i < 6; i++) part('pin', 232 + i * 13, 196, 7, 7, 18);
  const leds = [0, 1, 2, 3].map(i => {
    const led = part('led', 236 + i * 19, 22, 13, 13, 8, '', 'button');
    led.setAttribute('aria-label', 'LED ' + (i + 1));
    return led;
  });
  const report = () => {
    const n = leds.filter(l => l.classList.contains('on')).length;
    hint.textContent = n === leds.length ? 'All systems on. Now say hello.' : `Drag to rotate · LEDs ${n}/${leds.length} · press the chip`;
  };
  let rx = 58, rz = -32, drag = null, moved = false;
  const turn = () => { pcb.style.setProperty('--rx', rx + 'deg'); pcb.style.setProperty('--rz', rz + 'deg'); };
  scene.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; moved = false; });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
    rz += dx * 0.4;
    if (e.pointerType !== 'touch') rx = clamp(rx - dy * 0.3, 20, 80); // touch keeps vertical drags for page scroll
    drag = { x: e.clientX, y: e.clientY };
    turn();
  });
  leds.forEach(l => l.addEventListener('click', () => { if (!moved) { l.classList.toggle('on'); report(); } }));
  mcu.addEventListener('click', () => {
    if (moved) return;
    leds.forEach(l => l.classList.remove('on'));
    leds.forEach((l, i) => setTimeout(() => { l.classList.add('on'); report(); }, 180 * (i + 1)));
  });
})();
