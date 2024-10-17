<script lang="ts">
  import { createEventDispatcher, afterUpdate } from 'svelte';
  import { projects } from '$lib/stores/projectStore';
  import type { Project } from '$lib/types/Project';

  let searchTerm = '';
  let searchResults: Project[] = [];
  let isExpanded = false;
  let inputElement: HTMLInputElement;
  let selectedIndex = -1;
  let searchResultsElement: HTMLDivElement;
  const dispatch = createEventDispatcher();

  $: {
    if (searchTerm.length > 0) {
      searchResults = $projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5);  // Limit to 5 results
      selectedIndex = -1; // Reset selection when results change
    } else {
      searchResults = [];
      selectedIndex = -1;
    }
  }

  afterUpdate(() => {
    if (searchResultsElement && selectedIndex !== -1) {
      const selectedElement = searchResultsElement.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  });

  function handleSelect(project: Project) {
    dispatch('select', project);
    searchTerm = '';
    searchResults = [];
    isExpanded = false;
    selectedIndex = -1;
    inputElement?.blur(); // Remove focus from the input
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
    if (isExpanded) {
      setTimeout(() => inputElement?.focus(), 300);
    } else {
      inputElement?.blur(); // Remove focus when collapsing
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (isExpanded && !target.closest('.search-container')) {
      isExpanded = false;
      inputElement?.blur(); // Remove focus when clicking outside
    }
  }

  function truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) return text;
    const ellipsis = '...';
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return text.substr(0, frontChars) + ellipsis + text.substr(text.length - backChars);
  }

  export function focusAndType(char: string) {
    isExpanded = true;
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
        searchTerm = char;
        inputElement.setSelectionRange(1, 1);
      }
    }, 0);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % searchResults.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + searchResults.length) % searchResults.length;
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex !== -1) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        isExpanded = false;
        inputElement?.blur(); // Remove focus when pressing Escape
        break;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="search-container {isExpanded ? 'expanded' : ''}">
  <div class="search-input-wrapper">
    <input
      type="text"
      bind:value={searchTerm}
      bind:this={inputElement}
      placeholder={isExpanded ? "Search for a project..." : ""}
      class="search-input"
      on:focus={() => isExpanded = true}
      on:keydown={handleKeydown}
    />
    <button class="search-icon" on:click={toggleExpand}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  </div>

  {#if searchResults.length > 0 && isExpanded}
    <div class="search-results" bind:this={searchResultsElement}>
      {#each searchResults as result, index}
        <button
          class="search-result-item {index === selectedIndex ? 'selected' : ''}"
          on:click={() => handleSelect(result)}
        >
          <div class="font-semibold text-white">{truncateText(result.name, 25)}</div>
          {#if result.tags && result.tags.length > 0}
            <div class="mt-1 text-xs text-gray-400 flex flex-wrap">
              {#each result.tags as tag}
                <span class="mr-1 mb-1 bg-gray-700 px-1 rounded">{truncateText(tag, 15)}</span>
              {/each}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    width: 40px;
    height: 40px;
    transition: width 0.3s ease-in-out;
  }

  .search-container.expanded {
    width: 250px;
  }

  .search-input-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    border-radius: 20px;
    overflow: hidden;
  }

  .search-input {
    flex-grow: 1;
    background: transparent;
    border: none;
    color: white;
    padding: 5px 10px;
    font-size: 14px;
    outline: none;
    width: 0;
    transition: width 0.3s ease-in-out;
  }

  .search-container.expanded .search-input {
    width: 200px;
  }

  .search-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 0;
  }

  .search-container:not(.expanded) .search-icon {
    width: 100%;
  }

  .search-icon svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: #2a2a2a;
    border-radius: 0 0 10px 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-top: 5px;
    max-height: 300px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }

  .search-result-item {
    display: block;
    width: 100%;
    padding: 10px;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }

  .search-result-item:hover {
    background-color: #3a3a3a;
  }

  .search-result-item.selected {
    background-color: #3a3a3a;
  }
</style>
