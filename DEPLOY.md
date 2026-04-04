# Deploy Camelot Scout v6

## Option 1: Netlify (Easiest - 30 seconds)
1. Go to https://app.netlify.com/drop
2. Drag the `dist/` folder onto the page
3. Done! You'll get a URL like https://random-name.netlify.app

## Option 2: Vercel
1. Go to https://vercel.com/new
2. Import from folder or connect GitHub repo
3. Framework: Vite
4. Build command: npm run build
5. Output directory: dist

## Option 3: Render (same as v4)
1. Go to https://dashboard.render.com
2. New → Static Site
3. Connect repo or upload
4. Build: npm run build
5. Publish directory: dist

## Environment Variables (set in hosting dashboard)
See .env.example for all required variables.
