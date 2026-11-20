(function () {
    'use strict';

    const { ipcRenderer } = require('electron');

    // 1. Phone Info Update (legacy compatibility, run safely once after load)
    function checkPhoneInfo() {
        try {
            if (window.Store && window.Store.Conn && window.Store.Conn.phone) {
                ipcRenderer.send('phoneinfoupdate', {
                    'info': window.Store.Stream ? window.Store.Stream.info : '',
                    'me': "+" + (window.Store.Conn.me ? window.Store.Conn.me.split("@")[0] : ''),
                    'battery': window.Store.Conn.battery,
                    'plugged': window.Store.Conn.plugged,
                    'platform': window.Store.Conn.platform,
                    'phoneActive': window.Store.Stream ? window.Store.Stream.phoneActive : true,
                    'phone': {
                        'manufacturer': window.Store.Conn.phone.device_manufacturer,
                        'model': window.Store.Conn.phone.device_model,
                        'mcc': window.Store.Conn.phone.mcc,
                        'mnc': window.Store.Conn.phone.mnc,
                        'os_build_number': window.Store.Conn.phone.os_build_number,
                        'os_version': window.Store.Conn.phone.os_version,
                        'wa_version': window.Store.Conn.phone.wa_version
                    }
                });
            }
        } catch (e) {}
    }

    // Only check phone info once after WhatsApp loads, avoiding continuous polling
    window.addEventListener('load', function () {
        setTimeout(checkPhoneInfo, 5000);
    });

    // 2. Keyboard shortcut for search (Ctrl+F / Ctrl+K / Cmd+F / Cmd+K)
    // Lightweight window listener instead of heavy continuous MutationObserver on entire DOM body
    window.addEventListener('keydown', function (event) {
        if ((event.keyCode === 75 || event.keyCode === 70) && (event.metaKey || event.ctrlKey)) {
            const inputSearch = document.querySelector("div[contenteditable='true'][data-tab='3'], input.input-search, [role='textbox']");
            if (inputSearch) {
                inputSearch.focus();
            }
        }
    });

    // 3. Native Notification override
    const NativeNotification = Notification;
    Notification = function(title, options) {
        try {
            if (typeof remote !== 'undefined' && remote.getGlobal && remote.getGlobal("config")) {
                const cfg = remote.getGlobal("config");
                if (cfg.currentSettings && cfg.currentSettings.quietMode) {
                    return;
                }
            }
        } catch (e) {}

        const notification = new NativeNotification(title, options);
        notification.addEventListener('click', function() {
            ipcRenderer.send('notificationClick');
        });
        return notification;
    };

    Notification.prototype = NativeNotification.prototype;
    Notification.permission = NativeNotification.permission;
    Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);

})();
