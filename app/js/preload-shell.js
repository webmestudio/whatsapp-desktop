const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAccountsState: () => ipcRenderer.invoke('get-accounts-state'),
    switchAccount: (id) => ipcRenderer.invoke('switch-account', id),
    addAccount: (name) => ipcRenderer.invoke('add-account', name),
    renameAccount: (id, name) => ipcRenderer.invoke('rename-account', { id, name }),
    removeAccount: (id) => ipcRenderer.invoke('remove-account', id),
    reloadAccount: (id) => ipcRenderer.invoke('reload-account', id),
    clearAccountSession: (id) => ipcRenderer.invoke('clear-account-session', id),
    setModalState: (isOpen) => ipcRenderer.invoke('set-modal-state', isOpen),
    showAccountContextMenu: (id) => ipcRenderer.send('show-account-context-menu', id),
    openSettings: () => ipcRenderer.send('open-settings'),
    openAbout: () => ipcRenderer.send('open-about'),

    onAccountsUpdated: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('accounts-updated', handler);
        return () => ipcRenderer.removeListener('accounts-updated', handler);
    },

    onBadgeUpdated: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('account-badge-updated', handler);
        return () => ipcRenderer.removeListener('account-badge-updated', handler);
    },

    onTriggerRenameAccount: (callback) => {
        const handler = (event, id) => callback(id);
        ipcRenderer.on('trigger-rename-account', handler);
        return () => ipcRenderer.removeListener('trigger-rename-account', handler);
    },

    onTriggerClearAccount: (callback) => {
        const handler = (event, id) => callback(id);
        ipcRenderer.on('trigger-clear-account', handler);
        return () => ipcRenderer.removeListener('trigger-clear-account', handler);
    },

    onTriggerDeleteAccount: (callback) => {
        const handler = (event, id) => callback(id);
        ipcRenderer.on('trigger-delete-account', handler);
        return () => ipcRenderer.removeListener('trigger-delete-account', handler);
    }
});
