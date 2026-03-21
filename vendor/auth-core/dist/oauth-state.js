const STATE_KEY = 'hexadian_oauth_state';
const RETURN_URL_KEY = 'hexadian_oauth_return_url';
export function createOAuthStateManager(storage = sessionStorage) {
    return {
        generateAndStore(returnUrl) {
            const state = crypto.randomUUID();
            storage.setItem(STATE_KEY, state);
            storage.setItem(RETURN_URL_KEY, returnUrl);
            return state;
        },
        validate(state) {
            const storedState = storage.getItem(STATE_KEY);
            if (storedState === null || storedState !== state) {
                return { valid: false, returnUrl: null };
            }
            return { valid: true, returnUrl: storage.getItem(RETURN_URL_KEY) };
        },
        clear() {
            storage.removeItem(STATE_KEY);
            storage.removeItem(RETURN_URL_KEY);
        },
    };
}
//# sourceMappingURL=oauth-state.js.map