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

    if (heroEl && heroImgEl
        && window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let parallaxRAF = null;
        heroEl.addEventListener('mousemove', (e) => {
            if (parallaxRAF) return;
            parallaxRAF = requestAnimationFrame(() => {
                parallaxRAF = null;
                const rect = heroEl.getBoundingClientRect();
                const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1..1
                const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;  // -1..1
                heroImgEl.style.setProperty('--parallax-x', (px * -10).toFixed(2));
                heroImgEl.style.setProperty('--parallax-y', (py * -6).toFixed(2));
            });
        });
        heroEl.addEventListener('mouseleave', () => {
            heroImgEl.style.setProperty('--parallax-x', 0);
            heroImgEl.style.setProperty('--parallax-y', 0);
        });
    }

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
            piece.style.setProperty('--piece-y1', `${dy + 130}px`);
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

    function triggerColorSplash(x, y) {
        if (!colorSplashEl) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const xPct = (x / window.innerWidth) * 100;
        const yPct = (y / window.innerHeight) * 100;
        colorSplashEl.style.setProperty('--splash-x', `${xPct}%`);
        colorSplashEl.style.setProperty('--splash-y', `${yPct}%`);

        colorSplashEl.classList.remove('is-active');
        void colorSplashEl.offsetWidth;
        colorSplashEl.classList.add('is-active');

        document.body.classList.add('rave-hold');
        document.documentElement.classList.add('rave-hold');

        clearTimeout(colorSplashTimeout);
        colorSplashTimeout = setTimeout(() => {
            colorSplashEl.classList.remove('is-active');

            document.documentElement.classList.add('rave-reveal-snap');
            document.body.classList.remove('rave-hold');
            document.documentElement.classList.remove('rave-hold');
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

    const ACCENT_CYCLE = ['var(--color-accent-gold)', 'var(--color-accent-wine-bright)', 'var(--color-accent-umber)'];

    const PLACEHOLDER_ICON = `<img src="Assets/Resources/Default.png" alt="Default Card Image"/>`

    let gamesData = [];
    let devLogRows = [];
    let activeGameId = null;
    let sortMode = 'az';

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
                arr.sort((a, b) => b.date.localeCompare(a.date));
                break;
            case 'old':
                arr.sort((a, b) => a.date.localeCompare(b.date));
                break;
            default:
                break;
        }
        return arr;
    }

    let lightboxBirds = [];
    let lightboxAccents = [];
    let lightboxIndex = -1;
    let lightboxTriggerEl = null;

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

    function encodePathSegments(path) {
        return path.split('/').map(encodeURIComponent).join('/');
    }

    function resolveAssetPath(defaultFolder, image) {
        const value = (image || '').trim();
        if (!value) return '';
        const rawPath = value.includes('/') ? value : `${defaultFolder}/${value}`;
        return encodePathSegments(rawPath);
    }

    function resolveImagePath(gameName, image) {
        return resolveAssetPath(`Assets/Games/${gameName}`, image);
    }

    function rowsToGames(rows) {
        const order = [];
        const byName = new Map();
        const usedSlugs = new Set();

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

        boardTitleEl.parentElement.classList.remove('board__header--enter');
        void boardTitleEl.parentElement.offsetWidth;
        boardTitleEl.parentElement.classList.add('board__header--enter');

        if (!game.birds.length) {
            boardGridEl.innerHTML = `<div class="board__empty">No birbs logged for this game yet — check back soon!</div>`;
            return;
        }

        boardGridEl.innerHTML = '';
        const displayBirds = sortBirds(game.birds, sortMode);
        const gameAccents = displayBirds.map((_, i) => ACCENT_CYCLE[(i + gameIndex) % ACCENT_CYCLE.length]);

        displayBirds.forEach((bird, i) => {
            const card = document.createElement('article');
            card.className = 'specimen';
            const tilt = (i % 5 - 2) * 0.6;
            card.style.setProperty('--tilt', `${tilt}deg`);
            card.style.setProperty('--delay', `${Math.min(i * 35, 400)}ms`);
            const accent = gameAccents[i];
            card.style.setProperty('--accent', accent);
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
                history.replaceState(null, '', newHash);
            }
        }
    }

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
            const eased = 1 - Math.pow(1 - progress, 3);
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

    const LOG_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function formatLogDate(isoDate) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((isoDate || '').trim());
        if (!match) return isoDate || '';
        const [, year, month, day] = match;
        const monthName = LOG_MONTHS[Number(month) - 1] || month;
        return `${monthName} ${Number(day)}, ${year}`;
    }

    const LOG_ACCENTS = ACCENT_CYCLE;

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

    function resolveDevImagePath(image) {
        return resolveAssetPath('Assets/Dev', image);
    }

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

    function renderBirbLog(panelEl, items) {
        if (!panelEl) return;
        panelEl.innerHTML = '';

        if (!items.length) {
            panelEl.innerHTML = `<p class="logbook__empty">Nothing logged yet, check back soon!</p>`;
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
                    const tilt = (cardIndex % 5 - 2) * 0.5;
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

    function renderDevLog(panelEl, items) {
        if (!panelEl) return;
        panelEl.innerHTML = '';

        if (!items.length) {
            panelEl.innerHTML = `<p class="logbook__empty">Nothing logged yet, check back soon!</p>`;
            return;
        }

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

    function initAboutMe() {
        const toggleEl = document.getElementById('aboutMeToggle');
        const sectionEl = document.getElementById('aboutMe');
        const logbookSectionEl = document.getElementById('logbook');
        if (!toggleEl || !sectionEl) return;

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