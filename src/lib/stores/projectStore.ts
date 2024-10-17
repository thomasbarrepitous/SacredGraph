import { writable } from 'svelte/store';
import { data as parisData } from '$lib/data/paris.js';
import type { Project } from '$lib/types/Project';

export const projects = writable<Project[]>(parisData.map(project => ({
    id: project.id.toString(),
    project_id: project.project_id,
    name: project.name,
    x: project.x,
    y: project.y,
    state: project.state,
    tags: (project.tags || []),
    description: project.description,
    difficulty: project.difficulty,
    duration: project.duration || '',
    rules: project.rules.split('. ').filter(rule => rule.trim() !== ''),
})));
