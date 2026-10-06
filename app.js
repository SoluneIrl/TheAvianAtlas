(function () {

    const gameListEl   = document.getElementById('gameList');
    const gameSearchEl = document.getElementById('gameSearch');
    const boardTitleEl = document.getElementById('boardTitle');
    const boardMetaEl  = document.getElementById('boardMeta');
    const boardGridEl  = document.getElementById('boardGrid');
    const boardSortEl      = document.getElementById('boardSort');
    const boardSortLabelEl = boardSortEl ? boardSortEl.closest('.board__sort-label') : null;
    const boardSortMenuEl  = document.getElementById('boardSortMenu');
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
    const lightboxFigureEl  = document.querySelector('.lightbox__figure');
    const lightboxCounterEl = document.getElementById('lightboxCounter');
    const boardStickyEl      = document.getElementById('boardSticky');
    const boardStickyTitleEl = document.getElementById('boardStickyTitle');
    const boardStickyMetaEl  = document.getElementById('boardStickyMeta');
    const boardStickyTopEl   = document.getElementById('boardStickyTop');
    const sidebarEl       = document.getElementById('gameSidebar');
    const pickerEl        = document.getElementById('gamePicker');
    const pickerBtnEl     = document.getElementById('gamePickerBtn');
    const pickerNameEl    = document.getElementById('gamePickerName');
    const pickerCountEl   = document.getElementById('gamePickerCount');
    const sheetBackdropEl = document.getElementById('sheetBackdrop');
    const sheetCloseEl    = document.getElementById('sheetClose');
    const sheetTopEl      = document.getElementById('sheetTop');
    const mobileMQ        = window.matchMedia('(max-width: 780px)');
    let sheetOpen = false;
    const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = () => reducedMotionMQ.matches;
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    const plainCollator = new Intl.Collator();
    const compareStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const PLAY_ICON  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"/></svg>';
    const PAUSE_ICON = '<svg viewBox="-1 0 8 8" fill="currentColor"><path d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606" transform="translate(-171,-3605)"/></svg>';

    if (heroEl && heroImgEl
        && window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !prefersReducedMotion()) {
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

    function safeDecode(str) {
        try { return decodeURIComponent(str); } catch (_) { return str; }
    }

    function clickPoint(e, targetEl) {
        if (e.detail === 0 && e.clientX === 0 && e.clientY === 0) {
            const el = targetEl || e.currentTarget || e.target;
            if (el && el.getBoundingClientRect) {
                const r = el.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            }
        }
        return { x: e.clientX, y: e.clientY };
    }

    function spawnConfetti(x, y, count) {
        if (prefersReducedMotion()) return;
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
        if (prefersReducedMotion()) return;

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
                const pt = clickPoint(e);
                triggerColorSplash(pt.x, pt.y);
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
    const PLACEHOLDER_ICON = `<img src="Assets/Resources/Default.png" alt=""/>`
    const USE_THUMBS = true;
    const GAMES_ROOT = 'Assets/Games';
    const THUMBS_ROOT = 'Assets/Thumbs';

    function thumbPathFor(fullPath) {
        if (!USE_THUMBS || !fullPath || !fullPath.startsWith(GAMES_ROOT + '/')) return '';
        return THUMBS_ROOT + fullPath.slice(GAMES_ROOT.length) + '.webp';
    }

    function withFullFallback(img, bird, onFail) {
        const onError = () => {
            if (bird.thumb && bird.image && img.getAttribute('src') === bird.thumb) {
                img.src = bird.image;
                return;
            }
            img.removeEventListener('error', onError);
            onFail();
        };
        img.addEventListener('error', onError);
    }

    let gamesData = [];
    let devLogRows = [];
    let smileRows = [];
    let activeGameId = null;
    let sortMode = 'az';

    function sortBirds(birds, mode) {
        const arr = birds.slice();
        switch (mode) {
            case 'az':
                arr.sort((a, b) => collator.compare(a.title, b.title));
                break;
            case 'za':
                arr.sort((a, b) => collator.compare(b.title, a.title));
                break;
            case 'new':
                arr.sort((a, b) => (!a.date - !b.date) || compareStr(b.date, a.date));
                break;
            case 'old':
                arr.sort((a, b) => (!a.date - !b.date) || compareStr(a.date, b.date));
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
        if (field !== '' || row.length) {
            row.push(field);
            if (row.some(f => f.trim() !== '')) rows.push(row);
        }

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

    const RESERVED_SLUGS = new Set(['top', 'collection', 'no-birds', 'logbook', 'smile', 'aboutme', 'about-me', 'lightbox']);

    function rowsToGames(rows) {
        const order = [];
        const byName = new Map();
        const usedSlugs = new Set();

        function uniqueSlug(name) {
            const base = slugify(name);
            let candidate = base;
            let suffix = 2;
            while (usedSlugs.has(candidate) || RESERVED_SLUGS.has(candidate)) {
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
                    index: order.length,
                    name: gameName,
                    birds: []
                });
                order.push(gameName);
            }
            const entry = byName.get(gameName);
            const image = resolveImagePath(gameName, r.image);
            entry.birds.push({
                key: entry.birds.length,
                id: r.id || String(entry.birds.length + 1),
                title: r.title || 'Untitled bird',
                image,
                thumb: thumbPathFor(image),
                credit: r.credit || '',
                date: (r.date || '').trim()
            });
        });

        return order.map(name => byName.get(name));
    }

    const NEW_BIRD_DAYS = 7;
    function isNewBird(bird) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((bird && bird.date) || '');
        if (!m) return false;
        const spotted = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const days = Math.round((today - spotted) / 86400000);
        return days >= -1 && days < NEW_BIRD_DAYS;
    }

    function catalogNumber(gameIndex, birdId) {
        const g = String(gameIndex + 1).padStart(2, '0');
        const b = String(birdId).padStart(3, '0');
        return `NO. ${g}.${b}`;
    }

    function scrollItemIntoListView(item) {
        let container = item.parentElement;
        while (container && container !== document.body) {
            const style = getComputedStyle(container);
            const scrollable = /(auto|scroll)/.test(style.overflowY) &&
                container.scrollHeight > container.clientHeight;
            if (scrollable) break;
            container = container.parentElement;
        }
        if (!container || container === document.body) return;

        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const stickyEl = gameSearchEl && gameSearchEl.closest('.sidebar__search-wrap');
        const stickyH = stickyEl && container.contains(stickyEl) && getComputedStyle(stickyEl).position === 'sticky'
            ? stickyEl.offsetHeight : 0;
        const topEdge = cRect.top + stickyH;
        let delta = 0;
        if (iRect.top < topEdge) delta = iRect.top - topEdge;
        else if (iRect.bottom > cRect.bottom) delta = iRect.bottom - cRect.bottom;
        if (delta) container.scrollBy({ top: delta, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
    }

    let indicatorPlaced = false;

    function positionSidebarIndicator(snap) {
        const li = gameListEl.querySelector('.game-item.active');
        if (!li) {
            gameListEl.style.setProperty('--ind-o', '0');
            indicatorPlaced = false;
            return;
        }
        const instant = snap || !indicatorPlaced;
        if (instant) gameListEl.classList.add('is-indicator-snap');
        gameListEl.style.setProperty('--ind-y', li.offsetTop + 'px');
        gameListEl.style.setProperty('--ind-h', li.offsetHeight + 'px');
        gameListEl.style.setProperty('--ind-o', '1');
        if (instant) {
            void gameListEl.offsetWidth;
            gameListEl.classList.remove('is-indicator-snap');
        }
        indicatorPlaced = true;
    }

    function updateListFades() {
        const el = gameListEl;
        const overflowing = el.scrollHeight > el.clientHeight + 1;
        el.classList.toggle('has-fade-top', overflowing && el.scrollTop > 1);
        el.classList.toggle('has-fade-bottom', overflowing && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }
    gameListEl.addEventListener('scroll', updateListFades, { passive: true });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { positionSidebarIndicator(true); updateListFades(); });
    }

    const COMBINING_MARKS = /[\u0300-\u036f]/;
    function foldWithMap(str) {
        let folded = '';
        const map = [];
        for (let i = 0; i < str.length; i++) {
            const piece = str[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            for (let k = 0; k < piece.length; k++) map.push(i);
            folded += piece;
        }
        return { folded, map };
    }
    const foldText = str => foldWithMap(str).folded;

    function highlightMatch(name, query) {
        if (!query) return escapeHTML(name);
        const { folded, map } = foldWithMap(name);
        let out = '';
        let pos = 0;
        let from = 0;
        let idx;
        while ((idx = folded.indexOf(query, from)) !== -1) {
            from = idx + query.length;
            const start = map[idx];
            let end = map[idx + query.length - 1] + 1;
            while (end < name.length && COMBINING_MARKS.test(name[end])) end++;
            if (start < pos) continue;
            out += escapeHTML(name.slice(pos, start))
                + '<mark class="game-btn__match">' + escapeHTML(name.slice(start, end)) + '</mark>';
            pos = end;
        }
        return out + escapeHTML(name.slice(pos));
    }

    const sidebarItems = new Map();

    function renderSidebar(opts) {
        const fromSearch = !!(opts && opts.fromSearch);
        const hadSearchFocus = document.activeElement === gameSearchEl;
        const rawQuery = (gameSearchEl?.value || '').trim();
        const query = foldText(rawQuery);
        const visibleGames = query
            ? gamesData.filter(g => foldText(g.name).includes(query))
            : gamesData;

        gameListEl.innerHTML = '';
        sidebarItems.clear();

        if (!visibleGames.length) {
            const empty = document.createElement('li');
            empty.className = 'game-list__empty';
            empty.textContent = rawQuery ? `No games match \u201c${rawQuery}\u201d.` : 'No games logged yet.';
            gameListEl.appendChild(empty);
            gameListEl.style.setProperty('--ind-o', '0');
            indicatorPlaced = false;
            updateListFades();
            if (hadSearchFocus && document.activeElement !== gameSearchEl) gameSearchEl.focus({ preventScroll: true });
            return;
        }

        const fragment = document.createDocumentFragment();
        let activeLi = null;

        visibleGames.forEach(game => {
            const isActive = game.id === activeGameId;

            const li = document.createElement('li');
            li.className = 'game-item' + (isActive ? ' active' : '');
            li.dataset.gameId = game.id;

            const btn = document.createElement('button');
            btn.className = 'game-btn';
            btn.type = 'button';
            if (isActive) btn.setAttribute('aria-current', 'true');
            btn.innerHTML = `
        <span class="game-btn__index">${String(game.index + 1).padStart(2, '0')}</span>
        <span class="game-btn__name">${highlightMatch(game.name, query)}</span>
        <span class="game-btn__count">${game.birds.length}</span>
      `;

            li.appendChild(btn);
            fragment.appendChild(li);
            sidebarItems.set(game.id, li);
            if (isActive) activeLi = li;
        });

        gameListEl.appendChild(fragment);
        if (fromSearch) {
            const scroller = gameListEl.closest('.sidebar__sticky');
            if (scroller) scroller.scrollTop = 0;
            gameListEl.scrollTop = 0;
        } else if (activeLi) {
            requestAnimationFrame(() => scrollItemIntoListView(activeLi));
        }
        positionSidebarIndicator(fromSearch);
        updateListFades();
        if (hadSearchFocus && document.activeElement !== gameSearchEl) gameSearchEl.focus({ preventScroll: true });
    }

    function updateSidebarActive() {
        let activeLi = null;
        sidebarItems.forEach((li, id) => {
            const isActive = id === activeGameId;
            if (isActive) activeLi = li;
            if (li.classList.contains('active') === isActive) return;
            li.classList.toggle('active', isActive);
            const btn = li.firstElementChild;
            if (isActive) btn.setAttribute('aria-current', 'true');
            else btn.removeAttribute('aria-current');
        });
        if (activeLi) requestAnimationFrame(() => scrollItemIntoListView(activeLi));
        positionSidebarIndicator(false);

        const activeGame = gamesData.find(g => g.id === activeGameId);
        if (activeGame && pickerNameEl) {
            pickerNameEl.textContent = activeGame.name;
            if (pickerCountEl) pickerCountEl.textContent = activeGame.birds.length;
        }
    }

    gameListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.game-btn');
        const li = btn && btn.closest('.game-item');
        if (!li || !gameListEl.contains(li)) return;
        const pt = clickPoint(e, btn);
        spawnConfetti(pt.x, pt.y);
        selectGame(li.dataset.gameId, { scrollToBoard: true });
    });

    function setStickyBarText(title, meta) {
        if (boardStickyTitleEl) boardStickyTitleEl.textContent = title;
        if (boardStickyMetaEl) boardStickyMetaEl.textContent = meta;
    }

    const boardSectionEl = document.querySelector('.board');
    const boardHeaderEl  = boardTitleEl.parentElement;
    let stickyVisible = null;

    function updateStickyBar() {
        if (!boardStickyEl) return;
        let show = false;
        if (boardSectionEl && boardHeaderEl && activeGameId) {
            const headerRect = boardHeaderEl.getBoundingClientRect();
            const boardRect = boardSectionEl.getBoundingClientRect();
            show = headerRect.bottom < 0 && boardRect.bottom > 160;
        }
        if (show === stickyVisible) return;
        stickyVisible = show;
        boardStickyEl.classList.toggle('is-visible', show);
        if (show) {
            boardStickyEl.removeAttribute('inert');
            boardStickyEl.removeAttribute('aria-hidden');
        } else {
            boardStickyEl.setAttribute('inert', '');
            boardStickyEl.setAttribute('aria-hidden', 'true');
        }
    }

    let stickyRAF = 0;
    function scheduleStickyUpdate() {
        if (stickyRAF) return;
        stickyRAF = requestAnimationFrame(() => { stickyRAF = 0; updateStickyBar(); });
    }
    window.addEventListener('scroll', scheduleStickyUpdate, { passive: true });

    let resizeRAF = 0;
    window.addEventListener('resize', () => {
        if (resizeRAF) return;
        resizeRAF = requestAnimationFrame(() => {
            resizeRAF = 0;
            positionSidebarIndicator(true);
            updateListFades();
            updateStickyBar();
        });
    });

    if (boardStickyTopEl) {
        boardStickyTopEl.addEventListener('click', () => {
            if (!boardSectionEl) return;
            window.scrollTo({ top: boardSectionEl.getBoundingClientRect().top + window.scrollY });
        });
    }

    let boardDisplayBirds = [];
    let boardDisplayAccents = [];

    function openCard(card, e) {
        if (!card || card.dataset.failed) return;
        const i = Number(card.dataset.i);
        if (!boardDisplayBirds[i]) return;
        const rect = card.getBoundingClientRect();
        const x = (e && typeof e.clientX === 'number') ? e.clientX : rect.left + rect.width / 2;
        const y = (e && typeof e.clientY === 'number') ? e.clientY : rect.top + rect.height / 2;
        spawnConfetti(x, y);
        const birds = [], accents = [];
        let startAt = 0;
        Array.from(boardGridEl.children).forEach(c => {
            const ci = Number(c.dataset.i);
            if (c.dataset.failed || !boardDisplayBirds[ci]) return;
            if (ci === i) startAt = birds.length;
            birds.push(boardDisplayBirds[ci]);
            accents.push(boardDisplayAccents[ci]);
        });
        openLightboxAt(birds, accents, startAt);
    }

    boardGridEl.addEventListener('click', (e) => {
        const card = e.target.closest('.specimen');
        if (card && boardGridEl.contains(card)) openCard(card, e);
    });
    boardGridEl.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.specimen');
        if (!card || !boardGridEl.contains(card)) return;
        e.preventDefault();
        openCard(card);
    });

    function trackImageLoad(frameEl, img) {
        if (!frameEl || !img) return;
        if (img.complete && img.naturalWidth) {
            frameEl.classList.remove('is-loading');
        } else {
            img.addEventListener('load', () => frameEl.classList.remove('is-loading'), { once: true });
        }
    }

    function renderBoard(opts) {
        const wantFlip = !!(opts && opts.flip) && !prefersReducedMotion();
        const game = gamesData.find(g => g.id === activeGameId);
        if (!game) {
            boardTitleEl.textContent = 'Pick a game to start birdwatching';
            boardMetaEl.textContent = '';
            setStickyBarText('', '');
            if (boardSortLabelEl) boardSortLabelEl.hidden = true;
            boardGridEl.innerHTML = `<div class="board__empty">Choose a game from the list to see what I've spotted so far.</div>`;
            updateStickyBar();
            return;
        }

        const gameIndex = gamesData.indexOf(game);
        boardTitleEl.textContent = game.name;
        boardMetaEl.textContent = `${game.birds.length} bird${game.birds.length === 1 ? '' : 's'} logged`;
        setStickyBarText(game.name, boardMetaEl.textContent);
        if (boardSortLabelEl) boardSortLabelEl.hidden = false;

        if (!wantFlip) {
            boardTitleEl.parentElement.classList.remove('board__header--enter');
            void boardTitleEl.parentElement.offsetWidth;
            boardTitleEl.parentElement.classList.add('board__header--enter');
        }

        if (!game.birds.length) {
            boardGridEl.innerHTML = `<div class="board__empty">No birbs logged for this game yet — check back soon!</div>`;
            updateStickyBar();
            return;
        }

        const prevCards = new Map();
        if (wantFlip) {
            Array.from(boardGridEl.children).forEach(c => {
                if (c.dataset && c.dataset.key !== undefined) {
                    prevCards.set(c.dataset.key, {
                        left: c.offsetLeft,
                        top: c.offsetTop,
                        img: c.querySelector('.specimen__frame img')
                    });
                }
            });
        }
        const doFlip = wantFlip && prevCards.size > 0;

        boardGridEl.innerHTML = '';
        const displayBirds = sortBirds(game.birds, sortMode);
        const gameAccents = displayBirds.map((_, i) => ACCENT_CYCLE[(i + gameIndex) % ACCENT_CYCLE.length]);
        boardDisplayBirds = displayBirds;
        boardDisplayAccents = gameAccents;

        const fragment = document.createDocumentFragment();
        displayBirds.forEach((bird, i) => {
            const birdKey = String(bird.key);
            const card = document.createElement('article');
            card.className = 'specimen';
            card.dataset.key = birdKey;
            card.dataset.i = String(i);
            const tilt = (i % 5 - 2) * 0.6;
            card.style.setProperty('--tilt', `${tilt}deg`);
            card.style.setProperty('--delay', `${Math.min(i * 35, 400)}ms`);
            card.style.setProperty('--accent', gameAccents[i]);
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `View ${bird.title} full size`);

            card.innerHTML = `
        ${isNewBird(bird) ? '<span class="specimen__new"><span class="specimen__new-band">NEW</span></span>' : ''}
        <div class="specimen__frame is-loading">
          <img src="${escapeHTML(bird.thumb || bird.image)}" alt="${escapeHTML(bird.title)}" loading="lazy" decoding="async" />
        </div>
        <p class="specimen__id">${catalogNumber(gameIndex, bird.id)}</p>
        <h3 class="specimen__title">${escapeHTML(bird.title)}</h3>
        ${bird.credit ? `<p class="specimen__credit"><span class="specimen__credit-name">${escapeHTML(bird.credit)}</span></p>` : ''}
      `;

            const frameEl = card.querySelector('.specimen__frame');
            let img = card.querySelector('img');

            const prev = prevCards.get(birdKey);
            const prevSrc = prev && prev.img ? prev.img.getAttribute('src') : null;
            if (doFlip && prev && prev.img && prev.img.complete && prev.img.naturalWidth
                && (prevSrc === bird.thumb || prevSrc === bird.image)) {
                img.replaceWith(prev.img);
                img = prev.img;
            }
            trackImageLoad(frameEl, img);

            withFullFallback(img, bird, () => {
                card.dataset.failed = '1';
                frameEl.classList.remove('is-loading');
                frameEl.innerHTML = PLACEHOLDER_ICON;
            });

            card.style.cursor = 'zoom-in';
            fragment.appendChild(card);
        });
        boardGridEl.appendChild(fragment);

        if (doFlip) {
            const cards = Array.from(boardGridEl.children);
            const deltas = cards.map(card => {
                const prev = prevCards.get(card.dataset.key);
                return prev ? { dx: prev.left - card.offsetLeft, dy: prev.top - card.offsetTop } : null;
            });
            cards.forEach((card, i) => {
                card.style.animationDuration = '0.001s, 3.5s, 1.8s';
                card.style.animationDelay = '0s';

                const d = deltas[i];
                if (!d || (!d.dx && !d.dy)) return;
                const { dx, dy } = d;
                const tilt = (i % 5 - 2) * 0.6;
                card.animate([
                    { transform: `translate(${dx}px, ${dy}px) rotate(${tilt}deg)` },
                    { transform: `translate(0px, 0px) rotate(${tilt}deg)` }
                ], {
                    duration: 520,
                    delay: Math.min(i * 6, 140),
                    easing: 'cubic-bezier(0.22, 0.85, 0.28, 1)',
                    fill: 'backwards'
                });
            });
        }

        updateStickyBar();
    }

    const LIGHTBOX_SWITCH_MS = 130;
    const LIGHTBOX_CLOSE_MS = 170;
    let lightboxTargetIndex = -1;
    let lightboxSwitchToken = 0;
    let lightboxClosing = false;

    function openLightboxAt(birds, accents, index) {
        lightboxSwitchToken++;
        lightboxClosing = false;
        if (lightboxEl) lightboxEl.classList.remove('is-closing');
        if (lightboxFigureEl) lightboxFigureEl.classList.remove('is-switching');
        lightboxTriggerEl = document.activeElement;
        lightboxBirds = birds;
        lightboxAccents = accents;
        lightboxIndex = index;
        lightboxTargetIndex = index;
        renderLightboxCurrent();
    }

    function preloadLightboxNeighbours() {
        const n = lightboxBirds.length;
        if (n < 2) return;
        [1, -1].forEach(offset => {
            const b = lightboxBirds[(lightboxIndex + offset + n) % n];
            if (b && b.image) { const im = new Image(); im.src = b.image; }
        });
    }

    function renderLightboxCurrent() {
        if (!lightboxEl || lightboxIndex < 0 || !lightboxBirds[lightboxIndex]) return;
        const bird = lightboxBirds[lightboxIndex];
        const accent = lightboxAccents[lightboxIndex];
        openLightbox(bird, accent);
        const n = lightboxBirds.length;
        const hasMultiple = n > 1;
        if (lightboxPrevEl) lightboxPrevEl.hidden = !hasMultiple;
        if (lightboxNextEl) lightboxNextEl.hidden = !hasMultiple;
        if (lightboxCounterEl) {
            lightboxCounterEl.hidden = !hasMultiple;
            lightboxCounterEl.textContent = hasMultiple ? `${lightboxIndex + 1} / ${n}` : '';
        }
        preloadLightboxNeighbours();
    }

    function showLightboxOffset(offset) {
        const n = lightboxBirds.length;
        if (!n || lightboxClosing) return;

        const base = lightboxTargetIndex >= 0 ? lightboxTargetIndex : lightboxIndex;
        lightboxTargetIndex = (base + offset + n) % n;

        if (prefersReducedMotion() || !lightboxFigureEl) {
            lightboxIndex = lightboxTargetIndex;
            renderLightboxCurrent();
            return;
        }

        const token = ++lightboxSwitchToken;
        lightboxFigureEl.style.setProperty('--shift', `${offset > 0 ? -14 : 14}px`);
        lightboxFigureEl.classList.add('is-switching');

        setTimeout(() => {
            if (token !== lightboxSwitchToken || lightboxEl.hidden || lightboxClosing) return;
            lightboxIndex = lightboxTargetIndex;
            renderLightboxCurrent();

            const reveal = () => {
                if (token === lightboxSwitchToken) lightboxFigureEl.classList.remove('is-switching');
            };
            if (lightboxImgEl.complete && lightboxImgEl.naturalWidth) {
                requestAnimationFrame(reveal);
            } else {
                lightboxImgEl.addEventListener('load', reveal, { once: true });
                lightboxImgEl.addEventListener('error', reveal, { once: true });
                setTimeout(reveal, 700);
            }
        }, LIGHTBOX_SWITCH_MS);
    }

    function openLightbox(item, accent) {
        if (!lightboxEl) return;
        lightboxImgEl.src = item.image;
        lightboxImgEl.alt = item.alt !== undefined ? item.alt : (item.title || '');

        const title = item.title || '';
        const meta = item.meta !== undefined
            ? item.meta
            : [
                item.date ? formatLogDate(item.date) : '',
                item.credit ? `Photo by ${item.credit}` : ''
            ].filter(Boolean).join(' \u00b7 ');

        lightboxCaptionTitleEl.textContent = title;
        lightboxCaptionTitleEl.hidden = !title;
        lightboxCaptionMetaEl.textContent = meta;
        lightboxCaptionMetaEl.hidden = !meta;

        if (accent !== undefined && lightboxMatEl) {
            lightboxMatEl.style.setProperty('--accent', accent);
        }
        const wasHidden = lightboxEl.hidden;
        lightboxEl.hidden = false;
        document.body.style.overflow = 'hidden';
        if (wasHidden) lightboxCloseEl.focus();
    }

    function closeLightbox() {
        if (!lightboxEl || lightboxEl.hidden || lightboxClosing) return;

        const finalize = () => {
            if (!lightboxClosing) return;
            lightboxClosing = false;
            lightboxEl.classList.remove('is-closing');
            if (lightboxFigureEl) lightboxFigureEl.classList.remove('is-switching');
            lightboxEl.hidden = true;
            lightboxImgEl.removeAttribute('src');
            document.body.style.overflow = '';
            lightboxBirds = [];
            lightboxAccents = [];
            lightboxIndex = -1;
            lightboxTargetIndex = -1;
            if (lightboxTriggerEl && document.contains(lightboxTriggerEl)) {
                lightboxTriggerEl.focus();
            }
            lightboxTriggerEl = null;
            scheduleStickyUpdate();
        };

        lightboxSwitchToken++;
        if (prefersReducedMotion()) {
            lightboxClosing = true;
            finalize();
            return;
        }
        lightboxClosing = true;
        lightboxEl.classList.add('is-closing');
        setTimeout(finalize, LIGHTBOX_CLOSE_MS);
    }

    if (lightboxEl) {
        lightboxCloseEl.addEventListener('click', closeLightbox);
        lightboxEl.addEventListener('click', (e) => {
            if (e.target === lightboxEl) closeLightbox();
        });
        if (lightboxPrevEl) lightboxPrevEl.addEventListener('click', () => showLightboxOffset(-1));
        if (lightboxNextEl) lightboxNextEl.addEventListener('click', () => showLightboxOffset(1));

        let swipeX = 0, swipeY = 0, swipeActive = false;
        lightboxEl.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) { swipeActive = false; return; }
            swipeActive = true;
            swipeX = e.touches[0].clientX;
            swipeY = e.touches[0].clientY;
        }, { passive: true });
        lightboxEl.addEventListener('touchend', (e) => {
            if (!swipeActive) return;
            swipeActive = false;
            const t = e.changedTouches[0];
            const dx = t.clientX - swipeX;
            const dy = t.clientY - swipeY;
            if (lightboxBirds.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                showLightboxOffset(dx < 0 ? 1 : -1);
            }
        }, { passive: true });

        document.addEventListener('keydown', (e) => {
            if (lightboxEl.hidden || lightboxClosing) return;
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

    let pendingBoardRender = null;
    let boardOpacity = 1;

    function setBoardOpacity(value) {
        const headerEl = boardTitleEl.parentElement;
        boardOpacity = value === null ? 1 : value;
        [headerEl, boardGridEl].forEach(el => {
            if (!el) return;
            el.style.transition = 'none';
            el.style.opacity = value === null ? '' : String(value);
        });
    }

    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const smoothstep = (a, b, x) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
    };

    function glideToBoard(done) {
        const boardEl = document.querySelector('.board');
        const reduceMotion = prefersReducedMotion();
        if (!boardEl || reduceMotion) {
            if (boardEl) window.scrollTo({ top: boardEl.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
            done();
            return () => {};
        }

        const startY = window.scrollY;
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        const targetY = Math.max(0, Math.min(boardEl.getBoundingClientRect().top + startY, maxY));
        const distance = targetY - startY;
        const startOpacity = boardOpacity;

        const duration = Math.abs(distance) < 2
            ? 180
            : Math.min(700, Math.max(380, 280 + Math.abs(distance) * 0.15));

        const startedAt = performance.now();
        let rafId = 0;
        let finished = false;

        const stopListening = () => {
            ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(evt =>
                window.removeEventListener(evt, interrupt));
        };
        function finish() {
            if (finished) return;
            finished = true;
            cancelAnimationFrame(rafId);
            stopListening();
            done();
        }
        function interrupt() { finish(); }
        ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(evt =>
            window.addEventListener(evt, interrupt, { passive: true }));

        function frame(now) {
            if (finished) return;
            const p = Math.min(1, (now - startedAt) / duration);
            if (Math.abs(distance) >= 2) {
                window.scrollTo({ top: startY + distance * easeInOutCubic(p), behavior: 'instant' });
            }
            setBoardOpacity(startOpacity * (1 - smoothstep(0, 0.9, p)));
            if (p < 1) rafId = requestAnimationFrame(frame);
            else finish();
        }
        rafId = requestAnimationFrame(frame);

        return () => {
            if (finished) return;
            finished = true;
            cancelAnimationFrame(rafId);
            stopListening();
        };
    }

    function syncSheetA11y() {
        if (!sidebarEl) return;
        const mobile = mobileMQ.matches;
        sidebarEl.toggleAttribute('inert', mobile && !sheetOpen);
        if (mobile) {
            sidebarEl.setAttribute('role', 'dialog');
            sidebarEl.setAttribute('aria-modal', 'true');
            if (sheetOpen) sidebarEl.removeAttribute('aria-hidden');
            else sidebarEl.setAttribute('aria-hidden', 'true');
        } else {
            sidebarEl.removeAttribute('role');
            sidebarEl.removeAttribute('aria-modal');
            sidebarEl.removeAttribute('aria-hidden');
        }
    }

    function centerActiveInList() {
        const li = gameListEl.querySelector('.game-item.active');
        if (!li) return;
        gameListEl.scrollTop = Math.max(0, li.offsetTop - (gameListEl.clientHeight - li.offsetHeight) / 2);
    }

    function openSheet() {
        if (!sidebarEl || !mobileMQ.matches || sheetOpen) return;
        sheetOpen = true;
        syncSheetA11y();
        document.documentElement.classList.add('sheet-open');
        sidebarEl.classList.add('is-open');
        pickerBtnEl.setAttribute('aria-expanded', 'true');
        positionSidebarIndicator(true);
        centerActiveInList();
        updateListFades();
        if (sheetCloseEl) sheetCloseEl.focus({ preventScroll: true });
    }

    function closeSheet(opts) {
        if (!sheetOpen) return;
        sheetOpen = false;
        document.documentElement.classList.remove('sheet-open');
        sidebarEl.classList.remove('is-open');
        pickerBtnEl.setAttribute('aria-expanded', 'false');
        if (!opts || opts.restoreFocus !== false) pickerBtnEl.focus({ preventScroll: true });
        syncSheetA11y();
    }

    function initGamePicker() {
        if (!sidebarEl || !pickerBtnEl) return;
        syncSheetA11y();

        pickerBtnEl.addEventListener('click', () => (sheetOpen ? closeSheet() : openSheet()));
        if (sheetCloseEl) sheetCloseEl.addEventListener('click', () => closeSheet());
        if (sheetBackdropEl) sheetBackdropEl.addEventListener('click', () => closeSheet());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sheetOpen) closeSheet();
        });

        const onBreakpoint = () => {
            if (!mobileMQ.matches && sheetOpen) closeSheet({ restoreFocus: false });
            syncSheetA11y();
        };
        if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', onBreakpoint);
        else mobileMQ.addListener(onBreakpoint);

        if (window.visualViewport) {
            const vv = window.visualViewport;
            const onViewport = () => {
                const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
                sidebarEl.style.setProperty('--kb', kb + 'px');
                sidebarEl.style.setProperty('--vvh', vv.height + 'px');
            };
            vv.addEventListener('resize', onViewport);
            vv.addEventListener('scroll', onViewport);
        }

        if (sheetTopEl) {
            let startY = null, dy = 0;
            sheetTopEl.addEventListener('pointerdown', (e) => {
                if (!sheetOpen || e.target.closest('button')) return;
                startY = e.clientY;
                dy = 0;
                sheetTopEl.setPointerCapture(e.pointerId);
                sidebarEl.style.transition = 'none';
            });
            sheetTopEl.addEventListener('pointermove', (e) => {
                if (startY === null) return;
                dy = Math.max(0, e.clientY - startY);
                sidebarEl.style.transform = `translateY(${dy}px)`;
            });
            const endDrag = () => {
                if (startY === null) return;
                startY = null;
                sidebarEl.style.transition = '';
                sidebarEl.style.transform = '';
                if (dy > 90) closeSheet();
            };
            sheetTopEl.addEventListener('pointerup', endDrag);
            sheetTopEl.addEventListener('pointercancel', endDrag);
        }
    }
    initGamePicker();

    function selectGame(gameId, options) {
        const opts = options || {};
        closeSheet({ restoreFocus: false });

        if (pendingBoardRender) { pendingBoardRender(); pendingBoardRender = null; }

        activeGameId = gameId;
        updateSidebarActive();

        if (opts.scrollToBoard) {
            pendingBoardRender = glideToBoard(() => {
                pendingBoardRender = null;
                setBoardOpacity(null);
                boardGridEl.classList.add('board__grid--soft');
                renderBoard();
            });
        } else {
            setBoardOpacity(null);
            boardGridEl.classList.remove('board__grid--soft');
            renderBoard();
        }

        if (opts.updateHash !== false) {
            const newHash = '#' + encodeURIComponent(gameId);
            if (location.hash !== newHash) {
                history.replaceState(null, '', newHash);
            }
        }
    }

    window.addEventListener('hashchange', () => {
        const targetId = safeDecode(location.hash.slice(1));
        if (targetId && targetId !== activeGameId && gamesData.some(g => g.id === targetId)) {
            selectGame(targetId, { updateHash: false });
        }
    });

    function animateCount(el, target, duration = 900) {
        if (!el) return;
        if (prefersReducedMotion()) {
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

    function whenLedgerReady(cb) {
        const ledgerEl = document.querySelector('.ledger');
        if (!ledgerEl || !('IntersectionObserver' in window)) { cb(); return; }

        let fired = false;
        const fire = () => {
            if (fired) return;
            fired = true;
            const anims = ledgerEl.getAnimations
                ? ledgerEl.getAnimations().filter(a => {
                    const t = a.effect && a.effect.getComputedTiming();
                    return t && isFinite(t.endTime);
                })
                : [];
            if (!anims.length) { cb(); return; }
            Promise.race([
                Promise.all(anims.map(a => a.finished.catch(() => {}))),
                new Promise(resolve => setTimeout(resolve, 2500))
            ]).then(cb);
        };

        const io = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) { io.disconnect(); fire(); }
        }, { threshold: 0.4 });
        io.observe(ledgerEl);
    }

    function renderStats() {
        const totalBirds = gamesData.reduce((sum, g) => sum + g.birds.length, 0);
        const contributors = new Set();
        gamesData.forEach(g => g.birds.forEach(bird => {
            const name = (bird.credit || '').trim().toLowerCase();
            if (name) contributors.add(name);
        }));
        const totalCredits = contributors.size;

        whenLedgerReady(() => {
            animateCount(statBirdsEl, totalBirds);
            animateCount(statGamesEl, gamesData.length);
            if (statContributorsEl) animateCount(statContributorsEl, totalCredits);
        });
    }

    function escapeHTML(str) {
        return String(str ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
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
                items.push({ date, title: bird.title, image: bird.image, thumb: bird.thumb, gameName: game.name });
            });
        });
        return items.sort((a, b) =>
            compareStr(b.date, a.date) ||
            plainCollator.compare(a.gameName, b.gameName) ||
            plainCollator.compare(a.title, b.title)
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
                images: String(r.img || '')
                    .split(/\s*\|\s*/)
                    .map(name => resolveDevImagePath(name))
                    .filter(Boolean)
            }))
            .filter(item => item.date || item.text)
            .sort((a, b) => compareStr(a.date, b.date));
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

    const BIRB_LOG_CHUNK = 60;

    function buildLogCard(bird, cardIndex, chunkIndex) {
        const card = document.createElement('article');
        card.className = 'log-card';
        card.style.setProperty('--tilt', `${(cardIndex % 5 - 2) * 0.5}deg`);
        card.style.setProperty('--delay', `${Math.min(chunkIndex * 30, 300)}ms`);
        card.style.setProperty('--accent', LOG_ACCENTS[cardIndex % LOG_ACCENTS.length]);

        const src = bird.thumb || bird.image;
        const imgTag = src
            ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(bird.title)}" loading="lazy" decoding="async" />`
            : PLACEHOLDER_ICON;

        card.innerHTML = `
            <div class="log-card__frame${src ? ' is-loading' : ''}">${imgTag}</div>
            <h3 class="log-card__title">${escapeHTML(bird.title)}</h3>
          `;

        const imgEl = card.querySelector('.log-card__frame img');
        if (imgEl) {
            const frameEl = imgEl.closest('.log-card__frame');
            trackImageLoad(frameEl, imgEl);
            withFullFallback(imgEl, bird, () => {
                frameEl.classList.remove('is-loading');
                frameEl.innerHTML = PLACEHOLDER_ICON;
            });
        }
        return card;
    }

    function renderBirbLog(panelEl, items) {
        if (!panelEl) return;
        panelEl.innerHTML = '';

        if (!items.length) {
            panelEl.innerHTML = `<p class="logbook__empty">Nothing logged yet, check back soon!</p>`;
            return;
        }

        const groups = groupBirbLogItems(items);
        const sentinel = document.createElement('div');
        sentinel.className = 'logbook__sentinel';
        sentinel.style.height = '1px';
        sentinel.setAttribute('aria-hidden', 'true');
        panelEl.appendChild(sentinel);

        let di = 0, gi = 0, bi = 0, cardIndex = 0;
        let dateEl = null, gridEl = null;

        function renderChunk(budget) {
            let made = 0;
            while (made < budget && di < groups.length) {
                const dateGroup = groups[di];
                const gameGroup = dateGroup.games[gi];

                if (!dateEl) {
                    dateEl = document.createElement('div');
                    dateEl.className = 'logbook__date-group';
                    const dateHeading = document.createElement('h3');
                    dateHeading.className = 'logbook__date-heading';
                    dateHeading.textContent = formatLogDate(dateGroup.date);
                    dateEl.appendChild(dateHeading);
                    panelEl.insertBefore(dateEl, sentinel);
                }
                if (!gridEl) {
                    const gameEl = document.createElement('div');
                    gameEl.className = 'logbook__game-group';
                    const gameHeading = document.createElement('h4');
                    gameHeading.className = 'logbook__game-heading';
                    gameHeading.textContent = gameGroup.gameName;
                    gridEl = document.createElement('div');
                    gridEl.className = 'logbook__bird-grid';
                    gameEl.append(gameHeading, gridEl);
                    dateEl.appendChild(gameEl);
                }

                gridEl.appendChild(buildLogCard(gameGroup.birds[bi], cardIndex++, made));
                made++;
                bi++;

                if (bi >= gameGroup.birds.length) {
                    bi = 0; gi++; gridEl = null;
                    if (gi >= dateGroup.games.length) { gi = 0; di++; dateEl = null; }
                }
            }
            return di < groups.length;
        }

        if (!('IntersectionObserver' in window)) {
            renderChunk(Infinity);
            sentinel.remove();
            return;
        }

        if (!renderChunk(BIRB_LOG_CHUNK)) {
            sentinel.remove();
            return;
        }

        const io = new IntersectionObserver((entries) => {
            if (!entries.some(e => e.isIntersecting)) return;
            if (renderChunk(BIRB_LOG_CHUNK)) {
                io.unobserve(sentinel);
                io.observe(sentinel);
            } else {
                io.disconnect();
                sentinel.remove();
            }
        }, { root: panelEl, rootMargin: '0px 0px 600px 0px' });
        io.observe(sentinel);
    }

    function parseDevText(text) {
        return String(text || '')
            .split(/\r?\n|\s+\|\s+/)
            .map(seg => seg.trim())
            .filter(Boolean)
            .map(seg => {
                const m = seg.match(/^[-*\u2022]\s+(.*)$/);
                return m ? { bullet: true, text: m[1] } : { bullet: false, text: seg };
            });
    }

    function devTextToHTML(text) {
        const parts = parseDevText(text);
        let html = '';
        let list = [];
        const flush = () => {
            if (list.length) {
                html += `<ul class="dev-entry__list">${list.map(t => `<li>${escapeHTML(t)}</li>`).join('')}</ul>`;
                list = [];
            }
        };
        parts.forEach(part => {
            if (part.bullet) {
                list.push(part.text);
            } else {
                flush();
                html += `<p class="dev-entry__line">${escapeHTML(part.text)}</p>`;
            }
        });
        flush();
        return html;
    }

    function renderDevLog(panelEl, items) {
        if (!panelEl) return;
        panelEl.innerHTML = '';

        if (!items.length) {
            panelEl.innerHTML = `<p class="logbook__empty">Nothing logged yet, check back soon!</p>`;
            return;
        }

        const lightboxItems = items.flatMap(item =>
            item.images.map(image => ({
                image,
                alt: '',
                title: '',
                meta: item.date ? formatLogDate(item.date) : ''
            }))
        );
        const lightboxAccentsForDev = lightboxItems.map((_, i) => LOG_ACCENTS[i % LOG_ACCENTS.length]);
        let imageCursor = -1;

        items.forEach((item, i) => {
            const entry = document.createElement('article');
            entry.className = 'dev-entry';
            entry.style.setProperty('--delay', `${Math.min(i * 30, 300)}ms`);

            entry.innerHTML = `
        <p class="dev-entry__date">${escapeHTML(formatLogDate(item.date))}</p>
        <div class="dev-entry__text">${devTextToHTML(item.text)}</div>
        ${item.images.length ? `<div class="dev-entry__images" style="--n:${item.images.length}">${item.images.map(src => `<div class="dev-entry__frame"><img src="${escapeHTML(src)}" alt="" loading="lazy" decoding="async" /></div>`).join('')}</div>` : ''}
      `;

            entry.querySelectorAll('.dev-entry__frame').forEach(frameEl => {
                const imgEl = frameEl.querySelector('img');
                if (!imgEl) return;
                const lbItem = lightboxItems[++imageCursor];
                let imageFailed = false;

                const applyRatio = () => {
                    if (imgEl.naturalWidth && imgEl.naturalHeight) {
                        frameEl.style.flexGrow = (imgEl.naturalWidth / imgEl.naturalHeight).toFixed(4);
                    }
                };
                if (imgEl.complete) applyRatio();
                imgEl.addEventListener('load', applyRatio, { once: true });

                imgEl.addEventListener('error', () => {
                    imageFailed = true;
                    frameEl.remove();

                    const at = lightboxItems.indexOf(lbItem);
                    if (at !== -1) {
                        lightboxItems.splice(at, 1);
                        lightboxAccentsForDev.pop();
                    }
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
                    openLightboxAt(lightboxItems, lightboxAccentsForDev, lightboxItems.indexOf(lbItem));
                };
                frameEl.addEventListener('click', open);
                frameEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        open();
                    }
                });
            });

            panelEl.appendChild(entry);
        });
    }

    let birbLogReady = false;
    let birbLogRendered = false;

    function renderBirbLogIfNeeded() {
        if (!birbLogReady || birbLogRendered || !logPanelBirdsEl || logPanelBirdsEl.hidden) return;
        birbLogRendered = true;
        renderBirbLog(logPanelBirdsEl, buildBirbLogItems());
    }

    function renderLogbook() {
        birbLogReady = true;
        renderBirbLogIfNeeded();
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
            if (showBirds) renderBirbLogIfNeeded();
        }

        logTabBirdsEl.addEventListener('click', () => showTab('birds'));
        logTabDevEl.addEventListener('click', () => showTab('dev'));
    }
    let NO_BIRDS_GAMES = [];
    function initNoBirds() {
        const listEl = document.getElementById('noBirdsList');
        if (!listEl) return;
        const sectionEl = document.getElementById('no-birds');
        if (!NO_BIRDS_GAMES.length) {
            if (sectionEl) sectionEl.hidden = true;
            return;
        }

        const sortedGames = [...NO_BIRDS_GAMES].sort((a, b) =>
            collator.compare((a || '').trim(), (b || '').trim())
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

    async function loadNoBirds() {
        try {
            const res = await fetch('Data/nobirds.csv');
            if (!res.ok) throw new Error('Failed to load nobirds.csv');
            const text = await res.text();
            NO_BIRDS_GAMES = parseCSV(text)
                .map(row => (row.game || '').trim())
                .filter(Boolean);
        } catch (err) {
            console.error(err);
            NO_BIRDS_GAMES = [];
        }
    }

    async function loadSmile() {
        try {
            const res = await fetch('Data/smile.csv', { cache: 'no-cache' });
            if (!res.ok) throw new Error('Failed to load smile.csv');
            const text = await res.text();
            smileRows = parseCSV(text)
                .map((r, i) => ({ id: (r.id || '').trim() || String(i + 1), user: (r.user || '').trim(), message: (r.message || '').trim() }))
                .filter(r => r.user || r.message);
        } catch (err) {
            console.error(err);
            smileRows = [];
        }
    }

    function renderSmile() {
        const sectionEl = document.getElementById('smile');
        const trackEl = document.getElementById('smileTrack');
        const logbookEl = document.getElementById('logbook');
        if (!sectionEl || !trackEl) return;
        trackEl.innerHTML = '';

        if (!smileRows.length) {
            sectionEl.hidden = true;
            return;
        }

        const STEP = 260 + 16;
        const target = Math.max(window.innerWidth, 1600) * 1.1;
        const reps = Math.max(1, Math.ceil(target / (smileRows.length * STEP)));

        const shuffle = (arr) => {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        const sequence = [];
        for (let r = 0; r < reps; r++) {
            const batch = shuffle(smileRows);
            const last = sequence[sequence.length - 1];
            if (last && batch.length > 1 && batch[0] === last) {
                [batch[0], batch[1]] = [batch[1], batch[0]];
            }
            sequence.push(...batch);
        }

        if (sequence.length > 2 && sequence[0] === sequence[sequence.length - 1]) {
            [sequence[0], sequence[1]] = [sequence[1], sequence[0]];
        }

        const buildGroup = (isCopy) => {
            const group = document.createElement('div');
            group.className = 'smile-group';
            if (isCopy) group.setAttribute('aria-hidden', 'true');
            sequence.forEach((row, n) => {
                const card = document.createElement('article');
                card.className = 'smile-card';
                card.dataset.id = row.id;
                card.style.setProperty('--accent', ACCENT_CYCLE[n % ACCENT_CYCLE.length]);
                card.style.setProperty('--d', `${-((n % 7) * 0.5)}s`);
                if (row.message) card.title = row.message;

                const userEl = document.createElement('p');
                userEl.className = 'smile-card__user';
                userEl.textContent = row.user;
                const msgEl = document.createElement('p');
                msgEl.className = 'smile-card__msg';
                msgEl.textContent = row.message;

                card.append(userEl, msgEl);
                group.appendChild(card);
            });
            return group;
        };

        trackEl.append(buildGroup(false), buildGroup(true));
        trackEl.style.setProperty('--smile-duration', `${Math.round((sequence.length * STEP) / 45)}s`);
        sectionEl.hidden = !(logbookEl && !logbookEl.hidden);
    }

    let secretOpened = false;
    let secretDataReady = false;
    let secretRendered = false;

    function renderSecretSections() {
        if (secretRendered || !secretOpened || !secretDataReady) return;
        secretRendered = true;
        renderLogbook();
        renderSmile();
    }

    async function init() {
        renderBoardSkeleton();

        const birdsLoad   = loadBirds();
        const devLoad     = loadDevLog();
        const noBirdsLoad = loadNoBirds();
        const smileLoad   = loadSmile();

        noBirdsLoad.then(initNoBirds);

        let birdsOk = true;
        try {
            await birdsLoad;
        } catch (err) {
            birdsOk = false;
            console.error(err);
        }

        if (birdsOk) {
            renderStats();
            renderSidebar();
            if (gameSearchEl) {
                gameSearchEl.addEventListener('input', () => renderSidebar({ fromSearch: true }));
                gameSearchEl.addEventListener('keydown', (e) => {
                    if (e.isComposing) return;
                    if (e.key === 'Escape' && gameSearchEl.value) {
                        e.preventDefault();
                        gameSearchEl.value = '';
                        renderSidebar({ fromSearch: true });
                    } else if (e.key === 'Enter') {
                        const firstBtn = gameListEl.querySelector('.game-item .game-btn');
                        if (!firstBtn) return;
                        e.preventDefault();
                        const gameId = firstBtn.closest('.game-item').dataset.gameId;
                        const r = firstBtn.getBoundingClientRect();
                        // Deferred so this same keydown can't interrupt the scroll glide.
                        setTimeout(() => {
                            spawnConfetti(r.left + r.width / 2, r.top + r.height / 2);
                            selectGame(gameId, { scrollToBoard: true });
                        }, 0);
                    }
                });
            }
            if (!gamesData.length) {
                boardTitleEl.textContent = 'No birds logged yet';
                boardMetaEl.textContent = '';
                boardGridEl.innerHTML = `<div class="board__empty">Nothing here yet, check back soon!</div>`;
                if (boardSortLabelEl) boardSortLabelEl.hidden = true;
            } else {
                const hashId = safeDecode(location.hash.slice(1));
                const startGame = gamesData.find(g => g.id === hashId) || gamesData[0];
                selectGame(startGame.id, { updateHash: false });
            }
        } else {
            if (location.protocol !== 'file:') {
                fileNoticeEl.textContent = 'Something went wrong loading the bird collection. Please check your connection and try refreshing the page.';
            }
            fileNoticeEl.hidden = false;
            boardTitleEl.textContent = 'Couldn\u2019t load your collection';
            boardMetaEl.textContent = '';
            boardGridEl.innerHTML = '';
        }

        await Promise.all([devLoad, smileLoad]);
        secretDataReady = true;
        renderSecretSections();
    }

    function initSortDropdown() {
        if (!boardSortEl || !boardSortLabelEl || !boardSortMenuEl) return;

        const options = Array.from(boardSortMenuEl.querySelectorAll('[role="option"]'));
        const currentEl = boardSortEl.querySelector('.board__sort-current');
        const valueEl = boardSortEl.querySelector('.board__sort-value');
        let activeIndex = -1;

        // Invisible copies of every label keep the pill the same width whichever option is picked.
        options.forEach(opt => {
            const sizer = document.createElement('span');
            sizer.className = 'board__sort-sizer';
            sizer.setAttribute('aria-hidden', 'true');
            sizer.textContent = opt.textContent.trim();
            valueEl.appendChild(sizer);
        });

        const isOpen = () => boardSortLabelEl.classList.contains('is-open');

        function markSelected(index) {
            options.forEach((opt, n) => opt.setAttribute('aria-selected', String(n === index)));
            if (options[index]) currentEl.textContent = options[index].textContent.trim();
        }

        function setActive(index) {
            activeIndex = index;
            options.forEach((opt, n) => opt.classList.toggle('is-active', n === index));
            if (options[index]) boardSortMenuEl.setAttribute('aria-activedescendant', options[index].id);
        }

        function openMenu() {
            if (isOpen()) return;
            boardSortLabelEl.classList.add('is-open');
            boardSortEl.setAttribute('aria-expanded', 'true');
            setActive(Math.max(0, options.findIndex(opt => opt.dataset.value === sortMode)));
            boardSortMenuEl.focus({ preventScroll: true });
            if (document.activeElement !== boardSortMenuEl) {
                requestAnimationFrame(() => boardSortMenuEl.focus({ preventScroll: true }));
            }
        }

        function closeMenu(returnFocus) {
            if (!isOpen()) return;
            boardSortLabelEl.classList.remove('is-open');
            boardSortEl.setAttribute('aria-expanded', 'false');
            boardSortMenuEl.removeAttribute('aria-activedescendant');
            options.forEach(opt => opt.classList.remove('is-active'));
            if (returnFocus) boardSortEl.focus({ preventScroll: true });
        }

        function choose(index) {
            const opt = options[index];
            if (!opt) return;
            const changed = opt.dataset.value !== sortMode;
            markSelected(index);
            closeMenu(true);
            if (changed) {
                sortMode = opt.dataset.value;
                if (activeGameId) renderBoard({ flip: true });
            }
        }

        markSelected(Math.max(0, options.findIndex(opt => opt.dataset.value === sortMode)));

        boardSortLabelEl.addEventListener('click', (e) => {
            if (boardSortMenuEl.contains(e.target)) return;
            if (isOpen()) closeMenu(true); else openMenu();
        });

        boardSortEl.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                openMenu();
            }
        });

        boardSortMenuEl.addEventListener('keydown', (e) => {
            const last = options.length - 1;
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); setActive(activeIndex >= last ? 0 : activeIndex + 1); break;
                case 'ArrowUp':   e.preventDefault(); setActive(activeIndex <= 0 ? last : activeIndex - 1); break;
                case 'Home':      e.preventDefault(); setActive(0); break;
                case 'End':       e.preventDefault(); setActive(last); break;
                case 'Enter':
                case ' ':         e.preventDefault(); choose(activeIndex); break;
                case 'Escape':    e.preventDefault(); closeMenu(true); break;
                case 'Tab':       closeMenu(true); break;   // focus returns to the button, then Tab moves on from there
                default: break;
            }
        });

        options.forEach((opt, i) => {
            opt.addEventListener('pointermove', () => { if (activeIndex !== i) setActive(i); });
            opt.addEventListener('click', () => choose(i));
        });

        document.addEventListener('pointerdown', (e) => {
            if (isOpen() && !boardSortLabelEl.contains(e.target)) closeMenu(false);
        });
    }

    function initScrollReveal() {
        const targets = document.querySelectorAll('.reveal-on-scroll');
        if (!targets.length) return;
        if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
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
        const smileSectionEl = document.getElementById('smile');
        if (!toggleEl || !sectionEl) return;

        const forceClosed = () => {
            sectionEl.hidden = true;
            if (logbookSectionEl) logbookSectionEl.hidden = true;
            if (smileSectionEl) smileSectionEl.hidden = true;
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
            if (smileSectionEl) smileSectionEl.hidden = !opening || !smileRows.length;
            toggleEl.setAttribute('aria-expanded', String(opening));

            if (opening) {
                secretOpened = true;
                renderSecretSections();
                sectionEl.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' });
                const pt = clickPoint(e);
                spawnConfetti(pt.x, pt.y);
            }
        });
    }

    function initInPageAnchors() {
        document.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const link = e.target.closest && e.target.closest('a[href^="#"]');
            if (!link || link.target === '_blank') return;

            const id = safeDecode(link.getAttribute('href').slice(1));
            const target = id ? document.getElementById(id) : null;
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({ block: 'start' });
        });
    }

    initInPageAnchors();
    initSortDropdown();
    initScrollReveal();
    init();
    initAboutMe();
    initLogbookTabs();
})();