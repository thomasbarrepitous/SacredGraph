# 42 "Sacred Graph"

A web application built with SvelteKit and Tailwind CSS to help 42 students find teammates for projects, access project descriptions, and view an improved mobile version of the "Holy Graph".

## Features

- Find peers for 42 projects
- View detailed project descriptions and information
- Mobile-friendly version of the 42 curriculum map ("Holy Graph")
- Project filtering and search capabilities

## Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn
- Supabase instance with a Subscriptions table (see below for details)
- 42 API Application (created through the 42 intra)
- `paris.js` file containing project data (see below for details)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/thomasbpitous/SacredGraph
cd SacredGraph
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up your Supabase instance:
   - Create a new Supabase project
   - In your Supabase database, create a `Subscriptions` table with the fields defined in `src/lib/stores/subscriptionStore.ts`

4. Create a 42 API Application:
   - Log in to the 42 intranet
   - Navigate to the API section and create a new application
   - Note down the Client ID and Client Secret

5. Create a `.env` file in the root directory and add the necessary environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_42_CLIENT_ID=your_42_app_client_id
VITE_42_CLIENT_SECRET=your_42_app_client_secret
VITE_42_REDIRECT_URI=your_42_app_redirect_uri
```

6. Create a `src/lib/data/paris.js` file containing the projects list. This file should include all projects with the fields defined in `src/lib/stores/projectStore.ts`. This file is not included in the repository for intellectual property reasons.

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

## Technologies Used

- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework for building web applications
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling
- [42 API](https://api.intra.42.fr/apidoc) - 42 API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GNU General Public License v3.0 (GNU GPLv3) - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is not officially affiliated with or endorsed by 42 School. The project data and curriculum information used in this application are subject to change and may not always reflect the most up-to-date information from 42 School.

The GNU GPLv3 license ensures that this software and any derivatives remain free and open-source. Any modifications or larger works based on this project must also be released under the same license terms.
