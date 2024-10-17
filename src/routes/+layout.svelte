<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/authStore';
    import { user } from '$lib/stores/userStore';

    onMount(async () => {
        await auth.checkAuth();
        if ($auth) {
            await user.fetchUser();
        }
    });
</script>

<slot />

<style>
    :global(body) {
        font-family: 'Inter', Arial, sans-serif;
    }
</style>
