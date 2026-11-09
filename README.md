# Unhyped

AI and Tesla news, minus the hype. Mobile-first responsive web app (MVP with sample data).

## Run it
```
npm install
npm run dev      # open the link it prints (works on your phone on the same Wi-Fi with: npm run dev -- --host)
npm run build    # production build in dist/
```

## Structure
- `src/data/stories.ts` – sample stories (label: official / report / rumor, sources, why it matters)
- `src/data/topics.ts` – topics, sub-areas, feed depth options
- `src/lib/feed.ts` – builds the home rows (hero, must know, trending, because you follow, per-topic)
- `src/lib/prefs.tsx` – user preferences, saved in the browser (no sign-up)
- `src/pages/` – Onboarding, Home, StoryPage, Brief, Saved, Settings
- `public/img/` – images cropped from the design mockups (replace with final images)

Stack: Vite, React, TypeScript, Tailwind, React Router, lucide icons.
