import { isUserId } from '../../util/entities/ids';
import { omit, uniqueByField } from '../../util/iteratees';
import { isChatChannel } from '../helpers';
import { selectChatFullInfo, selectPeer, selectPeerPhotos, selectUserFullInfo, } from '../selectors';
import { updateChat, updateChatFullInfo } from './chats';
import { updateUser, updateUserFullInfo } from './users';
export function updatePeer(global, peerId, peerUpdate) {
    if (isUserId(peerId)) {
        return updateUser(global, peerId, peerUpdate);
    }
    return updateChat(global, peerId, peerUpdate);
}
export function updatePeerFullInfo(global, peerId, peerFullInfoUpdate) {
    if (isUserId(peerId)) {
        return updateUserFullInfo(global, peerId, peerFullInfoUpdate);
    }
    return updateChatFullInfo(global, peerId, peerFullInfoUpdate);
}
export function updatePeerPhotosIsLoading(global, peerId, isLoading) {
    const profilePhotos = selectPeerPhotos(global, peerId);
    if (!profilePhotos) {
        return global;
    }
    return replacePeerPhotos(global, peerId, {
        ...profilePhotos,
        isLoading,
    });
}
export function replacePeerPhotos(global, peerId, value) {
    if (!value) {
        return {
            ...global,
            peers: {
                ...global.peers,
                profilePhotosById: omit(global.peers.profilePhotosById, [peerId]),
            },
        };
    }
    return {
        ...global,
        peers: {
            ...global.peers,
            profilePhotosById: {
                ...global.peers.profilePhotosById,
                [peerId]: value,
            },
        },
    };
}
export function updatePeerPhotos(global, peerId, update) {
    const profilePhotos = selectPeerPhotos(global, peerId);
    const { newPhotos, count, nextOffset, fullInfo, shouldInvalidateCache, } = update;
    const currentPhotos = profilePhotos;
    const profilePhoto = fullInfo.profilePhoto;
    const fallbackPhoto = 'fallbackPhoto' in fullInfo ? fullInfo.fallbackPhoto : undefined;
    const personalPhoto = 'personalPhoto' in fullInfo ? fullInfo.personalPhoto : undefined;
    if (!currentPhotos || shouldInvalidateCache) {
        // In some channels, last service message with photo change is deleted, so we need to patch it in
        if (profilePhoto && profilePhoto.id !== newPhotos[0]?.id) {
            newPhotos.unshift(profilePhoto);
        }
        if (personalPhoto && personalPhoto.id !== newPhotos[0]?.id) {
            newPhotos.unshift(personalPhoto);
        }
        if (fallbackPhoto) {
            newPhotos.push(fallbackPhoto);
        }
        return replacePeerPhotos(global, peerId, {
            fallbackPhoto,
            personalPhoto,
            photos: newPhotos,
            count,
            nextOffset,
            isLoading: false,
        });
    }
    const hasFallbackPhoto = currentPhotos.photos[currentPhotos.photos.length - 1].id === fallbackPhoto?.id;
    const currentPhotoArray = hasFallbackPhoto ? currentPhotos.photos.slice(0, -1) : currentPhotos.photos;
    const photos = uniqueByField([...currentPhotoArray, ...newPhotos, fallbackPhoto].filter(Boolean), 'id');
    return replacePeerPhotos(global, peerId, {
        fallbackPhoto,
        personalPhoto,
        photos,
        count,
        nextOffset,
        isLoading: false,
    });
}
export function deletePeerPhoto(global, peerId, photoId, isFromActionMessage) {
    const peer = selectPeer(global, peerId);
    const profilePhotos = selectPeerPhotos(global, peerId);
    if (!peer || !profilePhotos) {
        return global;
    }
    const isChannel = 'title' in peer && isChatChannel(peer);
    const userFullInfo = selectUserFullInfo(global, peerId);
    const chatFullInfo = selectChatFullInfo(global, peerId);
    const isAvatar = peer.avatarPhotoId === photoId && (!isChannel || isFromActionMessage);
    const nextAvatarPhoto = isAvatar ? profilePhotos.photos[1] : undefined;
    if (userFullInfo) {
        const newFallbackPhoto = userFullInfo.fallbackPhoto?.id === photoId ? undefined : userFullInfo.fallbackPhoto;
        const newPersonalPhoto = userFullInfo.personalPhoto?.id === photoId ? undefined : userFullInfo.personalPhoto;
        const newProfilePhoto = userFullInfo.profilePhoto?.id === photoId ? nextAvatarPhoto : userFullInfo.profilePhoto;
        global = updateUserFullInfo(global, peerId, {
            fallbackPhoto: newFallbackPhoto,
            personalPhoto: newPersonalPhoto,
            profilePhoto: newProfilePhoto,
        });
    }
    if (chatFullInfo) {
        const newProfilePhoto = chatFullInfo.profilePhoto?.id === photoId ? nextAvatarPhoto : chatFullInfo.profilePhoto;
        global = updateChatFullInfo(global, peerId, {
            profilePhoto: newProfilePhoto,
        });
    }
    const avatarPhotoId = isAvatar ? nextAvatarPhoto?.id : peer.avatarPhotoId;
    const shouldKeepInPhotos = isAvatar && 'title' in peer && isChatChannel(peer);
    const photos = shouldKeepInPhotos
        ? profilePhotos.photos.filter((photo) => photo.id !== photoId) : profilePhotos.photos.slice();
    global = updatePeer(global, peerId, {
        avatarPhotoId,
    });
    global = replacePeerPhotos(global, peerId, avatarPhotoId ? {
        ...profilePhotos,
        photos,
        count: profilePhotos.count - 1,
    } : undefined);
    return global;
}
