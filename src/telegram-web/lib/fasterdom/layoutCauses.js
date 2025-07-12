// https://gist.github.com/paulirish/5d52fb081b3570c81e3a
export default {
    Element: {
        props: [
            'clientLeft', 'clientTop', 'clientWidth', 'clientHeight',
            'scrollWidth', 'scrollHeight', 'scrollLeft', 'scrollTop',
        ],
        methods: [
            'getClientRects', 'getBoundingClientRect',
            'scrollBy', 'scrollTo', 'scrollIntoView', 'scrollIntoViewIfNeeded',
        ],
    },
    HTMLElement: {
        props: [
            'offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight', 'offsetParent',
            'innerText',
        ],
        methods: ['focus'],
    },
    window: {
        props: [
            'scrollX', 'scrollY',
            'innerHeight', 'innerWidth',
        ],
        methods: ['getComputedStyle'],
    },
    VisualViewport: {
        props: [
            'height', 'width', 'offsetTop', 'offsetLeft',
        ],
    },
    Document: {
        props: ['scrollingElement'],
        methods: ['elementFromPoint'],
    },
    HTMLInputElement: {
        methods: ['select'],
    },
    MouseEvent: {
        props: ['layerX', 'layerY', 'offsetX', 'offsetY'],
    },
    Range: {
        methods: ['getClientRects', 'getBoundingClientRect'],
    },
};
