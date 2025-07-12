import TeactDOM from '../../lib/teact/teact-dom';
export default function jsxToHtml(jsx) {
    const fragment = document.createElement('div');
    TeactDOM.render(jsx, fragment);
    const children = Array.from(fragment.children);
    TeactDOM.render(undefined, fragment);
    return children;
}
