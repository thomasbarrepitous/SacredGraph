import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TOKEN_URL = 'https://api.intra.42.fr/oauth/token';

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // TODO: Verify state to prevent CSRF attacks

    if (!code) {
        throw redirect(302, '/');
    }

    try {
        const tokenResponse = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: import.meta.env.VITE_42_CLIENT_ID,
                client_secret: import.meta.env.VITE_42_CLIENT_SECRET,
                code: code,
                redirect_uri: import.meta.env.VITE_42_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to fetch token');
        }

        const tokenData = await tokenResponse.json();

        // Store the access token in a secure, HTTP-only cookie
        cookies.set('access_token', tokenData.access_token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD, // Use secure cookies in production
            sameSite: 'lax',
            maxAge: tokenData.expires_in, // Set the cookie to expire when the token expires
        });

        // Optionally store the refresh token if you want to implement token refresh later
        if (tokenData.refresh_token) {
            cookies.set('refresh_token', tokenData.refresh_token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
            });
        }

        // Redirect to the map page after successful authentication
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/map'
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        // Redirect to an error page or back to the login page
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/?error=authentication_failed'
            }
        });
    }
};
