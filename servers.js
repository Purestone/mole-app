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

const DEFAULT_SERVER = 0;
const DEFAULT_VERSION = 0;

function getUrl(serverIndex, versionIndex) {
    const server = SERVERS[serverIndex];
    if (!server) return null;
    const versions = server.versionsAll ? VERSIONS : [VERSIONS[0]];
    const vIdx = server.versionsAll ? versionIndex : 0;
    const v = versions[vIdx] || versions[0];
    return server.baseUrl + v.suffix;
}

function getServersMenu(currentSIdx, currentVIdx, onSelect) {
    return {
        label: 'Servers',
        submenu: SERVERS.map((server, sIdx) => {
            const versions = server.versionsAll ? VERSIONS : [VERSIONS[0]];

            if (versions.length === 1) {
                return {
                    label: server.title,
                    type: 'checkbox',
                    checked: currentSIdx === sIdx,
                    click: () => onSelect(sIdx, 0)
                };
            }

            return {
                label: server.title,
                submenu: versions.map((v, vIdx) => {
                    return {
                        label: v.title,
                        type: 'checkbox',
                        checked: currentSIdx === sIdx && currentVIdx === vIdx,
                        click: () => onSelect(sIdx, vIdx)
                    };
                })
            };
        })
    };
}

function matchUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const normalizedUrl = url.replace(/\/$/, '');
    for (let sIdx = 0; sIdx < SERVERS.length; sIdx++) {
        const server = SERVERS[sIdx];
        const serverBase = server.baseUrl.replace(/\/$/, '');
        if (normalizedUrl.startsWith(serverBase)) {
            return { sIdx, vIdx: 0 };
        }
    }
    return null;
}

module.exports = { SERVERS, VERSIONS, DEFAULT_SERVER, DEFAULT_VERSION, getUrl, getServersMenu, matchUrl };
