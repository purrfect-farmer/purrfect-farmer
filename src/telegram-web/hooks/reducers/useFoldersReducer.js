import { getGlobal } from '../../global';
import { selectChat } from '../../global/selectors';
import { omit, pick } from '../../util/iteratees';
import useReducer from '../useReducer';
const INCLUDE_FILTER_FIELDS = [
    'includedChatIds', 'bots', 'channels', 'groups', 'contacts', 'nonContacts',
];
const EXCLUDE_FILTER_FIELDS = [
    'excludedChatIds', 'excludeArchived', 'excludeMuted', 'excludeRead',
];
export function selectChatFilters(state, mode, selectTemp) {
    let selectedChatIds = [];
    let selectedChatTypes = [];
    if (mode === 'included') {
        const { includedChatIds, ...includeFilters } = selectTemp
            ? state.includeFilters || {}
            : pick(state.folder, INCLUDE_FILTER_FIELDS);
        selectedChatIds = includedChatIds || [];
        selectedChatTypes = Object.keys(includeFilters)
            .filter((key) => Boolean(includeFilters[key]));
    }
    else {
        const { excludedChatIds, ...excludeFilters } = selectTemp
            ? state.excludeFilters || {}
            : pick(state.folder, EXCLUDE_FILTER_FIELDS);
        selectedChatIds = excludedChatIds || [];
        selectedChatTypes = Object.keys(excludeFilters)
            .filter((key) => Boolean(excludeFilters[key]));
    }
    const global = getGlobal();
    const existingSelectedChatIds = selectedChatIds.filter((id) => selectChat(global, id));
    return {
        selectedChatIds: existingSelectedChatIds,
        selectedChatTypes,
    };
}
function getSuggestedFolderName(includeFilters) {
    if (includeFilters) {
        const { includedChatIds, ...filters } = includeFilters;
        if (Object.values(filters).filter(Boolean).length > 1
            || (includedChatIds?.length)) {
            return '';
        }
        if (filters.bots) {
            return 'Bots';
        }
        else if (filters.groups) {
            return 'Groups';
        }
        else if (filters.channels) {
            return 'Channels';
        }
        else if (filters.contacts) {
            return 'Contacts';
        }
        else if (filters.nonContacts) {
            return 'Non-Contacts';
        }
    }
    return '';
}
const INITIAL_STATE = {
    mode: 'create',
    chatFilter: '',
    folder: {
        title: { text: '' },
        includedChatIds: [],
        excludedChatIds: [],
    },
};
const foldersReducer = (state, action) => {
    switch (action.type) {
        case 'setTitle':
            return {
                ...state,
                folder: {
                    ...state.folder,
                    title: { text: action.payload },
                },
                isTouched: true,
            };
        case 'setFolderId':
            return {
                ...state,
                folderId: action.payload,
                mode: 'edit',
            };
        case 'editIncludeFilters':
            return {
                ...state,
                includeFilters: pick(state.folder, INCLUDE_FILTER_FIELDS),
            };
        case 'editExcludeFilters':
            return {
                ...state,
                excludeFilters: pick(state.folder, EXCLUDE_FILTER_FIELDS),
            };
        case 'setIncludeFilters':
            return {
                ...state,
                includeFilters: action.payload,
                chatFilter: '',
            };
        case 'setExcludeFilters':
            return {
                ...state,
                excludeFilters: action.payload,
                chatFilter: '',
            };
        case 'saveFilters':
            if (state.includeFilters) {
                return {
                    ...state,
                    folder: {
                        ...omit(state.folder, INCLUDE_FILTER_FIELDS),
                        title: state.folder.title ? state.folder.title : { text: getSuggestedFolderName(state.includeFilters) },
                        ...state.includeFilters,
                    },
                    includeFilters: undefined,
                    chatFilter: '',
                    isTouched: true,
                };
            }
            else if (state.excludeFilters) {
                return {
                    ...state,
                    folder: {
                        ...omit(state.folder, EXCLUDE_FILTER_FIELDS),
                        ...state.excludeFilters,
                    },
                    excludeFilters: undefined,
                    chatFilter: '',
                    isTouched: true,
                };
            }
            else {
                return state;
            }
        case 'editFolder': {
            const { id: folderId, ...folder } = action.payload;
            return {
                mode: 'edit',
                folderId,
                folder,
                chatFilter: '',
            };
        }
        case 'setChatFilter': {
            return {
                ...state,
                chatFilter: action.payload,
            };
        }
        case 'setIsTouched': {
            return {
                ...state,
                isTouched: action.payload,
            };
        }
        case 'setIsLoading': {
            return {
                ...state,
                isLoading: action.payload,
            };
        }
        case 'setError': {
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };
        }
        case 'setIsChatlist':
            return {
                ...state,
                folder: {
                    ...state.folder,
                    isChatList: action.payload,
                },
            };
        case 'reset':
            return INITIAL_STATE;
        default:
            return state;
    }
};
const useFoldersReducer = () => {
    return useReducer(foldersReducer, INITIAL_STATE);
};
export default useFoldersReducer;
