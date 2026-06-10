// MiniCMS Application Logic
// Handles client-side view routing, form submissions, dynamic content loading, filtering, live preview rendering,
// dual storage modes (API Backend Server / LocalStorage fallback), and authentication management (Login/Logout).

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let allPosts = [];
  let currentView = 'blog-home'; // Default to public blog view
  let postToDeleteId = null;
  let isStaticMode = false; // Toggled dynamically if the API server is unavailable
  let isAdminLoggedIn = false; // Tracks administrator state

  // DOM Elements - Authentication & Layout
  const themeSwitch = document.getElementById('checkbox-theme');
  const adminProfileWrapper = document.getElementById('admin-profile-wrapper');
  const btnLoginTrigger = document.getElementById('btn-login-trigger');
  
  // DOM Elements - Navigation (Sidebar)
  const sidebar = document.querySelector('.sidebar');
  const navDashboard = document.getElementById('nav-dashboard');
  const navNewPost = document.getElementById('nav-new-post');
  const navExportDb = document.getElementById('nav-export-db');
  const navViewBlog = document.getElementById('nav-view-blog');
  const navLogout = document.getElementById('nav-logout');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('page-title');

  // DOM Elements - Public Blog View
  const blogPostsGrid = document.getElementById('blog-posts-grid');
  const publicSearchInput = document.getElementById('public-search-input');
  const publicFilterCategory = document.getElementById('public-filter-category');

  // DOM Elements - Login View
  const loginForm = document.getElementById('login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const btnCancelLogin = document.getElementById('btn-cancel-login');

  // DOM Elements - Dashboard View (Admin only)
  const postsTableBody = document.getElementById('posts-table-body');
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const filterStatus = document.getElementById('filter-status');
  const btnCreateShortcut = document.getElementById('btn-create-shortcut');
  
  // DOM Elements - Stats
  const statTotal = document.getElementById('stat-total');
  const statPublished = document.getElementById('stat-published');
  const statDrafts = document.getElementById('stat-drafts');

  // DOM Elements - Editor View (Admin only)
  const postForm = document.getElementById('post-form');
  const postIdInput = document.getElementById('post-id');
  const postTitleInput = document.getElementById('post-title');
  const postCategorySelect = document.getElementById('post-category');
  const postStatusSelect = document.getElementById('post-status');
  const postSummaryTextarea = document.getElementById('post-summary');
  const postContentTextarea = document.getElementById('post-content');
  const editorActionTitle = document.getElementById('editor-action-title');
  const btnBackDashboard = document.getElementById('btn-back-dashboard');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const toolbarButtons = document.querySelectorAll('.tb-btn');

  // DOM Elements - Editor Preview Pane
  const previewTitle = document.getElementById('preview-title');
  const previewCategory = document.getElementById('preview-category');
  const previewDate = document.getElementById('preview-date');
  const previewBodyContent = document.getElementById('preview-body-content');

  // DOM Elements - Reader View (Shared)
  const btnBackFromReader = document.getElementById('btn-back-from-reader');
  const btnEditFromReader = document.getElementById('btn-edit-from-reader');
  const readCategory = document.getElementById('read-category');
  const readDate = document.getElementById('read-date');
  const readTitle = document.getElementById('read-title');
  const readSummary = document.getElementById('read-summary');
  const readContent = document.getElementById('read-content');

  // DOM Elements - Delete Modal
  const deleteModal = document.getElementById('delete-modal');
  const deletePostTitle = document.getElementById('delete-post-title');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const toastContainer = document.getElementById('toast-container');

  // --- INITIALIZATION ---
  initTheme();
  updateAuthUI();
  fetchPosts();

  // --- AUTHENTICATION STATE SYNC ---
  function updateAuthUI() {
    isAdminLoggedIn = localStorage.getItem('minicms_logged_in') === 'true';
    
    if (isAdminLoggedIn) {
      document.body.classList.add('admin-logged-in');
      if (adminProfileWrapper) adminProfileWrapper.style.display = 'flex';
      if (btnLoginTrigger) btnLoginTrigger.style.display = 'none';
      
      // Show admin menu controls
      if (navDashboard) navDashboard.style.display = 'flex';
      if (navNewPost) navNewPost.style.display = 'flex';
      if (navExportDb) navExportDb.style.display = 'flex';
      if (navLogout) navLogout.style.display = 'flex';
      if (btnEditFromReader) btnEditFromReader.style.display = 'inline-flex';
    } else {
      document.body.classList.remove('admin-logged-in');
      if (adminProfileWrapper) adminProfileWrapper.style.display = 'none';
      if (btnLoginTrigger) btnLoginTrigger.style.display = 'inline-flex';
      
      // Hide admin menu controls
      if (navDashboard) navDashboard.style.display = 'none';
      if (navNewPost) navNewPost.style.display = 'none';
      if (navExportDb) navExportDb.style.display = 'none';
      if (navLogout) navLogout.style.display = 'none';
      if (btnEditFromReader) btnEditFromReader.style.display = 'none';
      
      // If currently inside an admin panel, redirect to public home
      if (currentView === 'dashboard' || currentView === 'editor') {
        switchView('blog-home');
      }
    }
  }

  // --- VIEW ROUTING ROUTINES ---
  const switchView = (targetView) => {
    // Auth Guard check for admin-only views
    if ((targetView === 'dashboard' || targetView === 'editor') && !isAdminLoggedIn) {
      showToast('Akses ditolak. Silakan login terlebih dahulu.', 'error');
      targetView = 'login';
    }

    currentView = targetView;
    
    // Toggle active sidebar selections
    if (navDashboard) navDashboard.classList.remove('active');
    if (navNewPost) navNewPost.classList.remove('active');
    if (navViewBlog) navViewBlog.classList.remove('active');
    
    if (targetView === 'dashboard') {
      if (navDashboard) navDashboard.classList.add('active');
      if (pageTitle) pageTitle.innerText = "Ringkasan Dashboard";
    } else if (targetView === 'editor') {
      if (navNewPost) navNewPost.classList.add('active');
      if (pageTitle) pageTitle.innerText = "Editor Postingan";
    } else if (targetView === 'blog-home') {
      if (navViewBlog) navViewBlog.classList.add('active');
      if (pageTitle) pageTitle.innerText = "Halaman Blog Utama";
    } else if (targetView === 'login') {
      if (pageTitle) pageTitle.innerText = "Login Administrator";
    } else {
      if (pageTitle) pageTitle.innerText = "Pembaca Artikel";
    }

    // Toggle DOM sections display
    viewSections.forEach(section => {
      if (section.id === `${targetView}-view`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Reset window scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LOGIN / LOGOUT HANDLERS ---
  if (btnLoginTrigger) {
    btnLoginTrigger.addEventListener('click', () => {
      console.log('Login Admin button clicked. Switching to login view.');
      switchView('login');
    });
  }

  if (btnCancelLogin) {
    btnCancelLogin.addEventListener('click', () => {
      switchView('blog-home');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = loginUsernameInput.value.trim();
      const pass = loginPasswordInput.value;

      if (user === 'admin' && pass === 'bismillah') {
        localStorage.setItem('minicms_logged_in', 'true');
        showToast('Login Berhasil! Selamat datang di Panel Admin.', 'success');
        updateAuthUI();
        loginForm.reset();
        switchView('dashboard');
      } else {
        showToast('Username atau password Anda salah!', 'error');
      }
    });
  }

  if (navLogout) {
    navLogout.addEventListener('click', () => {
      localStorage.removeItem('minicms_logged_in');
      showToast('Anda berhasil keluar dari sistem.', 'success');
      updateAuthUI();
      switchView('blog-home');
    });
  }

  // --- THEME MANAGEMENT ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
      document.body.classList.remove('dark-mode');
      if (themeSwitch) themeSwitch.checked = true; // Slider switches 'on' for light mode
    } else if (savedTheme === 'dark' || systemPrefersDark) {
      document.body.classList.add('dark-mode');
      if (themeSwitch) themeSwitch.checked = false;
    }
  }

  if (themeSwitch) {
    themeSwitch.addEventListener('change', () => {
      if (themeSwitch.checked) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // --- TOAST NOTIFICATIONS ---
  const showToast = (message, type = 'success') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s forwards ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  // --- DATA OPERATIONS (FETCH/LOAD/RENDER) ---
  async function fetchPosts() {
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');

    try {
      // Try to fetch from Express REST API server
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Respon server gagal');
      
      allPosts = await response.json();
      isStaticMode = false;
      
      if (statusDot) statusDot.className = 'status-dot online';
      if (statusText) statusText.innerText = 'Flatfile API Connected';
      
      // Clean local storage since API server is source of truth
      localStorage.removeItem('minicms_posts');
      
      updateStats();
      renderAdminTable(allPosts);
      renderPublicBlogGrid();
    } catch (err) {
      console.log('Backend server API offline. Falling back to local storage static mode.', err);
      isStaticMode = true;
      if (statusDot) statusDot.className = 'status-dot offline';
      if (statusText) statusText.innerText = 'Local Sync (Static)';
      
      // Check if LocalStorage already contains database records
      const localData = localStorage.getItem('minicms_posts');
      if (localData) {
        allPosts = JSON.parse(localData);
        updateStats();
        renderAdminTable(allPosts);
        renderPublicBlogGrid();
      } else {
        // Fallback to loading default file from repository structure
        try {
          const staticResponse = await fetch('data/posts.json');
          if (staticResponse.ok) {
            allPosts = await staticResponse.json();
            localStorage.setItem('minicms_posts', JSON.stringify(allPosts));
            updateStats();
            renderAdminTable(allPosts);
            renderPublicBlogGrid();
            showToast('Memuat data awal dari data/posts.json', 'success');
          } else {
            throw new Error('Static file not available');
          }
        } catch (staticErr) {
          // Fallback to hardcoded demo data if files fail to load
          allPosts = [
            {
              id: "1",
              title: "Selamat Datang di MiniCMS",
              slug: "selamat-datang-di-minicms",
              summary: "Selamat datang di aplikasi MiniCMS Anda yang baru. Pelajari cara kerja flat-file database JSON di sini.",
              content: "<h2>Selamat Datang di MiniCMS!</h2><p>Ini adalah postingan pertama Anda yang dimuat langsung dari flat-file database <code>posts.json</code>.</p><p>MiniCMS dibangun dengan teknologi sederhana namun bertenaga:</p><ul><li><strong>Express.js</strong> untuk backend server & API</li><li><strong>HTML5, CSS3, & Vanilla JS</strong> untuk antarmuka pengguna yang cepat dan responsif</li><li><strong>Flat-file JSON</strong> sebagai penyimpanan data tanpa perlu database SQL/NoSQL eksternal</li></ul><p>Anda dapat mengedit postingan ini, menghapusnya, atau menambahkan postingan baru melalui dashboard admin yang telah disediakan. Selamat mencoba!</p>",
              category: "Panduan",
              date: new Date().toISOString(),
              status: "published"
            }
          ];
          localStorage.setItem('minicms_posts', JSON.stringify(allPosts));
          updateStats();
          renderAdminTable(allPosts);
          renderPublicBlogGrid();
          showToast('Menggunakan data contoh bawaan.', 'warning');
        }
      }
    }
  }

  function updateStats() {
    const total = allPosts.length;
    const published = allPosts.filter(p => p.status === 'published').length;
    const drafts = allPosts.filter(p => p.status === 'draft').length;

    if (statTotal) statTotal.innerText = total;
    if (statPublished) statPublished.innerText = published;
    if (statDrafts) statDrafts.innerText = drafts;
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString('id-ID', options);
  }

  // --- RENDER PUBLIC BLOG GRID ---
  function renderPublicBlogGrid() {
    if (!blogPostsGrid) return;
    const publishedPosts = allPosts.filter(p => p.status === 'published');
    
    // Applying public search and filters
    const query = publicSearchInput ? publicSearchInput.value.toLowerCase() : '';
    const category = publicFilterCategory ? publicFilterCategory.value : 'all';
    
    const filtered = publishedPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(query) || 
                            (post.summary && post.summary.toLowerCase().includes(query)) ||
                            post.content.toLowerCase().includes(query);
      const matchesCategory = (category === 'all' || post.category === category);
      return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
      blogPostsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 4rem 1rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48" style="margin-bottom: 1rem; opacity: 0.5;"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          <p>Belum ada artikel yang dipublikasikan dalam pencarian ini.</p>
        </div>`;
      return;
    }

    blogPostsGrid.innerHTML = '';
    filtered.forEach(post => {
      const card = document.createElement('article');
      card.className = 'blog-card';
      
      const textOnlyContent = post.content.replace(/<[^>]*>/g, '');
      const summaryText = post.summary || (textOnlyContent.substring(0, 140) + '...');
      
      card.innerHTML = `
        <div class="blog-card-meta">
          <span class="blog-card-category">${escapeHtml(post.category)}</span>
          <span class="blog-card-date">${formatDate(post.date)}</span>
        </div>
        <h3 class="blog-card-title" data-id="${post.id}">${escapeHtml(post.title)}</h3>
        <p class="blog-card-summary">${escapeHtml(summaryText)}</p>
        <div class="blog-card-footer">
          <button class="btn btn-secondary btn-sm read-more-btn" data-id="${post.id}">
            Baca Selengkapnya
          </button>
        </div>
      `;
      blogPostsGrid.appendChild(card);
    });

    // Attach click events on public cards
    document.querySelectorAll('.blog-card-title, .read-more-btn').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        openReader(id);
      });
    });
  }

  // --- RENDER ADMIN POSTS LIST ---
  function renderAdminTable(posts) {
    if (!postsTableBody) return;
    if (posts.length === 0) {
      postsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Tidak ada postingan ditemukan.</td></tr>`;
      return;
    }

    postsTableBody.innerHTML = '';
    posts.forEach(post => {
      const tr = document.createElement('tr');
      
      const statusBadgeClass = post.status === 'published' ? 'badge-status-published' : 'badge-status-draft';
      const statusLabel = post.status === 'published' ? 'Published' : 'Draft';
      
      tr.innerHTML = `
        <td>
          <div class="post-row-title" data-id="${post.id}">${escapeHtml(post.title)}</div>
          <div class="post-summary-text">${escapeHtml(post.summary || '')}</div>
        </td>
        <td><span class="badge badge-category">${escapeHtml(post.category)}</span></td>
        <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(post.date)}</span></td>
        <td><span class="badge ${statusBadgeClass}">${statusLabel}</span></td>
        <td class="actions-cell">
          <button class="btn-icon-only view-btn" data-id="${post.id}" title="Lihat Postingan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn-icon-only edit-btn" data-id="${post.id}" title="Edit Postingan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-only delete-btn" data-id="${post.id}" title="Hapus Postingan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </td>
      `;
      postsTableBody.appendChild(tr);
    });

    // Attach dynamic click event listeners
    attachActionListeners();
  }

  function attachActionListeners() {
    // Row/Title click (view post)
    document.querySelectorAll('.post-row-title, .view-btn').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        openReader(id);
      });
    });

    // Edit button click
    document.querySelectorAll('.edit-btn').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        openEditor(id);
      });
    });

    // Delete button click
    document.querySelectorAll('.delete-btn').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const post = allPosts.find(p => p.id === id);
        if (post) {
          postToDeleteId = id;
          if (deletePostTitle) deletePostTitle.innerText = post.title;
          if (deleteModal) deleteModal.classList.add('open');
        }
      });
    });
  }

  // --- SEARCH AND FILTERING (ADMIN PANEL) ---
  const applyAdminFilters = () => {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const cat = filterCategory ? filterCategory.value : 'all';
    const stat = filterStatus ? filterStatus.value : 'all';

    const filtered = allPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(query) || 
                            (post.summary && post.summary.toLowerCase().includes(query)) ||
                            post.content.toLowerCase().includes(query);
      const matchesCategory = (cat === 'all' || post.category === cat);
      const matchesStatus = (stat === 'all' || post.status === stat);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    renderAdminTable(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', applyAdminFilters);
  if (filterCategory) filterCategory.addEventListener('change', applyAdminFilters);
  if (filterStatus) filterStatus.addEventListener('change', applyAdminFilters);

  // Search & Filter listeners for Public Blog
  if (publicSearchInput) publicSearchInput.addEventListener('input', renderPublicBlogGrid);
  if (publicFilterCategory) publicFilterCategory.addEventListener('change', renderPublicBlogGrid);

  // --- READER VIEW ---
  function openReader(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) {
      showToast('Postingan tidak ditemukan', 'error');
      return;
    }

    if (readCategory) readCategory.innerText = post.category;
    if (readDate) readDate.innerText = formatDate(post.date || post.createdAt);
    if (readTitle) readTitle.innerText = post.title;
    if (readSummary) readSummary.innerText = post.summary || '';
    if (readContent) readContent.innerHTML = post.content;
    
    // Bind reader edit button action
    if (btnEditFromReader) {
      btnEditFromReader.onclick = () => {
        openEditor(post.id);
      };
    }

    // Toggle Back Button label and destination based on who is reading
    if (btnBackFromReader) {
      if (isAdminLoggedIn) {
        btnBackFromReader.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Kembali ke Dashboard
        `;
        btnBackFromReader.onclick = () => switchView('dashboard');
      } else {
        btnBackFromReader.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Kembali ke Blog
        `;
        btnBackFromReader.onclick = () => switchView('blog-home');
      }
    }

    switchView('reader');
  }

  // --- EDITOR VIEW (CREATE / EDIT) ---
  function openEditor(id = null) {
    if (postForm) postForm.reset();
    if (postIdInput) postIdInput.value = '';
    
    if (id) {
      // Edit Post
      const post = allPosts.find(p => p.id === id);
      if (!post) {
        showToast('Postingan tidak ditemukan untuk diedit', 'error');
        return;
      }
      
      if (postIdInput) postIdInput.value = post.id;
      if (postTitleInput) postTitleInput.value = post.title;
      if (postCategorySelect) postCategorySelect.value = post.category || 'Umum';
      if (postStatusSelect) postStatusSelect.value = post.status || 'draft';
      if (postSummaryTextarea) postSummaryTextarea.value = post.summary || '';
      if (postContentTextarea) postContentTextarea.value = post.content;
      
      if (editorActionTitle) editorActionTitle.innerText = "Edit Postingan";
      updatePreview(post.date || new Date().toISOString());
    } else {
      // Create New Post
      if (editorActionTitle) editorActionTitle.innerText = "Buat Postingan Baru";
      updatePreview(new Date().toISOString());
    }

    switchView('editor');
  }

  // Live preview bindings
  const updatePreview = (forcedDate = null) => {
    if (previewTitle) previewTitle.innerText = postTitleInput ? postTitleInput.value : 'Judul Postingan Baru';
    if (previewCategory) previewCategory.innerText = postCategorySelect ? postCategorySelect.value : 'Umum';
    
    const displayDate = forcedDate || new Date().toISOString();
    if (previewDate) previewDate.innerText = formatDate(displayDate);
    
    // Live render html body content
    if (previewBodyContent) {
      previewBodyContent.innerHTML = (postContentTextarea && postContentTextarea.value) ? postContentTextarea.value : '<p style="color: var(--text-muted); font-style: italic;">Mulai ketik konten artikel Anda di editor untuk melihat pratinjau langsung...</p>';
    }
  };

  if (postTitleInput) postTitleInput.addEventListener('input', () => updatePreview());
  if (postCategorySelect) postCategorySelect.addEventListener('change', () => updatePreview());
  if (postContentTextarea) postContentTextarea.addEventListener('input', () => updatePreview());

  // Text editor custom HTML tag injection
  toolbarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      insertHTMLTag(tag);
    });
  });

  function insertHTMLTag(tag) {
    if (!postContentTextarea) return;
    const start = postContentTextarea.selectionStart;
    const end = postContentTextarea.selectionEnd;
    const text = postContentTextarea.value;
    const selected = text.substring(start, end);
    let insertion = '';

    switch (tag) {
      case 'ul':
        insertion = `<ul>\n  <li>${selected || 'Item list'}</li>\n</ul>`;
        break;
      case 'a':
        insertion = `<a href="https://example.com" target="_blank">${selected || 'Tautan Link'}</a>`;
        break;
      case 'code':
        insertion = `<code>${selected || 'kode_program'}</code>`;
        break;
      default:
        insertion = `<${tag}>${selected || 'Teks utama'}</${tag}>`;
    }

    postContentTextarea.value = text.substring(0, start) + insertion + text.substring(end);
    postContentTextarea.focus();
    
    // Set selection after inserted content
    const newCursorPos = start + insertion.length;
    postContentTextarea.setSelectionRange(newCursorPos, newCursorPos);
    
    updatePreview();
  }

  // Cancel edit buttons
  if (btnBackDashboard) btnBackDashboard.addEventListener('click', () => switchView('dashboard'));
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => switchView('dashboard'));
  
  // Navigation trigger shortcuts
  if (navDashboard) navDashboard.addEventListener('click', () => switchView('dashboard'));
  if (navNewPost) navNewPost.addEventListener('click', () => openEditor());
  if (navViewBlog) navViewBlog.addEventListener('click', () => switchView('blog-home'));
  if (btnCreateShortcut) btnCreateShortcut.addEventListener('click', () => openEditor());

  // --- DATABASE EXPORT (JSON download) ---
  if (navExportDb) {
    navExportDb.addEventListener('click', () => {
      try {
        const jsonString = JSON.stringify(allPosts, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'posts.json';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        showToast('File posts.json siap diunduh! Ganti file posts.json lama Anda dengan file baru ini.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Gagal melakukan ekspor data', 'error');
      }
    });
  }

  // Form Submission (Create or Edit)
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = postTitleInput.value.trim();
      const category = postCategorySelect.value;
      const status = postStatusSelect.value;
      const summary = postSummaryTextarea.value.trim() || title.substring(0, 100) + '...';
      const content = postContentTextarea.value.trim();
      const editId = postIdInput.value;

      const generateSlug = (t) => {
        return t
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      };

      const postData = {
        title,
        slug: generateSlug(title),
        summary,
        content,
        category,
        status
      };

      if (isStaticMode) {
        // LocalStorage mode execution
        if (editId) {
          // Edit existing local record
          const index = allPosts.findIndex(p => p.id === editId.toString());
          if (index === -1) {
            showToast('Data tidak ditemukan untuk diubah', 'error');
            return;
          }
          allPosts[index] = {
            ...allPosts[index],
            ...postData,
            updatedAt: new Date().toISOString()
          };
        } else {
          // Create new local record
          const newPost = {
            id: Date.now().toString(),
            ...postData,
            date: new Date().toISOString()
          };
          allPosts.push(newPost);
        }

        // Sort chronological descending
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        localStorage.setItem('minicms_posts', JSON.stringify(allPosts));
        
        showToast(editId ? 'Postingan lokal diperbarui!' : 'Postingan lokal ditambahkan!', 'success');
        showToast("Klik 'Ekspor JSON' di menu untuk menyimpan perubahan permanen.", 'warning');
        
        updateStats();
        renderAdminTable(allPosts);
        renderPublicBlogGrid();
        switchView('dashboard');
      } else {
        // REST API server execution
        if (editId) {
          postData.id = editId;
        }

        try {
          const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
          });

          if (!response.ok) throw new Error('Respon server error');

          showToast(editId ? 'Postingan berhasil diperbarui!' : 'Postingan baru berhasil ditambahkan!');
          await fetchPosts();
          switchView('dashboard');
        } catch (err) {
          console.error(err);
          showToast('Gagal menyimpan postingan ke server API', 'error');
        }
      }
    });
  }

  // --- DELETE MODAL HANDLERS ---
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      if (deleteModal) deleteModal.classList.remove('open');
      postToDeleteId = null;
    });
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (!postToDeleteId) return;

      if (isStaticMode) {
        // Local database deletion
        allPosts = allPosts.filter(p => p.id !== postToDeleteId.toString());
        localStorage.setItem('minicms_posts', JSON.stringify(allPosts));
        
        showToast('Postingan dihapus secara lokal!');
        showToast("Klik 'Ekspor JSON' di menu untuk menyimpan perubahan.", 'warning');
        
        if (deleteModal) deleteModal.classList.remove('open');
        postToDeleteId = null;
        
        updateStats();
        renderAdminTable(allPosts);
        renderPublicBlogGrid();
        
        if (currentView === 'reader') {
          switchView('dashboard');
        }
      } else {
        // REST API deletion
        try {
          const response = await fetch(`/api/posts/${postToDeleteId}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('Gagal menghapus');

          showToast('Postingan berhasil dihapus');
          if (deleteModal) deleteModal.classList.remove('open');
          postToDeleteId = null;
          
          await fetchPosts();
          
          if (currentView === 'reader') {
            switchView('dashboard');
          }
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus postingan dari server', 'error');
        }
      }
    });
  }

  // Close modal when clicking outside card
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        deleteModal.classList.remove('open');
        postToDeleteId = null;
      }
    });
  }

  // --- UTILITIES ---
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
