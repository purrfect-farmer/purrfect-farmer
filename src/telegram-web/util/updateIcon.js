export default function updateIcon(asUnread) {
    document.querySelectorAll('link[rel="icon"], link[rel="alternate icon"]')
        .forEach((link) => {
        if (asUnread) {
            if (!link.href.includes('favicon-unread')) {
                link.href = link.href.replace('favicon', 'favicon-unread');
            }
        }
        else {
            link.href = link.href.replace('favicon-unread', 'favicon');
        }
    });
}
