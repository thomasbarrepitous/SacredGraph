export interface Project {
    id: string;
    project_id: string;
    name: string;
    x: number;
    y: number;
    state: string;
    tags?: string[];
    description: string;
    difficulty: number;
    duration: string;
    rules: string[];
}

export interface Zone {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}
