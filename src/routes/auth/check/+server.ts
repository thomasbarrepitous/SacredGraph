import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

const TOKEN_INFO_URL = 'https://api.intra.42.fr/oauth/token/info';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
    const token = cookies.get('access_token');

    if (!token) {
        return new Response(null, { status: 401 });
    }

    try {
        // Validate the token with the 42 API
        const response = await fetch(TOKEN_INFO_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tokenInfo = await response.json();
            // You can use tokenInfo to get additional details about the token if needed
            return json({ authenticated: true });
        } else if (response.status === 401) {
            // Token is invalid
            return new Response(null, { status: 401 });
        } else {
            // Unexpected error
            console.error('Unexpected error while validating token:', await response.text());
            return new Response(null, { status: 500 });
        }
    } catch (error) {
        console.error('Error while validating token:', error);
        return new Response(null, { status: 500 });
    }
};
