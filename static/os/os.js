/**
 * The desktop shown on the monitor.
 *
 * All of the content comes from data.js. This file only turns that data into
 * windows, and tells the 3D scene around it about mouse and key activity.
 */
(function () {
    const data = window.PORTFOLIO;

    // ---------------------------------------------------------------- helpers

    const esc = (value) =>
        String(value).replace(
            /[&<>"']/g,
            (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
        );

    const el = (tag, className, html) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (html !== undefined) node.innerHTML = html;
        return node;
    };

    const svg = (paths, className) =>
        `<svg ${className ? `class="${className}" ` : ''}viewBox="0 0 48 48" aria-hidden="true">${paths}</svg>`;

    const chips = (items) =>
        `<div class="chips">${items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>`;

    const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

    const link = (url, label, className, extra) =>
        `<a class="${className || ''}" href="${esc(url)}" target="_blank" rel="noopener" ${extra || ''}>${esc(label)}</a>`;

    // ------------------------------------------------------------------ icons

    const ICONS = {
        about: '<circle cx="24" cy="24" r="22" fill="#0078d7"/><circle cx="24" cy="19" r="8" fill="#fff"/><path d="M9 39c2-8 8-11 15-11s13 3 15 11a22 22 0 0 1-30 0z" fill="#fff"/>',
        experience: '<rect x="4" y="14" width="40" height="27" rx="3" fill="#8d5a2b"/><path d="M17 14v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" fill="none" stroke="#5e3a17" stroke-width="3"/><rect x="4" y="24" width="40" height="4" fill="#5e3a17"/><rect x="21" y="22" width="6" height="8" rx="1" fill="#f2c94c"/>',
        projects: '<path d="M4 10a3 3 0 0 1 3-3h11l4 5h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><rect x="4" y="15" width="40" height="26" rx="3" fill="#ffcf48"/>',
        skills: '<rect x="4" y="7" width="40" height="34" rx="3" fill="#2b2b2b"/><path d="M4 10a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v5H4z" fill="#0078d7"/><path d="M19 22l-6 6 6 6M29 22l6 6-6 6M26 20l-4 16" fill="none" stroke="#7fd1ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
        education: '<path d="M24 8L2 19l22 11 22-11z" fill="#1f3a5f"/><path d="M11 25v9c0 4 6 7 13 7s13-3 13-7v-9l-13 6.5z" fill="#2f5d94"/><path d="M42 20v12" stroke="#f2c94c" stroke-width="2.5"/><circle cx="42" cy="34" r="2.5" fill="#f2c94c"/>',
        more: '<path d="M24 4l6 13.5 14.5 1.6-10.8 9.8 3 14.3L24 36l-12.7 7.2 3-14.3L3.5 19.1 18 17.5z" fill="#ffb900"/>',
        setup: '<rect x="4" y="8" width="40" height="26" rx="2" fill="#2b2b2b"/><rect x="7" y="11" width="34" height="20" fill="#4cb5ff"/><rect x="21" y="34" width="6" height="5" fill="#8a8a8a"/><rect x="14" y="39" width="20" height="3" rx="1" fill="#8a8a8a"/>',
        contact: '<rect x="4" y="10" width="40" height="28" rx="3" fill="#0078d7"/><path d="M5 12l19 15 19-15" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>',
        cv: '<path d="M10 4h20l10 10v27a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#fff" stroke="#b0b0b0"/><path d="M30 4v10h10z" fill="#dcdcdc"/><rect x="3" y="24" width="30" height="13" rx="2" fill="#d93025"/><text x="18" y="34.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff">PDF</text>',
        env: '<path d="M10 4h20l10 10v27a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#fff" stroke="#b0b0b0"/><path d="M30 4v10h10z" fill="#dcdcdc"/><circle cx="23.5" cy="29" r="6" fill="none" stroke="#5c6670" stroke-width="3.2"/><path d="M23.5 19.5v3.2M23.5 35.3v3.2M14 29h3.2M29.8 29H33M16.8 22.3l2.3 2.3M27.9 33.4l2.3 2.3M16.8 35.7l2.3-2.3M27.9 24.6l2.3-2.3" stroke="#5c6670" stroke-width="3.2" stroke-linecap="round"/>',
        terminal: '<rect x="4" y="7" width="40" height="34" rx="2" fill="#0c0c0c" stroke="#8a8a8a"/><path d="M11 18l7 6-7 6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 31h13" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    };

    const CONTROLS = {
        minimise: '<svg viewBox="0 0 12 12"><path d="M1 6.5h10"/></svg>',
        maximise: '<svg viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9"/></svg>',
        close: '<svg viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11"/></svg>',
    };

    // ------------------------------------------------------------------- apps

    const apps = [
        {
            id: 'about',
            name: 'About Me',
            size: [900, 720],
            render: () => `
                <h1>${esc(data.name)}</h1>
                <p class="lead">${esc(data.title)}</p>
                ${data.profile.map((p) => `<p>${esc(p)}</p>`).join('')}
                <h3>At a glance</h3>
                <dl class="facts">
                    ${data.highlights.map((h) => `<dt>${esc(h.label)}</dt><dd>${esc(h.value)}</dd>`).join('')}
                </dl>
                <div class="buttons">
                    <button class="button primary" data-open="experience">Experience</button>
                    <button class="button" data-open="projects">Projects</button>
                    <button class="button" data-open="contact">Get in touch</button>
                </div>`,
        },
        {
            id: 'experience',
            name: 'Experience',
            size: [900, 680],
            render: () =>
                data.experience
                    .map(
                        (job) => `
                <div class="entry">
                    <div class="entry-head">
                        <h2>${esc(job.role)}</h2>
                        <span class="dates">${esc(job.dates)}</span>
                    </div>
                    <div class="company">${esc(job.company)}</div>
                    ${list(job.points)}
                </div>`
                    )
                    .join(''),
        },
        {
            id: 'projects',
            name: 'Projects',
            size: [1060, 700],
            render: () => `
                <div class="cards">
                    ${data.projects
                        .map(
                            (project) => `
                        <div class="card">
                            <h2>${esc(project.name)}</h2>
                            <p>${esc(project.description)}</p>
                            ${chips(project.tech || [])}
                            ${project.link ? link(project.link, 'View project') : ''}
                        </div>`
                        )
                        .join('')}
                </div>`,
        },
        {
            id: 'skills',
            name: 'Skills',
            size: [760, 600],
            render: () =>
                data.skills.map((s) => `<h3>${esc(s.group)}</h3>${chips(s.items)}`).join(''),
        },
        {
            id: 'education',
            name: 'Education',
            size: [900, 520],
            render: () => `
                <table>
                    <thead><tr><th>Category</th><th>Qualification</th><th>Result</th></tr></thead>
                    <tbody>
                        ${data.education
                            .map(
                                (e) => `
                            <tr>
                                <td class="muted">${esc(e.category)}</td>
                                <td>${esc(e.qualification)}</td>
                                <td class="result">${esc(e.result)}</td>
                            </tr>`
                            )
                            .join('')}
                    </tbody>
                </table>`,
        },
        {
            id: 'more',
            name: 'Beyond Work',
            size: [820, 560],
            render: () => `
                <h3>Leadership &amp; achievements</h3>
                ${list(data.leadership)}
                <h3>Interests</h3>
                ${chips(data.interests)}`,
        },
        {
            id: 'setup',
            name: 'My Setup',
            size: [720, 520],
            hidden: () => !data.setup || data.setup.length === 0,
            render: () => `
                <dl class="facts">
                    ${data.setup.map((s) => `<dt>${esc(s.part)}</dt><dd>${esc(s.detail)}</dd>`).join('')}
                </dl>`,
        },
        {
            id: 'contact',
            name: 'Contact',
            size: [680, 480],
            render: () => {
                const c = data.contact;
                return `
                <h1>Get in touch</h1>
                <p class="lead">The best way to reach me is through LinkedIn.</p>
                <dl class="facts">
                    ${c.links.map((l) => `<dt>${esc(l.label)}</dt><dd>${link(l.url, l.url.replace(/^https?:\/\/(www\.)?/, ''))}</dd>`).join('')}
                </dl>
                <p class="note">${esc(c.note)}</p>
                <div class="buttons">
                    ${c.links.map((l, i) => link(l.url, l.label, i === 0 ? 'button primary' : 'button')).join('')}
                    ${c.cv ? '<button class="button" data-open="cv">My CV</button>' : ''}
                </div>`;
            },
        },
        {
            id: 'cv',
            name: 'My CV',
            size: [620, 360],
            hidden: () => !data.contact.cv,
            render: () => `
                <h1>Curriculum Vitae</h1>
                <p class="lead">${esc(data.name)} - ${esc(data.title)}</p>
                <p>My full CV as a PDF, with everything on this desktop in one document.</p>
                <div class="buttons">
                    ${link(data.contact.cv, 'Open CV', 'button primary')}
                    ${link(data.contact.cv, 'Download', 'button', 'download')}
                </div>`,
        },
        {
            id: 'env',
            name: '.env',
            windowTitle: '.env - Notepad',
            size: [640, 400],
            contentClass: 'notepad',
            hidden: () => !data.envFile || data.envFile.length === 0,
            render: () => data.envFile.map((line) => esc(line)).join('\n'),
        },
        {
            id: 'terminal',
            name: 'Command Prompt',
            size: [860, 520],
            windowClass: 'console',
            contentClass: 'terminal',
            render: () => '',
            mount: mountTerminal,
        },
    ].filter((app) => !(app.hidden && app.hidden()));

    const appById = (id) => apps.find((app) => app.id === id);

    // ---------------------------------------------------------------- windows

    const desktop = document.getElementById('desktop');
    const windowLayer = document.getElementById('windows');
    const taskbarApps = document.getElementById('taskbar-apps');
    const open = {};
    let zIndex = 10;
    let cascade = 0;

    const topWindow = () =>
        Object.keys(open)
            .filter((id) => !open[id].win.classList.contains('minimised'))
            .sort((a, b) => open[b].win.style.zIndex - open[a].win.style.zIndex)[0];

    function focusWindow(id) {
        for (const key in open) {
            const active = key === id;
            open[key].win.classList.toggle('active', active);
            open[key].task.classList.toggle('active', active);
        }
        if (open[id]) {
            open[id].win.classList.remove('minimised');
            open[id].win.style.zIndex = ++zIndex;
        }
    }

    function minimiseWindow(id) {
        if (!open[id]) return;
        open[id].win.classList.add('minimised');
        focusWindow(topWindow());
    }

    function closeWindow(id) {
        if (!open[id]) return;
        open[id].win.remove();
        open[id].task.remove();
        delete open[id];
        focusWindow(topWindow());
    }

    function openWindow(id) {
        const app = appById(id);
        if (!app) return;
        if (open[id]) return focusWindow(id);

        const bounds = desktop.getBoundingClientRect();
        const width = Math.min(app.size[0], bounds.width - 40);
        const height = Math.min(app.size[1], bounds.height - 40);
        const step = (cascade++ % 6) * 28;
        const left = Math.max(20, Math.min((bounds.width - width) / 2 + 40 + step, bounds.width - width - 20));
        const top = Math.max(20, Math.min((bounds.height - height) / 2 - 20 + step, bounds.height - height - 20));

        const win = el('div', 'window ' + (app.windowClass || ''));
        win.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
        win.innerHTML = `
            <div class="titlebar">
                ${svg(ICONS[id], 'app-icon')}
                <span class="label">${esc(app.windowTitle || app.name)}</span>
                <button class="minimise" aria-label="Minimise">${CONTROLS.minimise}</button>
                <button class="maximise" aria-label="Maximise">${CONTROLS.maximise}</button>
                <button class="close" aria-label="Close">${CONTROLS.close}</button>
            </div>
            <div class="content ${app.contentClass || ''}">${app.render()}</div>`;

        const task = el('button', 'task', svg(ICONS[id]));
        task.title = app.name;
        task.addEventListener('click', () => {
            const isActive = win.classList.contains('active') && !win.classList.contains('minimised');
            if (isActive) minimiseWindow(id);
            else focusWindow(id);
        });
        taskbarApps.appendChild(task);

        open[id] = { win, task };
        windowLayer.appendChild(win);

        win.addEventListener('pointerdown', (event) => {
            if (!event.target.closest('.titlebar button')) focusWindow(id);
        });
        win.querySelector('.close').addEventListener('click', () => closeWindow(id));
        win.querySelector('.minimise').addEventListener('click', () => minimiseWindow(id));

        // Maximise / restore
        let restore = null;
        const toggleMaximise = () => {
            if (restore) {
                win.style.cssText = restore;
                restore = null;
            } else {
                restore = win.style.cssText;
                win.style.cssText = `left:0;top:0;width:100%;height:100%;z-index:${win.style.zIndex}`;
            }
            win.classList.toggle('maximised', !!restore);
        };
        win.querySelector('.maximise').addEventListener('click', toggleMaximise);

        // Dragging by the title bar
        const titlebar = win.querySelector('.titlebar');
        titlebar.addEventListener('dblclick', (event) => {
            if (!event.target.closest('button')) toggleMaximise();
        });
        titlebar.addEventListener('pointerdown', (event) => {
            if (event.target.closest('button') || restore) return;
            const startX = event.clientX - win.offsetLeft;
            const startY = event.clientY - win.offsetTop;
            titlebar.setPointerCapture(event.pointerId);
            const move = (e) => {
                const area = desktop.getBoundingClientRect();
                const x = Math.max(120 - win.offsetWidth, Math.min(e.clientX - startX, area.width - 120));
                const y = Math.max(0, Math.min(e.clientY - startY, area.height - 40));
                win.style.left = x + 'px';
                win.style.top = y + 'px';
            };
            const stop = () => {
                titlebar.removeEventListener('pointermove', move);
                titlebar.removeEventListener('pointerup', stop);
                titlebar.removeEventListener('pointercancel', stop);
            };
            titlebar.addEventListener('pointermove', move);
            titlebar.addEventListener('pointerup', stop);
            titlebar.addEventListener('pointercancel', stop);
        });

        // Buttons inside a window that open another window
        win.addEventListener('click', (event) => {
            const target = event.target.closest('[data-open]');
            if (target) openWindow(target.dataset.open);
        });

        if (app.mount) app.mount(win.querySelector('.content'));
        focusWindow(id);
    }

    // --------------------------------------------------------------- terminal

    function mountTerminal(content) {
        const PROMPT = 'C:\\Users\\Seamus>';
        const output = el('div');
        const row = el('div', 'input-row', `<span>${esc(PROMPT)}</span>`);
        const input = el('input');
        input.setAttribute('aria-label', 'Command prompt input');
        input.spellcheck = false;
        input.autocomplete = 'off';
        row.appendChild(input);
        content.append(output, row);

        const print = (text) => {
            const line = el('div', 'line');
            line.textContent = text;
            output.appendChild(line);
        };

        const openable = apps.filter((app) => app.id !== 'terminal').map((app) => app.id);

        const commands = {
            help: () =>
                [
                    'ABOUT        Who I am',
                    'EXPERIENCE   Where I have worked',
                    'PROJECTS     Things I have built',
                    'SKILLS       What I work with',
                    'EDUCATION    Qualifications',
                    'CONTACT      How to reach me',
                    'OPEN <name>  Opens a window (' + openable.join(', ') + ')',
                    'CLS          Clears the screen',
                    '',
                ].join('\n'),
            whoami: () => `${data.name} - ${data.title}\n`,
            about: () => data.profile.join('\n\n') + '\n',
            experience: () =>
                data.experience.map((j) => `${j.dates}\n  ${j.role} - ${j.company}`).join('\n') + '\n',
            projects: () =>
                data.projects.map((p) => `${p.name}\n  ${(p.tech || []).join(', ')}`).join('\n') + '\n',
            skills: () => data.skills.map((s) => `${s.group}: ${s.items.join(', ')}`).join('\n') + '\n',
            education: () =>
                data.education.map((e) => `${e.result.padEnd(4)} ${e.qualification}`).join('\n') + '\n',
            contact: () =>
                data.contact.links
                    .map((l) => `${l.label}: ${l.url}`)
                    .concat([data.contact.note])
                    .join('\n') + '\n',
            cls: () => {
                output.innerHTML = '';
                return '';
            },
            open: (name) => {
                if (!openable.includes(name)) return 'Usage: OPEN <' + openable.join('|') + '>\n';
                openWindow(name);
                return `Opening ${appById(name).name}...\n`;
            },
        };
        commands.clear = commands.cls;

        print(`${data.name} Portfolio [Version 1.0]`);
        print("Type 'help' for a list of commands.\n");

        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            const text = input.value.trim();
            input.value = '';
            print(PROMPT + text);
            if (text) {
                const [name, ...args] = text.toLowerCase().split(/\s+/);
                const command = commands[name];
                const result = command
                    ? command(...args)
                    : `'${name}' is not recognised as a command. Type 'help'.\n`;
                if (result) print(result);
            }
            content.scrollTop = content.scrollHeight;
        });

        content.addEventListener('click', () => {
            if (!String(window.getSelection())) input.focus();
        });
        input.focus();
    }

    // ---------------------------------------------------------------- desktop

    const icons = document.getElementById('icons');
    for (const app of apps) {
        const icon = el('button', 'icon', `${svg(ICONS[app.id])}<span>${esc(app.name)}</span>`);
        icon.addEventListener('click', () => openWindow(app.id));
        icons.appendChild(icon);
    }

    // ------------------------------------------------------------- start menu

    const startMenu = document.getElementById('start-menu');
    const startButton = document.getElementById('start-button');
    const toggleStart = (show) => {
        startMenu.hidden = show === undefined ? !startMenu.hidden : !show;
        startButton.classList.toggle('open', !startMenu.hidden);
    };

    const initials = data.name
        .split(/\s+/)
        .map((part) => part[0])
        .join('');
    document.getElementById('start-rail').innerHTML = `<div class="avatar" title="${esc(data.name)}">${esc(initials)}</div>`;

    const startList = document.getElementById('start-list');
    startList.appendChild(el('div', 'heading', esc(data.name)));
    const tiles = el('div', 'grid');
    for (const app of [...apps].sort((a, b) => a.name.localeCompare(b.name))) {
        const item = el('button', '', `${svg(ICONS[app.id])}<span>${esc(app.name)}</span>`);
        item.addEventListener('click', () => {
            toggleStart(false);
            openWindow(app.id);
        });
        startList.appendChild(item);
    }
    for (const app of apps.slice(0, 9)) {
        const tile = el('button', 'tile', `${svg(ICONS[app.id])}<span>${esc(app.name)}</span>`);
        tile.addEventListener('click', () => {
            toggleStart(false);
            openWindow(app.id);
        });
        tiles.appendChild(tile);
    }
    const startTiles = document.getElementById('start-tiles');
    startTiles.appendChild(el('div', 'heading', esc(data.title)));
    startTiles.appendChild(tiles);

    startButton.addEventListener('click', () => toggleStart());
    document.getElementById('taskbar-search').addEventListener('click', () => toggleStart());
    document.addEventListener('pointerdown', (event) => {
        if (!event.target.closest('#start-menu, #start-button, #taskbar-search')) toggleStart(false);
    });

    // ---------------------------------------------------------------- taskbar

    document.getElementById('show-desktop').addEventListener('click', () => {
        for (const id in open) open[id].win.classList.add('minimised');
        focusWindow(undefined);
    });

    const clock = document.getElementById('taskbar-clock');
    const tick = () => {
        const now = new Date();
        const two = (n) => String(n).padStart(2, '0');
        clock.innerHTML =
            `<span>${two(now.getHours())}:${two(now.getMinutes())}</span>` +
            `<span>${two(now.getDate())}/${two(now.getMonth() + 1)}/${now.getFullYear()}</span>`;
    };
    tick();
    setInterval(tick, 10000);

    openWindow('about');

    // ------------------------------------------------- talk to the 3D scene

    // The 3D scene says when the room's light is switched off or on, and the
    // desktop follows with its dark or light theme
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'theme') {
            document.documentElement.classList.toggle('dark', !!event.data.dark);
        }
    });

    // When this page is shown on the 3D monitor, the scene needs to know about
    // mouse and key activity to move the camera and play sounds.
    if (window.parent !== window) {
        const send = (message) => window.parent.postMessage(message, '*');
        for (const type of ['mousemove', 'mousedown', 'mouseup']) {
            document.addEventListener(type, (event) =>
                send({ type, clientX: event.clientX, clientY: event.clientY })
            );
        }
        for (const type of ['keydown', 'keyup']) {
            document.addEventListener(type, (event) => send({ type, key: event.key }));
        }
    }
})();
