import { RPCError } from './RPCBaseErrors';
import { rpcErrorRe } from './RPCErrorList';
export function RPCMessageToError(rpcError, request) {
    for (const [msgRegex, Cls] of rpcErrorRe) {
        const m = rpcError.errorMessage.match(msgRegex);
        if (m) {
            const capture = m.length === 2 ? parseInt(m[1], 10) : undefined;
            return new Cls({ request, capture });
        }
    }
    return new RPCError(rpcError.errorMessage, request, rpcError.errorCode);
}
export * from './Common';
export * from './RPCBaseErrors';
export * from './RPCErrorList';
