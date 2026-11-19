(function () {
    'use strict';

    const accountListEl = document.getElementById('account-list');
    const btnAddAccount = document.getElementById('btn-add-account');
    const btnSettings = document.getElementById('btn-settings');

    const contextMenu = document.getElementById('context-menu');
    const menuRename = document.getElementById('menu-rename');
    const menuReload = document.getElementById('menu-reload');
    const menuClear = document.getElementById('menu-clear');
    const menuDelete = document.getElementById('menu-delete');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalInput = document.getElementById('modal-input');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');
    const modalBtnConfirm = document.getElementById('modal-btn-confirm');

    let currentAccounts = [];
    let currentActiveId = null;
    let targetContextMenuAccountId = null;
    let activeModalAction = null;

    function getInitials(name) {
        if (!name) return 'WA';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function renderAccounts() {
        accountListEl.innerHTML = '';

        currentAccounts.forEach((acc, index) => {
            const isActive = acc.id === currentActiveId;

            const wrapper = document.createElement('div');
            wrapper.className = `account-item-wrapper ${isActive ? 'active' : ''}`;
            wrapper.dataset.id = acc.id;

            const indicator = document.createElement('div');
            indicator.className = 'active-indicator';

            const button = document.createElement('button');
            button.className = 'account-btn';
            button.title = `${acc.name} (Klik untuk beralih, Klik kanan untuk opsi)`;
            button.textContent = getInitials(acc.name);

            // Custom color accent
            if (acc.color) {
                button.style.backgroundColor = acc.color;
            }

            // Badge count
            const badge = document.createElement('div');
            badge.className = `badge-count ${(!acc.badge || acc.badge <= 0) ? 'hidden' : ''}`;
            badge.id = `badge-${acc.id}`;
            badge.textContent = acc.badge > 99 ? '99+' : acc.badge;

            button.appendChild(badge);
            wrapper.appendChild(indicator);
            wrapper.appendChild(button);

            // Left click to switch account
            button.addEventListener('click', () => {
                if (acc.id !== currentActiveId) {
                    window.electronAPI.switchAccount(acc.id);
                }
            });

            // Right click context menu
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (window.electronAPI && window.electronAPI.showAccountContextMenu) {
                    window.electronAPI.showAccountContextMenu(acc.id);
                } else {
                    showContextMenu(acc.id, e.clientX, e.clientY);
                }
            });

            accountListEl.appendChild(wrapper);
        });
    }

    function updateBadge(id, count) {
        const badgeEl = document.getElementById(`badge-${id}`);
        if (badgeEl) {
            if (count > 0) {
                badgeEl.textContent = count > 99 ? '99+' : count;
                badgeEl.classList.remove('hidden');
            } else {
                badgeEl.classList.add('hidden');
            }
        }
    }

    function showContextMenu(accountId, x, y) {
        targetContextMenuAccountId = accountId;
        contextMenu.style.left = `${x + 10}px`;
        contextMenu.style.top = `${Math.min(y, window.innerHeight - 180)}px`;
        contextMenu.classList.remove('hidden');
    }

    function hideContextMenu() {
        contextMenu.classList.add('hidden');
        targetContextMenuAccountId = null;
    }

    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // Action Handlers
    function handleRenameAction(accId) {
        const acc = currentAccounts.find(a => a.id === accId);
        if (!acc) return;

        openModal({
            title: 'Ubah Nama Akun',
            placeholder: 'Masukkan nama baru...',
            defaultValue: acc.name,
            confirmText: 'Simpan',
            onConfirm: (newName) => {
                window.electronAPI.renameAccount(accId, newName);
            }
        });
    }

    function handleClearAction(accId) {
        const acc = currentAccounts.find(a => a.id === accId);
        if (!acc) return;

        openModal({
            title: 'Keluar / Reset Sesi',
            bodyHtml: `<p style="color:#8696a0; font-size:13px; line-height:1.5;">Apakah Anda yakin ingin keluar dari akun <b>${acc.name}</b>? Anda harus memindai ulang kode QR untuk masuk kembali.</p>`,
            confirmText: 'Keluar & Reset',
            isDanger: true,
            onConfirm: () => {
                window.electronAPI.clearAccountSession(accId);
            }
        });
    }

    function handleDeleteAction(accId) {
        if (currentAccounts.length <= 1) {
            alert('Tidak dapat menghapus akun satu-satunya.');
            return;
        }

        const acc = currentAccounts.find(a => a.id === accId);
        if (!acc) return;

        openModal({
            title: 'Hapus Akun',
            bodyHtml: `<p style="color:#8696a0; font-size:13px; line-height:1.5;">Hapus <b>${acc.name}</b> dari daftar multi-akun? Semua data sesi akun ini akan dibersihkan.</p>`,
            confirmText: 'Hapus Akun',
            isDanger: true,
            onConfirm: () => {
                window.electronAPI.removeAccount(accId);
            }
        });
    }

    // Context Menu Handlers (HTML Menu Fallback)
    menuRename.addEventListener('click', () => {
        const accId = targetContextMenuAccountId;
        hideContextMenu();
        handleRenameAction(accId);
    });

    menuReload.addEventListener('click', () => {
        const accId = targetContextMenuAccountId;
        hideContextMenu();
        if (accId) {
            window.electronAPI.reloadAccount(accId);
        }
    });

    menuClear.addEventListener('click', () => {
        const accId = targetContextMenuAccountId;
        hideContextMenu();
        handleClearAction(accId);
    });

    menuDelete.addEventListener('click', () => {
        const accId = targetContextMenuAccountId;
        hideContextMenu();
        handleDeleteAction(accId);
    });

    // Native Context Menu Listeners from Main Process
    if (window.electronAPI.onTriggerRenameAccount) {
        window.electronAPI.onTriggerRenameAccount((id) => handleRenameAction(id));
    }
    if (window.electronAPI.onTriggerClearAccount) {
        window.electronAPI.onTriggerClearAccount((id) => handleClearAction(id));
    }
    if (window.electronAPI.onTriggerDeleteAccount) {
        window.electronAPI.onTriggerDeleteAccount((id) => handleDeleteAction(id));
    }

    // Add Account Button
    btnAddAccount.addEventListener('click', () => {
        openModal({
            title: 'Tambah Akun Baru',
            placeholder: `Akun ${currentAccounts.length + 1}`,
            defaultValue: `Akun ${currentAccounts.length + 1}`,
            confirmText: 'Tambah',
            onConfirm: (name) => {
                window.electronAPI.addAccount(name);
            }
        });
    });

    // Settings Button
    btnSettings.addEventListener('click', () => {
        window.electronAPI.openSettings();
    });

    // Modal Helpers
    function openModal({ title, placeholder, defaultValue, confirmText, bodyHtml, isDanger, onConfirm }) {
        if (window.electronAPI && window.electronAPI.setModalState) {
            window.electronAPI.setModalState(true);
        }

        modalTitle.textContent = title || 'Konfirmasi';
        modalBtnConfirm.textContent = confirmText || 'OK';

        if (isDanger) {
            modalBtnConfirm.style.backgroundColor = '#ea4335';
            modalBtnConfirm.style.color = '#fff';
        } else {
            modalBtnConfirm.style.backgroundColor = '#00a884';
            modalBtnConfirm.style.color = '#111b21';
        }

        if (bodyHtml) {
            modalBody.innerHTML = bodyHtml;
            setTimeout(() => {
                modalBtnConfirm.focus();
            }, 50);
        } else {
            modalBody.innerHTML = `<input type="text" id="modal-input" class="modal-input" autocomplete="off" placeholder="${placeholder || ''}" value="${defaultValue || ''}">`;
            setTimeout(() => {
                const input = document.getElementById('modal-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        }

        activeModalAction = onConfirm;
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        activeModalAction = null;
        if (window.electronAPI && window.electronAPI.setModalState) {
            window.electronAPI.setModalState(false);
        }
    }

    modalBtnCancel.addEventListener('click', closeModal);

    modalBtnConfirm.addEventListener('click', () => {
        if (activeModalAction) {
            const input = document.getElementById('modal-input');
            const val = input ? input.value : null;
            activeModalAction(val);
        }
        closeModal();
    });

    modalOverlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            modalBtnConfirm.click();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Setup Listeners from Main Process
    window.electronAPI.onAccountsUpdated((state) => {
        currentAccounts = state.accounts || [];
        currentActiveId = state.activeAccountId;
        renderAccounts();
    });

    window.electronAPI.onBadgeUpdated(({ id, badge }) => {
        const acc = currentAccounts.find(a => a.id === id);
        if (acc) {
            acc.badge = badge;
        }
        updateBadge(id, badge);
    });

    // Initial Load
    window.electronAPI.getAccountsState().then((state) => {
        currentAccounts = state.accounts || [];
        currentActiveId = state.activeAccountId;
        renderAccounts();
    });

})();
