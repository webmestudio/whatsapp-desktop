const electron = require('electron');
const { app, BrowserView, Menu, MenuItem, nativeImage, shell, ipcMain } = electron;
const fs = require('fs');
const path = require('path');
const log = require('electron-log');
const agents = require('./agents');

const COLORS = [
    '#25D366', // WhatsApp Green
    '#128C7E', // WhatsApp Dark Green
    '#00A884', // Mint
    '#34B7F1', // Sky Blue
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#FF9800', // Orange
    '#009688', // Teal
    '#607D8B'  // Blue Grey
];

const SIDEBAR_WIDTH = 72;

class AccountManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.accounts = [];
        this.activeAccountId = null;
        this.views = new Map();
        this.accountsFile = path.join(app.getPath('userData'), 'accounts.json');
        this.userAgent = this.resolveUserAgent();
        this.isModalOpen = false;

        this.loadAccounts();
        this.setupIpc();
    }

    resolveUserAgent() {
        if (agents && agents.userAgents && agents.userAgents.length > 0) {
            // Prefer Chrome Windows/Mac user agent if available
            const chromeUa = agents.userAgents.find(u => u.includes('Chrome') && !u.includes('Firefox'));
            if (chromeUa) return chromeUa;
            return agents.userAgents[0];
        }
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    }

    loadAccounts() {
        try {
            if (fs.existsSync(this.accountsFile)) {
                const data = JSON.parse(fs.readFileSync(this.accountsFile, 'utf8'));
                if (Array.isArray(data.accounts) && data.accounts.length > 0) {
                    this.accounts = data.accounts.map(acc => ({
                        id: acc.id,
                        name: acc.name || 'WhatsApp',
                        partition: acc.partition || `persist:wa_account_${acc.id}`,
                        color: acc.color || COLORS[0],
                        badge: 0
                    }));
                    this.activeAccountId = data.activeAccountId || this.accounts[0].id;
                    log.info(`[AccountManager] Loaded ${this.accounts.length} accounts from file`);
                    return;
                }
            }
        } catch (e) {
            log.warn('[AccountManager] Failed to read accounts file, creating default', e);
        }

        // Default initial account
        const defaultId = 'acc_default';
        this.accounts = [
            {
                id: defaultId,
                name: 'Akun 1',
                partition: `persist:wa_account_${defaultId}`,
                color: COLORS[0],
                badge: 0
            }
        ];
        this.activeAccountId = defaultId;
        this.saveAccounts();
    }

    saveAccounts() {
        try {
            const data = {
                activeAccountId: this.activeAccountId,
                accounts: this.accounts.map(acc => ({
                    id: acc.id,
                    name: acc.name,
                    partition: acc.partition,
                    color: acc.color
                }))
            };
            fs.writeFileSync(this.accountsFile, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            log.error('[AccountManager] Failed to save accounts file', e);
        }
    }

    getPublicState() {
        return {
            activeAccountId: this.activeAccountId,
            accounts: this.accounts.map(acc => ({
                id: acc.id,
                name: acc.name,
                color: acc.color,
                badge: acc.badge || 0
            }))
        };
    }

    notifyShell(channel, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.webContents) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    setupIpc() {
        ipcMain.handle('get-accounts-state', () => {
            return this.getPublicState();
        });

        ipcMain.handle('switch-account', (event, accountId) => {
            return this.switchAccount(accountId);
        });

        ipcMain.handle('add-account', (event, name) => {
            return this.addAccount(name);
        });

        ipcMain.handle('rename-account', (event, { id, name }) => {
            return this.renameAccount(id, name);
        });

        ipcMain.handle('remove-account', (event, id) => {
            return this.removeAccount(id);
        });

        ipcMain.handle('reload-account', (event, id) => {
            return this.reloadAccount(id);
        });

        ipcMain.handle('clear-account-session', async (event, id) => {
            return await this.clearAccountSession(id);
        });

        ipcMain.handle('set-modal-state', (event, isOpen) => {
            this.isModalOpen = !!isOpen;
            if (this.isModalOpen) {
                this.mainWindow.setBrowserView(null);
            } else {
                const activeView = this.views.get(this.activeAccountId);
                if (activeView) {
                    this.mainWindow.setBrowserView(activeView);
                    this.updateViewBounds();
                    if (!activeView.webContents.isDestroyed()) {
                        activeView.webContents.focus();
                    }
                }
            }
            return true;
        });

        ipcMain.on('show-account-context-menu', (event, accountId) => {
            const account = this.accounts.find(a => a.id === accountId);
            if (!account) return;

            const menu = new Menu();
            menu.append(new MenuItem({
                label: 'Ubah Nama',
                click: () => {
                    this.notifyShell('trigger-rename-account', accountId);
                }
            }));
            menu.append(new MenuItem({
                label: 'Muat Ulang Tab',
                click: () => {
                    this.reloadAccount(accountId);
                }
            }));
            menu.append(new MenuItem({
                label: 'Keluar / Reset Sesi',
                click: () => {
                    this.notifyShell('trigger-clear-account', accountId);
                }
            }));
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({
                label: 'Hapus Akun',
                enabled: this.accounts.length > 1,
                click: () => {
                    this.notifyShell('trigger-delete-account', accountId);
                }
            }));

            menu.popup({ window: this.mainWindow });
        });

        ipcMain.on('open-settings', () => {
            if (global.settings) {
                global.settings.init();
            }
        });

        ipcMain.on('open-about', () => {
            if (global.about) {
                global.about.init();
            }
        });
    }

    getOrCreateView(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return null;

        if (this.views.has(accountId)) {
            return this.views.get(accountId);
        }

        log.info(`[AccountManager] Creating BrowserView for account: ${account.name} (${account.id})`);

        const view = new BrowserView({
            webPreferences: {
                partition: account.partition,
                preload: path.join(__dirname, 'js', 'injected.js'),
                spellcheck: false,
                nodeIntegration: false,
                contextIsolation: false,
                backgroundThrottling: true
            }
        });

        const ua = this.userAgent;
        view.webContents.setUserAgent(ua);

        const sess = view.webContents.session;
        sess.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['User-Agent'] = ua;
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });

        // Auto-grant WhatsApp media & notification permissions
        sess.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['notifications', 'media', 'mediaKeySystem', 'clipboard-sanitized-write', 'fullscreen'];
            callback(allowed.includes(permission));
        });

        // Apply proxy if configured
        if (global.config && global.config.get("useProxy")) {
            const httpProxy = global.config.get("httpProxy");
            const httpsProxy = global.config.get("httpsProxy") || httpProxy;
            if (httpProxy) {
                sess.setProxy("http=" + httpProxy + ";https=" + httpsProxy, () => {});
            }
        }

        // Open external links in default OS browser
        view.webContents.on('new-window', (e, url) => {
            e.preventDefault();
            shell.openExternal(url);
        });

        // Custom context menu with spellcheck suggestions
        view.webContents.on('context-menu', (event, params) => {
            const menu = new Menu();

            if (params.misspelledWord) {
                if (params.dictionarySuggestions.length > 0) {
                    params.dictionarySuggestions.forEach(suggestion => {
                        menu.append(new MenuItem({
                            label: suggestion,
                            click: () => view.webContents.replaceMisspelling(suggestion)
                        }));
                    });
                } else {
                    menu.append(new MenuItem({
                        label: 'No suggestions available',
                        enabled: false
                    }));
                }
                menu.append(new MenuItem({ type: 'separator' }));
                menu.append(new MenuItem({
                    label: 'Add to Dictionary',
                    click: () => sess.addWordToSpellCheckerDictionary(params.misspelledWord)
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            }

            if (params.isEditable) {
                menu.append(new MenuItem({ label: 'Cut', role: 'cut', enabled: params.editFlags.canCut }));
                menu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy }));
                menu.append(new MenuItem({ label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste }));
                menu.append(new MenuItem({ label: 'Select All', role: 'selectAll', enabled: params.editFlags.canSelectAll }));
            } else if (params.selectionText) {
                menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
            }

            if (params.linkURL) {
                if (menu.items.length > 0) menu.append(new MenuItem({ type: 'separator' }));
                menu.append(new MenuItem({
                    label: 'Copy Link',
                    click: () => electron.clipboard.writeText(params.linkURL)
                }));
            }

            if (menu.items.length > 0) {
                menu.popup({ window: this.mainWindow });
            }
        });

        // Watch for unread messages badge from page title
        view.webContents.on('page-title-updated', (event, title) => {
            const match = title.match(/\((\d+)\)/);
            const count = match ? parseInt(match[1], 10) : 0;
            account.badge = count;

            this.notifyShell('account-badge-updated', {
                id: account.id,
                badge: count
            });

            this.updateTotalAppBadge();
        });

        // Apply custom CSS (dark mode, fontSize, etc.)
        view.webContents.on('dom-ready', () => {
            this.applyConfigToView(view);
        });

        // Load WhatsApp Web
        view.webContents.loadURL('https://web.whatsapp.com', { userAgent: ua });

        this.views.set(accountId, view);
        return view;
    }

    applyConfigToView(view) {
        if (!global.config || !view || view.webContents.isDestroyed()) return;

        try {
            let fontSize = global.config.get("fontSize") || "normal";
            let fontCSS = (fontSize !== "normal") ? `font-size: ${fontSize} !important;` : "";
            view.webContents.insertCSS(`* { text-rendering: optimizeSpeed !important; -webkit-font-smoothing: subpixel-antialiased !important; ${fontCSS} }`);

            if (global.config.get("hideAvatars")) {
                view.webContents.insertCSS('.chat-avatar img { display: none !important; }');
            }
            if (global.config.get("hidePreviews")) {
                view.webContents.insertCSS('.chat-secondary .chat-status{z-index: -999;}');
            }
            if (global.config.get("blurImages")) {
                view.webContents.insertCSS('div.message-in img, div.message-out img { filter: contrast(25%) blur(8px) grayscale(75%); } div.message-in:hover img, div.message-out:hover img { filter: none; }');
            }
        } catch (e) {
            log.warn('[AccountManager] Error injecting styles into view:', e);
        }
    }

    applyConfigToAllViews() {
        this.views.forEach(view => {
            this.applyConfigToView(view);
        });
    }

    updateViewBounds() {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
        if (this.isModalOpen) return;
        const activeView = this.views.get(this.activeAccountId);
        if (!activeView) return;

        const bounds = this.mainWindow.getContentBounds();
        const viewWidth = Math.max(0, bounds.width - SIDEBAR_WIDTH);
        const viewHeight = bounds.height;

        activeView.setBounds({
            x: SIDEBAR_WIDTH,
            y: 0,
            width: viewWidth,
            height: viewHeight
        });
        activeView.setAutoResize({ width: true, height: true });
    }

    switchAccount(accountId) {
        const target = this.accounts.find(a => a.id === accountId);
        if (!target) return false;

        this.activeAccountId = accountId;
        this.saveAccounts();

        const view = this.getOrCreateView(accountId);
        if (!view) return false;

        if (!this.isModalOpen) {
            this.mainWindow.setBrowserView(view);
            this.updateViewBounds();
            view.webContents.focus();
        }

        this.notifyShell('accounts-updated', this.getPublicState());
        return true;
    }

    addAccount(name) {
        const id = `acc_${Date.now()}`;
        const colorIndex = this.accounts.length % COLORS.length;
        const accountName = (name && name.trim()) ? name.trim() : `Akun ${this.accounts.length + 1}`;

        const newAccount = {
            id: id,
            name: accountName,
            partition: `persist:wa_account_${id}`,
            color: COLORS[colorIndex],
            badge: 0
        };

        this.accounts.push(newAccount);
        this.saveAccounts();

        // Switch to the newly created account immediately
        this.switchAccount(id);
        return newAccount;
    }

    renameAccount(id, newName) {
        const account = this.accounts.find(a => a.id === id);
        if (!account) return false;

        account.name = (newName && newName.trim()) ? newName.trim() : account.name;
        this.saveAccounts();
        this.notifyShell('accounts-updated', this.getPublicState());
        return true;
    }

    reloadAccount(id) {
        const view = this.views.get(id);
        if (view && !view.webContents.isDestroyed()) {
            view.webContents.reload();
            return true;
        }
        return false;
    }

    async clearAccountSession(id) {
        const account = this.accounts.find(a => a.id === id);
        if (!account) return false;

        const view = this.views.get(id);
        if (view && !view.webContents.isDestroyed()) {
            const sess = view.webContents.session;
            await sess.clearStorageData();
            await sess.clearCache();
            view.webContents.loadURL('https://web.whatsapp.com', { userAgent: this.userAgent });
            account.badge = 0;
            this.notifyShell('account-badge-updated', { id, badge: 0 });
            this.updateTotalAppBadge();
            return true;
        }
        return false;
    }

    async removeAccount(id) {
        if (this.accounts.length <= 1) {
            log.warn('[AccountManager] Cannot delete the only remaining account');
            return false;
        }

        const index = this.accounts.findIndex(a => a.id === id);
        if (index === -1) return false;

        const targetAccount = this.accounts[index];

        // Clean up BrowserView
        if (this.views.has(id)) {
            const view = this.views.get(id);
            if (this.activeAccountId === id) {
                this.mainWindow.setBrowserView(null);
            }
            try {
                const sess = view.webContents.session;
                await sess.clearStorageData();
                await sess.clearCache();
            } catch (e) {
                log.warn('[AccountManager] Error clearing storage data on remove:', e);
            }
            view.webContents.destroy();
            this.views.delete(id);
        }

        this.accounts.splice(index, 1);

        // If the removed account was active, switch to next or previous account
        if (this.activeAccountId === id) {
            const nextActive = this.accounts[Math.max(0, index - 1)] || this.accounts[0];
            this.activeAccountId = nextActive.id;
        }

        this.saveAccounts();
        this.switchAccount(this.activeAccountId);
        this.updateTotalAppBadge();
        return true;
    }

    updateTotalAppBadge() {
        const total = this.accounts.reduce((sum, acc) => sum + (acc.badge || 0), 0);

        if (process.platform === 'darwin') {
            app.dock.setBadge(total > 0 ? String(total) : '');
        } else if (process.platform === 'win32' || process.platform === 'linux') {
            if (total > 0) {
                if (!this.mainWindow.isFocused() && global.config && global.config.get("quietMode") !== true) {
                    this.mainWindow.flashFrame(true);
                }
                const badgeIndex = total > 9 ? 0 : total;
                const badgePath = path.join(app.getAppPath(), 'assets', 'badges', `badge-${badgeIndex}.png`);
                if (fs.existsSync(badgePath)) {
                    const badge = nativeImage.createFromPath(badgePath);
                    this.mainWindow.setOverlayIcon(badge, `${total} pesan baru`);
                }
                if (global.whatsApp) global.whatsApp.setNewMessageIcon();
            } else {
                this.mainWindow.setOverlayIcon(null, '');
                if (global.whatsApp) global.whatsApp.clearNewMessageIcon();
            }
        }

        log.info(`[AccountManager] Total badge count across all accounts: ${total}`);
    }

    init() {
        // Create initial view for the active account
        this.switchAccount(this.activeAccountId);
    }
}

module.exports = AccountManager;
