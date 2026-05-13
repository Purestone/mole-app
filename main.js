const { app, BrowserWindow, Menu, session, screen } = require('electron');
const localShortcut = require('electron-localshortcut');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const { getIncognitoPartition, registerIncognitoWindow } = require('./incognito');
const { DEFAULT_SERVER, DEFAULT_VERSION, getUrl, getServersMenu, matchUrl, SERVERS } = require('./servers');
const store = new Store({ defaults: { serverIndex: DEFAULT_SERVER, versionIndex: DEFAULT_VERSION, isMuted: true } });

const WIDTH = 960;
const HEIGHT = 560;
const RESIZABLE = false;
const WHITE = '#ffffff';

let mainWindow = null;

// Debounce helper: prevents double-trigger when both menu accelerator
// and localShortcut fire for the same key (Flash hijacks keyboard focus).
function debounceAction(fn, delay = 100) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall < delay) return;
        lastCall = now;
        fn(...args);
    };
}

const dNewWindow = debounceAction(() => createWindow(false));
const dNewPrivateWindow = debounceAction(() => createWindow(true));
const dReload = debounceAction(() => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.reload();
});
const dCloseWindow = debounceAction(() => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});
const dQuit = debounceAction(() => app.quit());

configureFlash();

function configureFlash() {
    if (process.platform !== 'darwin') {
        app.disableHardwareAcceleration();
    }

    let pluginName;
    let pluginVersion;

    switch (process.platform) {
        case 'win32':
            pluginName = 'pepflashplayer64_26_0_0_131.dll';
            pluginVersion = '26.0.0.131';
            break;
        case 'darwin':
            pluginName = 'PepperFlashPlayer.plugin';
            pluginVersion = '21.0.0.204';
            break;
        default:
            pluginName = undefined;
            pluginVersion = undefined;
    }

    if (pluginName) {
        const pluginPath = path.join(__dirname, 'plugins', pluginName);
        app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
        app.commandLine.appendSwitch('ppapi-flash-version', pluginVersion);
    }

    app.commandLine.appendSwitch('--disable-http-cache');
}

function createWindow(isIncognito = false) {
    const webPref = {
        plugins: true,
        contextIsolation: false,
        preload: path.join(__dirname, 'preload.js'),
        additionalArguments: [`--is-incognito=${isIncognito ? 'true' : 'false'}`]
    };

    if (isIncognito) {
        webPref.partition = getIncognitoPartition();
    }

    // Cascading logic: offset new window from the currently focused one
    const focusedWin = BrowserWindow.getFocusedWindow();
    let x, y;
    if (focusedWin) {
        const bounds = focusedWin.getBounds();
        const display = screen.getDisplayMatching(bounds);
        const area = display.workArea;

        x = bounds.x + 30;
        y = bounds.y + 30;

        // Reset to a default position if cascading goes beyond screen bounds
        if (x + WIDTH > area.x + area.width || y + HEIGHT > area.y + area.height) {
            x = area.x + 50;
            y = area.y + 50;
        }
    }

    const win = new BrowserWindow({
        x: x,
        y: y,
        width: WIDTH,
        height: HEIGHT,
        useContentSize: true,
        resizable: RESIZABLE,
        backgroundColor: WHITE,
        'auto-hide-menu-bar': process.platform !== 'darwin',
        title: isIncognito ? 'Mole.app (Incognito)' : 'Mole.app',
        icon: path.join(__dirname, 'icon_256x256.ico'),
        webPreferences: webPref
    });

    if (isIncognito) {
        registerIncognitoWindow(win);
    }

    win.webContents.setAudioMuted(store.get('isMuted'));

    const sIdx = isIncognito ? DEFAULT_SERVER : store.get('serverIndex');
    const vIdx = isIncognito ? DEFAULT_VERSION : store.get('versionIndex');
    const targetUrl = getUrl(sIdx, vIdx);
    win.loadURL(targetUrl);

    win.webContents.on('did-navigate', (event, url) => {
        updateAppMenu();
    });

    win.webContents.on('new-window', (event, url) => {
        if (!matchUrl(url)) {
            event.preventDefault();
        }
    });

    win.on('closed', () => {
        if (mainWindow === win) {
            mainWindow = null;
        }
        updateAppMenu();
    });

    // Register keyboard shortcuts via localShortcut to punch through Flash.
    // Menu accelerators serve as display hints + fallback; debounce prevents double-fire.
    localShortcut.unregisterAll(win);
    localShortcut.register(win, 'CmdOrCtrl+N', dNewWindow);
    localShortcut.register(win, 'CmdOrCtrl+Shift+N', dNewPrivateWindow);
    localShortcut.register(win, 'CmdOrCtrl+R', dReload);
    localShortcut.register(win, 'CmdOrCtrl+W', dCloseWindow);
    localShortcut.register(win, 'CmdOrCtrl+Q', dQuit);
    localShortcut.register(win, process.platform === 'darwin' ? 'Cmd+Option+I' : 'CmdOrCtrl+Shift+I', () => win.webContents.toggleDevTools());
    localShortcut.register(win, 'F12', () => process.platform !== 'darwin' && win.webContents.toggleDevTools());
    localShortcut.register(win, 'F5', () => process.platform !== 'darwin' && win.webContents.reload());
    localShortcut.register(win, 'Alt+F4', () => process.platform !== 'darwin' && win.close());
    localShortcut.register(win, 'CmdOrCtrl+0', () => win.webContents.setZoomFactor(1));

    return win;
}

async function clearAppData() {
    // 1. Clear Electron session data and cache
    await session.defaultSession.clearStorageData();
    await session.defaultSession.clearCache();

    // 2. Clear Flash SharedObjects (Pepper Data)
    const pepperDataPath = path.join(app.getPath('userData'), 'Pepper Data');
    if (fs.existsSync(pepperDataPath)) {
        try {
            fs.rmdirSync(pepperDataPath, { recursive: true });
        } catch (err) {
            console.error('Failed to clear Pepper Data:', err);
        }
    }
}

function updateAppMenu() {
    if (process.platform === 'darwin') {
        const sIdx = store.get('serverIndex');
        const vIdx = store.get('versionIndex');

        const template = Menu.buildFromTemplate([
            {
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    {
                        label: 'Clear Cookies',
                        click: clearAppData
                    },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Window',
                        accelerator: 'CmdOrCtrl+N',
                        click: dNewWindow
                    },
                    {
                        label: 'New Private Window',
                        accelerator: 'CmdOrCtrl+Shift+N',
                        click: dNewPrivateWindow
                    },
                    { type: 'separator' },
                    {
                        label: 'Close Window',
                        accelerator: 'CmdOrCtrl+W',
                        click: dCloseWindow
                    }
                ]
            },
            { role: 'editMenu' },
            {
                label: 'View',
                submenu: [
                    {
                        role: 'reload',
                        enabled: BrowserWindow.getAllWindows().length > 0
                    }
                ]
            },
            {
                label: 'Audio',
                submenu: [
                    {
                        label: 'Mute all',
                        type: 'checkbox',
                        checked: store.get('isMuted'),
                        click: (menuItem) => {
                            const isMuted = menuItem.checked;
                            store.set('isMuted', isMuted);
                            BrowserWindow.getAllWindows().forEach(w => {
                                w.webContents.setAudioMuted(isMuted);
                            });
                        }
                    }
                ]
            },
            getServersMenu(sIdx, vIdx, (newSIdx, newVIdx) => {
                store.set({ serverIndex: newSIdx, versionIndex: newVIdx });
                const focusedWin = BrowserWindow.getFocusedWindow() || mainWindow;
                if (focusedWin) {
                    focusedWin.loadURL(getUrl(newSIdx, newVIdx));
                }
                updateAppMenu();
            }),
            { role: 'windowMenu' }
        ]);
        Menu.setApplicationMenu(template);
    } else {
        Menu.setApplicationMenu(null);
    }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            const win = windows[0];
            if (win.isMinimized()) win.restore();
            win.focus();
        } else {
            mainWindow = createWindow();
        }
    });

    app.on('ready', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow();
        }
        updateAppMenu();
    });
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
