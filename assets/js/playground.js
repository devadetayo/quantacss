// playground.js

document.addEventListener('DOMContentLoaded', () => {
  // Preset snippets
  const presets = {
    default: `<form class="d-flex flex-col gap-5 p-4 md-px-12 md-py-8 w-full items-center">
  <div class="d-flex w-full md-w-80p lg-w-60p flex-col gap-2">
    <div class="d-flex flex-col gap-1">
      <label for="name" class="font-weight-medium text-sm text-slate-700 dark-text-slate-300">Full Name</label>
      <input type="text" id="name" placeholder="John Doe" class="quanta-form-input" />
    </div>
    <div class="d-flex flex-col gap-1">
      <label for="email" class="font-weight-medium text-sm text-slate-700 dark-text-slate-300">Email Address</label>
      <input type="email" id="email" placeholder="you@example.com" class="quanta-form-input" />
    </div>
    <div class="d-flex flex-col gap-1">
      <label for="message" class="font-weight-medium text-sm text-slate-700 dark-text-slate-300">Message</label>
      <textarea id="message" rows="2" placeholder="Leave a message..." class="quanta-textarea quanta-input-bordered"></textarea>
    </div>
    <div class="d-flex justify-between items-center">
      <label class="quanta-custom-checkbox d-flex items-center gap-2">
        <input type="checkbox" class="quanta-custom-checkbox-input"/>
        <span class="quanta-custom-checkbox-box"></span>
        <span class="text-slate-600 dark-text-slate-400">Subscribe to newsletter</span>
      </label>
      <button type="submit" class="quanta-btn quanta-btn-md quanta-btn-primary gap-2">
        Send 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      </button>
    </div>
  </div>
</form>`,
    card: '<div class="quanta-card p-4 bg-secondary">Card Content</div>'
  };

  // Elements
  const editor = document.getElementById('code-input');
  const cssEditor = document.getElementById('css-input'); // Custom CSS editor
  const previewFrame = document.getElementById('preview-frame');
  const generatedWrap = document.getElementById('generated-css-wrapper');
  const generatedCodeEl = document.querySelector('#generated-css');
  const layoutBtns = document.querySelectorAll('button[data-layout]');
  const deviceBtns = document.querySelectorAll('button[data-device]');
  const prettifyBtn = document.getElementById('prettify-code');
  const resetBtn = document.getElementById('reset-code');
  const copyBtn = document.getElementById('copy-code');
  const toggleGenBtn = document.getElementById('toggle-generated-css');
  const drawerToggle = document.querySelector('[data-toggle="drawer"]');
  const drawer = document.getElementById('components-drawer');
  const presetBtns = drawer.querySelectorAll('button[data-preset]');
  const container = document.getElementById('main-playground');
  const editorPanel = document.getElementById('editor-panel');
  const previewPanel = document.getElementById('preview-panel');
  const tabBtns = document.querySelectorAll('[data-tab]');
  const tabPanels = document.querySelectorAll('[data-tab-panel]');
  const resizer = document.getElementById('resizer');

  let quantaCssText = '';
  let quantaClasses = new Set();
  let updateTimer = null;
  let syntaxTimer = null;
  let isUpdating = false;
  let cssGenerationEnabled = false;
  let autocompleteDropdown = null;
  let currentEditor = null;
  let isResizing = false;

  // Load Quanta CSS and extract classes
  fetch('https://cdn.jsdelivr.net/npm/quanta-css@1.1.0/dist/quanta.min.css')
    .then(r => r.text())
    .then(txt => { 
      quantaCssText = txt; 
      extractQuantaClasses(txt);
      setup(); 
    })
    .catch(e => console.error('Could not load CSS:', e));

  function extractQuantaClasses(cssText) {
    // Extract all class names from the CSS
    const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
    let match;
    
    while ((match = classRegex.exec(cssText)) !== null) {
      const className = match[1];
      // Filter out pseudo-classes and complex selectors
      if (!className.includes(':') && !className.includes('[') && !className.includes('>')) {
        quantaClasses.add(className);
      }
    }
    
    console.log(`Extracted ${quantaClasses.size} Quanta CSS classes`);
  }

  function setup() {
    // Hide CSS wrapper by default
    generatedCodeEl.classList.add('d-none');
    
    // Set default content and highlight
    setEditorContent(presets.default);
    if (cssEditor) {
      setCSSEditorContent('/* Write your custom CSS here */');
    }
    updatePreview();

    // Setup tabs
    setupTabs();

    // Setup resizer
    setupResizer();

    // Setup autocomplete
    setupAutocomplete();

    // Event listeners for HTML editor
    editor.addEventListener('input', handleHTMLEditorInput);
    editor.addEventListener('paste', handlePaste);
    editor.addEventListener('keydown', handleKeydown);
    
    // Event listeners for CSS editor
    if (cssEditor) {
      cssEditor.addEventListener('input', handleCSSEditorInput);
      cssEditor.addEventListener('paste', handleCSSPaste);
      cssEditor.addEventListener('keydown', handleCSSKeydown);
    }
    
    // Button listeners
    prettifyBtn.addEventListener('click', () => {
      const formatted = prettyFormat(getEditorText());
      setEditorContent(formatted);
      updatePreview();
    });
    
    resetBtn.addEventListener('click', () => {
      setEditorContent(presets.default);
      if (cssEditor) {
        setCSSEditorContent('/* Write your custom CSS here */');
      }
      updatePreview();
    });
    
    copyBtn.addEventListener('click', () => { 
      const activeTab = document.querySelector('[data-tab].active');
      const text = activeTab?.dataset.tab === 'css' ? getCSSEditorText() : getEditorText();
      navigator.clipboard.writeText(text).then(() => alert('Copied!')); 
    });
    
    toggleGenBtn.addEventListener('click', () => {
      cssGenerationEnabled = !cssGenerationEnabled;
      
      if (cssGenerationEnabled) {
        generatedCodeEl.classList.toggle('d-none');
        updateGeneratedCSS(getEditorText());
      } else {
        generatedCodeEl.classList.toggle('d-none');
      }
      
      if (!generatedCodeEl.classList.contains('d-none')) {
        generatedWrap.style.maxHeight = '280px';
        toggleGenBtn.style.transform = 'rotate(180deg)';
      } else {
        generatedWrap.style.maxHeight = 'auto';
        toggleGenBtn.style.transform = 'rotate(180deg)';
      }
    });
    
    drawerToggle.addEventListener('click', () => drawer.classList.toggle('d-none'));
    
    presetBtns.forEach(btn => btn.addEventListener('click', () => {
      const preset = presets[btn.dataset.preset] || '';
      setEditorContent(preset);
      updatePreview();
    }));
    
    layoutBtns.forEach(btn => btn.addEventListener('click', () => switchLayout(btn.dataset.layout)));
    deviceBtns.forEach(btn => btn.addEventListener('click', () => previewFrame.style.width = btn.dataset.device));
  }

  function setupTabs() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab panel
        tabPanels.forEach(panel => {
          if (panel.dataset.tabPanel === tabId) {
            panel.classList.remove('d-none');
            panel.classList.add('d-flex');
          } else {
            panel.classList.add('d-none');
            panel.classList.remove('d-flex');
          }
        });
        
        // Update current editor reference
        currentEditor = tabId === 'css' ? cssEditor : editor;
      });
    });
  }

  function setupResizer() {
    if (!resizer) return;

    // Force flex layout
    container.style.display = 'flex';

    // Panels shouldn’t grow/shrink—only flex-basis matters
    [editorPanel, previewPanel].forEach(panel => {
      panel.style.flexGrow   = '0';
      panel.style.flexShrink = '0';
    });

    // Initial halves
    editorPanel.style.flexBasis  = '50%';
    previewPanel.style.flexBasis = '50%';

    // Mark resizer and inject styles once
    resizer.classList.add('resizer');
    if (!document.getElementById('resizer-styles')) {
      const s = document.createElement('style');
      s.id = 'resizer-styles';
      s.textContent = `
        .resizer {
          width: 6px;
          background: #e2e8f0;
          cursor: ew-resize;          /* <–– here */
          flex-shrink: 0;
          transition: background .2s;
        }
        .resizer.resizing { background: #3b82f6; }
        .no-select { user-select: none; }
      `;
      document.head.appendChild(s);
    }

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    function initDrag(e) {
      isResizing  = true;
      startX      = (e.touches ? e.touches[0] : e).clientX;
      startWidth  = editorPanel.getBoundingClientRect().width;
      resizer.classList.add('resizing');
      document.body.classList.add('no-select');

      document.addEventListener('mousemove', onDrag, { passive: false });
      document.addEventListener('mouseup',   stopDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend',  stopDrag);
      e.preventDefault();
    }

    function onDrag(e) {
      if (!isResizing) return;
      const clientX = (e.touches ? e.touches[0] : e).clientX;
      const dx      = clientX - startX;
      const total   = container.clientWidth;
      const min     = total * 0.2;
      const max     = total * 0.8;
      let newLeft   = startWidth + dx;
      newLeft = Math.max(min, Math.min(max, newLeft));

      const leftPct  = (newLeft / total) * 100;
      const rightPct = 100 - leftPct;

      editorPanel.style.flexBasis  = `${leftPct}%`;
      previewPanel.style.flexBasis = `${rightPct}%`;

      e.preventDefault();
    }

    function stopDrag() {
      isResizing = false;
      resizer.classList.remove('resizing');
      document.body.classList.remove('no-select');
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup',   stopDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend',  stopDrag);
    }

    resizer.addEventListener('mousedown', initDrag, { passive: false });
    resizer.addEventListener('touchstart', initDrag, { passive: false });
  }

  function setupAutocomplete() {
    // Create autocomplete dropdown
    autocompleteDropdown = document.createElement('div');
    autocompleteDropdown.className = 'autocomplete-dropdown';
    autocompleteDropdown.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(autocompleteDropdown);

    // Add autocomplete styles
    const style = document.createElement('style');
    style.textContent = `
      .autocomplete-dropdown {
        font-family: monospace;
        font-size: 14px;
      }
      .autocomplete-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }
      .autocomplete-item:hover,
      .autocomplete-item.selected {
        background-color: #f0f0f0;
      }
      .autocomplete-item:last-child {
        border-bottom: none;
      }
      [data-theme="dark"] .autocomplete-dropdown {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
      }
      [data-theme="dark"] .autocomplete-item {
        border-color: #4a5568;
      }
      [data-theme="dark"] .autocomplete-item:hover,
      [data-theme="dark"] .autocomplete-item.selected {
        background-color: #4a5568;
      }
    `;
    document.head.appendChild(style);

    // Setup autocomplete for HTML editor
    setupEditorAutocomplete(editor);
  }

  function setupEditorAutocomplete(editorEl) {
    let selectedIndex = -1;
    let currentSuggestions = [];

    editorEl.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        return;
      }

      const text = getTextAtCursor(editorEl);
      const classMatch = text.match(/class=["']([^"']*?)$/);
      
      if (classMatch) {
        const partial = classMatch[1].split(/\s+/).pop();
        if (partial.length > 0) {
          const suggestions = Array.from(quantaClasses)
            .filter(cls => cls.toLowerCase().includes(partial.toLowerCase()))
            .slice(0, 10);
          
          if (suggestions.length > 0) {
            showAutocomplete(suggestions, editorEl);
            currentSuggestions = suggestions;
            selectedIndex = -1;
          } else {
            hideAutocomplete();
          }
        } else {
          hideAutocomplete();
        }
      } else {
        hideAutocomplete();
      }
    });

    editorEl.addEventListener('keydown', (e) => {
      if (autocompleteDropdown.style.display === 'block') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
          updateAutocompleteSelection();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, -1);
          updateAutocompleteSelection();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedIndex >= 0) {
            insertAutocompleteSelection(editorEl, currentSuggestions[selectedIndex]);
          }
          hideAutocomplete();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          hideAutocomplete();
        }
      }
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (!autocompleteDropdown.contains(e.target) && e.target !== editorEl) {
        hideAutocomplete();
      }
    });
  }

  function getTextAtCursor(editorEl) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return '';
    
    const range = selection.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(editorEl);
    preRange.setEnd(range.startContainer, range.startOffset);
    
    return preRange.toString();
  }

  function showAutocomplete(suggestions, editorEl) {
    autocompleteDropdown.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = suggestion;
      item.addEventListener('click', () => {
        insertAutocompleteSelection(editorEl, suggestion);
        hideAutocomplete();
      });
      autocompleteDropdown.appendChild(item);
    });

    // Position dropdown
    const rect = editorEl.getBoundingClientRect();
    autocompleteDropdown.style.left = rect.left + 'px';
    autocompleteDropdown.style.top = (rect.bottom + 5) + 'px';
    autocompleteDropdown.style.display = 'block';
  }

  function hideAutocomplete() {
    autocompleteDropdown.style.display = 'none';
  }

  function updateAutocompleteSelection() {
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  function insertAutocompleteSelection(editorEl, suggestion) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textContent = editorEl.textContent;
    const cursorPos = range.startOffset;
    
    // Find the start of the current class name being typed
    const textBeforeCursor = textContent.substring(0, cursorPos);
    const classMatch = textBeforeCursor.match(/class=["']([^"']*?)$/);
    
    if (classMatch) {
      const fullMatch = classMatch[0];
      const classContent = classMatch[1];
      const lastSpaceIndex = classContent.lastIndexOf(' ');
      const partialClass = lastSpaceIndex >= 0 ? classContent.substring(lastSpaceIndex + 1) : classContent;
      
      // Replace the partial class with the full suggestion
      const beforeClass = textBeforeCursor.substring(0, textBeforeCursor.length - partialClass.length);
      const afterCursor = textContent.substring(cursorPos);
      
      const newContent = beforeClass + suggestion + afterCursor;
      setEditorContent(newContent);
      
      // Position cursor after the inserted class
      setTimeout(() => {
        const newRange = document.createRange();
        const textNode = editorEl.firstChild;
        if (textNode) {
          const newCursorPos = beforeClass.length + suggestion.length;
          newRange.setStart(textNode, Math.min(newCursorPos, textNode.textContent.length));
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }, 0);
    }
  }

  function handleHTMLEditorInput() {
    if (isUpdating) return;
    
    // Debounce preview updates
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      updatePreview();
    }, 300);
    
    // Debounce syntax highlighting
    clearTimeout(syntaxTimer);
    syntaxTimer = setTimeout(() => {
      highlightSyntax();
    }, 150);
  }

  function handleCSSEditorInput() {
    if (isUpdating) return;
    
    // Debounce preview updates
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      updatePreview();
    }, 300);
    
    // Debounce syntax highlighting for CSS
    clearTimeout(syntaxTimer);
    syntaxTimer = setTimeout(() => {
      highlightCSSSyntax();
    }, 150);
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    
    // Insert plain text at cursor position
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
    
    // Trigger update after paste
    setTimeout(() => {
      updatePreview();
      highlightSyntax();
    }, 10);
  }

  function handleCSSPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    
    // Insert plain text at cursor position
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
    
    // Trigger update after paste
    setTimeout(() => {
      updatePreview();
      highlightCSSSyntax();
    }, 10);
  }

  function handleKeydown(e) {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const tabNode = document.createTextNode('  '); // 2 spaces
      range.insertNode(tabNode);
      range.setStartAfter(tabNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function handleCSSKeydown(e) {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const tabNode = document.createTextNode('  '); // 2 spaces
      range.insertNode(tabNode);
      range.setStartAfter(tabNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function setEditorContent(html) {
    isUpdating = true;
    
    // Store cursor position
    const selection = window.getSelection();
    let cursorPos = 0;
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPos = range.startOffset;
    }

    // Set content and highlight
    editor.textContent = html;
    highlightSyntax();
    
    // Restore cursor position
    try {
      const range = document.createRange();
      const textNode = editor.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const pos = Math.min(cursorPos, textNode.textContent.length);
        range.setStart(textNode, pos);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      // Cursor positioning failed, continue without it
    }
    
    isUpdating = false;
  }

  function setCSSEditorContent(css) {
    if (!cssEditor) return;
    
    isUpdating = true;
    
    // Store cursor position
    const selection = window.getSelection();
    let cursorPos = 0;
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPos = range.startOffset;
    }

    // Set content and highlight
    cssEditor.textContent = css;
    highlightCSSSyntax();
    
    // Restore cursor position
    try {
      const range = document.createRange();
      const textNode = cssEditor.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const pos = Math.min(cursorPos, textNode.textContent.length);
        range.setStart(textNode, pos);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      // Cursor positioning failed, continue without it
    }
    
    isUpdating = false;
  }

  function getEditorText() {
    return editor.textContent || '';
  }

  function getCSSEditorText() {
    return cssEditor ? (cssEditor.textContent || '') : '';
  }

  function highlightSyntax() {
    if (isUpdating) return;
    
    const code = getEditorText();
    
    if (typeof Prism !== 'undefined') {
      // Store cursor position relative to text content
      const selection = window.getSelection();
      let cursorOffset = 0;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Get cursor position within the entire text content
        const preRange = document.createRange();
        preRange.selectNodeContents(editor);
        preRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preRange.toString().length;
      }

      // Apply syntax highlighting
      const highlighted = Prism.highlight(code, Prism.languages.html, 'html');
      editor.innerHTML = highlighted;
      
      // Restore cursor position
      restoreCursorPosition(editor, cursorOffset);
    }
  }

  function highlightCSSSyntax() {
    if (isUpdating || !cssEditor) return;
    
    const code = getCSSEditorText();
    
    if (typeof Prism !== 'undefined') {
      // Store cursor position relative to text content
      const selection = window.getSelection();
      let cursorOffset = 0;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Get cursor position within the entire text content
        const preRange = document.createRange();
        preRange.selectNodeContents(cssEditor);
        preRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preRange.toString().length;
      }

      // Apply syntax highlighting
      const highlighted = Prism.highlight(code, Prism.languages.css, 'css');
      cssEditor.innerHTML = highlighted;
      
      // Restore cursor position
      restoreCursorPosition(cssEditor, cursorOffset);
    }
  }

  function restoreCursorPosition(editorEl, cursorOffset) {
    // Restore cursor position
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      const walker = document.createTreeWalker(
        editorEl,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let currentOffset = 0;
      let targetNode = null;
      let targetOffset = 0;
      
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeText = node.textContent;
        const nodeLength = nodeText.length;
        
        if (currentOffset + nodeLength >= cursorOffset) {
          targetNode = node;
          targetOffset = cursorOffset - currentOffset;
          break;
        }
        currentOffset += nodeLength;
      }
      
      if (targetNode) {
        range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent.length));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: place cursor at the end
        range.selectNodeContents(editorEl);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      // Cursor restoration failed, place at end
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e2) {
        // Complete fallback
      }
    }
  }

  function updatePreview() {
    if (isUpdating) return;
    
    const htmlCode = getEditorText().trim();
    const cssCode = getCSSEditorText().trim();
    const doc = previewFrame.contentDocument;
    
    // Check if parent document has dark mode using data-theme
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                      document.body.getAttribute('data-theme') === 'dark';
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en" data-theme="${isDarkMode ? 'dark' : 'light'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${quantaCssText}
            
            /* Ensure iframe background respects dark mode */
            html[data-theme="dark"] {
              background-color: var(--quanta-slate-900);
            }
            
            html[data-theme="light"] {
              background-color: inherit;
            }
            
            body {
              background-color: inherit;
              color: inherit;
            }
            
            /* Custom CSS from user */
            ${cssCode}
          </style>
          <script>
            // Listen for dark mode changes from parent
            window.addEventListener('message', (event) => {
              if (event.data.type === 'darkModeChange') {
                document.documentElement.setAttribute('data-theme', event.data.isDark ? 'dark' : 'light');
              }
            });
          </script>
        </head>
        <body class="quanta-font-inter p-4">${htmlCode}</body>
      </html>
    `);
    doc.close();

    // Only update CSS if generation is enabled
    if (cssGenerationEnabled && htmlCode) {
      updateGeneratedCSS(htmlCode);
    }
  }

  // Listen for dark mode changes using data-theme attribute
  const darkModeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                          document.body.getAttribute('data-theme') === 'dark';
        
        if (previewFrame.contentWindow) {
          previewFrame.contentWindow.postMessage({
            type: 'darkModeChange',
            isDark: isDarkMode
          }, '*');
        }
      }
    });
  });

  // Observe changes to document element and body for data-theme attribute
  darkModeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  darkModeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  function updateGeneratedCSS(code) {
    // Only run if CSS generation is enabled
    if (!cssGenerationEnabled) return;
    
    // Extract classes from HTML
    const classRx = /class=["']([^"']+)["']/g;
    const classes = new Set();
    let m;
    while ((m = classRx.exec(code))) {
      m[1].split(/\s+/).forEach(c => c.trim() && classes.add(c.trim()));
    }

    // Find matching CSS rules (optimized to avoid excessive regex operations)
    let matchedRules = [];
    
    // Only process if we have a reasonable number of classes
    if (classes.size > 0 && classes.size < 100) {
      classes.forEach(cls => {
        // Escape special characters for regex
        const escapedClass = cls.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Look for rules that target this class specifically
        const patterns = [
          new RegExp(`\\.${escapedClass}(?![\\w-])[^{]*{[^}]*}`, 'g'), // .class
          new RegExp(`\\.${escapedClass}:[^{]*{[^}]*}`, 'g'), // .class:hover etc
          new RegExp(`\\.${escapedClass}\\s*>[^{]*{[^}]*}`, 'g'), // .class > child
          new RegExp(`\\.${escapedClass}\\s+[^{]*{[^}]*}`, 'g'), // .class descendant
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(quantaCssText))) {
            const rule = match[0].trim();
            if (!matchedRules.includes(rule)) {
              matchedRules.push(rule);
            }
          }
        });
      });
    }

    // Format and prettify CSS
    let cssOutput = '';
    if (matchedRules.length > 0) {
      cssOutput = matchedRules.join('\n\n');
      cssOutput = prettifyCSS(cssOutput);
    } else {
      cssOutput = '/* No matching CSS rules found */';
    }

    // Update generated CSS display
    generatedCodeEl.textContent = cssOutput;
    generatedCodeEl.className = 'language-css css-collapse';
    
    // Highlight with Prism if available
    if (typeof Prism !== 'undefined') {
      Prism.highlightElement(generatedCodeEl);
    }
  }

  function prettifyCSS(css) {
    return css
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n\n')
      .replace(/,\s*/g, ',\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  function switchLayout(mode) {
    // Clear all layout classes first
    container.classList.remove('flex-col', 'flex-row', 'md-flex-row');
    editorPanel.classList.remove('d-none', 'w-full', 'w-1/2');
    previewPanel.classList.remove('d-none', 'w-full', 'w-1/2');

    // Apply layout based on mode
    switch (mode) {
      case 'full':
        container.classList.add('flex-row');
        editorPanel.classList.add('d-none');
        previewPanel.classList.add('w-full');
        previewPanel.style.flex = '0 0 100%';
        break;
        
      case 'split':
        container.classList.add('flex-row');
        editorPanel.classList.add('w-1/2');
        previewPanel.classList.add('w-1/2');
        break;
        
      case 'stack':
        container.classList.add('flex-col');
        editorPanel.classList.add('w-full');
        previewPanel.classList.add('w-full');
        break;
        
      default:
        // Default to split view
        container.classList.add('flex-row');
        editorPanel.classList.add('w-1/2');
        previewPanel.classList.add('w-1/2');
    }
  }

  // Improved prettify: indent tags properly
  function prettyFormat(html) {
    try {
      // Clean up the HTML first
      html = html.trim();
      
      // Simple but effective HTML formatter
      let formatted = html
        .replace(/></g, '>\n<')  // Add newlines between tags
        .replace(/^\s+|\s+$/gm, '')  // Remove leading/trailing whitespace
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      let result = '';
      let indent = 0;
      const indentStr = '  ';
      
      for (let i = 0; i < formatted.length; i++) {
        const line = formatted[i];
        
        // Decrease indent for closing tags
        if (line.startsWith('</')) {
          indent = Math.max(0, indent - 1);
        }
        
        // Add current line with proper indentation
        result += indentStr.repeat(indent) + line + '\n';
        
        // Increase indent for opening tags (but not self-closing or if next is closing)
        if (line.startsWith('<') && 
            !line.startsWith('</') && 
            !line.endsWith('/>') && 
            !line.includes('</')) {
          const nextLine = formatted[i + 1];
          if (nextLine && !nextLine.startsWith('</')) {
            indent++;
          }
        }
      }
      
      return result.trim();
    } catch (e) {
      console.error('Prettify error:', e);
      return html; // Return original if parsing fails
    }
  }
});