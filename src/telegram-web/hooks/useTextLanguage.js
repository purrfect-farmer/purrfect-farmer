import { useEffect, useState } from '../lib/teact/teact';
import { detectLanguage } from '../util/languageDetection';
export default function useTextLanguage(text, isDisabled, getIsReady) {
    const [language, setLanguage] = useState();
    useEffect(() => {
        if (isDisabled || (getIsReady && !getIsReady()))
            return;
        if (text) {
            detectLanguage(text).then(setLanguage);
        }
        else {
            setLanguage(undefined);
        }
    }, [isDisabled, text, getIsReady]);
    return language;
}
