import { writable } from 'svelte/store';
import { createClient } from '@supabase/supabase-js';
import { data as parisData } from '$lib/data/paris.js';

// Define the Subscription type based on the table structure
export interface Subscription {
    id: number;
    created_at: string;
    login: string;
    project_id: number;
    campus_id: number;
    profile_pic: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a map of project names to project_ids from paris.js
const projectIdMap = new Map(parisData.map(project => [project.name, project.project_id]));

// Create a writable store
function createSubscriptionStore() {
    const { subscribe, set, update } = writable<Subscription[]>([]);

    return {
        subscribe,
        set,
        update,
        // Fetch all subscriptions from Supabase
        fetchSubscriptions: async () => {
            const { data, error } = await supabase
                .from('Subscriptions')
                .select('*');
            if (error) {
                console.error('Error fetching subscriptions:', error);
                return;
            }
            set(data);
        },
        // Add a new subscription
        addSubscription: async (subscription: Omit<Subscription, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('Subscriptions')
                .insert([subscription])
                .single();
            if (error) {
                console.error('Error adding subscription:', error);
                return;
            }
            update(subscriptions => [...subscriptions, data]);
        },
        // Remove a subscription by id
        removeSubscription: async (id: number) => {
            const { error } = await supabase
                .from('Subscriptions')
                .delete()
                .match({ id });
            if (error) {
                console.error('Error removing subscription:', error);
                return;
            }
            update(subscriptions => subscriptions.filter(s => s.id !== id));
        },
        // Update a subscription
        updateSubscription: async (id: number, updatedSubscription: Partial<Subscription>) => {
            const { data, error } = await supabase
                .from('Subscriptions')
                .update(updatedSubscription)
                .match({ id })
                .single();
            if (error) {
                console.error('Error updating subscription:', error);
                return;
            }
            update(subscriptions => 
                subscriptions.map(s => s.id === id ? { ...s, ...data } : s)
            );
        },
        // Clear all subscriptions (only from the store, not from Supabase)
        clear: () => set([]),

        // Fetch subscriptions for a specific project
        fetchProjectSubscriptions: async (projectName: string) => {
            const projectId = projectIdMap.get(projectName);
            if (!projectId) {
                console.error('Project not found:', projectName);
                return [];
            }
            const { data, error } = await supabase
                .from('Subscriptions')
                .select('*')
                .eq('project_id', projectId);
            if (error) {
                console.error('Error fetching project subscriptions:', error);
                return [];
            }
            return data;
        },
    };
}

export const subscriptions = createSubscriptionStore();
