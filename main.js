const { app, BrowserWindow, Menu } = require('electron');
const localShortcut = require('electron-localshortcut');
const path = require('path');
const domScript = require('./domScript');

const START_URL = 'http://mole.61.com/';
const WIDTH = 960;
const HEIGHT = 560;
const TITLE_BAR_HEIGHT = 26;
const RESIZABLE = process.platform === 'darwin' ? true : false

let mainWindow = null;

configureFlash();

function configureFlash() {
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
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

function createWindow() {
    const win = new BrowserWindow({
        width: WIDTH,
        height: HEIGHT + TITLE_BAR_HEIGHT,
        resizable: RESIZABLE,
        backgroundColor: '#000000',
        'auto-hide-menu-bar': process.platform !== 'darwin',
        title: 'Mole.app',
        icon: path.join(__dirname, 'icon_256x256.ico'),
        webPreferences: {
            plugins: true,
            contextIsolation: false,
        }
    });

    win.loadURL(START_URL);

    win.webContents.on('did-finish-load', () => {
        win.webContents.executeJavaScript(domScript);
    });

    // Block external new windows
    win.webContents.on('new-window', (event, url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === new URL(START_URL).hostname) {
                return;
            }
        } catch (e) {
            // Invalid URL
        }
        event.preventDefault();
    });

    win.on('closed', () => {
        if (mainWindow === win) {
            mainWindow = null;
        }
    });

    // Register keyboard shortcuts
    localShortcut.register(win, 'CmdOrCtrl+N', () => createWindow());
    localShortcut.register(win, 'CmdOrCtrl+Shift+I', () => win.webContents.toggleDevTools());
    localShortcut.register(win, 'F12', () => process.platform !== 'darwin' && win.webContents.toggleDevTools());
    localShortcut.register(win, 'CmdOrCtrl+W', () => win.close());
    localShortcut.register(win, 'Alt+F4', () => process.platform !== 'darwin' && win.close());
    localShortcut.register(win, 'CmdOrCtrl+R', () => win.webContents.reload());
    localShortcut.register(win, 'F5', () => process.platform !== 'darwin' && win.webContents.reload());
    localShortcut.register(win, 'CmdOrCtrl+Q', () => app.quit());
    localShortcut.register(win, 'CmdOrCtrl+0', () => win.webContents.setZoomFactor(1));

    return win;
}

app.on('ready', () => {
    mainWindow = createWindow();

    if (process.platform === 'darwin') {
        const template = Menu.buildFromTemplate([
            {
                label: 'Mole.app',
                submenu: [{ role: 'quit' }]
            }
        ]);
        Menu.setApplicationMenu(template);
    } else {
        Menu.setApplicationMenu(null);
    }
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
