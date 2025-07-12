import { useEffect, useRef } from '../lib/teact/teact';
import { preloadImage } from '../util/files';
import useAsync from './useAsync';
export default function useImageLoader(file) {
    const urlRef = useRef();
    const { result: image } = useAsync(() => {
        if (!file) {
            return Promise.resolve(undefined);
        }
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
        }
        const url = URL.createObjectURL(file);
        urlRef.current = url;
        return preloadImage(url);
    }, [file]);
    useEffect(() => {
        return () => {
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = undefined;
            }
        };
    }, []);
    return { image };
}
