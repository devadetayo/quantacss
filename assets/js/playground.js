// assets/js/playground.js
// Dependencies: ace.js, split.js must be loaded first

document.addEventListener('DOMContentLoaded', () => {
  // 1) Grab containers
  const section     = document.querySelector('.playground');
  const editorPane  = section.querySelector('.editor-pane');
  const previewPane = section.querySelector('.preview-pane');
  const wrapper     = section.querySelector('.position-relative');

  // 2) Inject the three ACE editor panes
  wrapper.innerHTML = `
    <div class="editor-container" style="display:flex; flex:1; width:100%;">
      <div id="ace-editor-html" class="ace-editor-pane"></div>
      <div id="ace-editor-css"  class="ace-editor-pane"></div>
      <div id="ace-editor-js"   class="ace-editor-pane"></div>
    </div>
  `;

  // 3) Initialize ACE editors & sessions
  const editors = {
    html: ace.edit('ace-editor-html', { theme:'ace/theme/dracula', wrap:true, showPrintMargin:false }),
    css:  ace.edit('ace-editor-css',  { theme:'ace/theme/dracula', wrap:true, showPrintMargin:false }),
    js:   ace.edit('ace-editor-js',   { theme:'ace/theme/dracula', wrap:true, showPrintMargin:false }),
  };
  Object.values(editors).forEach(e => e.renderer.setScrollMargin(8,8));

  const sessions = {
    html: ace.createEditSession(
      `<form class="lz-form max-w-md mx-auto">
  <div class="lz-form-group">
    <label class="lz-form-label">Username</label>
    <input type="text" class="lz-form-input" placeholder="johndoe"/>
  </div>
  <div class="lz-form-group">
    <label class="lz-form-label">Password</label>
    <input type="password" class="lz-form-input" placeholder="••••••"/>
  </div>
  <div class="lz-form-group flex items-center gap-2">
    <label class="lz-checkbox flex items-center gap-2">
      <input type="checkbox" class="lz-checkbox-input"/>
      <span class="lz-checkbox-box"></span>
      <span class="lz-checkbox-label">Remember me</span>
    </label>
  </div>
  <button type="submit" class="lz-button bg-primary text-white px-4 py-2 rounded">
    Log In
  </button>
</form>`, 'ace/mode/html'),
    css: ace.createEditSession('/* Your CSS here */', 'ace/mode/css'),
    js:  ace.createEditSession('// Your JS here',        'ace/mode/javascript'),
  };
  Object.entries(sessions).forEach(([k,s]) => {
    s.setValue(s.getValue(), 1);
    editors[k].setSession(s);
  });

  // 4) Live preview
  const preview = document.getElementById('preview-frame');
  function updatePreview() {
    const h = sessions.html.getValue(),
          c = sessions.css .getValue(),
          j = sessions.js  .getValue();
    preview.srcdoc = `
      <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/litezen-css@1.1.6/dist/litezen.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/litezen-css@1.1.6/dist/utilities.css" rel="stylesheet">
        <style>${c}</style>
      </head><body>
        ${h}
        <script>${j}<\/script>
      </body></html>
    `;
  }
  Object.values(sessions).forEach(s => s.on('change', updatePreview));
  updatePreview();

  // 5) Tabs
  let current = 'html', currentLayout = 'lr', splits = [];
  function switchTab(to) {
    if (to === current && currentLayout !== 'stack') return;
    document.getElementById(`tab-${current}`).classList.remove('active');
    document.getElementById(`tab-${to}`     ).classList.add('active');
    if (currentLayout !== 'stack') {
      wrapper.querySelectorAll('.ace-editor-pane').forEach(el => el.style.display = 'none');
      wrapper.querySelector(`#ace-editor-${to}`).style.display = 'block';
    }
    current = to;
  }
  ['html','css','js'].forEach(n => {
    document.getElementById(`tab-${n}`).addEventListener('click', () => switchTab(n));
  });

  // 6) Copy & Reset
  document.getElementById('copy-btn').addEventListener('click', () => {
    const text = [
      sessions.html.getValue(),
      "\n/* CSS */\n", sessions.css .getValue(),
      "\n/* JS */\n", sessions.js  .getValue()
    ].join('');
    navigator.clipboard.writeText(text).then(() => {
      const b = document.getElementById('copy-btn');
      b.innerHTML = 'Copied!';
      setTimeout(() => b.innerHTML = 'Copy', 1500);
    });
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    Object.values(sessions).forEach(s => s.setValue(s.getValue(), 1));
    updatePreview();
  });

  // 7) Split.js helpers
  function destroySplits() {
    splits.forEach(s => s.destroy && s.destroy());
    splits = [];
  }

  // 8) Layout setup
  function setupLayout(layout) {
    destroySplits();
    currentLayout = layout;

    // Reset classes & hide editors
    section.className     = 'playground d-flex flex-1 pt-24 px-4 md-px-8 lg-px-16 pb-8 flex-col gap-2';
    editorPane.className  = 'editor-pane w-full d-flex flex-col';
    previewPane.className = 'preview-pane w-full p-4 bg-white';
    wrapper.style.height  = '100%';
    wrapper.querySelectorAll('.ace-editor-pane').forEach(el => el.style.display = 'none');
    editorPane.style.height = '';

    if (layout === 'lr' || layout === 'rl') {
      // side-by-side
      wrapper.querySelector(`#ace-editor-${current}`).style.display = 'block';
      section.classList.add(layout==='lr'?'md-flex-row':'md-flex-row-reverse');
      splits.push( Split([ editorPane, previewPane ], {
        sizes: [50,50], minSize:[300,300], gutterSize:12,
        elementStyle:(d,s,g)=>({ 'flex-basis':`calc(${s}% - ${g}px)` }),
        gutterStyle:(d,g)=>({ width:`${g}px` }),
        onDrag:    ()=>document.body.style.cursor='ew-resize',
        onDragEnd: ()=>{ document.body.style.cursor=''; Object.values(editors).forEach(e=>e.resize()); }
      }) );

    } else if (layout === 'stack') {
      // three-column top + preview bottom
      section.classList.add('stack','flex-col');
      editorPane.style.height = '50%';

      const editorRow = wrapper.querySelector('.editor-container');
      editorRow.style.display = 'flex';

      ['html','css','js'].forEach(n => {
        const el = wrapper.querySelector(`#ace-editor-${n}`);
        el.style.display = 'block';
        el.style.flex    = '0 0 33.3333%';
        el.style.maxWidth= '33.3333%';
        el.style.height  = '100%';
      });
      previewPane.style.height = '50%';

      // 1) Horizontal gutter for the three editors
      splits.push( Split(
        ['#ace-editor-html','#ace-editor-css','#ace-editor-js'], {
          direction:   'horizontal',
          sizes:       [33.33,33.33,33.34],
          minSize:     100,
          gutterSize:  12,
          elementStyle:(d,s,g)=>({ 'flex-basis':`calc(${s}% - ${g}px)` }),
          gutterStyle: (d,g)=>({ width:`${g}px` }),
          onDrag:    ()=>document.body.style.cursor='ew-resize',
          onDragEnd: ()=>{ document.body.style.cursor=''; Object.values(editors).forEach(e=>e.resize()); }
        }
      ));

      // 2) Vertical gutter between editorRow & preview
      splits.push( Split([ editorPane, previewPane ], {
        direction:   'vertical',
        sizes:       [50,50],
        minSize:     [200,200],
        gutterSize:  12,
        elementStyle:(d,s,g)=>({ height:`calc(${s}% - ${g}px)` }),
        gutterStyle: (d,g)=>({ height:`${g}px` }),
        onDrag:    ()=>document.body.style.cursor='ns-resize',
        onDragEnd: ()=>{ document.body.style.cursor=''; Object.values(editors).forEach(e=>e.resize()); }
      }) );
    }

    // force ACE editors to repaint
    setTimeout(()=>Object.values(editors).forEach(e=>e.resize()), 0);
  }

  // 9) Layout dropdown wiring
  document.getElementById('layout-toggle').addEventListener('click', e => {
    document.getElementById('layout-menu').classList.toggle('d-none');
    e.stopPropagation();
  });
  document.addEventListener('click', () => {
    document.getElementById('layout-menu').classList.add('d-none');
  });
  document.querySelectorAll('[data-layout]').forEach(btn => {
    btn.addEventListener('click', () => {
      setupLayout(btn.dataset.layout);
      document.getElementById('layout-menu').classList.add('d-none');
    });
  });

  // 10) Kick things off
  setupLayout('lr');
  window.addEventListener('resize', ()=>Object.values(editors).forEach(e=>e.resize()));
});