(function () {
    'use strict';

    const cfg = window.BabelArcaeaMermaid || {};

    function decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    function getThemeMode() {
        const configured = cfg.themeMode || 'arcaea_dark';
        if (configured !== 'auto') { return configured; }

        const html = document.documentElement;
        const body = document.body;
        const attr = html.getAttribute('data-theme') || body.getAttribute('data-theme')
            || html.getAttribute('data-scheme') || body.getAttribute('data-scheme');

        if (attr && /light/i.test(attr)) { return 'arcaea_light'; }
        if (attr && /dark|night/i.test(attr)) { return 'arcaea_dark'; }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) { return 'arcaea_light'; }
        return 'arcaea_dark';
    }

    function getThemeVariables(mode) {
        if (mode === 'arcaea_light') {
            return {
                background: 'transparent',
                primaryColor: '#f7fbff',
                primaryTextColor: '#263141',
                primaryBorderColor: '#7cbcff',
                secondaryColor: '#eef7ff',
                tertiaryColor: '#ffffff',
                lineColor: '#5c9ee6',
                textColor: '#263141',
                mainBkg: '#f7fbff',
                secondBkg: '#eef7ff',
                clusterBkg: 'rgba(244, 250, 255, 0.92)',
                clusterBorder: '#8fc6ff',
                edgeLabelBackground: '#ffffff',
                nodeBorder: '#7cbcff',
                fontFamily: 'FiraCode Nerd Font, Fira Code, JetBrains Mono, Noto Sans SC, Microsoft YaHei, sans-serif'
            };
        }
        return {
            background: 'transparent',
            primaryColor: '#1b2233',
            primaryTextColor: '#eaf4ff',
            primaryBorderColor: '#8dc7ff',
            secondaryColor: '#222b40',
            tertiaryColor: '#111827',
            lineColor: '#8abfff',
            textColor: '#eaf4ff',
            mainBkg: '#1b2233',
            secondBkg: '#222b40',
            clusterBkg: 'rgba(27, 34, 51, 0.88)',
            clusterBorder: '#8dc7ff',
            edgeLabelBackground: '#121827',
            nodeBorder: '#8dc7ff',
            fontFamily: 'FiraCode Nerd Font, Fira Code, JetBrains Mono, Noto Sans SC, Microsoft YaHei, sans-serif'
        };
    }

    function convertCodeBlocks() {
        if (!cfg.enableCodeblock) { return; }
        const selectors = [
            'pre code.language-mermaid',
            'pre code.lang-mermaid',
            'pre code.mermaid',
            'pre.mermaid code'
        ];
        document.querySelectorAll(selectors.join(',')).forEach((code) => {
            const pre = code.closest('pre');
            if (!pre || pre.dataset.bamConverted === '1') { return; }
            const raw = code.textContent || code.innerText || '';
            const decoded = decodeHtmlEntities(raw).trim();
            if (!decoded) { return; }
            const outer = document.createElement('div');
            outer.className = 'bam-mermaid-wrap';
            const div = document.createElement('div');
            div.className = 'mermaid bam-mermaid-diagram';
            div.textContent = decoded;
            outer.appendChild(div);
            pre.dataset.bamConverted = '1';
            pre.replaceWith(outer);
        });
    }

    function markContainers() {
        document.querySelectorAll('.mermaid').forEach((el) => {
            if (!el.closest('.bam-mermaid-wrap')) {
                const outer = document.createElement('div');
                outer.className = 'bam-mermaid-wrap';
                el.parentNode.insertBefore(outer, el);
                outer.appendChild(el);
            }
            el.classList.add('bam-mermaid-diagram');
        });
    }

    async function loadMermaid() {
        if (!cfg.mermaidUrl) { throw new Error('Missing Mermaid URL.'); }
        const mod = await import(cfg.mermaidUrl);
        return mod.default || mod;
    }

    async function boot() {
        try {
            convertCodeBlocks();
            markContainers();
            const diagrams = document.querySelectorAll('.mermaid');
            if (!diagrams.length) { return; }

            const mermaid = await loadMermaid();
            const mode = getThemeMode();
            document.documentElement.setAttribute('data-bam-mermaid-theme', mode);

            mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                securityLevel: cfg.securityLevel || 'strict',
                deterministicIds: true,
                themeVariables: getThemeVariables(mode),
                flowchart: { htmlLabels: false, curve: 'basis', padding: 16 },
                sequence: { mirrorActors: false, rightAngles: false },
                gantt: { fontSize: 14 }
            });

            await mermaid.run({ querySelector: '.mermaid' });
            document.documentElement.classList.add('bam-mermaid-ready');
        } catch (err) {
            console.error('[Babel Arcaea Mermaid] Render failed:', err);
            document.querySelectorAll('.bam-mermaid-wrap').forEach((wrap) => {
                wrap.classList.add('bam-mermaid-error');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
