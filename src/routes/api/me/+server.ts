import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_URL = 'https://api.intra.42.fr/v2/me';

export const GET: RequestHandler = async ({ fetch, cookies }) => {
    const accessToken = cookies.get('access_token');

    if (!accessToken) {
        return new Response(null, { status: 401 });
    }

    try {
        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            return json(userData);
        } else {
            console.error('Failed to fetch user data from 42 API');
            return new Response(null, { status: response.status });
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return new Response(null, { status: 500 });
    }
};
