(function () {
    'use strict';

    const cfg = window.BabelArcaeaMermaid || {};

    function debugLog(...args) {
        if (cfg.debugMode) {
            console.log('[Babel Arcaea Mermaid]', ...args);
        }
    }

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
                primaryColor: '#f6fbff',
                primaryTextColor: '#243246',
                primaryBorderColor: '#5ba8f5',
                secondaryColor: '#eef7ff',
                secondaryTextColor: '#243246',
                secondaryBorderColor: '#6fb6ff',
                tertiaryColor: '#ffffff',
                tertiaryTextColor: '#243246',
                tertiaryBorderColor: '#7cbcff',
                lineColor: '#3d8fd9',
                textColor: '#243246',
                mainBkg: '#f6fbff',
                secondBkg: '#eef7ff',
                nodeBorder: '#5ba8f5',
                clusterBkg: 'rgba(246, 251, 255, 0.94)',
                clusterBorder: '#6fb6ff',
                edgeLabelBackground: '#ffffff',
                titleColor: '#243246',
                labelTextColor: '#243246',
                actorBkg: '#f6fbff',
                actorBorder: '#5ba8f5',
                actorTextColor: '#243246',
                actorLineColor: '#5ba8f5',
                signalColor: '#243246',
                signalTextColor: '#243246',
                noteBkgColor: '#eef7ff',
                noteTextColor: '#243246',
                noteBorderColor: '#5ba8f5',
                fontFamily: 'FiraCode Nerd Font, Fira Code, JetBrains Mono, Noto Sans SC, Microsoft YaHei, sans-serif',
                fontSize: '15px'
            };
        }
        return {
            background: 'transparent',
            primaryColor: '#202a40',
            primaryTextColor: '#f2f8ff',
            primaryBorderColor: '#9fd2ff',
            secondaryColor: '#26334d',
            secondaryTextColor: '#f2f8ff',
            secondaryBorderColor: '#8dc7ff',
            tertiaryColor: '#121827',
            tertiaryTextColor: '#f2f8ff',
            tertiaryBorderColor: '#6fb6ff',
            lineColor: '#9fd2ff',
            textColor: '#f2f8ff',
            mainBkg: '#202a40',
            secondBkg: '#26334d',
            nodeBorder: '#9fd2ff',
            clusterBkg: 'rgba(32, 42, 64, 0.92)',
            clusterBorder: '#8dc7ff',
            edgeLabelBackground: '#151d2c',
            titleColor: '#f2f8ff',
            labelTextColor: '#f2f8ff',
            actorBkg: '#202a40',
            actorBorder: '#9fd2ff',
            actorTextColor: '#f2f8ff',
            actorLineColor: '#8dc7ff',
            signalColor: '#f2f8ff',
            signalTextColor: '#f2f8ff',
            noteBkgColor: '#1c2638',
            noteTextColor: '#f2f8ff',
            noteBorderColor: '#9fd2ff',
            fontFamily: 'FiraCode Nerd Font, Fira Code, JetBrains Mono, Noto Sans SC, Microsoft YaHei, sans-serif',
            fontSize: '15px'
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
        let count = 0;
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
            count++;
        });
        debugLog('Converted', count, 'Mermaid code blocks');
        return count;
    }

    function markContainers() {
        let count = 0;
        document.querySelectorAll('.mermaid').forEach((el) => {
            if (!el.closest('.bam-mermaid-wrap')) {
                const outer = document.createElement('div');
                outer.className = 'bam-mermaid-wrap';
                el.parentNode.insertBefore(outer, el);
                outer.appendChild(el);
                count++;
            }
            el.classList.add('bam-mermaid-diagram');
        });
        debugLog('Wrapped', count, 'Mermaid containers');
    }

    function normalizeRenderedSvgs() {
        document.querySelectorAll('.bam-mermaid-diagram svg').forEach((svg) => {
            svg.removeAttribute('height');
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                svg.style.width = '100%';
                svg.style.maxWidth = '100%';
                svg.style.height = 'auto';
            } else {
                svg.style.width = '100%';
                svg.style.height = 'auto';
            }
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        });
        debugLog('Normalized SVG dimensions');
    }

    function markRenderedContainers() {
        document.querySelectorAll('.bam-mermaid-wrap').forEach((wrap) => {
            const svg = wrap.querySelector('svg');
            if (!svg) { return; }
            wrap.classList.add('bam-mermaid-rendered');
            const rect = svg.getBoundingClientRect();
            if (rect.width < 480) {
                wrap.classList.add('bam-mermaid-small-graph');
                debugLog('Small graph detected:', rect.width, 'px');
            }
        });
    }

    async function loadMermaid() {
        if (!cfg.mermaidUrl) { throw new Error('Missing Mermaid URL.'); }
        debugLog('Loading Mermaid from:', cfg.mermaidUrl);
        const mod = await import(cfg.mermaidUrl);
        return mod.default || mod;
    }

    async function boot() {
        try {
            const converted = convertCodeBlocks();
            markContainers();
            const diagrams = document.querySelectorAll('.mermaid:not([data-processed="true"])');
            if (!diagrams.length) {
                debugLog('No Mermaid diagrams found');
                return;
            }
            debugLog('Found', diagrams.length, 'Mermaid diagrams to render');
            debugLog('Theme mode:', cfg.themeMode);
            debugLog('Security level:', cfg.securityLevel);

            const mermaid = await loadMermaid();
            const mode = getThemeMode();
            document.documentElement.setAttribute('data-bam-mermaid-theme', mode);

            mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                securityLevel: cfg.securityLevel || 'strict',
                deterministicIds: true,
                themeVariables: getThemeVariables(mode),
                flowchart: {
                    htmlLabels: false,
                    curve: 'basis',
                    padding: 24,
                    nodeSpacing: 48,
                    rankSpacing: 64,
                    diagramPadding: 16
                },
                sequence: {
                    mirrorActors: false,
                    rightAngles: false,
                    diagramMarginX: 32,
                    diagramMarginY: 24,
                    boxMargin: 12,
                    boxTextMargin: 8,
                    noteMargin: 10,
                    messageMargin: 40
                },
                gantt: { fontSize: 14 }
            });

            await mermaid.run({ querySelector: '.mermaid' });

            normalizeRenderedSvgs();
            markRenderedContainers();
            document.documentElement.classList.add('bam-mermaid-ready');

            diagrams.forEach(el => el.setAttribute('data-processed', 'true'));

            debugLog('Mermaid rendering complete');

            if (cfg.forceFullWidth) {
                document.querySelectorAll('.bam-mermaid-diagram svg').forEach(svg => {
                    svg.style.width = '100%';
                    svg.style.maxWidth = '100%';
                });
            }
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
