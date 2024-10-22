import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLIENT_ID, REDIRECT_URI } from '$env/static/private';
import crypto from 'crypto';

const AUTHORIZATION_URL = 'https://api.intra.42.fr/oauth/authorize';

export const GET: RequestHandler = async () => {
    const state = crypto.randomUUID();

    const authorizationUrl = new URL(AUTHORIZATION_URL);
    authorizationUrl.searchParams.append('client_id', CLIENT_ID);
    authorizationUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authorizationUrl.searchParams.append('response_type', 'code');
    authorizationUrl.searchParams.append('state', state);

    // TODO: Store the state in a secure, short-lived storage (e.g., server-side session)
    // to verify it in the callback and prevent CSRF attacks

    throw redirect(302, authorizationUrl.toString());
};
