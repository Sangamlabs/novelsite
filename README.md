# Akhyana — Multilingual Novel Publishing Platform
## Inspired by the “Forest Quiet” Visual Direction

**Akhyana** (आख्यान) is a digital novel publishing press and reading platform dedicated to original fiction, light novels, and multilingual serials.

The visual direction follows the **Forest Quiet** editorial aesthetic:
- **Palette**: Pale sage background (`#EEF0E4`), deep moss accents (`#2C3A22`), pale sage containers (`#DDE5D2`), frosted glass panels with soft white borders, muted ink (`#68715F`), and antique gold highlights (`#B08D46`).
- **Typography**: Times New Roman / Times / Cormorant Garamond serif with Japanese serif fallback (`Noto Serif JP`).
- **Zero-Pill Discipline**: Clean, unboxed metadata separated by typographic dots (`·`), generous negative space, and single-elevation glass depth.
- **Multilingual Reading**: Native support for Hinglish, English, and Japanese translations with synchronized chapter navigation and unavailable-translation indicators.

---

## Technical Architecture

```
/
├── server.ts               # Express backend & Vite middleware server
├── src/
│   ├── assets/images/      # Botanical backgrounds and high-res book covers
│   ├── components/         # Modular React components:
│   │   ├── Navigation.tsx         # Top Bar Contract with 3 zones & drawer
│   │   ├── Hero.tsx               # Sunlit fern hero section
│   │   ├── ReadingProgressCards.tsx # Continue Reading, Recently Published, Library
│   │   ├── NovelCard.tsx          # Frosted glass card with 3:4 cover
│   │   ├── NovelDetails.tsx       # Synopsis, chapter archive, & discussions
│   │   ├── ChapterReader.tsx      # Canvas themes (Sage, Paper, Sepia, Night)
│   │   ├── ChapterArchive.tsx     # Filterable complete chapter directory
│   │   ├── AnnouncementModal.tsx  # Dismissible persistent broadcast popup
│   │   ├── NewChapterAlert.tsx    # Automatic alert when authors publish new chapters
│   │   ├── AdminStudio.tsx        # Full Author Studio CRUD dashboard
│   │   ├── LoginModal.tsx         # Secure POST body login (zero URL leak)
│   │   ├── LibraryModal.tsx       # Personal bookmarked stories drawer
│   │   ├── AboutView.tsx          # Literary heritage & brand philosophy
│   │   └── Footer.tsx             # Restrained literary footer
│   ├── db/migrations/
│   │   └── 001_initial_schema.sql # PostgreSQL / Neon / Render migration
│   ├── server/
│   │   └── db.ts                  # Persistent data store & seed engine
│   ├── services/
│   │   └── api.ts                 # Type-safe API client with session management
│   ├── types/
│   │   └── index.ts               # Shared TypeScript schemas
│   ├── App.tsx                    # Main application router
│   ├── index.css                  # Tailwind tokens, glass panels, reader themes
│   └── main.tsx                   # React 19 entry point
├── metadata.json
└── package.json
```

---

## Authentication & Security

1. **Owner & Admin Authentication**:
   - Credentials are submitted via **POST request body only** to `/api/auth/login`.
   - Never transmits usernames or passwords via GET query strings.
   - Password verification uses `bcrypt` (`bcryptjs.compareSync`).
   - Generates a 32-byte cryptographic session token returned via JSON header and optional HttpOnly cookie.
   - Persistent across browser refresh; invalidates on `/api/auth/logout`.
   - Default dev owner account: `owner@akhyana.lit` / `akhyana_owner_2026`.

2. **Roles & Permissions**:
   - `owner`: full control over site settings, staff accounts, novels, manuscripts, and announcements.
   - `admin`: content CRUD and site settings.
   - `editor`: manuscripts, chapters, and drafts.
   - `moderator`: reader comments and discussion forums.

---

## Local Development (Windows PowerShell & Bash)

```powershell
# 1. Install dependencies
npm install

# 2. Run dev server (Express backend + Vite HMR on port 3000)
npm run dev

# 3. Build for production
npm run build

# 4. Check TypeScript types
npm run lint
```

---

## Deployment Instructions

### 1. Frontend: Netlify
1. Connect the Git repository to Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variable:
   - `VITE_API_URL`: Your Render backend service URL (e.g. `https://akhyana-backend.onrender.com`)
5. SPA redirect rule is handled via `index.html` fallback.

### 2. Backend: Render
1. Create a **Web Service** on Render connected to this repository.
2. Runtime: **Node.js**
3. Build command: `npm install && npm run build`
4. Start command: `npm run start` (runs `tsx server.ts`)
5. Set environment variables on Render:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (or leave default for Render)
   - `DATABASE_URL`: Your managed PostgreSQL / Neon connection string
   - `OWNER_EMAIL`: `owner@akhyana.lit`
   - `OWNER_PASSWORD_HASH`: `$2a$10$...` (generate using `node -e "console.log(require('bcryptjs').hashSync('your_password', 10))"`)
   - `SESSION_SECRET`: Random 32+ character hex string
   - `FRONTEND_ORIGIN`: Your Netlify URL (`https://your-site.netlify.app`)

### 3. Database: Neon PostgreSQL
1. Create a serverless PostgreSQL database on [Neon](https://neon.tech).
2. Copy the connection string with `?sslmode=require`.
3. Run the migration script in `src/db/migrations/001_initial_schema.sql` via Neon's SQL Editor or `psql`.
