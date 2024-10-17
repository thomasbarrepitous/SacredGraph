import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const accessToken = cookies.get('access_token');
    
    if (!accessToken) {
        throw redirect(303, '/');
    }

    return {
        session: { accessToken }
    };
};

