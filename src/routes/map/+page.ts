import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    const response = await fetch('/api/subscriptions');
    const subscriptionData = await response.json();
    return { subscriptionData };
}; 