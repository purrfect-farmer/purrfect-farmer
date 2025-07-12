import { memo } from '../../../../lib/teact/teact';
import useLastCallback from '../../../../hooks/useLastCallback';
import BaseResult from './BaseResult';
const ArticleResult = ({ focus, inlineResult, onClick }) => {
    const { title, description, } = inlineResult;
    const url = 'url' in inlineResult ? inlineResult.url : undefined;
    const webThumbnail = 'webThumbnail' in inlineResult ? inlineResult.webThumbnail : undefined;
    const handleClick = useLastCallback(() => {
        onClick(inlineResult);
    });
    return (<BaseResult focus={focus} thumbnail={webThumbnail} title={title || url} description={description} onClick={handleClick}/>);
};
export default memo(ArticleResult);
