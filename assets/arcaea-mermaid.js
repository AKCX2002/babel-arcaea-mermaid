(function () {
  'use strict';

  const LOG = '[Babel Arcaea Mermaid]';

  /* ── Step 1: Mark Mermaid code blocks so Prism ignores them ── */
  function protectMermaidFromPrism(root) {
    root.querySelectorAll(
      'pre > code.language-mermaid, pre > code.lang-mermaid'
    ).forEach((code) => {
      const pre = code.closest('pre');
      if (!pre) return;

      pre.classList.add(
        'no-toolbar',
        'no-highlight',
        'notranslate',
        'arcaea-mermaid-source'
      );

      code.classList.add(
        'no-toolbar',
        'no-highlight',
        'language-none'
      );

      code.removeAttribute('data-language');
    });
  }

  /* ── Step 2: Replace <pre><code> with <div class="mermaid"> ── */
  function convertMermaidCodeBlocks(root) {
    root.querySelectorAll(
      'pre > code.language-mermaid, pre > code.lang-mermaid'
    ).forEach((code, index) => {
      const pre = code.closest('pre');
      if (!pre || pre.dataset.arcaeaMermaidConverted === '1') return;

      const source = code.textContent || '';
      if (!source.trim()) return;

      const box = document.createElement('div');
      box.className = 'arcaea-mermaid-box';

      const diagram = document.createElement('div');
      diagram.className = 'mermaid arcaea-mermaid-diagram';
      diagram.dataset.processed = 'false';
      diagram.dataset.arcaeaMermaidId = String(index + 1);
      diagram.textContent = source;

      box.appendChild(diagram);
      pre.dataset.arcaeaMermaidConverted = '1';
      pre.replaceWith(box);
    });
  }

  /* ── Load Mermaid ESM ── */
  async function loadMermaid() {
    if (window.mermaid) return window.mermaid;

    const moduleUrl =
      'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.esm.min.mjs';

    const mod = await import(moduleUrl);
    window.mermaid = mod.default;
    return window.mermaid;
  }

  /* ── Step 3: Render all .mermaid elements ── */
  async function renderMermaid(root) {
    protectMermaidFromPrism(root);
    convertMermaidCodeBlocks(root);

    const diagrams = root.querySelectorAll(
      '.mermaid.arcaea-mermaid-diagram:not([data-arcaea-rendered="1"])'
    );

    if (!diagrams.length) return;

    const mermaid = await loadMermaid();

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      flowchart: {
        htmlLabels: false,
        curve: 'basis',
        padding: 24,
        nodeSpacing: 48,
        rankSpacing: 64
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
      themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#202a40',
        primaryTextColor: '#f2f8ff',
        primaryBorderColor: '#9fd2ff',
        lineColor: '#9fd2ff',
        secondaryColor: '#26334d',
        tertiaryColor: '#121827',
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
      }
    });

    await mermaid.run({
      nodes: diagrams,
      suppressErrors: true
    });

    /* Normalize SVGs after render */
    diagrams.forEach((el) => {
      el.dataset.arcaeaRendered = '1';
      const svg = el.querySelector('svg');
      if (svg) {
        svg.removeAttribute('height');
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      }
    });

    console.log(LOG, 'Mermaid rendered:', diagrams.length);
  }

  /* ── Bind to page lifecycle ── */
  document.addEventListener('DOMContentLoaded', () => {
    renderMermaid(document).catch((err) => console.error(LOG, err));
  });

  window.addEventListener('load', () => {
    renderMermaid(document).catch((err) => console.error(LOG, err));
  });

  /* Sakurairo PJAX support */
  document.addEventListener('pjax:complete', () => {
    renderMermaid(document).catch((err) => console.error(LOG, err));
  });

  document.addEventListener('pjax:end', () => {
    renderMermaid(document).catch((err) => console.error(LOG, err));
  });

  window.BabelArcaeaMermaidRender = renderMermaid;
})();
