import { useEffect } from '../../../lib/teact/teact';
import { ApiMediaFormat } from '../../../api/types';
import { getProfilePhotoMediaHash } from '../../../global/helpers';
import * as mediaLoader from '../../../util/mediaLoader';
const PHOTOS_TO_PRELOAD = 4;
export default function usePhotosPreload(photos, currentIndex) {
    useEffect(() => {
        photos.slice(currentIndex, currentIndex + PHOTOS_TO_PRELOAD).forEach((photo) => {
            const mediaHash = getProfilePhotoMediaHash(photo);
            const mediaData = mediaLoader.getFromMemory(mediaHash);
            if (!mediaData) {
                mediaLoader.fetch(mediaHash, ApiMediaFormat.BlobUrl);
            }
        });
    }, [currentIndex, photos]);
}
