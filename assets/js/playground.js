// assets/js/playground.js
// Dependencies: ace.js, split.js must be loaded first

document.addEventListener('DOMContentLoaded', () => {
  // ========== Grab containers ==========
  const section     = document.querySelector('.playground');
  const editorPane  = section.querySelector('.editor-pane');
  const previewPane = section.querySelector('.preview-pane');
  const wrapper     = section.querySelector('.position-relative');

  // ========== Inject ACE Editor Panes ==========
  wrapper.innerHTML = `
    <div class="editor-container d-flex flex-1 w-full">
      <div id="ace-editor-html" class="ace-editor-pane"></div>
      <div id="ace-editor-css"  class="ace-editor-pane"></div>
      <div id="ace-editor-js"   class="ace-editor-pane"></div>
    </div>
  `;

  // ========== Initialize ACE Editors ==========
  const editors = {
    html: ace.edit('ace-editor-html', { theme: 'ace/theme/dracula', wrap: true, showPrintMargin: false }),
    css:  ace.edit('ace-editor-css',  { theme: 'ace/theme/dracula', wrap: true, showPrintMargin: false }),
    js:   ace.edit('ace-editor-js',   { theme: 'ace/theme/dracula', wrap: true, showPrintMargin: false }),
  };
  Object.values(editors).forEach(e => e.renderer.setScrollMargin(8, 8));

  // ========== Create Sessions ==========
  const sessions = {
    html: ace.createEditSession(`<!-- Sample Form -->\n<form class=\"lz-form max-w-md mx-auto\">\n  <div class=\"lz-form-group\">\n    <label class=\"lz-form-label\">Username</label>\n    <input type=\"text\" class=\"lz-form-input\" placeholder=\"johndoe\"/>\n  </div>\n  <div class=\"lz-form-group\">\n    <label class=\"lz-form-label\">Password</label>\n    <input type=\"password\" class=\"lz-form-input\" placeholder=\"••••••\"/>\n  </div>\n  <button type=\"submit\" class=\"lz-button bg-primary text-white px-4 py-2 rounded\">Log In</button>\n</form>`, 'ace/mode/html'),
    css: ace.createEditSession('/* Your CSS here */', 'ace/mode/css'),
    js:  ace.createEditSession('// Your JS here',     'ace/mode/javascript'),
  };
  Object.entries(sessions).forEach(([key, session]) => {
    session.setValue(session.getValue(), 1);
    editors[key].setSession(session);
  });

  // ========== Live Preview Update ==========
  const preview = document.getElementById('preview-frame');
  function updatePreview() {
    const h = sessions.html.getValue();
    const c = sessions.css.getValue();
    const j = sessions.js.getValue();

    preview.srcdoc = `<!DOCTYPE html>
<html><head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<link href='https://cdn.jsdelivr.net/npm/quanta-css@1.0.8/dist/quanta.css' rel='stylesheet'>
<style>${c}</style>
</head><body>${h}<script>${j}<\/script></body></html>`;
  }
  Object.values(sessions).forEach(s => s.on('change', updatePreview));
  updatePreview();

  // ========== Tab Switching ==========
  let current = 'html';
  function switchTab(to) {
    if (to === current) return;
    document.getElementById(`tab-${current}`).classList.remove('active');
    document.getElementById(`tab-${to}`).classList.add('active');

    wrapper.querySelectorAll('.ace-editor-pane').forEach(el => el.style.display = 'none');
    wrapper.querySelector(`#ace-editor-${to}`).style.display = 'block';
    current = to;
  }
  ['html', 'css', 'js'].forEach(tab => {
    document.getElementById(`tab-${tab}`).addEventListener('click', () => switchTab(tab));
  });

  // ========== Copy & Reset ==========
  document.getElementById('copy-btn').addEventListener('click', () => {
    const content = `${sessions.html.getValue()}\n/* CSS */\n${sessions.css.getValue()}\n/* JS */\n${sessions.js.getValue()}`;
    navigator.clipboard.writeText(content).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.innerHTML = 'Copied!';
      setTimeout(() => btn.innerHTML = 'Copy', 1500);
    });
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    Object.values(sessions).forEach(s => s.setValue(s.getValue(), 1));
    updatePreview();
  });

  // ========== Layout Handling ==========
  let splits = [];
  function destroySplits() {
    splits.forEach(s => s.destroy?.());
    splits = [];
  }

  function setupLayout(layout) {
    destroySplits();

    section.className     = 'playground d-flex flex-1 p-4 md-p-6 pt-20 flex-row gap-2 min-h-full';
    editorPane.className  = 'editor-pane w-full d-flex flex-col';
    previewPane.className = 'preview-pane w-full p-4 bg-white';
    wrapper.style.height  = '100%';
    editorPane.style.height = '';
    wrapper.querySelectorAll('.ace-editor-pane').forEach(el => el.style.display = 'none');

    if (layout === 'lr' || layout === 'rl') {
      wrapper.querySelector(`#ace-editor-${current}`).style.display = 'block';
      section.classList.add(layout === 'lr' ? 'md-flex-row' : 'md-flex-row-reverse');

      splits.push(Split([editorPane, previewPane], {
        sizes: [50, 50], minSize: [300, 300], gutterSize: 12,
        elementStyle: (dim, size, gutter) => ({ flexBasis: `calc(${size}% - ${gutter}px)` }),
        gutterStyle:  (dim, gutter) => ({ width: `${gutter}px` }),
        onDrag: () => document.body.style.cursor = 'ew-resize',
        onDragEnd: () => {
          document.body.style.cursor = '';
          Object.values(editors).forEach(e => e.resize());
        }
      }));
    }

    if (layout === 'stack') {
      section.classList.add('stack', 'flex-col');
      editorPane.style.height = '50%';
      previewPane.style.height = '50%';

      const row = wrapper.querySelector('.editor-container');
      row.style.display = 'flex';

      ['html', 'css', 'js'].forEach(n => {
        const el = wrapper.querySelector(`#ace-editor-${n}`);
        el.style.display = 'block';
        el.style.flex = '1';
        el.style.maxWidth = '100%';
        el.style.height = '100%';
      });

      splits.push(Split([editorPane, previewPane], {
        direction: 'vertical', sizes: [50, 50], minSize: [200, 200], gutterSize: 12,
        elementStyle: (d, s, g) => ({ height: `calc(${s}% - ${g}px)` }),
        gutterStyle: (d, g) => ({ height: `${g}px` }),
        onDrag: () => document.body.style.cursor = 'ns-resize',
        onDragEnd: () => {
          document.body.style.cursor = '';
          Object.values(editors).forEach(e => e.resize());
        }
      }));
    }

    if (layout === 'responsive') {
      section.className = 'playground flex-1 p-4 md-p-6 pt-20 flex-col min-h-full';
      editorPane.style.display = 'none';
      previewPane.style.flex = '1';
      previewPane.style.height = '100%';
      previewPane.className = 'preview-pane w-full p-4 bg-white';
      return;
    }

    setTimeout(() => Object.values(editors).forEach(e => e.resize()), 0);
  }

  // ========== New Layout Buttons ==========
  document.querySelectorAll('.layout-btn[data-layout]').forEach(btn => {
    btn.addEventListener('click', () => {
      const layout = btn.dataset.layout;
      setupLayout(layout);
    });
  });

  // ========== Init ==========
  setupLayout('lr');
  window.addEventListener('resize', () => Object.values(editors).forEach(e => e.resize()));
});
