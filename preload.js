const WHITE = '#ffffff';
const BLACK = '#000000';

// 预加载阶段：保持纯白并去掉默认边距
window.addEventListener('DOMContentLoaded', () => {
    const doc = document;
    const html = doc.documentElement;
    const head = doc.head;
    const body = doc.body;

    const isIncognito = process.argv.includes('--is-incognito=true');
    const myTitle = isIncognito ? '摩尔庄园 (无痕浏览)' : '摩尔庄园';

    if (html) {
        html.style.margin = '0';
        html.style.padding = '0';
        html.style.backgroundColor = WHITE;
        html.style.overflow = 'hidden';
    }

    if (head) {
        head.innerHTML = '';
        const title = doc.createElement('title');
        title.textContent = myTitle;
        head.appendChild(title);
    }

    if (body) {
        body.style.margin = '0';
        body.style.padding = '0';
        body.style.backgroundColor = WHITE;
        body.style.visibility = 'hidden';
        body.style.display = 'none';
        body.style.overflow = 'hidden';
    }

    doc.title = myTitle;

    const preventScroll = (e) => {
        e.preventDefault();
        return false;
    };
    window.addEventListener('scroll', preventScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
});

// 页面加载完成后：仅保留 .flash_main 容器
window.addEventListener('load', () => {
    try {
        const doc = document;
        const body = doc.body;
        if (!body) return;

        const flashContainer = doc.querySelector('.flash_main');

        if (flashContainer) {
            body.replaceChildren(flashContainer);
            flashContainer.style.display = 'block';
        }

        // switch to WHITE background for the whole document after full load
        if (doc.documentElement) {
            doc.documentElement.style.backgroundColor = WHITE;
        }
        body.style.backgroundColor = WHITE;
        body.style.display = 'block';
        body.style.visibility = 'visible';
    } catch (err) {
        console.error('preload cleanup failed:', err);
    }
});
