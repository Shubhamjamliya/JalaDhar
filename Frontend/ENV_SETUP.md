# Environment Variables Setup

## Important: Restart Dev Server After Adding Environment Variables

Vite requires you to **restart the development server** after adding or modifying environment variables in the `.env` file.

## Steps to Fix "VITE_GOOGLE_MAPS_API_KEY not set" Error:

1. **Check your `.env` file** in the `Frontend` folder:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
   ```

2. **Stop the dev server** (Press `Ctrl+C` in the terminal)

3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

4. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)

## Current Environment Variables Needed:

### Frontend `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Backend `.env` file:
```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Verify Environment Variables are Loaded:

1. Open browser console (F12)
2. Type: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
3. You should see your API key (not undefined)

If it shows `undefined`, restart the dev server.

