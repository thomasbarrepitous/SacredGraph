import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// GET /api/subscriptions
export const GET: RequestHandler = async ({ url }) => {
    const projectId = url.searchParams.get('project_id');
    
    let query = supabase.from('Subscriptions').select('*');
    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    
    return json(data);
};

// POST /api/subscriptions
export const POST: RequestHandler = async ({ request }) => {
    const subscription = await request.json();
    
    const subscriptionData = {
        ...subscription,
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('Subscriptions')
        .insert([subscriptionData])
        .select()
        .single();
        
    if (error) {
        console.error('Subscription error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    
    return json(data);
};

// DELETE /api/subscriptions?id=123
export const DELETE: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get('id');
    
    if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }
    
    const { error } = await supabase
        .from('Subscriptions')
        .delete()
        .match({ id });
        
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    
    return new Response(null, { status: 204 });
};

// PATCH /api/subscriptions?id=123
export const PATCH: RequestHandler = async ({ request, url }) => {
    const id = url.searchParams.get('id');
    const updates = await request.json();
    
    if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }
    
    const { data, error } = await supabase
        .from('Subscriptions')
        .update(updates)
        .match({ id })
        .single();
        
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    
    return json(data);
}; 