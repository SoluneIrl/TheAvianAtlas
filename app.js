(function () {
    const NO_BIRDS_GAMES = ['Hollow Knight','Hollow Knight Silksong','Deepest Sword'];

    const gameListEl   = document.getElementById('gameList');
    const gameSearchEl = document.getElementById('gameSearch');
    const boardTitleEl = document.getElementById('boardTitle');
    const boardMetaEl  = document.getElementById('boardMeta');
    const boardGridEl  = document.getElementById('boardGrid');
    const boardSortEl      = document.getElementById('boardSort');
    const boardSortLabelEl = boardSortEl ? boardSortEl.closest('.board__sort-label') : null;
    const statBirdsEl  = document.getElementById('statBirds');
    const statGamesEl  = document.getElementById('statGames');
    const statContributorsEl = document.getElementById('statContributors');
    const fileNoticeEl = document.getElementById('fileNotice');
    const lightboxEl        = document.getElementById('lightbox');
    const lightboxImgEl     = document.getElementById('lightboxImg');
    const lightboxMatEl     = document.querySelector('.lightbox__mat');
    const lightboxCaptionTitleEl = document.getElementById('lightboxCaptionTitle');
    const lightboxCaptionMetaEl  = document.getElementById('lightboxCaptionMeta');
    const lightboxCloseEl   = document.getElementById('lightboxClose');
    const lightboxPrevEl    = document.getElementById('lightboxPrev');
    const lightboxNextEl    = document.getElementById('lightboxNext');
    const musicToggleEl     = document.getElementById('musicToggle');
    const musicToggleIconEl = document.getElementById('musicToggleIcon');
    const bgMusicEl         = document.getElementById('bgMusic');
    const heroEl            = document.querySelector('.hero');
    const heroImgEl         = document.querySelector('.hero__img');
    const logTabBirdsEl     = document.getElementById('logTabBirds');
    const logTabDevEl       = document.getElementById('logTabDev');
    const logPanelBirdsEl   = document.getElementById('logPanelBirds');
    const logPanelDevEl     = document.getElementById('logPanelDev');

    const PLAY_ICON  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"/></svg>';
    const PAUSE_ICON = '<svg viewBox="-1 0 8 8" fill="currentColor"><path d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606" transform="translate(-171,-3605)"/></svg>';

    // subtle cursor-follow parallax on the hero photo — desktop/mouse only,
    // and skipped entirely for reduced-motion users
    if (heroEl && heroImgEl
        && window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroEl.addEventListener('mousemove', (e) => {
            const rect = heroEl.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1..1
            const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;  // -1..1
            heroImgEl.style.setProperty('--parallax-x', (px * -10).toFixed(2));
            heroImgEl.style.setProperty('--parallax-y', (py * -6).toFixed(2));
        });
        heroEl.addEventListener('mouseleave', () => {
            heroImgEl.style.setProperty('--parallax-x', 0);
            heroImgEl.style.setProperty('--parallax-y', 0);
        });
    }

    // little confetti burst from a point on screen — plain accent palette
    // normally, full rainbow while rave mode is on. Self-cleaning: each
    // piece removes itself once its fall animation finishes.
    function spawnConfetti(x, y, count) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rave = document.body.classList.contains('music-playing');
        const palette = rave
            ? ['#ff5c8a', '#ff9f43', '#ffd93d', '#6bcb77', '#4d96ff', '#a66bff']
            : ['var(--color-accent-gold)', 'var(--color-accent-wine)', 'var(--color-accent-umber)', 'var(--color-accent-gold-bright)'];
        const total = count || (rave ? 22 : 14);
        for (let i = 0; i < total; i++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * (rave ? 150 : 70);
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - (rave ? 50 : 20);
            const duration = rave ? (0.7 + Math.random() * 0.6) : (0.55 + Math.random() * 0.35);
            piece.style.setProperty('--piece-color', palette[i % palette.length]);
            piece.style.setProperty('--piece-x1', `${dx}px`);
            piece.style.setProperty('--piece-y1', `${dy + 130}px`); // gravity pulls it back down
            piece.style.setProperty('--piece-spin', `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360)}deg`);
            piece.style.setProperty('--piece-duration', `${duration}s`);
            piece.style.left = `${x}px`;
            piece.style.top = `${y}px`;
            document.body.appendChild(piece);
            piece.addEventListener('animationend', () => piece.remove());
            setTimeout(() => piece.remove(), duration * 1000 + 250);
        }
    }

    const colorSplashEl = document.getElementById('colorSplash');
    let colorSplashTimeout = null;

    // one-shot rainbow burst, centered on wherever the click happened —
    // used for the music-toggle line. Restartable: clicking again mid-burst
    // resets it instead of stacking / getting stuck.
    function triggerColorSplash(x, y) {
        if (!colorSplashEl) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const xPct = (x / window.innerWidth) * 100;
        const yPct = (y / window.innerHeight) * 100;
        colorSplashEl.style.setProperty('--splash-x', `${xPct}%`);
        colorSplashEl.style.setProperty('--splash-y', `${yPct}%`);

        colorSplashEl.classList.remove('is-active');
        void colorSplashEl.offsetWidth; // force reflow so the animation restarts cleanly
        colorSplashEl.classList.add('is-active');

        // hold off the page-wide rave rainbow until the splash's own
        // cream/brown fill has finished, so the two don't blend together
        document.body.classList.add('rave-hold');
        document.documentElement.classList.add('rave-hold');

        clearTimeout(colorSplashTimeout);
        colorSplashTimeout = setTimeout(() => {
            colorSplashEl.classList.remove('is-active');

            // snap the rave-mode reveal so it lands the instant the groove
            // animation ends, instead of visibly fading in over each
            // element's own transition duration
            document.documentElement.classList.add('rave-reveal-snap');
            document.body.classList.remove('rave-hold');
            document.documentElement.classList.remove('rave-hold');

            // let the snapped styles paint, then restore normal transitions
            // (hover states, the fade-out on pause) for everything after
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    document.documentElement.classList.remove('rave-reveal-snap');
                });
            });
        }, 2600);
    }

    if (musicToggleEl && bgMusicEl) {
        let grooveShownThisLoad = false;
        musicToggleEl.addEventListener('click', (e) => {
            if (!grooveShownThisLoad) {
                grooveShownThisLoad = true;
                triggerColorSplash(e.clientX, e.clientY);
            }
            if (bgMusicEl.paused) {
                bgMusicEl.play().catch(() => {
                    // e.g. missing/blocked audio file — fail quietly, no music, no crash
                });
            } else {
                bgMusicEl.pause();
            }
        });

        bgMusicEl.addEventListener('play', () => {
            document.body.classList.add('music-playing');
            document.documentElement.classList.add('music-playing');
            musicToggleEl.classList.add('is-playing');
            musicToggleEl.setAttribute('aria-pressed', 'true');
            if (musicToggleIconEl) musicToggleIconEl.innerHTML = PAUSE_ICON;
        });

        bgMusicEl.addEventListener('pause', () => {
            document.body.classList.remove('music-playing');
            document.documentElement.classList.remove('music-playing');
            musicToggleEl.classList.remove('is-playing');
            musicToggleEl.setAttribute('aria-pressed', 'false');
            if (musicToggleIconEl) musicToggleIconEl.innerHTML = PLAY_ICON;
        });
    }

    // Shared gold/wine/umber accent cycle — used to color-code both the
    // main collection cards and the two Logbook grids, so every card style
    // in the site draws from the same three-accent palette.
    const ACCENT_CYCLE = ['var(--color-accent-gold)', 'var(--color-accent-wine-bright)', 'var(--color-accent-umber)'];

    const PLACEHOLDER_ICON = `<img src="Assets/Resources/Default.png" alt="Default Card Image"/>`

    let gamesData = [];
    let devLogRows = [];
    let activeGameId = null;
    // Persists across game switches, so picking "Newest first" once keeps
    // applying as you browse other games too — reset only by picking a
    // different option.
    let sortMode = 'az';

    // Returns a *new* array — never mutates game.birds, since that array's
    // original (catalog) order is also what's carried through unrelated to
    // display, e.g. bird.id / catalogNumber() come from the CSV row, not
    // from wherever a bird ends up sitting in the sorted grid.
    function sortBirds(birds, mode) {
        const arr = birds.slice();
        switch (mode) {
            case 'az':
                arr.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }));
                break;
            case 'za':
                arr.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base', numeric: true }));
                break;
            case 'new':
                // Array.prototype.sort is stable, so same-date birds keep
                // their existing relative (catalog) order rather than
                // jumping around.
                arr.sort((a, b) => b.date.localeCompare(a.date));
                break;
            case 'old':
                arr.sort((a, b) => a.date.localeCompare(b.date));
                break;
            default:
                break; // fallback — leave in catalog (CSV/id) order
        }
        return arr;
    }

    // Tracks whatever bird list the lightbox is currently browsing, so
    // prev/next (and the arrow keys) can step through it.
    let lightboxBirds = [];
    let lightboxAccents = [];
    let lightboxIndex = -1;
    // Whatever card/button had focus right before the lightbox opened, so
    // closing it (Escape, the × button, or clicking the backdrop) returns
    // focus there instead of stranding keyboard/screen-reader users on a
    // now-hidden close button.
    let lightboxTriggerEl = null;

    // --- tiny CSV parser: handles quoted fields, commas & quotes inside quotes ---
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (inQuotes) {
                if (char === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else { inQuotes = false; }
                } else {
                    field += char;
                }
                continue;
            }

            if (char === '"') { inQuotes = true; }
            else if (char === ',') { row.push(field); field = ''; }
            else if (char === '\n' || char === '\r') {
                if (char === '\r' && text[i + 1] === '\n') i++;
                row.push(field); field = '';
                if (row.some(f => f.trim() !== '')) rows.push(row);
                row = [];
            } else {
                field += char;
            }
        }
        if (field !== '' || row.length) { row.push(field); rows.push(row); }

        if (!rows.length) return [];
        const headers = rows[0].map(h => h.trim().toLowerCase());
        return rows.slice(1).map(r => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
            return obj;
        });
    }

    function slugify(str) {
        return String(str)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'game';
    }

    // Encode each path segment separately (not the whole string) so slashes
    // stay as directory separators while everything else — spaces, #, &,
    // etc. — gets escaped. "#" is the important one: left raw, the browser
    // reads it as a URL fragment and silently drops everything after it,
    // which is why a file like "Gaster Follower #3.png" never loaded.
    function encodePathSegments(path) {
        return path.split('/').map(encodeURIComponent).join('/');
    }

    // Shared by resolveImagePath and resolveDevImagePath: if "image" already
    // looks like a path (has a slash), it's used as-is — this keeps old-style
    // full-path CSV rows working. Otherwise it's treated as a bare filename
    // living in defaultFolder, e.g. resolveAssetPath('Assets/Games/Alpaca Stacka',
    // 'Chase.png') -> 'Assets/Games/Alpaca Stacka/Chase.png'.
    function resolveAssetPath(defaultFolder, image) {
        const value = (image || '').trim();
        if (!value) return '';
        const rawPath = value.includes('/') ? value : `${defaultFolder}/${value}`;
        return encodePathSegments(rawPath);
    }

    // Build the web path to a bird image from its game + the CSV's "image"
    // value, e.g. "Chase.png" -> "Assets/Games/Alpaca Stacka/Chase.png".
    function resolveImagePath(gameName, image) {
        return resolveAssetPath(`Assets/Games/${gameName}`, image);
    }

    // group flat CSV rows (game, id, title, image) into the same
    // { id, name, birds: [{id, title, image}] } shape the renderer expects
    function rowsToGames(rows) {
        const order = [];
        const byName = new Map();
        const usedSlugs = new Set();

        // Two different game names can slugify to the same id (e.g. "Foo!"
        // and "Foo?" both become "foo") — since the id drives navigation
        // (the URL hash, sidebar selection, etc.), a silent collision would
        // make the second game unreachable. Suffix it instead: "foo-2",
        // "foo-3", and so on, assigned in first-seen (CSV) order so it's
        // deterministic across reruns.
        function uniqueSlug(name) {
            const base = slugify(name);
            let candidate = base;
            let suffix = 2;
            while (usedSlugs.has(candidate)) {
                candidate = `${base}-${suffix++}`;
            }
            usedSlugs.add(candidate);
            return candidate;
        }

        rows.forEach(r => {
            const gameName = r.game || 'Untitled Game';
            if (!byName.has(gameName)) {
                byName.set(gameName, {
                    id: uniqueSlug(gameName),
                    name: gameName,
                    birds: []
                });
                order.push(gameName);
            }
            byName.get(gameName).birds.push({
                id: r.id || String(byName.get(gameName).birds.length + 1),
                title: r.title || 'Untitled bird',
                image: resolveImagePath(gameName, r.image),
                credit: r.credit || '',
                date: (r.date || '').trim()
            });
        });

        return order.map(name => byName.get(name));
    }

    function catalogNumber(gameIndex, birdId) {
        const g = String(gameIndex + 1).padStart(2, '0');
        const b = String(birdId).padStart(3, '0');
        return `NO. ${g}.${b}`;
    }

    function renderSidebar() {
        const query = (gameSearchEl?.value || '').trim().toLowerCase();
        const visibleGames = query
            ? gamesData.filter(g => g.name.toLowerCase().includes(query))
            : gamesData;

        gameListEl.innerHTML = '';

        if (!visibleGames.length) {
            const empty = document.createElement('p');
            empty.className = 'game-list__empty';
            empty.textContent = `No games match “${gameSearchEl.value.trim()}”.`;
            gameListEl.appendChild(empty);
            return;
        }

        visibleGames.forEach(game => {
            // catalog index always reflects the full, unfiltered list order
            const i = gamesData.indexOf(game);
            const isActive = game.id === activeGameId;

            const li = document.createElement('li');
            li.className = 'game-item' + (isActive ? ' active' : '');

            const btn = document.createElement('button');
            btn.className = 'game-btn';
            btn.type = 'button';
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            if (isActive) btn.setAttribute('aria-current', 'true');
            btn.innerHTML = `
        <span class="game-btn__index">${String(i + 1).padStart(2, '0')}</span>
        <span class="game-btn__name">${escapeHTML(game.name)}</span>
        <span class="game-btn__count">${game.birds.length}</span>
      `;
            btn.addEventListener('click', (e) => {
                spawnConfetti(e.clientX, e.clientY);
                selectGame(game.id);
            });

            li.appendChild(btn);
            gameListEl.appendChild(li);

            if (isActive) {
                requestAnimationFrame(() => {
                    li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                });
            }
        });
    }

    function renderBoard() {
        const game = gamesData.find(g => g.id === activeGameId);
        if (!game) {
            boardTitleEl.textContent = 'Pick a game to start birdwatching';
            boardMetaEl.textContent = '';
            if (boardSortLabelEl) boardSortLabelEl.hidden = true;
            boardGridEl.innerHTML = `<div class="board__empty">Choose a game from the list on the left to see what I've spotted so far.</div>`;
            return;
        }

        const gameIndex = gamesData.indexOf(game);
        boardTitleEl.textContent = game.name;
        boardMetaEl.textContent = `${game.birds.length} bird${game.birds.length === 1 ? '' : 's'} logged`;
        if (boardSortLabelEl) boardSortLabelEl.hidden = false;

        // retrigger the header's entrance transition on every switch
        boardTitleEl.parentElement.classList.remove('board__header--enter');
        void boardTitleEl.parentElement.offsetWidth; // force reflow
        boardTitleEl.parentElement.classList.add('board__header--enter');

        if (!game.birds.length) {
            boardGridEl.innerHTML = `<div class="board__empty">No birbs logged for this game yet — check back soon!</div>`;
            return;
        }

        boardGridEl.innerHTML = '';
        // Sorted just for display — catalogNumber() below still uses each
        // bird's own stored id, so the "NO. 01.003" tag stays tied to the
        // bird itself rather than wherever it lands in the grid.
        const displayBirds = sortBirds(game.birds, sortMode);
        // one accent per bird, in displayed order — reused by the lightbox so
        // prev/next can recolor correctly without recomputing anything
        const gameAccents = displayBirds.map((_, i) => ACCENT_CYCLE[(i + gameIndex) % ACCENT_CYCLE.length]);

        displayBirds.forEach((bird, i) => {
            const card = document.createElement('article');
            card.className = 'specimen';
            const tilt = (i % 5 - 2) * 0.6; // subtle alternating tilt, -1.2deg..1.2deg
            card.style.setProperty('--tilt', `${tilt}deg`);
            card.style.setProperty('--delay', `${Math.min(i * 35, 400)}ms`);
            // cycle each card through the three named accents (gold / wine / umber)
            // rather than a full hue sweep, to keep the palette considered rather than carnival
            const accent = gameAccents[i];
            card.style.setProperty('--accent', accent);

            // keyboard-focusable and screen-reader-labelled, since this card
            // is the only way to open the full-size lightbox view
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `View ${bird.title} full size`);

            card.innerHTML = `
        <div class="specimen__frame">
          <img src="${escapeHTML(bird.image)}" alt="${escapeHTML(bird.title)}" loading="lazy" />
        </div>
        <p class="specimen__id">${catalogNumber(gameIndex, bird.id)}</p>
        <h3 class="specimen__title">${escapeHTML(bird.title)}</h3>
        ${bird.credit ? `<p class="specimen__credit">By: ${escapeHTML(bird.credit)}</p>` : ''}
      `;

            const img = card.querySelector('img');
            let imageFailed = false;
            img.addEventListener('error', () => {
                imageFailed = true;
                img.closest('.specimen__frame').innerHTML = PLACEHOLDER_ICON;
            }, { once: true });

            card.style.cursor = 'zoom-in';
            const open = (e) => {
                if (imageFailed) return;
                const rect = card.getBoundingClientRect();
                const x = (e && typeof e.clientX === 'number') ? e.clientX : rect.left + rect.width / 2;
                const y = (e && typeof e.clientY === 'number') ? e.clientY : rect.top + rect.height / 2;
                spawnConfetti(x, y);
                openLightboxAt(displayBirds, gameAccents, i);
            };
            card.addEventListener('click', open);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });

            boardGridEl.appendChild(card);
        });
    }

    // Opens the lightbox on birds[index], remembering the list + accents so
    // the prev/next controls (and arrow keys) can step through the same set.
    function openLightboxAt(birds, accents, index) {
        lightboxTriggerEl = document.activeElement;
        lightboxBirds = birds;
        lightboxAccents = accents;
        lightboxIndex = index;
        renderLightboxCurrent();
    }

    function renderLightboxCurrent() {
        if (!lightboxEl || lightboxIndex < 0 || !lightboxBirds[lightboxIndex]) return;
        const bird = lightboxBirds[lightboxIndex];
        const accent = lightboxAccents[lightboxIndex];
        openLightbox(bird, accent);
        const hasMultiple = lightboxBirds.length > 1;
        if (lightboxPrevEl) lightboxPrevEl.hidden = !hasMultiple;
        if (lightboxNextEl) lightboxNextEl.hidden = !hasMultiple;
    }

    function showLightboxOffset(offset) {
        if (!lightboxBirds.length) return;
        lightboxIndex = (lightboxIndex + offset + lightboxBirds.length) % lightboxBirds.length;
        renderLightboxCurrent();
    }

    // Caption is split into a title line and a smaller meta line (credit,
    // date, etc.) instead of one flat string, so the two can be styled
    // differently. Bird cards pass {title, credit} directly; dev-log
    // entries pass a pre-built {title, meta} pair (see renderDevLog).
    function openLightbox(item, accent) {
        if (!lightboxEl) return;
        lightboxImgEl.src = item.image;
        lightboxImgEl.alt = item.alt !== undefined ? item.alt : (item.title || '');

        const title = item.title || '';
        const meta = item.meta !== undefined
            ? item.meta
            : (item.credit ? `Photo by ${item.credit}` : '');

        lightboxCaptionTitleEl.textContent = title;
        lightboxCaptionMetaEl.textContent = meta;
        lightboxCaptionMetaEl.hidden = !meta;

        if (accent !== undefined && lightboxMatEl) {
            lightboxMatEl.style.setProperty('--accent', accent);
        }
        lightboxEl.hidden = false;
        document.body.style.overflow = 'hidden';
        lightboxCloseEl.focus();
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.hidden = true;
        lightboxImgEl.src = '';
        document.body.style.overflow = '';
        lightboxBirds = [];
        lightboxAccents = [];
        lightboxIndex = -1;
        if (lightboxTriggerEl && document.contains(lightboxTriggerEl)) {
            lightboxTriggerEl.focus();
        }
        lightboxTriggerEl = null;
    }

    if (lightboxEl) {
        lightboxCloseEl.addEventListener('click', closeLightbox);
        lightboxEl.addEventListener('click', (e) => {
            if (e.target === lightboxEl) closeLightbox();
        });
        if (lightboxPrevEl) lightboxPrevEl.addEventListener('click', () => showLightboxOffset(-1));
        if (lightboxNextEl) lightboxNextEl.addEventListener('click', () => showLightboxOffset(1));

        document.addEventListener('keydown', (e) => {
            if (lightboxEl.hidden) return;
            if (e.key === 'Escape') { closeLightbox(); return; }
            if (e.key === 'ArrowLeft') { showLightboxOffset(-1); return; }
            if (e.key === 'ArrowRight') { showLightboxOffset(1); return; }

            // simple focus trap: keep Tab cycling within the lightbox's
            // visible controls instead of escaping to the page behind it
            if (e.key === 'Tab') {
                const focusable = [lightboxCloseEl, lightboxPrevEl, lightboxNextEl]
                    .filter(el => el && !el.hidden);
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    function selectGame(gameId, options) {
        const opts = options || {};
        activeGameId = gameId;
        renderSidebar();
        renderBoard();

        if (opts.updateHash !== false) {
            const newHash = '#' + encodeURIComponent(gameId);
            if (location.hash !== newHash) {
                // replaceState (not location.hash=) so clicking through games
                // doesn't spam the browser history — the URL still updates,
                // so it's still bookmarkable/shareable
                history.replaceState(null, '', newHash);
            }
        }
    }

    // Let external links / manual URL edits (and the odd back/forward
    // navigation) jump straight to a game
    window.addEventListener('hashchange', () => {
        const targetId = decodeURIComponent(location.hash.slice(1));
        if (targetId && targetId !== activeGameId && gamesData.some(g => g.id === targetId)) {
            selectGame(targetId, { updateHash: false });
        }
    });

    function animateCount(el, target, duration = 900) {
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.textContent = target;
            return;
        }
        const startTime = performance.now();
        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    }

    function renderStats() {
        const totalBirds = gamesData.reduce((sum, g) => sum + g.birds.length, 0);
        animateCount(statBirdsEl, totalBirds);
        animateCount(statGamesEl, gamesData.length);

        if (statContributorsEl) {
            const uniqueContributors = new Set();
            gamesData.forEach(g => g.birds.forEach(bird => {
                const name = (bird.credit || '').trim();
                if (name) uniqueContributors.add(name);
            }));
            animateCount(statContributorsEl, uniqueContributors.size);
        }
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    }



    // "2026-09-25" -> "Sep 25, 2026". Parsed manually (rather than with
    // `new Date('2026-09-25')`) to sidestep that string being interpreted
    // as UTC midnight, which can quietly roll over to the previous day in
    // timezones west of UTC.
    const LOG_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function formatLogDate(isoDate) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((isoDate || '').trim());
        if (!match) return isoDate || '';
        const [, year, month, day] = match;
        const monthName = LOG_MONTHS[Number(month) - 1] || month;
        return `${monthName} ${Number(day)}, ${year}`;
    }

    // Same accent-cycling idea as the main collection cards, so the log
    // grids feel like the same family of card rather than a re-skin.
    const LOG_ACCENTS = ACCENT_CYCLE;

    // Flattens every bird with a date into one Birb Log card per bird —
    // newest date first, ties broken by game then title so the order stays
    // stable between renders.
    function buildBirbLogItems() {
        const items = [];
        gamesData.forEach(game => {
            game.birds.forEach(bird => {
                const date = (bird.date || '').trim();
                if (!date) return;
                items.push({ date, title: bird.title, image: bird.image, gameName: game.name });
            });
        });
        return items.sort((a, b) =>
            b.date.localeCompare(a.date) ||
            a.gameName.localeCompare(b.gameName) ||
            a.title.localeCompare(b.title)
        );
    }

    // Mirrors resolveImagePath for dev-log images: a bare filename in
    // dev.csv's "img" column is assumed to live in the "Assets/Dev/" folder.
    function resolveDevImagePath(image) {
        return resolveAssetPath('Assets/Dev', image);
    }

    // dev.csv has no automatic timestamp to key off (there's no per-row file
    // to read a date from, unlike bird images), so it's simply hand-edited —
    // one date,text,img row per update — and sorted newest first here.
    function buildDevLogItems() {
        return devLogRows
            .map(r => ({
                date: (r.date || '').trim(),
                text: (r.text || '').trim(),
                image: resolveDevImagePath(r.img)
            }))
            .filter(item => item.date || item.text)
            .sort((a, b) => b.date.localeCompare(a.date));
    }

    // Groups the flat, already-sorted (date desc, game asc, title asc) Birb
    // Log items into { date, games: [{ gameName, birds }] } — one heading
    // per date, one sub-heading per game underneath it, in first-seen order
    // (which, thanks to the incoming sort, is alphabetical within a date).
    function groupBirbLogItems(items) {
        const dateOrder = [];
        const dateGroups = new Map();

        items.forEach(item => {
            if (!dateGroups.has(item.date)) {
                dateGroups.set(item.date, { gameOrder: [], gameMap: new Map() });
                dateOrder.push(item.date);
            }
            const dateGroup = dateGroups.get(item.date);
            if (!dateGroup.gameMap.has(item.gameName)) {
                dateGroup.gameMap.set(item.gameName, []);
                dateGroup.gameOrder.push(item.gameName);
            }
            dateGroup.gameMap.get(item.gameName).push(item);
        });

        return dateOrder.map(date => {
            const g = dateGroups.get(date);
            return {
                date,
                games: g.gameOrder.map(gameName => ({ gameName, birds: g.gameMap.get(gameName) }))
            };
        });
    }

    // Birb Log: a heading per date, a sub-heading per game underneath it,
    // and a small grid of that game's bird cards (image + title only —
    // the date/game are already shown by the headings above them).
    function renderBirbLog(panelEl, items) {
        if (!panelEl) return;
        panelEl.innerHTML = '';

        if (!items.length) {
            panelEl.innerHTML = `<p class="logbook__empty">Nothing logged yet — check back soon!</p>`;
            return;
        }

        let cardIndex = 0;
        groupBirbLogItems(items).forEach(dateGroup => {
            const dateEl = document.createElement('div');
            dateEl.className = 'logbook__date-group';

            const dateHeading = document.createElement('h3');
            dateHeading.className = 'logbook__date-heading';
            dateHeading.textContent = formatLogDate(dateGroup.date);
            dateEl.appendChild(dateHeading);

            dateGroup.games.forEach(gameGroup => {
                const gameEl = document.createElement('div');
                gameEl.className = 'logbook__game-group';

                const gameHeading = document.createElement('h4');
                gameHeading.className = 'logbook__game-heading';
                gameHeading.textContent = gameGroup.gameName;
                gameEl.appendChild(gameHeading);

                const gridEl = document.createElement('div');
                gridEl.className = 'logbook__bird-grid';

                gameGroup.birds.forEach(bird => {
                    const card = document.createElement('article');
                    card.className = 'log-card';
                    const tilt = (cardIndex % 5 - 2) * 0.5; // subtle alternating tilt, matching .specimen
                    card.style.setProperty('--tilt', `${tilt}deg`);
                    card.style.setProperty('--delay', `${Math.min(cardIndex * 30, 300)}ms`);
                    card.style.setProperty('--accent', LOG_ACCENTS[cardIndex % LOG_ACCENTS.length]);
                    cardIndex++;

                    const imgTag = bird.image
                        ? `<img src="${escapeHTML(bird.image)}" alt="${escapeHTML(bird.title)}" loading="lazy" />`
                        : PLACEHOLDER_ICON;

                    card.innerHTML = `
            <div class="log-card__frame">${imgTag}</div>
            <h3 class="log-card__title">${escapeHTML(bird.title)}</h3>
          `;

                    const imgEl = card.querySelector('.log-card__frame img');
                    if (imgEl) {
                        imgEl.addEventListener('error', () => {
                            imgEl.closest('.log-card__frame').innerHTML = PLACEHOLDER_ICON;
                        }, { once: true });
                    }

                    gridEl.appendChild(card);
                });

                gameEl.appendChild(gridEl);
                dateEl.appendChild(gameEl);
            });

            panelEl.appendChild(dateEl);
        });
    }

    // Dev Log: a plain chronological list — date, then text, then an image
    // only when that row actually has one (no placeholder icon standing in
    // for a missing image, since most dev-log entries are text-only).
    function renderDevLog(panelEl, items) {
        if (!panelEl) return;
        panelEl.innerHTML = '';

        if (!items.length) {
            panelEl.innerHTML = `<p class="logbook__empty">Nothing logged yet — check back soon!</p>`;
            return;
        }

        // Pre-build the lightbox-ready list (image + title/meta) for every
        // dev entry that has an image, in the same order they're rendered,
        // so clicking one opens a lightbox that can prev/next through the
        // others — the same experience as the main collection's cards.
        // The entry's own text stands in for the "title" line, the date
        // for the smaller "meta" line underneath.
        const lightboxItems = items
            .filter(item => item.image)
            .map(item => ({
                image: item.image,
                alt: '',
                title: item.text,
                meta: item.date ? formatLogDate(item.date) : ''
            }));
        const lightboxAccentsForDev = lightboxItems.map((_, i) => LOG_ACCENTS[i % LOG_ACCENTS.length]);
        let imageCursor = -1;

        items.forEach((item, i) => {
            const entry = document.createElement('article');
            entry.className = 'dev-entry';
            entry.style.setProperty('--delay', `${Math.min(i * 30, 300)}ms`);

            entry.innerHTML = `
        <p class="dev-entry__date">${escapeHTML(formatLogDate(item.date))}</p>
        <p class="dev-entry__text">${escapeHTML(item.text)}</p>
        ${item.image ? `<div class="dev-entry__frame"><img src="${escapeHTML(item.image)}" alt="" loading="lazy" /></div>` : ''}
      `;

            const frameEl = entry.querySelector('.dev-entry__frame');
            const imgEl = entry.querySelector('.dev-entry__frame img');
            if (imgEl) {
                const thisImageIndex = ++imageCursor;
                let imageFailed = false;

                // A dev-log image is a nice-to-have, not a fallback-worthy
                // slot like a bird photo — if it 404s, just drop it rather
                // than showing a placeholder icon for a "just text" entry.
                imgEl.addEventListener('error', () => {
                    imageFailed = true;
                    frameEl.remove();
                }, { once: true });

                frameEl.style.cursor = 'zoom-in';
                frameEl.tabIndex = 0;
                frameEl.setAttribute('role', 'button');
                frameEl.setAttribute('aria-label', 'View image full size');

                const open = (e) => {
                    if (imageFailed) return;
                    const rect = frameEl.getBoundingClientRect();
                    const x = (e && typeof e.clientX === 'number') ? e.clientX : rect.left + rect.width / 2;
                    const y = (e && typeof e.clientY === 'number') ? e.clientY : rect.top + rect.height / 2;
                    spawnConfetti(x, y);
                    openLightboxAt(lightboxItems, lightboxAccentsForDev, thisImageIndex);
                };
                frameEl.addEventListener('click', open);
                frameEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        open();
                    }
                });
            }

            panelEl.appendChild(entry);
        });
    }

    function renderLogbook() {
        renderBirbLog(logPanelBirdsEl, buildBirbLogItems());
        renderDevLog(logPanelDevEl, buildDevLogItems());
    }

    // Simple two-tab switcher for the Logbook — plain show/hide, matching
    // how lightweight the rest of the secret About Me page is.
    function initLogbookTabs() {
        if (!logTabBirdsEl || !logTabDevEl || !logPanelBirdsEl || !logPanelDevEl) return;

        function showTab(tab) {
            const showBirds = tab === 'birds';
            logPanelBirdsEl.hidden = !showBirds;
            logPanelDevEl.hidden = showBirds;
            logTabBirdsEl.classList.toggle('is-active', showBirds);
            logTabDevEl.classList.toggle('is-active', !showBirds);
            logTabBirdsEl.setAttribute('aria-selected', String(showBirds));
            logTabDevEl.setAttribute('aria-selected', String(!showBirds));
        }

        logTabBirdsEl.addEventListener('click', () => showTab('birds'));
        logTabDevEl.addEventListener('click', () => showTab('dev'));
    }

    // Renders the "no birds spotted" list from NO_BIRDS_GAMES above, as a
    // compact wrapping row of chips rather than a tall one-per-row list —
    // keeps it from turning into a long scroll as the list grows.
    function initNoBirds() {
        const listEl = document.getElementById('noBirdsList');
        if (!listEl) return;
        if (!NO_BIRDS_GAMES.length) return;

        const sortedGames = [...NO_BIRDS_GAMES].sort((a, b) =>
            (a || '').trim().localeCompare((b || '').trim(), undefined, { sensitivity: 'base' })
        );

        listEl.innerHTML = '';
        sortedGames.forEach(name => {
            const trimmed = (name || '').trim();
            if (!trimmed) return;

            const li = document.createElement('li');
            li.className = 'no-birds__chip';
            li.textContent = trimmed;
            listEl.appendChild(li);
        });
    }

    // Shimmering placeholder cards shown in the board grid while Birds.csv
    // is still being fetched, so the first paint isn't just an empty box.
    function renderBoardSkeleton(count = 8) {
        boardTitleEl.textContent = 'Loading your collection\u2026';
        boardMetaEl.textContent = '';
        boardGridEl.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const card = document.createElement('div');
            card.className = 'specimen specimen--skeleton';
            card.setAttribute('aria-hidden', 'true');
            card.style.setProperty('--delay', `${i * 40}ms`);
            card.innerHTML = `
        <div class="specimen__frame"></div>
        <div class="skeleton-line skeleton-line--id"></div>
        <div class="skeleton-line skeleton-line--title"></div>
      `;
            boardGridEl.appendChild(card);
        }
    }

    // Loads dev.csv for the Dev Log side of the Logbook. Kept as its own
    // try/catch (rather than failing the whole init()) since it's an
    // optional, separately-maintained file — a missing or malformed
    // dev.csv shouldn't take the bird collection down with it.
    async function loadDevLog() {
        try {
            const res = await fetch('Data/dev.csv');
            if (!res.ok) throw new Error('Failed to load dev.csv');
            const text = await res.text();
            devLogRows = parseCSV(text);
        } catch (err) {
            console.error(err);
            devLogRows = [];
        }
    }

    async function loadBirds() {
        const res = await fetch('Data/birds.csv');
        if (!res.ok) throw new Error('Failed to load birds.csv');
        const text = await res.text();
        gamesData = rowsToGames(parseCSV(text));
    }

    async function init() {
        renderBoardSkeleton();
        // Birds.csv and Dev.csv are independent, so fetch them in parallel
        // rather than waiting on the dev log before starting the (more
        // important, above-the-fold) bird collection request.
        const [, birdsResult] = await Promise.allSettled([loadDevLog(), loadBirds()]);

        if (birdsResult.status === 'fulfilled') {
            renderStats();
            renderSidebar();
            if (gameSearchEl) {
                gameSearchEl.addEventListener('input', renderSidebar);
            }
            if (boardSortEl) {
                boardSortEl.value = sortMode;
                boardSortEl.addEventListener('change', () => {
                    sortMode = boardSortEl.value;
                    renderBoard();
                });
            }
            if (gamesData.length) {
                const hashId = decodeURIComponent(location.hash.slice(1));
                const startGame = gamesData.find(g => g.id === hashId) || gamesData[0];
                selectGame(startGame.id);
            }
        } else {
            console.error(birdsResult.reason);
            fileNoticeEl.hidden = false;
            boardTitleEl.textContent = 'Couldn\u2019t load your collection';
            boardMetaEl.textContent = '';
            boardGridEl.innerHTML = '';
        }
        renderLogbook();
    }

    // Sections marked .reveal-on-scroll fade/rise in the first time they
    // scroll into view, then stop being observed (one-shot reveal, not a
    // repeating scroll-jank effect).
    function initScrollReveal() {
        const targets = document.querySelectorAll('.reveal-on-scroll');
        if (!targets.length) return;
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            targets.forEach(el => el.classList.add('is-visible'));
            return;
        }
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        targets.forEach(el => observer.observe(el));
    }

    // Opens/closes the About Me section from the footer credit. The
    // fade+rise animation itself is handled purely by CSS (see
    // .about-me / @starting-style in styles.css) reacting to the
    // `hidden` attribute — no JS-timed classes or setTimeout duration-
    // guessing involved, so there's nothing here to fall out of sync
    // with the CSS and cause a stutter.
    function initAboutMe() {
        const toggleEl = document.getElementById('aboutMeToggle');
        const sectionEl = document.getElementById('aboutMe');
        // The Logbook lives in its own section right after About Me, but
        // opens/closes in lockstep with it rather than having its own
        // separate reveal trigger.
        const logbookSectionEl = document.getElementById('logbook');
        if (!toggleEl || !sectionEl) return;

        // Always start closed — covers the normal case (the "hidden"
        // attribute already does this) and the bfcache case, where
        // some browsers restore the exact DOM state (including an
        // open section) on back/forward navigation instead of
        // re-running the page fresh.
        const forceClosed = () => {
            sectionEl.hidden = true;
            if (logbookSectionEl) logbookSectionEl.hidden = true;
            toggleEl.setAttribute('aria-expanded', 'false');
        };
        forceClosed();
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) forceClosed();
        });

        toggleEl.addEventListener('click', (e) => {
            const opening = sectionEl.hidden;
            sectionEl.hidden = !opening;
            if (logbookSectionEl) logbookSectionEl.hidden = !opening;
            toggleEl.setAttribute('aria-expanded', String(opening));

            if (opening) {
                // jump to it instantly *while it's still invisible* —
                // scrolling and fading in at the same time is what
                // made this feel janky before
                sectionEl.scrollIntoView({ behavior: 'auto', block: 'start' });
                spawnConfetti(e.clientX, e.clientY);
            }
        });
    }

    initScrollReveal();
    init();
    initNoBirds();
    initAboutMe();
    initLogbookTabs();
})();