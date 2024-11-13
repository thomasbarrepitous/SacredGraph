import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from '$env/static/private';

const TOKEN_URL = 'https://api.intra.42.fr/oauth/token';

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // TODO: Implement state verification to prevent CSRF attacks

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
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            console.error('Token response not OK:', await tokenResponse.text());
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

        // Return the redirect response instead of throwing it
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/map'
            }
        });
        
    } catch (error) {
        // Log the actual error for debugging
        console.error('Authentication error:', error instanceof Error ? error.message : error);
        // Only redirect to error page for actual errors
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/?error=authentication_failed'
            }
        });
    }
};
