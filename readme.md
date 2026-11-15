# Séamus Grew - Portfolio

My portfolio website: a 3D scene of my desk setup, with the portfolio itself running on the monitor.

Things to try: hover the monitor to sit down at it, press its power button, pull the lamp's cord, and open the `.env` file on the desktop.

## Where things live

| What | Where |
| --- | --- |
| Portfolio content (profile, experience, projects, skills...) | `static/os/data.js` |
| The desktop shown on the monitor | `static/os/` |
| Sizes, positions and colours of everything on the desk | `src/Application/World/SetupConfig.ts` |
| The 3D models (desk, PC, keyboard, medal, lamp...) | `src/Application/World/` |
| Loading screen and overlay text | `src/Application/UI/components/` |
| Photos in the picture frames | `static/images/` |

To add or change anything on the portfolio, edit `static/os/data.js`. No other file needs to change.

## Running it

Requires Node 20 or later.

```bash
# Install dependencies
npm install

# Run the local dev server at http://localhost:8080
npm run dev
```

## Deploying

The site is fully static. Build it and serve the `public` folder from any static host:

```bash
npm run build
```

On Vercel, Netlify or Cloudflare Pages, set the build command to `npm run build` and the output directory to `public`.

To preview the production build locally:

```bash
npm run build
npm start
```
