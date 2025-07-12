import { useState } from '../lib/teact/teact';
import { callApi } from '../api/gramjs';
import useAsync from './useAsync';
import useDebouncedMemo from './useDebouncedMemo';
import useLastCallback from './useLastCallback';
const DEBOUNCE_TIMEOUT = 300;
export async function peerGlobalSearch(query) {
    const searchResult = await callApi('searchChats', { query });
    if (!searchResult)
        return undefined;
    const ids = [...searchResult.accountResultIds, ...searchResult.globalResultIds];
    return ids;
}
export function prepareChatMemberSearch(chat) {
    return async (query) => {
        const searchResult = await callApi('fetchMembers', {
            chat,
            memberFilter: 'search',
            query,
        });
        return searchResult?.members?.map((member) => member.userId) || [];
    };
}
export default function usePeerSearch({ query, queryFn = peerGlobalSearch, defaultValue, debounceTimeout = DEBOUNCE_TIMEOUT, isDisabled, }) {
    const debouncedQuery = useDebouncedMemo(() => query, debounceTimeout, [query]);
    const [currentResultsQuery, setCurrentResultsQuery] = useState('');
    const searchQuery = !query ? query : debouncedQuery; // Ignore debounce if query is empty
    const queryCallback = useLastCallback(queryFn);
    const result = useAsync(async () => {
        if (!searchQuery || isDisabled) {
            setCurrentResultsQuery('');
            return Promise.resolve(defaultValue);
        }
        const answer = await queryCallback(searchQuery);
        setCurrentResultsQuery(searchQuery);
        return answer;
    }, [searchQuery, defaultValue, queryCallback, isDisabled], defaultValue);
    return {
        ...result,
        currentResultsQuery,
    };
}
