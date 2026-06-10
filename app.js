// MiniCMS Application Logic
// Handles client-side view routing, form submissions, dynamic content loading, filtering, live preview rendering,
// and dual storage modes: Full API Backend Server or client-side LocalStorage fallback (with JSON database exports).

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let allPosts = [];
  let currentView = 'dashboard';
  let postToDeleteId = null;
  let isStaticMode = false; // Toggled dynamically if the API server is unavailable

  // DOM Elements - Navigation
  const navDashboard = document.getElementById('nav-dashboard');
  const navNewPost = document.getElementById('nav-new-post');
  const navExportDb = document.getElementById('nav-export-db');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('page-title');
  const themeSwitch = document.getElementById('checkbox-theme');

  // DOM Elements - Dashboard View
  const postsTableBody = document.getElementById('posts-table-body');
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const filterStatus = document.getElementById('filter-status');
  const btnCreateShortcut = document.getElementById('btn-create-shortcut');
  
  // DOM Elements - Stats
  const statTotal = document.getElementById('stat-total');
  const statPublished = document.getElementById('stat-published');
  const statDrafts = document.getElementById('stat-drafts');

  // DOM Elements - Editor View
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

  // DOM Elements - Reader View
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
  fetchPosts();

  // --- VIEW ROUTING ROUTINES ---
  const switchView = (targetView) => {
    currentView = targetView;
    
    // Toggle active state in sidebar
    if (targetView === 'dashboard') {
      navDashboard.classList.add('active');
      navNewPost.classList.remove('active');
      pageTitle.innerText = "Ringkasan Dashboard";
    } else if (targetView === 'editor') {
      navDashboard.classList.remove('active');
      navNewPost.classList.add('active');
      pageTitle.innerText = "Editor Postingan";
    } else {
      navDashboard.classList.remove('active');
      navNewPost.classList.remove('active');
      pageTitle.innerText = "Pembaca Blog";
    }

    // Slide and view sections toggle
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

  // --- THEME MANAGEMENT ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
      document.body.classList.remove('dark-mode');
      themeSwitch.checked = true; // Slider switches 'on' for light mode
    } else if (savedTheme === 'dark' || systemPrefersDark) {
      document.body.classList.add('dark-mode');
      themeSwitch.checked = false;
    }
  }

  themeSwitch.addEventListener('change', () => {
    if (themeSwitch.checked) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
  });

  // --- TOAST NOTIFICATIONS ---
  const showToast = (message, type = 'success') => {
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
      
      statusDot.className = 'status-dot online';
      statusText.innerText = 'Flatfile API Connected';
      
      // Clean local storage since API server is source of truth
      localStorage.removeItem('minicms_posts');
      
      updateStats();
      renderPostsTable(allPosts);
    } catch (err) {
      console.log('Backend server API offline or running static. Falling back to local storage mode.', err);
      isStaticMode = true;
      statusDot.className = 'status-dot offline';
      statusText.innerText = 'Local Sync (Static)';
      
      // Check if LocalStorage already contains database records
      const localData = localStorage.getItem('minicms_posts');
      if (localData) {
        allPosts = JSON.parse(localData);
        updateStats();
        renderPostsTable(allPosts);
      } else {
        // Fallback to loading default file from repository structure
        try {
          const staticResponse = await fetch('data/posts.json');
          if (staticResponse.ok) {
            allPosts = await staticResponse.json();
            localStorage.setItem('minicms_posts', JSON.stringify(allPosts));
            updateStats();
            renderPostsTable(allPosts);
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
          renderPostsTable(allPosts);
          showToast('Menggunakan data contoh bawaan.', 'warning');
        }
      }
    }
  }

  function updateStats() {
    const total = allPosts.length;
    const published = allPosts.filter(p => p.status === 'published').length;
    const drafts = allPosts.filter(p => p.status === 'draft').length;

    statTotal.innerText = total;
    statPublished.innerText = published;
    statDrafts.innerText = drafts;
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString('id-ID', options);
  }

  function renderPostsTable(posts) {
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
          deletePostTitle.innerText = post.title;
          deleteModal.classList.add('open');
        }
      });
    });
  }

  // --- SEARCH AND FILTERING ---
  const applyFilters = () => {
    const query = searchInput.value.toLowerCase();
    const cat = filterCategory.value;
    const stat = filterStatus.value;

    const filtered = allPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(query) || 
                            (post.summary && post.summary.toLowerCase().includes(query)) ||
                            post.content.toLowerCase().includes(query);
      const matchesCategory = (cat === 'all' || post.category === cat);
      const matchesStatus = (stat === 'all' || post.status === stat);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    renderPostsTable(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  filterCategory.addEventListener('change', applyFilters);
  filterStatus.addEventListener('change', applyFilters);

  // --- READER VIEW ---
  function openReader(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) {
      showToast('Postingan tidak ditemukan', 'error');
      return;
    }

    readCategory.innerText = post.category;
    readDate.innerText = formatDate(post.date || post.createdAt);
    readTitle.innerText = post.title;
    readSummary.innerText = post.summary || '';
    readContent.innerHTML = post.content;
    
    // Bind reader edit button action
    btnEditFromReader.onclick = () => {
      openEditor(post.id);
    };

    switchView('reader');
  }

  btnBackFromReader.addEventListener('click', () => {
    switchView('dashboard');
  });

  // --- EDITOR VIEW (CREATE / EDIT) ---
  function openEditor(id = null) {
    postForm.reset();
    postIdInput.value = '';
    
    if (id) {
      // Edit Post
      const post = allPosts.find(p => p.id === id);
      if (!post) {
        showToast('Postingan tidak ditemukan untuk diedit', 'error');
        return;
      }
      
      postIdInput.value = post.id;
      postTitleInput.value = post.title;
      postCategorySelect.value = post.category || 'Umum';
      postStatusSelect.value = post.status || 'draft';
      postSummaryTextarea.value = post.summary || '';
      postContentTextarea.value = post.content;
      
      editorActionTitle.innerText = "Edit Postingan";
      updatePreview(post.date || new Date().toISOString());
    } else {
      // Create New Post
      editorActionTitle.innerText = "Buat Postingan Baru";
      updatePreview(new Date().toISOString());
    }

    switchView('editor');
  }

  // Live preview bindings
  const updatePreview = (forcedDate = null) => {
    previewTitle.innerText = postTitleInput.value || 'Judul Postingan Baru';
    previewCategory.innerText = postCategorySelect.value;
    
    const displayDate = forcedDate || new Date().toISOString();
    previewDate.innerText = formatDate(displayDate);
    
    // Live render html body content
    previewBodyContent.innerHTML = postContentTextarea.value || '<p style="color: var(--text-muted); font-style: italic;">Mulai ketik konten artikel Anda di editor untuk melihat pratinjau langsung...</p>';
  };

  postTitleInput.addEventListener('input', () => updatePreview());
  postCategorySelect.addEventListener('change', () => updatePreview());
  postContentTextarea.addEventListener('input', () => updatePreview());

  // Text editor custom HTML tag injection
  toolbarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      insertHTMLTag(tag);
    });
  });

  function insertHTMLTag(tag) {
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
  btnBackDashboard.addEventListener('click', () => switchView('dashboard'));
  btnCancelEdit.addEventListener('click', () => switchView('dashboard'));
  
  // Sidebar shortcuts
  navDashboard.addEventListener('click', () => switchView('dashboard'));
  navNewPost.addEventListener('click', () => openEditor());
  btnCreateShortcut.addEventListener('click', () => openEditor());

  // --- DATABASE EXPORT (JSON download) ---
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

  // Form Submission (Create or Edit)
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
      showToast("Klik 'Ekspor JSON' di menu untuk menyimpan perubahan permanen ke database file.", 'warning');
      
      updateStats();
      renderPostsTable(allPosts);
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

  // --- DELETE MODAL HANDLERS ---
  btnCloseModal.addEventListener('click', () => {
    deleteModal.classList.remove('open');
    postToDeleteId = null;
  });

  btnConfirmDelete.addEventListener('click', async () => {
    if (!postToDeleteId) return;

    if (isStaticMode) {
      // Local database deletion
      allPosts = allPosts.filter(p => p.id !== postToDeleteId.toString());
      localStorage.setItem('minicms_posts', JSON.stringify(allPosts));
      
      showToast('Postingan dihapus secara lokal!');
      showToast("Klik 'Ekspor JSON' di menu untuk menyimpan perubahan permanen ke database file.", 'warning');
      
      deleteModal.classList.remove('open');
      postToDeleteId = null;
      
      updateStats();
      renderPostsTable(allPosts);
      
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
        deleteModal.classList.remove('open');
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

  // Close modal when clicking outside card
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      deleteModal.classList.remove('open');
      postToDeleteId = null;
    }
  });

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
