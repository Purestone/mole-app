const { app, BrowserWindow, Menu } = require('electron');
const localShortcut = require('electron-localshortcut');
const path = require('path');

// Set userData to a 'userData' folder in the current project root for true portability
app.setPath('userData', path.join(__dirname, 'userData'));

const { getIncognitoPartition, registerIncognitoWindow } = require('./incognito');
const { DEFAULT_URL, getServersMenu, SERVERS } = require('./servers');
const Store = require('electron-store');

const store = new Store({ cwd: __dirname, defaults: { lastUrl: DEFAULT_URL, isMuted: false } });

const WIDTH = 960;
const HEIGHT = 560;
const RESIZABLE = false;
const WHITE = '#ffffff';

let mainWindow = null;

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

    const win = new BrowserWindow({
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

    const targetUrl = isIncognito ? DEFAULT_URL : store.get('lastUrl');
    win.loadURL(targetUrl);

    win.webContents.on('did-navigate', (event, url) => {
        updateAppMenu(url);
        if (!isIncognito) store.set('lastUrl', url);
    });

    win.on('close', () => {
        if (!isIncognito && win.webContents) {
            store.set('lastUrl', win.webContents.getURL());
        }
    });

    win.webContents.on('new-window', (event, url) => {
        try {
            const urlObj = new URL(url);
            const isMatch = SERVERS.some(server => {
                return urlObj.hostname === new URL(server.baseUrl).hostname;
            });
            if (isMatch) {
                return;
            }
        } catch (e) {
            // Ignore invalid URLs
        }
        event.preventDefault();
    });

    win.on('closed', () => {
        if (mainWindow === win) {
            mainWindow = null;
        }
        updateAppMenu(store.get('lastUrl'));
    });

    // Register keyboard shortcuts
    localShortcut.register(win, 'CmdOrCtrl+N', () => createWindow(false));
    localShortcut.register(win, 'CmdOrCtrl+Shift+N', () => createWindow(true));
    localShortcut.register(win, process.platform === 'darwin' ? 'Cmd+Option+I' : 'CmdOrCtrl+Shift+I', () => win.webContents.toggleDevTools());
    localShortcut.register(win, 'F12', () => process.platform !== 'darwin' && win.webContents.toggleDevTools());
    localShortcut.register(win, 'CmdOrCtrl+W', () => win.close());
    localShortcut.register(win, 'Alt+F4', () => process.platform !== 'darwin' && win.close());
    localShortcut.register(win, 'CmdOrCtrl+R', () => win.webContents.reload());
    localShortcut.register(win, 'F5', () => process.platform !== 'darwin' && win.webContents.reload());
    localShortcut.register(win, 'CmdOrCtrl+Q', () => app.quit());
    localShortcut.register(win, 'CmdOrCtrl+0', () => win.webContents.setZoomFactor(1));

    return win;
}

function updateAppMenu(currentUrl) {
    if (process.platform === 'darwin') {
        const template = Menu.buildFromTemplate([
            {
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    {
                        label: 'Clear Cookies',
                        click: async () => {
                            const { session, app } = require('electron');
                            const fs = require('fs');
                            const path = require('path');

                            // 1. Clear Electron session cookies and cache
                            await session.defaultSession.clearStorageData();
                            await session.defaultSession.clearCache();

                            // 2. Clear Flash Cookies (SharedObjects) by deleting the Pepper Data folder
                            const pepperDataPath = path.join(app.getPath('userData'), 'Pepper Data');
                            if (fs.existsSync(pepperDataPath)) {
                                fs.rmSync(pepperDataPath, { recursive: true, force: true });
                            }
                        }
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
                        click: () => createWindow(false)
                    },
                    {
                        label: 'New Private Window',
                        accelerator: 'CmdOrCtrl+Shift+N',
                        click: () => createWindow(true)
                    },
                    { type: 'separator' },
                    { role: 'close' }
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
            getServersMenu(currentUrl),
            { role: 'windowMenu' }
        ]);
        Menu.setApplicationMenu(template);
    } else {
        Menu.setApplicationMenu(null);
    }
}

app.on('ready', () => {
    mainWindow = createWindow();
    updateAppMenu(store.get('lastUrl'));
});

app.on('activate', () => {
    if (mainWindow === null) {
        mainWindow = createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
