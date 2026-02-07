module.exports = `
    // Remove the entire head element
    const head = document.querySelector('head');
    if (head) {
        head.remove();
    }
    
    // Find the embed element
    const flashEmbed = document.querySelector('embed[type="application/x-shockwave-flash"]');
    
    if (flashEmbed) {
        // Function to check if element should be kept
        function shouldKeepElement(el) {
            // Keep if it's the embed itself
            if (el === flashEmbed) return true;
            
            // Keep if it contains the embed
            if (el.contains && el.contains(flashEmbed)) return true;
            
            // Keep div if id contains 'flash' or 'Flash'
            if (el.tagName === 'DIV' && el.id && (el.id.includes('flash') || el.id.includes('Flash'))) {
                return true;
            }
            
            return false;
        }
        
        // Remove all scripts
        document.querySelectorAll('script').forEach(el => el.remove());
        
        // Remove unwanted elements from body
        const body = document.body;
        if (body) {
            Array.from(body.children).forEach(child => {
                if (!shouldKeepElement(child)) {
                    console.log('Removing from body:', child.tagName, child.id, child.className);
                    child.remove();
                }
            });
        }
        
        // Recursively clean children
        function cleanChildren(parent) {
            Array.from(parent.children).forEach(child => {
                if (!shouldKeepElement(child)) {
                    console.log('Removing:', child.tagName, child.id, child.className);
                    child.remove();
                } else if (child !== flashEmbed) {
                    cleanChildren(child);
                }
            });
        }
        
        if (body) {
            cleanChildren(body);
        }
        
        // Clean styles on ancestors
        const html = document.documentElement;
        
        if (html) {
            html.style.backgroundColor = '#000000';
            html.style.margin = '0';
            html.style.padding = '0';
            html.style.height = '100%';
        }
        
        if (body) {
            body.style.backgroundColor = '#000000';
            body.style.margin = '0';
            body.style.padding = '0';
            body.style.overflow = 'hidden';
            body.style.height = '100%';
            body.style.display = 'flex';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
        }
    }
`;
