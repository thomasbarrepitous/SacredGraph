import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLIENT_ID, CLIENT_SECRET } from '$env/static/private';

const TOKEN_URL = 'https://api.intra.42.fr/oauth/token';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
    const refreshToken = cookies.get('refresh_token');

    if (!refreshToken) {
        return new Response(null, { status: 401 });
    }

    try {
        const tokenResponse = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: refreshToken,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to refresh token');
        }

        const tokenData = await tokenResponse.json();

        cookies.set('access_token', tokenData.access_token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: tokenData.expires_in,
        });

        if (tokenData.refresh_token) {
            cookies.set('refresh_token', tokenData.refresh_token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
            });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Token refresh error:', error);
        return new Response(null, { status: 401 });
    }
};
