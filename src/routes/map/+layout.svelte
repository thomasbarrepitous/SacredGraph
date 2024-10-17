<script lang="ts">
    import { auth } from '$lib/stores/authStore';
    import { user } from '$lib/stores/userStore';
    import { slide } from 'svelte/transition';
    import { onMount } from 'svelte';
    import FilterBar from '$lib/components/FilterBar.svelte';
    import { projects } from '$lib/stores/projectStore';
    import type { Project } from '$lib/types/Project';

    let isExpanded = false;
    let mounted = false;
    let expandableBar: HTMLDivElement;

    onMount(() => {
        mounted = true;
        
        const handleClickOutside = (event: MouseEvent) => {
            if (isExpanded && expandableBar && !expandableBar.contains(event.target as Node)) {
                isExpanded = false;
            }
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    });

    function toggleExpand(event: MouseEvent) {
        event.stopPropagation();
        isExpanded = !isExpanded;
    }

    function handleFilter(event: CustomEvent<Project[]>) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('filterProjects', { detail: event.detail }));
        }
    }
</script>

<div class="relative min-h-screen">
    {#if mounted}
        <div class="fixed md:absolute md:top-4 md:right-4 bottom-0 left-0 md:left-auto z-10 flex md:items-start items-stretch">
            {#if isExpanded}
                <div 
                    bind:this={expandableBar}
                    transition:slide={{ duration: 300, axis: 'y' }}
                    class="bg-gray-800 bg-opacity-80 backdrop-filter backdrop-blur-sm md:rounded-l-lg rounded-t-lg shadow-lg p-4 space-y-4 w-full md:w-72 md:mr-2 mb-0 md:mb-0 max-h-[80vh] md:max-h-none overflow-y-auto ml-14 md:pl-4"
                    on:click|stopPropagation
                >
                    {#if $user}
                        <h2 class="text-xl font-semibold text-white mb-4">Welcome, {$user.first_name}!</h2>
                    {/if}
                    <FilterBar allProjects={$projects} on:filter={handleFilter} />
                    <button
                        on:click={auth.logout}
                        class="control-button flex items-center justify-center w-full mt-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            {/if}
            <button
                on:click={toggleExpand}
                class="control-button md:ml-0 ml-auto md:mr-0 mr-auto absolute md:static bottom-4 left-4 z-20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>
        </div>
    {/if}
    <slot />
</div>

<style>
    .control-button {
        @apply bg-gray-700 bg-opacity-80 text-white rounded-full py-2 px-4 flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
    }
</style>
