const { session } = require('electron');

const INCOGNITO_PARTITION = 'in-memory-incognito';
let windowCount = 0;

function getIncognitoPartition() {
    return INCOGNITO_PARTITION;
}

function registerIncognitoWindow(win) {
    windowCount++;
    
    // 当一个无痕窗口关闭时，减少计数
    win.on('closed', () => {
        windowCount--;
        
        // 如果最后一个无痕窗口也被关了，下令清空所有痕迹内存
        if (windowCount === 0) {
            const incogSession = session.fromPartition(INCOGNITO_PARTITION);
            if (incogSession) {
                incogSession.clearStorageData();
            }
        }
    });
}

module.exports = {
    getIncognitoPartition,
    registerIncognitoWindow
};
