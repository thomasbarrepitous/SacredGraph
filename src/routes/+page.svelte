<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { auth } from '$lib/stores/authStore';

    let showContent = false;

    onMount(() => {
        setTimeout(() => {
            showContent = true;
        }, 100);
    });

    function handleAuth() {
        if (!$auth) {
            auth.login();
        } else {
            window.location.href = '/map';
        }
    }
</script>

<svelte:head>
    <title>Sacred Graph | 42 Project Map</title>
    <meta name="description" content="Explore the interconnected world of 42 projects with Sacred Graph - your visual guide to the 42 curriculum.">
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden">
    {#if showContent}
        <div class="max-w-5xl w-full space-y-16 text-center relative" in:fade={{ duration: 1000 }}>
            <h1 class="text-6xl sm:text-7xl font-extrabold tracking-tight" in:fly={{ y: 50, duration: 1000, delay: 300 }}>
                Sacred Graph
            </h1>
            <p class="text-2xl sm:text-3xl text-blue-300 font-light" in:fly={{ y: 50, duration: 1000, delay: 600 }}>
                Unveil the mysteries of the 42 curriculum
            </p>
            <div class="space-y-8" in:fly={{ y: 50, duration: 1000, delay: 900 }}>
                <p class="text-xl text-gray-300 max-w-2xl mx-auto">
                    Embark on a journey through the interconnected world of 42 projects with our interactive visual map.
                </p>
                <button
                    on:click={handleAuth}
                    class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/42_Logo.svg/800px-42_Logo.svg.png" 
                         alt="42 Logo" 
                         class="w-6 h-6 mr-3"
                    >
                    {$auth ? 'Enter the Sacred Graph' : 'Login with 42'}
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-12 mt-24" in:fly={{ y: 50, duration: 1000, delay: 1200 }}>
                <div class="space-y-4 p-6 bg-gray-800 bg-opacity-50 rounded-xl backdrop-filter backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <h2 class="text-2xl font-semibold">Interactive Map</h2>
                    <p class="text-gray-300">Navigate through projects with an intuitive interface</p>
                </div>
                <div class="space-y-4 p-6 bg-gray-800 bg-opacity-50 rounded-xl backdrop-filter backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h2 class="text-2xl font-semibold">Project Insights</h2>
                    <p class="text-gray-300">Gain valuable information about each project</p>
                </div>
                <div class="space-y-4 p-6 bg-gray-800 bg-opacity-50 rounded-xl backdrop-filter backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 class="text-2xl font-semibold">Community Driven</h2>
                    <p class="text-gray-300">See who's working on what and connect with peers</p>
                </div>
            </div>
        </div>
    {/if}
</main>

<style>
    :global(body) {
        @apply bg-gray-900;
    }

    @keyframes spin-slow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .animate-spin-slow {
        animation: spin-slow 60s linear infinite;
    }
</style>
