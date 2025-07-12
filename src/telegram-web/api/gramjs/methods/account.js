import BigInt from 'big-integer';
import { Api as GramJs } from '../../../lib/gramjs';
import { buildApiChatLink } from '../apiBuilders/misc';
import { buildInputPeer, buildInputPhoto, buildInputReportReason, DEFAULT_PRIMITIVES } from '../gramjsBuilders';
import { invokeRequest } from './client';
export async function reportPeer({ peer, reason, description = DEFAULT_PRIMITIVES.STRING, }) {
    const result = await invokeRequest(new GramJs.account.ReportPeer({
        peer: buildInputPeer(peer.id, peer.accessHash),
        reason: buildInputReportReason(reason),
        message: description,
    }));
    return result;
}
export async function reportProfilePhoto({ peer, photo, reason, description = DEFAULT_PRIMITIVES.STRING, }) {
    const photoId = buildInputPhoto(photo);
    if (!photoId)
        return undefined;
    const result = await invokeRequest(new GramJs.account.ReportProfilePhoto({
        peer: buildInputPeer(peer.id, peer.accessHash),
        photoId,
        reason: buildInputReportReason(reason),
        message: description,
    }));
    return result;
}
export async function changeSessionSettings({ hash, areCallsEnabled, areSecretChatsEnabled, isConfirmed, }) {
    const result = await invokeRequest(new GramJs.account.ChangeAuthorizationSettings({
        hash: BigInt(hash),
        ...(areCallsEnabled !== undefined ? { callRequestsDisabled: !areCallsEnabled } : undefined),
        ...(areSecretChatsEnabled !== undefined ? { encryptedRequestsDisabled: !areSecretChatsEnabled } : undefined),
        ...(isConfirmed && { confirmed: isConfirmed }),
    }));
    return result;
}
export async function changeSessionTtl({ days, }) {
    const result = await invokeRequest(new GramJs.account.SetAuthorizationTTL({
        authorizationTtlDays: days,
    }));
    return result;
}
export async function resolveBusinessChatLink({ slug }) {
    const result = await invokeRequest(new GramJs.account.ResolveBusinessChatLink({
        slug,
    }), {
        shouldIgnoreErrors: true,
    });
    if (!result)
        return undefined;
    const chatLink = buildApiChatLink(result);
    return {
        chatLink,
    };
}
export function toggleSponsoredMessages({ enabled, }) {
    return invokeRequest(new GramJs.account.ToggleSponsoredMessages({
        enabled,
    }), {
        shouldReturnTrue: true,
    });
}
export function buildApiAccountDays(ttl) {
    return {
        days: ttl.days,
    };
}
export function buildApiAccountDaysTTL(days) {
    return new GramJs.AccountDaysTTL({
        days,
    });
}
export async function fetchAccountTTL() {
    const result = await invokeRequest(new GramJs.account.GetAccountTTL());
    if (!result)
        return undefined;
    return buildApiAccountDays(result);
}
export function setAccountTTL({ days }) {
    return invokeRequest(new GramJs.account.SetAccountTTL({
        ttl: buildApiAccountDaysTTL(days),
    }), {
        shouldReturnTrue: true,
    });
}
