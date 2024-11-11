export interface User42 {
    id: number;
    login: string;
    email: string;
    first_name: string;
    last_name: string;
    image: {
        link: string;
        versions: {
            large: string;
            medium: string;
            small: string;
            micro: string;
        }
    };
    campus_users: Array<{
        campus_id: number;
        is_primary: boolean;
    }>;
}

export interface AuthSession {
    user: User42 | null;
    isAuthenticated: boolean;
} 