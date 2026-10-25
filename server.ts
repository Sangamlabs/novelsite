import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db, AdminUser } from './src/server/db.ts';
import { logger, maskEmail } from './src/server/logger.ts';
import { uploadCoverImage } from './src/server/upload.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Ensure persistent uploads directory exists and mount static handler
const UPLOADS_ROOT = path.resolve(process.cwd(), 'data', 'uploads');
const COVERS_DIR = path.join(UPLOADS_ROOT, 'covers');
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_ROOT));

// Request correlation ID and structured HTTP access logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  (req as any).id = reqId;
  res.setHeader('X-Request-Id', reqId);
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    if (req.path.startsWith('/api')) {
      const logContext = {
        requestId: reqId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip || req.socket.remoteAddress
      };

      if (res.statusCode >= 500) {
        logger.error('http.request.failed', `${req.method} ${req.path} -> ${res.statusCode} (${durationMs}ms)`, undefined, logContext);
      } else if (res.statusCode >= 400) {
        logger.warn('http.request.client_error', `${req.method} ${req.path} -> ${res.statusCode} (${durationMs}ms)`, logContext);
      } else {
        logger.info('http.request.completed', `${req.method} ${req.path} -> ${res.statusCode} (${durationMs}ms)`, logContext);
      }
    }
  });
  next();
});

// Parse JSON bodies (up to 10MB to accommodate high-res covers before compression)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Production & Dev CORS configuration (Supports Netlify and Render custom origins)
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.CORS_ORIGIN,
  'https://akhyana.netlify.app'
].filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = !isProd ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    }
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// In-memory active session store (backed by secure tokens)
interface ActiveSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'admin' | 'editor' | 'moderator';
  };
  expiresAt: number;
}

const sessions = new Map<string, ActiveSession>();

// Rate limiter helper for auth attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= 10) {
    return false;
  }
  record.count += 1;
  return true;
}

// Session authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('akhyana_session='));
    if (sessionCookie) {
      token = sessionCookie.split('=')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  (req as any).user = session.user;
  next();
}

// Role authorization middleware
function authorizeRoles(...allowedRoles: Array<'owner' | 'admin' | 'editor' | 'moderator'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/* ========================================================================== */
/*                               API ENDPOINTS                                */
/* ========================================================================== */

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Akhyana Literary Platform',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const reqId = (req as any).id;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!checkRateLimit(ip)) {
    logger.warn('auth.login.rate_limited', 'Login rate limit reached for client IP', {
      requestId: reqId,
      ip,
      email: cleanEmail
    });
    res.status(429).json({ error: 'Too many login attempts. Please wait 1 minute.' });
    return;
  }

  if (!cleanEmail || !password) {
    logger.warn('auth.login.missing_credentials', 'Login attempted without email or password', {
      requestId: reqId,
      ip
    });
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const admin = await db.findAdminByEmail(cleanEmail);
  if (!admin) {
    logger.warn('auth.login.failed', 'Admin authentication failed: email not found', {
      requestId: reqId,
      ip,
      email: cleanEmail,
      reason: 'unknown_email'
    });
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  let matches = false;
  if (admin.password_hash) {
    if (admin.password_hash.startsWith('$2a$') || admin.password_hash.startsWith('$2b$') || admin.password_hash.startsWith('$2y$')) {
      matches = bcrypt.compareSync(password, admin.password_hash);
    } else {
      // In case password_hash is stored in plain text from environment or legacy migration, securely verify and upgrade
      matches = (password === admin.password_hash);
      if (matches) {
        admin.password_hash = bcrypt.hashSync(password, 10);
        logger.info('auth.password.upgraded', 'Legacy password hash automatically upgraded to bcrypt', {
          requestId: reqId,
          adminId: admin.id,
          email: cleanEmail
        });
      }
    }
  }

  if (!matches) {
    logger.warn('auth.login.failed', 'Admin authentication failed: invalid password', {
      requestId: reqId,
      ip,
      email: cleanEmail,
      adminId: admin.id,
      reason: 'invalid_password'
    });
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Create cryptographic session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData: ActiveSession = {
    token,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    },
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };

  sessions.set(token, sessionData);

  // Set HTTP-only cookie with cross-site support if deployed
  res.cookie('akhyana_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  logger.info('auth.login.success', 'Administrator authenticated successfully', {
    requestId: reqId,
    ip,
    adminId: admin.id,
    email: cleanEmail,
    role: admin.role
  });

  res.json({
    token,
    user: sessionData.user
  });
});

app.get('/api/auth/session', authenticate, (req: Request, res: Response) => {
  res.json({
    user: (req as any).user
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    sessions.delete(token);
  }
  res.clearCookie('akhyana_session', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  logger.info('auth.logout.success', 'Session terminated', {
    requestId: (req as any).id
  });
  res.json({ success: true });
});

// Admin accounts management (Owner only)
app.get('/api/admin/users', authenticate, authorizeRoles('owner'), (_req, res) => {
  const admins = db.getAdmins().map(a => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    created_at: a.created_at
  }));
  res.json(admins);
});

app.post('/api/admin/users', authenticate, authorizeRoles('owner'), async (req, res) => {
  const { email, name, role, password } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Missing required admin fields' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const existing = await db.findAdminByEmail(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'Admin email already exists' });
    return;
  }
  const newAdmin: AdminUser = {
    id: 'usr-' + Date.now(),
    email,
    name,
    role: role || 'editor',
    password_hash: bcrypt.hashSync(password, 10),
    created_at: new Date().toISOString()
  };
  db.addAdmin(newAdmin);
  res.status(201).json({
    id: newAdmin.id,
    email: newAdmin.email,
    name: newAdmin.name,
    role: newAdmin.role
  });
});

app.delete('/api/admin/users/:id', authenticate, authorizeRoles('owner'), (req, res) => {
  const deleted = db.deleteAdmin(req.params.id);
  if (!deleted) {
    res.status(400).json({ error: 'Cannot delete primary owner or staff member not found' });
    return;
  }
  res.json({ success: true, message: 'Staff member account removed successfully' });
});

// Admin stats
app.get('/api/admin/stats', authenticate, (_req, res) => {
  const novels = db.getNovels();
  const allChapters = db.getChapters(undefined, true);
  const publishedChapters = allChapters.filter(c => c.status === 'published');
  const draftChapters = allChapters.filter(c => c.status === 'draft');
  const comments = db.getAllComments();
  const totalWords = allChapters.reduce((acc, c) => acc + (c.word_count || 0), 0);

  res.json({
    novel_count: novels.length,
    chapter_count: allChapters.length,
    published_chapter_count: publishedChapters.length,
    draft_chapter_count: draftChapters.length,
    comment_count: comments.length,
    pending_comments: comments.filter(c => c.status === 'pending').length,
    total_words: totalWords
  });
});

// Novels endpoints
app.get('/api/novels', (_req, res) => {
  const novels = db.getNovels();
  res.json(novels);
});

app.get('/api/novels/:slug', (req, res) => {
  const novel = db.getNovelBySlug(req.params.slug);
  if (!novel) {
    res.status(404).json({ error: 'Novel not found' });
    return;
  }
  res.json(novel);
});

app.post('/api/novels', authenticate, authorizeRoles('owner', 'admin', 'editor'), (req, res) => {
  const { title, slug, synopsis, author, cover_url, genres, status, available_languages, is_featured, translations } = req.body;
  if (!title || !slug) {
    res.status(400).json({ error: 'Title and unique slug are required' });
    return;
  }
  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!cleanSlug) {
    res.status(400).json({ error: 'A valid alphanumeric slug is required' });
    return;
  }
  const existing = db.getNovelBySlug(cleanSlug);
  if (existing) {
    res.status(409).json({ error: 'A novel with this slug already exists. Please choose a different slug.' });
    return;
  }
  const novel = {
    id: 'nov-' + Date.now(),
    slug: cleanSlug,
    title: title.trim(),
    synopsis: synopsis || '',
    author: author || 'Akhyana Staff',
    cover_url: cover_url || '/src/assets/images/novel_cover_whispering_canopy_1792815709554.jpg',
    genres: genres || ['Literary Fiction'],
    status: status || 'ongoing',
    available_languages: available_languages || ['en'],
    is_featured: !!is_featured,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: translations || {}
  };
  const saved = db.saveNovel(novel);
  res.status(201).json(saved);
});

app.put('/api/novels/:slug', authenticate, authorizeRoles('owner', 'admin', 'editor'), (req, res) => {
  const existing = db.getNovelBySlug(req.params.slug);
  if (!existing) {
    res.status(404).json({ error: 'Novel not found' });
    return;
  }
  const cleanSlug = req.body.slug
    ? req.body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
    : existing.slug;
  if (cleanSlug !== existing.slug) {
    const slugInUse = db.getNovelBySlug(cleanSlug);
    if (slugInUse && slugInUse.id !== existing.id) {
      res.status(409).json({ error: 'A novel with this new slug already exists' });
      return;
    }
  }
  const updated = db.saveNovel({
    ...existing,
    ...req.body,
    slug: cleanSlug,
    id: existing.id,
    updated_at: new Date().toISOString()
  });
  res.json(updated);
});

app.delete('/api/novels/:slug', authenticate, authorizeRoles('owner', 'admin'), (req, res) => {
  const deleted = db.deleteNovel(req.params.slug);
  if (!deleted) {
    res.status(404).json({ error: 'Novel not found' });
    return;
  }
  res.json({ success: true });
});

// Chapters endpoints
app.get('/api/novels/:slug/chapters', (req, res) => {
  const includeDrafts = req.query.include_drafts === 'true';
  const chapters = db.getChapters(req.params.slug, includeDrafts);
  res.json(chapters);
});

app.get('/api/chapters/:idOrSlug', (req, res) => {
  const novelSlug = req.query.novel as string | undefined;
  const chapter = db.getChapter(req.params.idOrSlug, novelSlug);
  if (!chapter) {
    res.status(404).json({ error: 'Chapter not found' });
    return;
  }
  res.json(chapter);
});

app.post('/api/chapters', authenticate, authorizeRoles('owner', 'admin', 'editor'), (req, res) => {
  const { novel_slug, chapter_number, title, slug, body, language, status, translations } = req.body;
  if (!novel_slug || !title || chapter_number === undefined) {
    res.status(400).json({ error: 'Missing novel, chapter number, or title' });
    return;
  }
  const novel = db.getNovelBySlug(novel_slug);
  if (!novel) {
    res.status(404).json({ error: 'Associated novel not found' });
    return;
  }

  const generatedSlug = (slug || title).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const words = (body || '').trim().split(/\s+/).filter(Boolean).length;

  const chapter = {
    id: 'ch-' + Date.now(),
    novel_id: novel.id,
    novel_slug: novel.slug,
    chapter_number: parseInt(chapter_number, 10),
    order_index: parseInt(chapter_number, 10),
    title,
    slug: generatedSlug,
    body: body || '',
    language: language || 'en',
    status: status || 'draft',
    cover_url: req.body.cover_url || null,
    published_at: status === 'published' ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    word_count: words,
    translations: translations || {}
  };

  const saved = db.saveChapter(chapter);
  res.status(201).json(saved);
});

app.put('/api/chapters/:id', authenticate, authorizeRoles('owner', 'admin', 'editor'), (req, res) => {
  const existing = db.getChapter(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Chapter not found' });
    return;
  }
  const body = req.body.body !== undefined ? req.body.body : existing.body;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const status = req.body.status || existing.status;
  const published_at = status === 'published' && !existing.published_at ? new Date().toISOString() : existing.published_at;

  const updated = db.saveChapter({
    ...existing,
    ...req.body,
    id: existing.id,
    word_count: words,
    published_at
  });
  res.json(updated);
});

app.delete('/api/chapters/:id', authenticate, authorizeRoles('owner', 'admin'), (req, res) => {
  const deleted = db.deleteChapter(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Chapter not found' });
    return;
  }
  res.json({ success: true });
});

// Cover image upload endpoint (Protected: owner, admin, editor)
// Integrates Catbox (Primary) + Yukisbox (Fallback) per documentation
app.post('/api/upload/cover', authenticate,  authorizeRoles('owner', 'admin', 'editor'), async (req: Request, res: Response) => {
  const reqId = (req as any).id;
  try {
    const { data, filename, customSlug } = req.body;
    if (!data || typeof data !== 'string') {
      logger.warn('cover.upload.missing_data', 'Missing image data in upload request', { requestId: reqId });
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    // Match data URL pattern
    const match = data.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!match) {
      logger.warn('cover.upload.invalid_format', 'Unsupported image format in data URL', { requestId: reqId });
      res.status(400).json({ error: 'Unsupported format. Only JPEG, PNG, and WebP are allowed.' });
      return;
    }

    const mime = match[1].toLowerCase();
    const base64Payload = match[3];
    const buffer = Buffer.from(base64Payload, 'base64');

    // 5MB limit check
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      logger.warn('cover.upload.oversized', 'Image exceeds 5MB size limit', {
        requestId: reqId,
        sizeBytes: buffer.length
      });
      res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
      return;
    }

    // Determine extension
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else ext = 'jpg';

    // Magic bytes verification
    let validMagic = false;
    if (ext === 'jpg' && buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      validMagic = true;
    } else if (ext === 'png' && buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      validMagic = true;
    } else if (ext === 'webp' && buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      validMagic = true;
    }

    if (!validMagic) {
      logger.warn('cover.upload.corrupt_bytes', 'Image magic bytes validation failed', { requestId: reqId, mime });
      res.status(400).json({ error: 'File appears corrupt or invalid for the selected image type.' });
      return;
    }

    // Clean filename
    const safeBase = (filename ? path.parse(filename).name : 'cover')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueFileName = `${safeBase}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;

    // Persist local disk copy as fallback cache
    try {
      const targetPath = path.join(COVERS_DIR, uniqueFileName);
      fs.writeFileSync(targetPath, buffer);
    } catch (fsErr: any) {
      logger.debug('cover.local_cache.notice', 'Local disk cache notice', { requestId: reqId, error: fsErr.message });
    }

    // Upload with Catbox primary + Yukisbox fallback
    const result = await uploadCoverImage({
      buffer,
      filename: uniqueFileName,
      mimeType: mime,
      requestId: reqId,
      customSlug
    });

    if (!result.success || !result.url) {
      logger.error('cover.upload.failed_both_providers', 'Failed to upload cover across both remote hosts', undefined, {
        requestId: reqId,
        catboxError: result.catboxError,
        yukisboxError: result.yukisboxError,
        filename: uniqueFileName
      });
      res.status(502).json({
        error: 'Remote image upload failed across both primary (Catbox) and fallback (Yukisbox) providers.',
        details: {
          catbox: result.catboxError,
          yukisbox: result.yukisboxError
        }
      });
      return;
    }

    res.status(201).json({
      url: result.url,
      provider: result.provider,
      filename: uniqueFileName,
      fileId: result.fileId,
      size: buffer.length
    });
  } catch (err: any) {
    logger.error('cover.upload.unhandled_error', 'Unhandled error processing image upload', err, { requestId: reqId });
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// Announcements endpoints
app.get('/api/announcements', (req, res) => {
  const publicOnly = req.query.all !== 'true';
  const list = db.getAnnouncements(publicOnly);
  res.json(list);
});

app.post('/api/announcements', authenticate, authorizeRoles('owner', 'admin', 'editor'), (req, res) => {
  const { title, message, type, action_label, action_url, image_url, status, expires_at } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: 'Title and message are required' });
    return;
  }
  const announcement = {
    id: 'ann-' + Date.now(),
    title,
    message,
    type: type || 'general',
    action_label: action_label || null,
    action_url: action_url || null,
    image_url: image_url || null,
    status: status || 'published',
    created_at: new Date().toISOString(),
    expires_at: expires_at || null
  };
  const saved = db.saveAnnouncement(announcement);
  res.status(201).json(saved);
});

app.put('/api/announcements/:id', authenticate, authorizeRoles('owner', 'admin', 'editor'), (req, res) => {
  const existing = db.getAnnouncements(false).find(a => a.id === req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }
  const updated = db.saveAnnouncement({ ...existing, ...req.body, id: existing.id });
  res.json(updated);
});

app.delete('/api/announcements/:id', authenticate, authorizeRoles('owner', 'admin'), (req, res) => {
  const deleted = db.deleteAnnouncement(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }
  res.json({ success: true });
});

// Reading progress & new chapter alert endpoints
app.get('/api/reading-progress', (req, res) => {
  const readerId = req.query.reader_id as string;
  if (!readerId) {
    res.json([]);
    return;
  }
  res.json(db.getReadingProgress(readerId));
});

app.post('/api/reading-progress', (req, res) => {
  const { reader_id, novel_id, novel_slug, last_chapter_id, last_chapter_number, progress_percent } = req.body;
  if (!reader_id || !novel_slug || last_chapter_number === undefined) {
    res.status(400).json({ error: 'Missing reader or reading data' });
    return;
  }
  const saved = db.saveReadingProgress({
    reader_id,
    novel_id: novel_id || '',
    novel_slug,
    last_chapter_id: last_chapter_id || '',
    last_chapter_number: parseInt(last_chapter_number, 10),
    progress_percent: progress_percent || 0,
    last_read_at: new Date().toISOString()
  });
  res.json(saved);
});

app.get('/api/reading-progress/alerts', (req, res) => {
  const readerId = req.query.reader_id as string;
  if (!readerId) {
    res.json([]);
    return;
  }
  const alerts = db.getNewChapterAlerts(readerId);
  res.json(alerts);
});

// Comments & discussions endpoints
app.get('/api/novels/:slug/comments', (req, res) => {
  res.json(db.getComments(req.params.slug));
});

app.get('/api/admin/comments', authenticate, authorizeRoles('owner', 'admin', 'moderator'), (_req, res) => {
  res.json(db.getAllComments());
});

app.post('/api/novels/:slug/comments', (req, res) => {
  const { author_name, content } = req.body;
  if (!author_name || !content || content.trim().length === 0) {
    res.status(400).json({ error: 'Author name and comment content are required' });
    return;
  }

  // Safe sanitize user generated content
  const cleanAuthor = String(author_name).slice(0, 60).replace(/<[^>]*>?/gm, '').trim();
  const cleanContent = String(content).slice(0, 2000).replace(/<[^>]*>?/gm, '').trim();

  const novel = db.getNovelBySlug(req.params.slug);
  if (!novel) {
    res.status(404).json({ error: 'Novel not found' });
    return;
  }

  const comment = {
    id: 'com-' + Date.now(),
    novel_id: novel.id,
    novel_slug: novel.slug,
    author_name: cleanAuthor || 'Anonymous Scholar',
    content: cleanContent,
    status: 'approved' as const, // auto-approved with moderation powers
    created_at: new Date().toISOString()
  };

  const saved = db.addComment(comment);
  res.status(201).json(saved);
});

app.put('/api/comments/:id/status', authenticate, authorizeRoles('owner', 'admin', 'moderator'), (req, res) => {
  const { status } = req.body;
  if (!['approved', 'hidden'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const ok = db.updateCommentStatus(req.params.id, status);
  if (!ok) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  res.json({ success: true, status });
});

app.delete('/api/comments/:id', authenticate, authorizeRoles('owner', 'admin', 'moderator'), (req, res) => {
  const ok = db.deleteComment(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  res.json({ success: true });
});

// Site customization settings
app.get('/api/site-settings', (_req, res) => {
  res.json(db.getSettings());
});

app.put('/api/site-settings', authenticate, authorizeRoles('owner', 'admin'), (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// 404 handler for undefined API routes
app.all('/api/*', (req, res) => {
  const reqId = (req as any).id;
  logger.warn('http.api.not_found', `API endpoint not found: ${req.method} ${req.path}`, {
    requestId: reqId,
    method: req.method,
    path: req.path
  });
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    requestId: reqId
  });
});

// Centralized unhandled error handler middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const reqId = (req as any).id || crypto.randomUUID();
  logger.error('server.unhandled_error', 'Unhandled server error during request processing', err, {
    requestId: reqId,
    method: req.method,
    path: req.path
  });
  if (!res.headersSent) {
    res.status(500).json({
      error: 'An internal server error occurred',
      requestId: reqId
    });
  }
});

/* ========================================================================== */
/*                           SERVER INITIALIZATION                            */
/* ========================================================================== */

async function startServer() {
  if (!isProd) {
    // Dynamic import to keep prod build clean
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('server.startup', `Akhyana platform backend listening on port ${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      hasPostgres: !!process.env.DATABASE_URL,
      hasOwnerConfig: !!process.env.OWNER_EMAIL,
      ownerEmail: maskEmail(process.env.OWNER_EMAIL || 'owner@akhyana.lit')
    });
  });
}

startServer().catch(err => {
  logger.error('server.startup.fatal', 'Failed to start Akhyana server', err);
  process.exit(1);
});
