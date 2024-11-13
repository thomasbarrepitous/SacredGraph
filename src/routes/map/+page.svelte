<script lang="ts">
    import { onMount } from 'svelte';
    import { select, zoom, zoomIdentity } from 'd3';
    import { projects } from '$lib/stores/projectStore';
    import { subscriptions } from '$lib/stores/subscriptionStore';
    import type { Project, Zone } from '$lib/types/Project';
    import type { Subscription } from '$lib/stores/subscriptionStore';
    import { createScales, createZoomBehavior, updateProjects, updateZones } from '$lib/utils/projectMapUtils';
    import zonesData from '$lib/data/zones.json';
    import SearchBar from '$lib/components/SearchBar.svelte';
    import FilterBar from '$lib/components/FilterBar.svelte';
    import { user } from '$lib/stores/userStore';

    let svg: SVGSVGElement;
    let windowWidth: number;
    let windowHeight: number;
    const gridSpacing = 140;

    let selectedProject: Project | null = null;
    let dialogVisible = false;
    let searchBarRef: SearchBar;
    let filteredProjects: Project[] = $projects;
    let zoomBehavior: any;

    let projectSubscriptions: Record<number, Subscription[]> = {};

    let currentUser: User | null;
    user.subscribe(value => currentUser = value);

    let isSubscribing = false;

    $: if (svg && windowWidth && windowHeight) {
        updateSVGSize();
    }

    $: isCurrentlySubscribed = (selectedProject && projectSubscriptions[selectedProject.id]?.some(
        sub => sub.login === currentUser?.login
    )) ?? false;

    function updateSVGSize() {
        const svgElement = select(svg);
        svgElement.attr('width', windowWidth).attr('height', windowHeight);
        
        const { xScale, yScale } = createScales(windowWidth, windowHeight, gridSpacing);
        const g = svgElement.select<SVGGElement>('g');
        
        const nodeSize = 120;
        updateZones(g, zonesData, xScale, yScale, gridSpacing, nodeSize);
        updateProjects(g, filteredProjects, xScale, yScale, openProjectDialog, selectedProject?.id || null, projectSubscriptions);
    }

    function zoomIn() {
        const svgElement = select(svg);
        zoomBehavior.scaleBy(svgElement.transition().duration(750), 1.5);
    }

    function zoomOut() {
        const svgElement = select(svg);
        zoomBehavior.scaleBy(svgElement.transition().duration(750), 0.75);
    }

    function resetZoom() {
        const svgElement = select(svg);
        svgElement.transition().duration(750).call(zoomBehavior.transform, zoomIdentity);
    }

    async function openProjectDialog(project: Project) {
        selectedProject = project;
        await fetchProjectSubscriptions(project);
        setTimeout(() => {
            dialogVisible = true;
            window.addEventListener('keydown', handleDialogKeydown);
        }, 50);
    }

    async function fetchProjectSubscriptions(project: Project) {
        const subs = await subscriptions.fetchProjectSubscriptions(project.name);
        projectSubscriptions[project.id] = subs;
    }

    function closeProjectDialog() {
        dialogVisible = false;
        window.removeEventListener('keydown', handleDialogKeydown);
        setTimeout(async () => {
            // Refresh all subscriptions data before clearing selectedProject
            await subscriptions.fetchSubscriptions();
            // Reset the projectSubscriptions object
            projectSubscriptions = {};
            // Rebuild it with fresh data
            $subscriptions.forEach(sub => {
                if (!projectSubscriptions[sub.project_id]) {
                    projectSubscriptions[sub.project_id] = [];
                }
                projectSubscriptions[sub.project_id].push(sub);
            });
            
            // Force an update of the SVG
            updateSVGSize();
            
            selectedProject = null;
        }, 300);
    }

    function getUserSubscription(): Subscription | null {
        if (!selectedProject || !currentUser) return null;
        return projectSubscriptions[selectedProject.id]?.find(
            sub => sub.login === currentUser.login
        ) || null;
    }

    async function subscribeToProject() {
        if (!selectedProject || !currentUser || isSubscribing) return;

        isSubscribing = true;
        try {
            const userSubscription = getUserSubscription();
            const isSubscribed = userSubscription !== null;

            const response = await fetch(
                isSubscribed 
                    ? `/api/subscriptions?id=${userSubscription.id}`
                    : '/api/subscriptions', 
                {
                    method: isSubscribed ? 'DELETE' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: isSubscribed ? undefined : JSON.stringify({
                        login: currentUser.login,
                        project_id: selectedProject.project_id,
                        campus_id: 21,
                        profile_pic: currentUser.image?.link || "",
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to ${isSubscribed ? 'unsubscribe from' : 'subscribe to'} project`);
            }

            // Refresh the subscriptions for this project
            await fetchProjectSubscriptions(selectedProject);

        } catch (error) {
            console.error('Error managing subscription:', error);
        } finally {
            isSubscribing = false;
        }
    }

    function handleOverlayClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            closeProjectDialog();
        }
    }

    function handleSearchSelect(event: CustomEvent<Project>) {
        const project = event.detail;
        const svgElement = select(svg);
        const g = svgElement.select('g');
        const { xScale, yScale } = createScales(windowWidth, windowHeight, gridSpacing);
        
        const zoomBehavior = createZoomBehavior(g);
        const scale = 1;
        const translate = [
            windowWidth / 2 - xScale(project.x) * scale,
            windowHeight / 2 - yScale(project.y) * scale
        ];

        svgElement
            .transition()
            .duration(750)
            .call(zoomBehavior.transform, zoomIdentity.translate(translate[0], translate[1]).scale(scale));

        openProjectDialog(project);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || dialogVisible) {
            return;
        }

        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault();
            searchBarRef.focusAndType(event.key);
        }
    }

    function handleDialogKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === 'Escape') {
            closeProjectDialog();
        }
    }

    function handleFilter(event: CustomEvent<Project[]>) {
        filteredProjects = event.detail;
        updateSVGSize();
    }

    function handleFilterProjects(event: CustomEvent<Project[]>) {
        filteredProjects = event.detail;
        updateSVGSize();
    }

    onMount(async () => {
        const svgElement = select(svg);
        
        // Create a linear gradient for the sky
        const gradient = svgElement.append("defs")
            .append("linearGradient")
            .attr("id", "skyGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#0f1f3d");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#182952");

        // Create a background rectangle with the gradient
        svgElement.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#skyGradient)');

        // Add a noise filter for texture
        const filter = svgElement.append("defs")
            .append("filter")
            .attr("id", "noise");

        filter.append("feTurbulence")
            .attr("type", "fractalNoise")
            .attr("baseFrequency", "0.65")
            .attr("numOctaves", "3")
            .attr("stitchTiles", "stitch");

        filter.append("feColorMatrix")
            .attr("type", "saturate")
            .attr("values", "0.1");

        // Apply the noise filter
        svgElement.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("filter", "url(#noise)")
            .attr("opacity", "0.05");

        const g = svgElement.append('g');

        zoomBehavior = createZoomBehavior(g);
        svgElement.call(zoomBehavior);

        const { xScale, yScale } = createScales(windowWidth, windowHeight, gridSpacing);
        updateZones(g, zonesData, xScale, yScale, gridSpacing, 120);

        const unsubscribe = projects.subscribe(projectsData => {
            filteredProjects = projectsData;
            updateProjects(g, filteredProjects, xScale, yScale, openProjectDialog, selectedProject?.id || null, projectSubscriptions);
        });

        // Initial zoom to fit all nodes
        const zoomFit = () => {
            const bounds = g.node()?.getBBox();
            if (!bounds) return;

            const fullWidth = windowWidth;
            const fullHeight = windowHeight;
            const width = bounds.width;
            const height = bounds.height;
            const midX = bounds.x + width / 2;
            const midY = bounds.y + height / 2;
            const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

            svgElement
                .transition()
                .duration(750)
                .call(zoomBehavior.transform, zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        };

        // Call zoomFit after a short delay to ensure all elements are rendered
        setTimeout(zoomFit, 100);

        // Fetch all subscriptions
        await subscriptions.fetchSubscriptions();
        $subscriptions.forEach(sub => {
            if (!projectSubscriptions[sub.project_id]) {
                projectSubscriptions[sub.project_id] = [];
            }
            projectSubscriptions[sub.project_id].push(sub);
        });

        updateSVGSize();

        window.addEventListener('filterProjects', handleFilterProjects as EventListener);

        return unsubscribe;
    });
</script>

<svelte:window 
    bind:innerWidth={windowWidth} 
    bind:innerHeight={windowHeight}
    on:keydown={handleKeydown}
/>

<main class="w-screen h-screen overflow-hidden relative">
    <svg bind:this={svg} class="w-full h-full"></svg>

    <div class="absolute top-4 left-4 z-10 flex flex-col items-start space-y-4">
        <h1 class="text-4xl font-bold mb-4 text-white text-shadow">42 Sacred Graph</h1>
        <p class="text-sm text-gray-300">Scroll to zoom, drag to pan</p>
        <SearchBar on:select={handleSearchSelect} bind:this={searchBarRef} />
    </div>

    <FilterBar allProjects={$projects} on:filter={handleFilter} />

    <!-- Zoom Controls -->
    <div class="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
        <button class="zoom-control" on:click={zoomIn}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
        <button class="zoom-control" on:click={zoomOut}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
            </svg>
        </button>
        <button class="zoom-control" on:click={resetZoom}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
        </button>
    </div>
</main>
{#if selectedProject}
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
         on:click={handleOverlayClick}>
        <div class="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out {dialogVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}">
            <div class="p-6">
                <h2 class="text-3xl font-bold mb-4 text-white">{selectedProject.name}</h2>
                <div class="mb-4 flex flex-wrap">
                    {#each selectedProject.tags || [] as tag}
                        <span class="bg-gray-700 text-gray-200 text-xs font-semibold mr-2 mb-2 px-2.5 py-0.5 rounded">{tag}</span>
                    {/each}
                </div>
                <p class="mb-2 text-sm font-medium text-gray-400">Status: <span class="font-bold {selectedProject.state === 'available' ? 'text-green-400' : 'text-red-400'}">{selectedProject.state}</span></p>
                <p class="mb-4 text-gray-300">{selectedProject.description}</p>
                <div class="mt-6 border-t border-gray-700 pt-4">
                    <p class="text-sm text-gray-400"><strong class="text-gray-200">Difficulty:</strong> {selectedProject.difficulty}</p>
                    <p class="text-sm text-gray-400"><strong class="text-gray-200">Duration:</strong> {selectedProject.duration}</p>
                    <div class="text-sm text-gray-400 mt-2">
                        <strong class="text-gray-200">Rules:</strong>
                        <ul class="list-disc list-inside mt-1">
                            {#each selectedProject.rules as rule}
                                <li>{rule}</li>
                            {/each}
                        </ul>
                    </div>
                </div>
                <!-- Updated Subscribed Users section -->
                <div class="mt-6 border-t border-gray-700 pt-4">
                    <h3 class="text-xl font-semibold text-white mb-4">Subscribed Users</h3>
                    <div class="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {#if projectSubscriptions[selectedProject.id]?.length > 0}
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {#each projectSubscriptions[selectedProject.id] as subscription}
                                    <a href="https://profile.intra.42.fr/users/{subscription.login}" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       class="flex items-center p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                                        <img src={subscription.profile_pic || '/default_avatar.png'} 
                                             alt={subscription.login} 
                                             class="w-10 h-10 rounded-full mr-3"
                                             on:error={(e) => e.target.src = '/default_avatar.png'}
                                        >
                                        <span class="text-sm text-gray-300 truncate">{subscription.login}</span>
                                    </a>
                                {/each}
                            </div>
                        {:else}
                            <p class="text-gray-400 text-center py-4">No users subscribed to this project yet.</p>
                        {/if}
                    </div>
                </div>
            </div>
            <div class="bg-gray-800 px-6 py-3 flex justify-between rounded-b-lg">
                <button 
                    class={`font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                        ${isCurrentlySubscribed 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                    on:click={subscribeToProject}
                    disabled={!currentUser || isSubscribing}
                >
                    {#if isSubscribing}
                        {isCurrentlySubscribed ? 'Unsubscribing...' : 'Subscribing...'}
                    {:else if !currentUser}
                        Login to Subscribe
                    {:else}
                        {isCurrentlySubscribed ? 'Unsubscribe' : 'Subscribe'}
                    {/if}
                </button>
                <button 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                    on:click={closeProjectDialog}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: 'Inter', Arial, sans-serif;
        background-color: #0a1325;
        color: white;
        overflow: hidden;
    }

    :global(.project) {
        cursor: pointer;
        transform-style: preserve-3d;
        backface-visibility: hidden;
    }

    :global(.project text) {
        user-select: none;
    }

    .zoom-control {
        background-color: rgba(42, 42, 42, 0.8);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;
    }

    .zoom-control:hover {
        background-color: rgba(62, 62, 62, 0.8);
        transform: scale(1.1);
    }

    .text-shadow {
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
</style>
