const { BrowserWindow } = require('electron');

const SERVERS = [
    { title: '官服', baseUrl: 'http://mole.61.com/', versionsAll: false },
    { title: '平行服', baseUrl: 'https://mole.61player.com/', versionsAll: true },
    { title: '平行服分节点', baseUrl: 'https://mole-sub.61player.com/', versionsAll: true }
];

const VERSIONS = [
    { title: '主版本', suffix: '' },
    { title: '骑士版', suffix: 'moleverse/20090626/' },
    { title: '圣诞版', suffix: 'moleverse/20111225/' },
    { title: '万圣版', suffix: 'moleverse/20190815/' },
    { title: '新春版', suffix: 'moleverse/20120128/' },
    { title: '火神杯', suffix: 'moleverse/2025hsb/' },
    { title: '桃源版', suffix: 'moleverse/taoyuan/' }
];

const DEFAULT_URL = SERVERS[0].baseUrl; // 第一次运行默认官服

function normalize(url) {
    return url.replace(/\/$/, '');
}

function loadUrl(url) {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (win) win.loadURL(url);
}

function getServersMenu(currentUrl) {
    return {
        label: 'Servers',
        submenu: SERVERS.map(server => {
            const versions = server.versionsAll ? VERSIONS : [VERSIONS[0]];

            if (versions.length === 1) {
                const fullUrl = server.baseUrl + versions[0].suffix;
                return {
                    label: server.title,
                    type: 'checkbox',
                    checked: normalize(currentUrl) === normalize(fullUrl),
                    click: () => loadUrl(fullUrl)
                };
            }

            return {
                label: server.title,
                submenu: versions.map(v => {
                    const fullUrl = server.baseUrl + v.suffix;
                    return {
                        label: v.title,
                        type: 'checkbox',
                        checked: normalize(currentUrl) === normalize(fullUrl),
                        click: () => loadUrl(fullUrl)
                    };
                })
            };
        })
    };
}

module.exports = { SERVERS, VERSIONS, DEFAULT_URL, getServersMenu };
