import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
    id: number;
    email: string;
    login: string;
    first_name: string;
    last_name: string;
    usual_full_name: string;
    usual_first_name: string | null;
    url: string;
    phone: string | null;
    displayname: string;
    kind: string;
    image: {
        link: string;
        versions: {
            large: string;
            medium: string;
            small: string;
            micro: string;
        };
    };
    staff?: boolean;
    correction_point: number;
    pool_month: string | null;
    pool_year: string | null;
    location: string | null;
    wallet: number;
    anonymize_date: string | null;
    data_erasure_date: string | null;
    created_at: string;
    updated_at: string;
    alumnized_at: string | null;
    'alumni?': boolean;
    'active?': boolean;
}

function createUserStore() {
    const { subscribe, set, update }: Writable<User | null> = writable(null);

    return {
        subscribe,
        fetchUser: async () => {
            if (browser) {
                try {
                    const response = await fetch('/api/me');
                    if (response.ok) {
                        const userData: User = await response.json();
                        set(userData);
                    } else {
                        console.error('Failed to fetch user data');
                        set(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    set(null);
                }
            }
        },
        reset: () => set(null)
    };
}

export const user = createUserStore();
