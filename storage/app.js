/* ── FileVault App ──────────────────────────────────────────────────────────── */

// State
const S = {
  supabase: null,
  user: null,
  currentPath: '',       // relative path inside user folder (empty = root)
  currentView: 'files',  // 'files' | 'shared'
  viewMode: 'grid',      // 'grid' | 'list'
  ctxTarget: null,       // { name, isFolder, storagePath }
  sharedLinks: [],       // locally tracked shared links
  searchTimer: null,
  allFiles: [],          // flat cache for search
};

// ── Init ─────────────────────────────────────────────────────────────────────

async function initApp() {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('YOUR-PROJECT')) {
    showAuthError('Please fill in your Supabase credentials in config.js');
    document.getElementById('auth-submit').disabled = true;
    return;
  }

  S.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const { data: { session } } = await S.supabase.auth.getSession();
  if (session) {
    S.user = session.user;
    enterDashboard();
  }

  S.supabase.auth.onAuthStateChange((_event, session) => {
    S.user = session?.user ?? null;
    if (S.user) { enterDashboard(); }
    else { enterAuth(); }
  });

  attachListeners();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function enterAuth() {
  document.getElementById('view-auth').classList.remove('hidden');
  document.getElementById('view-dashboard').classList.add('hidden');
}

async function enterDashboard() {
  document.getElementById('view-auth').classList.add('hidden');
  document.getElementById('view-dashboard').classList.remove('hidden');

  const email = S.user.email ?? '';
  document.getElementById('user-email-display').textContent = email;
  document.getElementById('user-avatar').textContent = email.charAt(0).toUpperCase();

  await loadFiles('');
  updateStorageUsage();
}

// ── Listeners ─────────────────────────────────────────────────────────────────

function attachListeners() {
  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isRegister = tab.dataset.tab === 'register';
      document.getElementById('field-name').style.display = isRegister ? 'flex' : 'none';
      document.getElementById('auth-btn-text').textContent = isRegister ? 'Create Account' : 'Sign In';
      document.getElementById('auth-error').style.display = 'none';
    });
  });

  // Auth form
  document.getElementById('auth-form').addEventListener('submit', handleAuth);

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await S.supabase.auth.signOut();
    S.currentPath = '';
  });

  // Sidebar nav
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const nav = link.dataset.nav;
      document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      switchView(nav);
    });
  });

  // Upload buttons
  document.getElementById('upload-btn-sidebar').addEventListener('click', () => triggerUpload());
  document.getElementById('upload-btn-empty').addEventListener('click', () => triggerUpload());

  // File input
  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files.length > 0) uploadFiles(Array.from(e.target.files));
    e.target.value = '';
  });

  // New folder
  document.getElementById('new-folder-btn').addEventListener('click', () => openModal('modal-folder'));
  document.getElementById('folder-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') createFolder();
  });
  document.getElementById('create-folder-confirm').addEventListener('click', createFolder);

  // Rename
  document.getElementById('rename-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmRename();
  });
  document.getElementById('rename-confirm').addEventListener('click', confirmRename);

  // Share
  document.getElementById('generate-link-btn').addEventListener('click', generateShareLink);
  document.getElementById('copy-link-btn').addEventListener('click', copyShareLink);

  // Delete
  document.getElementById('delete-confirm').addEventListener('click', confirmDelete);

  // Modal close buttons
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // View toggle
  document.getElementById('btn-grid-view').addEventListener('click', () => setViewMode('grid'));
  document.getElementById('btn-list-view').addEventListener('click', () => setViewMode('list'));

  // Drag & drop
  const main = document.getElementById('main-content');
  main.addEventListener('dragover', e => { e.preventDefault(); showDropOverlay(); });
  main.addEventListener('dragleave', e => {
    if (!main.contains(e.relatedTarget)) hideDropOverlay();
  });
  main.addEventListener('drop', e => {
    e.preventDefault(); hideDropOverlay();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  });

  // Context menu global close
  document.addEventListener('click', () => closeCtxMenu());
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCtxMenu();
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    }
  });

  // Context menu actions
  document.getElementById('ctx-menu').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !S.ctxTarget) return;
    const action = btn.dataset.action;
    const target = S.ctxTarget;
    closeCtxMenu();
    if (action === 'download') downloadFile(target);
    else if (action === 'share') openShareModal(target);
    else if (action === 'rename') openRenameModal(target);
    else if (action === 'delete') openDeleteModal(target);
  });

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(S.searchTimer);
    S.searchTimer = setTimeout(() => handleSearch(e.target.value.trim()), 250);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.header__search')) hideSearch();
  });
}

// ── Auth Handler ──────────────────────────────────────────────────────────────

async function handleAuth(e) {
  e.preventDefault();
  const isRegister = document.querySelector('.auth-tab.active').dataset.tab === 'register';
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();

  if (!email || !password) { showAuthError('Please fill in all fields'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }

  const spinner = document.getElementById('auth-spinner');
  const btn = document.getElementById('auth-submit');
  spinner.classList.remove('hidden');
  document.getElementById('auth-btn-text').style.display = 'none';
  btn.disabled = true;
  hideAuthError();

  let result;
  if (isRegister) {
    result = await S.supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name || email.split('@')[0] } }
    });
    if (!result.error && result.data.user && !result.data.session) {
      showAuthError('Check your email for a confirmation link!');
      spinner.classList.add('hidden');
      document.getElementById('auth-btn-text').style.display = '';
      btn.disabled = false;
      return;
    }
  } else {
    result = await S.supabase.auth.signInWithPassword({ email, password });
  }

  spinner.classList.add('hidden');
  document.getElementById('auth-btn-text').style.display = '';
  btn.disabled = false;
  if (result.error) showAuthError(result.error.message);
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg; el.style.display = 'block';
}
function hideAuthError() {
  document.getElementById('auth-error').style.display = 'none';
}

// ── View Switching ────────────────────────────────────────────────────────────

function switchView(nav) {
  S.currentView = nav === 'shared' ? 'shared' : 'files';
  document.getElementById('view-files').classList.toggle('hidden', nav !== 'my-files');
  document.getElementById('view-shared').classList.toggle('hidden', nav !== 'shared');
  if (nav === 'shared') renderSharedLinks();
}

// ── File Loading ──────────────────────────────────────────────────────────────

async function loadFiles(relativePath) {
  S.currentPath = relativePath;
  updateBreadcrumb(relativePath);
  setFileState('loading');

  const storagePath = userPath(relativePath);
  const { data, error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .list(storagePath, { limit: 500, offset: 0, sortBy: { column: 'name', order: 'asc' } });

  if (error) {
    setFileState('empty');
    showToast('Failed to load files: ' + error.message, 'error');
    return;
  }

  // filter out .keep placeholder files
  const items = (data || []).filter(f => f.name !== '.keep');
  S.allFiles = items.map(f => ({ ...f, relativePath }));

  if (items.length === 0) { setFileState('empty'); return; }
  setFileState('loaded');
  renderFiles(items, relativePath);
  updateStorageUsage();
}

function setFileState(state) {
  document.getElementById('file-container').innerHTML = '';
  document.getElementById('state-loading').classList.add('hidden');
  document.getElementById('state-empty').classList.add('hidden');
  if (state === 'loading') document.getElementById('state-loading').classList.remove('hidden');
  else if (state === 'empty') document.getElementById('state-empty').classList.remove('hidden');
}

function renderFiles(items, relativePath) {
  const container = document.getElementById('file-container');
  container.innerHTML = '';

  // Folders first
  const folders = items.filter(f => f.id === null);
  const files = items.filter(f => f.id !== null);
  [...folders, ...files].forEach(item => {
    const el = item.id === null
      ? makeFolder(item, relativePath)
      : makeFile(item, relativePath);
    container.appendChild(el);
  });
}

// ── File / Folder Elements ────────────────────────────────────────────────────

function makeFolder(item, relativePath) {
  const subPath = relativePath ? `${relativePath}/${item.name}` : item.name;
  const storagePath = userPath(subPath);
  const target = { name: item.name, isFolder: true, storagePath, relativePath: subPath };

  if (S.viewMode === 'list') {
    const row = document.createElement('div');
    row.className = 'file-row folder';
    row.innerHTML = `
      <div class="row-icon icon-folder">${iconFolder()}</div>
      <div class="row-name">${esc(item.name)}</div>
      <div class="row-size">—</div>
      <div class="row-date">—</div>
      <button class="row-menu" title="Options">${iconDots()}</button>`;
    row.querySelector('.row-menu').addEventListener('click', e => { e.stopPropagation(); openCtxMenu(e, target); });
    row.addEventListener('click', e => { if (!e.target.closest('.row-menu')) loadFiles(subPath); });
    return row;
  }

  const card = document.createElement('div');
  card.className = 'file-card folder';
  card.innerHTML = `
    <div class="card-icon icon-folder">${iconFolder(40)}</div>
    <div class="card-info">
      <span class="card-name" title="${esc(item.name)}">${esc(item.name)}</span>
      <span class="card-meta">Folder</span>
    </div>
    <button class="card-menu" title="Options">${iconDots()}</button>`;
  card.querySelector('.card-menu').addEventListener('click', e => { e.stopPropagation(); openCtxMenu(e, target); });
  card.addEventListener('click', e => { if (!e.target.closest('.card-menu')) loadFiles(subPath); });
  return card;
}

function makeFile(item, relativePath) {
  const storagePath = userPath(relativePath ? `${relativePath}/${item.name}` : item.name);
  const target = { name: item.name, isFolder: false, storagePath, relativePath };
  const iconEl = fileIcon(item.name);
  const size = formatBytes(item.metadata?.size ?? 0);
  const date = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—';

  if (S.viewMode === 'list') {
    const row = document.createElement('div');
    row.className = 'file-row';
    row.innerHTML = `
      <div class="row-icon ${iconEl.cls}">${iconEl.svg}</div>
      <div class="row-name" title="${esc(item.name)}">${esc(item.name)}</div>
      <div class="row-size">${size}</div>
      <div class="row-date">${date}</div>
      <button class="row-menu" title="Options">${iconDots()}</button>`;
    row.querySelector('.row-menu').addEventListener('click', e => { e.stopPropagation(); openCtxMenu(e, target); });
    row.addEventListener('dblclick', () => downloadFile(target));
    return row;
  }

  const card = document.createElement('div');
  card.className = 'file-card';
  card.innerHTML = `
    <div class="card-icon ${iconEl.cls}">${iconEl.svg}</div>
    <div class="card-info">
      <span class="card-name" title="${esc(item.name)}">${esc(item.name)}</span>
      <span class="card-meta">${size}</span>
    </div>
    <button class="card-menu" title="Options">${iconDots()}</button>`;
  card.querySelector('.card-menu').addEventListener('click', e => { e.stopPropagation(); openCtxMenu(e, target); });
  card.addEventListener('dblclick', () => downloadFile(target));
  return card;
}

// ── Upload ────────────────────────────────────────────────────────────────────

function triggerUpload() {
  document.getElementById('file-input').click();
}

async function uploadFiles(files) {
  const area = document.getElementById('upload-progress-area');
  area.classList.remove('hidden');

  const tasks = files.map(file => uploadSingle(file, area));
  await Promise.all(tasks);

  setTimeout(() => {
    area.classList.add('hidden');
    area.innerHTML = '';
  }, 1200);

  await loadFiles(S.currentPath);
}

async function uploadSingle(file, area) {
  const itemEl = document.createElement('div');
  itemEl.className = 'upload-item';
  itemEl.innerHTML = `
    <div class="upload-item-header">
      <span class="upload-item-name">${esc(file.name)}</span>
      <span class="upload-item-pct" id="pct-${CSS.escape(file.name)}">0%</span>
    </div>
    <div class="upload-bar"><div class="upload-bar-fill" id="bar-${CSS.escape(file.name)}" style="width:0%"></div></div>`;
  area.appendChild(itemEl);

  const storagePath = userPath(
    S.currentPath ? `${S.currentPath}/${file.name}` : file.name
  );

  const { error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .upload(storagePath, file, { upsert: true, cacheControl: '3600' });

  const pct = document.getElementById(`pct-${CSS.escape(file.name)}`);
  const bar = document.getElementById(`bar-${CSS.escape(file.name)}`);

  if (error) {
    if (pct) pct.textContent = 'Error';
    if (pct) pct.style.color = 'var(--red)';
    showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
  } else {
    if (pct) pct.textContent = '100%';
    if (bar) bar.style.width = '100%';
    showToast(`${file.name} uploaded`, 'success');
  }
}

// ── Create Folder ─────────────────────────────────────────────────────────────

async function createFolder() {
  const name = document.getElementById('folder-name-input').value.trim();
  if (!name) { showToast('Enter a folder name', 'error'); return; }
  if (/[\/\\]/.test(name)) { showToast('Folder name cannot contain / or \\', 'error'); return; }

  closeModal('modal-folder');
  document.getElementById('folder-name-input').value = '';

  const placeholderPath = userPath(
    S.currentPath ? `${S.currentPath}/${name}/.keep` : `${name}/.keep`
  );

  const { error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .upload(placeholderPath, new Blob([''], { type: 'text/plain' }), { upsert: true });

  if (error) { showToast('Failed to create folder: ' + error.message, 'error'); return; }
  showToast(`Folder "${name}" created`, 'success');
  await loadFiles(S.currentPath);
}

// ── Download ──────────────────────────────────────────────────────────────────

async function downloadFile(target) {
  if (target.isFolder) return;
  showToast('Preparing download...', 'info');

  const { data, error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .download(target.storagePath);

  if (error) { showToast('Download failed: ' + error.message, 'error'); return; }

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url; a.download = target.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Share ─────────────────────────────────────────────────────────────────────

function openShareModal(target) {
  if (target.isFolder) { showToast('Folders cannot be shared directly', 'info'); return; }
  S.ctxTarget = target;
  document.getElementById('share-file-name').textContent = target.name;
  document.getElementById('share-link-wrap').classList.add('hidden');
  document.getElementById('share-link-input').value = '';
  openModal('modal-share');
}

async function generateShareLink() {
  const target = S.ctxTarget;
  if (!target) return;
  const expiresIn = parseInt(document.getElementById('share-expiry').value, 10);

  const { data, error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .createSignedUrl(target.storagePath, expiresIn);

  if (error) { showToast('Failed to generate link: ' + error.message, 'error'); return; }

  document.getElementById('share-link-input').value = data.signedUrl;
  document.getElementById('share-link-wrap').classList.remove('hidden');

  S.sharedLinks.push({
    name: target.name,
    url: data.signedUrl,
    expiresAt: Date.now() + expiresIn * 1000,
  });
}

function copyShareLink() {
  const url = document.getElementById('share-link-input').value;
  if (!url) return;
  navigator.clipboard.writeText(url).then(() => showToast('Link copied!', 'success'));
}

// ── Rename ────────────────────────────────────────────────────────────────────

function openRenameModal(target) {
  S.ctxTarget = target;
  document.getElementById('rename-input').value = target.name;
  openModal('modal-rename');
  setTimeout(() => {
    const inp = document.getElementById('rename-input');
    inp.focus();
    const dotIndex = target.name.lastIndexOf('.');
    inp.setSelectionRange(0, dotIndex > 0 ? dotIndex : target.name.length);
  }, 100);
}

async function confirmRename() {
  const target = S.ctxTarget;
  if (!target) return;
  const newName = document.getElementById('rename-input').value.trim();
  if (!newName || newName === target.name) { closeModal('modal-rename'); return; }

  closeModal('modal-rename');

  if (target.isFolder) {
    showToast('Folder rename is not supported yet — please delete and recreate', 'info');
    return;
  }

  const dirPath = target.storagePath.substring(0, target.storagePath.lastIndexOf('/') + 1);
  const newPath = dirPath + newName;

  const { error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .move(target.storagePath, newPath);

  if (error) { showToast('Rename failed: ' + error.message, 'error'); return; }
  showToast(`Renamed to "${newName}"`, 'success');
  await loadFiles(S.currentPath);
}

// ── Delete ────────────────────────────────────────────────────────────────────

function openDeleteModal(target) {
  S.ctxTarget = target;
  document.getElementById('delete-msg').textContent =
    `Delete "${target.name}"? This cannot be undone.`;
  openModal('modal-delete');
}

async function confirmDelete() {
  const target = S.ctxTarget;
  if (!target) return;
  closeModal('modal-delete');

  if (target.isFolder) {
    await deleteFolder(target);
  } else {
    const { error } = await S.supabase.storage
      .from(window.STORAGE_BUCKET)
      .remove([target.storagePath]);
    if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
  }
  showToast(`"${target.name}" deleted`, 'success');
  await loadFiles(S.currentPath);
}

async function deleteFolder(target) {
  // List all files inside the folder and delete them
  const { data, error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .list(target.storagePath, { limit: 500 });

  if (!error && data) {
    const paths = data.map(f => `${target.storagePath}/${f.name}`);
    if (paths.length > 0) {
      await S.supabase.storage.from(window.STORAGE_BUCKET).remove(paths);
    }
  }
  // Also remove the .keep placeholder
  await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .remove([`${target.storagePath}/.keep`]);
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function updateBreadcrumb(relativePath) {
  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = '';

  const homeBtn = document.createElement('button');
  homeBtn.className = 'bc-item';
  homeBtn.textContent = 'Home';
  homeBtn.dataset.path = '';
  homeBtn.addEventListener('click', () => loadFiles(''));
  bc.appendChild(homeBtn);

  if (!relativePath) return;
  const parts = relativePath.split('/');
  parts.forEach((part, idx) => {
    const sep = document.createElement('span');
    sep.className = 'bc-sep'; sep.textContent = '/';
    bc.appendChild(sep);

    const btn = document.createElement('button');
    btn.className = 'bc-item';
    btn.textContent = part;
    const path = parts.slice(0, idx + 1).join('/');
    btn.addEventListener('click', () => loadFiles(path));
    bc.appendChild(btn);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────

async function handleSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query) { hideSearch(); return; }

  // Search from root
  const storagePath = userPath('');
  const { data, error } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .list(storagePath, { limit: 100, search: query });

  if (error || !data) { hideSearch(); return; }

  const items = data.filter(f => f.name !== '.keep' && f.id !== null);
  resultsEl.innerHTML = '';

  if (items.length === 0) {
    resultsEl.innerHTML = '<div class="search-item" style="color:var(--grey)">No results</div>';
  } else {
    items.slice(0, 20).forEach(item => {
      const el = document.createElement('div');
      el.className = 'search-item';
      const icon = fileIcon(item.name);
      el.innerHTML = `<div class="${icon.cls}">${icon.svg}</div><div class="search-item-name">${esc(item.name)}</div>`;
      el.addEventListener('click', async () => {
        hideSearch();
        document.getElementById('search-input').value = '';
        const target = { name: item.name, isFolder: false, storagePath: userPath(item.name) };
        downloadFile(target);
      });
      resultsEl.appendChild(el);
    });
  }

  resultsEl.classList.remove('hidden');
}

function hideSearch() {
  document.getElementById('search-results').classList.add('hidden');
}

// ── Shared Links ──────────────────────────────────────────────────────────────

function renderSharedLinks() {
  const list = document.getElementById('shared-list');
  const emptyState = document.getElementById('state-shared-empty');
  list.innerHTML = '';

  const valid = S.sharedLinks.filter(l => l.expiresAt > Date.now());

  if (valid.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  valid.forEach((link, idx) => {
    const remaining = Math.round((link.expiresAt - Date.now()) / 1000 / 60);
    const item = document.createElement('div');
    item.className = 'shared-item';
    item.innerHTML = `
      <div class="shared-item-info">
        <div class="shared-item-name">${esc(link.name)}</div>
        <div class="shared-item-exp">Expires in ${remaining} min</div>
      </div>
      <div class="shared-item-actions">
        <button class="btn btn--ghost btn--sm" data-copy="${idx}">Copy Link</button>
        <button class="btn btn--ghost btn--sm" data-remove="${idx}">Remove</button>
      </div>`;
    item.querySelector('[data-copy]').addEventListener('click', () => {
      navigator.clipboard.writeText(link.url).then(() => showToast('Link copied!', 'success'));
    });
    item.querySelector('[data-remove]').addEventListener('click', () => {
      S.sharedLinks.splice(idx, 1);
      renderSharedLinks();
    });
    list.appendChild(item);
  });
}

// ── Storage Usage ─────────────────────────────────────────────────────────────

async function updateStorageUsage() {
  const { data } = await S.supabase.storage
    .from(window.STORAGE_BUCKET)
    .list(userPath(''), { limit: 500 });

  if (!data) return;
  let totalBytes = 0;
  data.forEach(f => { totalBytes += f.metadata?.size ?? 0; });

  const used = formatBytes(totalBytes);
  const pct = Math.min(100, (totalBytes / (1024 ** 3)) * 100);
  document.getElementById('storage-text').textContent = used;
  document.getElementById('storage-fill').style.width = pct + '%';
}

// ── Context Menu ──────────────────────────────────────────────────────────────

function openCtxMenu(e, target) {
  e.stopPropagation();
  S.ctxTarget = target;

  const menu = document.getElementById('ctx-menu');
  const downloadBtn = menu.querySelector('[data-action="download"]');
  const shareBtn = menu.querySelector('[data-action="share"]');
  const renameBtn = menu.querySelector('[data-action="rename"]');

  downloadBtn.style.display = target.isFolder ? 'none' : '';
  shareBtn.style.display = target.isFolder ? 'none' : '';
  renameBtn.style.display = target.isFolder ? 'none' : '';

  menu.classList.remove('hidden');
  const rect = menu.getBoundingClientRect();
  let x = e.clientX, y = e.clientY;
  if (x + 180 > window.innerWidth) x = window.innerWidth - 184;
  if (y + 200 > window.innerHeight) y = window.innerHeight - 204;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function closeCtxMenu() {
  document.getElementById('ctx-menu').classList.add('hidden');
}

// ── View Mode ─────────────────────────────────────────────────────────────────

function setViewMode(mode) {
  S.viewMode = mode;
  const container = document.getElementById('file-container');
  container.className = mode === 'list' ? 'file-container list-view' : 'file-container grid-view';
  document.getElementById('btn-grid-view').classList.toggle('active', mode === 'grid');
  document.getElementById('btn-list-view').classList.toggle('active', mode === 'list');
  if (S.allFiles.length > 0) {
    const items = (S.allFiles || []).filter(f => f.name !== '.keep');
    renderFiles(items, S.currentPath);
  }
}

// ── Drop Overlay ──────────────────────────────────────────────────────────────

function showDropOverlay() { document.getElementById('drop-overlay').classList.remove('hidden'); }
function hideDropOverlay() { document.getElementById('drop-overlay').classList.add('hidden'); }

// ── Modals ────────────────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  const input = document.querySelector(`#${id} input`);
  if (input) setTimeout(() => input.focus(), 50);
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── Toasts ────────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  const wrap = document.getElementById('toast-wrap');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = (icons[type] || icons.info) + `<span>${esc(msg)}</span>`;
  wrap.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function userPath(relativePath) {
  const uid = S.user.id;
  return relativePath ? `${uid}/${relativePath}` : uid;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function iconDots() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
}

function iconFolder(size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    image: ['jpg','jpeg','png','gif','webp','svg','ico','bmp','avif'],
    video: ['mp4','mov','avi','mkv','webm','flv'],
    audio: ['mp3','wav','ogg','flac','aac','m4a'],
    pdf:   ['pdf'],
    doc:   ['doc','docx','odt','pages','txt','rtf','md'],
    zip:   ['zip','rar','7z','tar','gz','bz2'],
    code:  ['js','ts','py','go','rs','java','cpp','c','h','css','html','json','xml','yaml','yml','sh','sql'],
  };
  const icons = {
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    audio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    pdf:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    doc:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    zip:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    code:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    file:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  };

  for (const [type, exts] of Object.entries(map)) {
    if (exts.includes(ext)) return { cls: `icon-${type}`, svg: icons[type] };
  }
  return { cls: 'icon-file', svg: icons.file };
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', initApp);
