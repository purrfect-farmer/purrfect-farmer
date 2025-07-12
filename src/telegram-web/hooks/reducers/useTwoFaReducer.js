import useReducer from '../useReducer';
const INITIAL_STATE = {
    currentPassword: '',
    password: '',
    hint: '',
    email: '',
};
const twoFaReducer = (state, action) => {
    switch (action.type) {
        case 'setCurrentPassword':
            return {
                ...state,
                currentPassword: action.payload,
            };
        case 'setPassword':
            return {
                ...state,
                password: action.payload,
            };
        case 'setHint':
            return {
                ...state,
                hint: action.payload,
            };
        case 'setEmail':
            return {
                ...state,
                email: action.payload,
            };
        case 'reset':
            return INITIAL_STATE;
        default:
            return state;
    }
};
const useTwoFaReducer = () => {
    return useReducer(twoFaReducer, INITIAL_STATE);
};
export default useTwoFaReducer;
