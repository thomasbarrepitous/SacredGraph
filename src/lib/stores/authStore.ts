import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createAuthStore() {
    const { subscribe, set } = writable(false);

    return {
        subscribe,
        login: async () => {
            if (browser) {
                window.location.href = '/auth/login';
            }
        },
        logout: async () => {
            if (browser) {
                const response = await fetch('/auth/logout', { method: 'POST' });
                if (response.ok) {
                    set(false);
                    window.location.href = '/';
                }
            }
        },
        checkAuth: async () => {
            if (browser) {
                const response = await fetch('/auth/check');
                if (response.status === 401) {
                    // Token expired, try to refresh
                    const refreshResponse = await fetch('/auth/refresh', { method: 'POST' });
                    if (refreshResponse.ok) {
                        set(true);
                    } else {
                        set(false);
                    }
                } else {
                    set(response.ok);
                }
            }
        }
    };
}

export const auth = createAuthStore();
