<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Project } from '$lib/types/Project';

  export let allProjects: Project[];

  let searchTerm = '';
  let selectedTags: string[] = [];
  let selectedState: string | null = null;

  const dispatch = createEventDispatcher<{filter: Project[]}>();

  $: allTags = [...new Set(allProjects.flatMap(project => project.tags || []))].sort();

  $: filteredProjects = allProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => project.tags?.includes(tag));
    const matchesState = !selectedState || project.state === selectedState;
    return matchesSearch && matchesTags && matchesState;
  });

  $: dispatch('filter', filteredProjects);

  function toggleTag(tag: string) {
    selectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
  }

  function clearFilters() {
    searchTerm = '';
    selectedTags = [];
    selectedState = null;
  }
</script>

<div class="space-y-4">
  <input
    type="text"
    placeholder="Filter by name..."
    bind:value={searchTerm}
    class="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
  
  <div class="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus-within:ring-2 focus-within:ring-blue-500">
    <div class="flex flex-wrap gap-2 mb-2">
      {#each selectedTags as tag}
        <span class="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {tag}
          <button on:click={() => toggleTag(tag)} class="ml-1 font-bold">&times;</button>
        </span>
      {/each}
    </div>
    <select
      multiple
      size="5"
      class="w-full bg-gray-700 text-white focus:outline-none"
      on:change={(e) => {
        const select = e.target;
        const selectedOptions = Array.from(select.selectedOptions);
        selectedTags = selectedOptions.map(option => option.value);
      }}
    >
      {#each allTags as tag}
        <option value={tag} selected={selectedTags.includes(tag)}>{tag}</option>
      {/each}
    </select>
  </div>
  
  <select
    bind:value={selectedState}
    class="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value={null}>All States</option>
    <option value="available">Available</option>
    <option value="unavailable">Unavailable</option>
  </select>
  
  <button
    on:click={clearFilters}
    class="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
  >
    Clear Filters
  </button>
</div>
