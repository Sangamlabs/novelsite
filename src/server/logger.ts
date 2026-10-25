// Akhyana Backend Structured Logger
// Produces consistent JSON logs formatted for Render Log Viewer

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  novelId?: string;
  novelSlug?: string;
  chapterId?: string;
  provider?: string;
  [key: string]: any;
}

const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'passwordhash',
  'token',
  'authorization',
  'cookie',
  'session_secret',
  'database_url',
  'secret',
  'key'
];

/**
 * Mask email addresses safely for logs (e.g. akhyanaweb@gmail.com -> a***b@gmail.com)
 */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return '[invalid-email]';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Recursively sanitize objects to prevent credentials, secrets, or raw payloads from leaking to stdout
 */
export function sanitizeLogData(data?: any): any {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (lowerKey === 'email') {
      clean[key] = maskEmail(value as string);
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeLogData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function writeLog(level: LogLevel, event: string, message: string, context?: LogContext, error?: Error | any) {
  const entry: Record<string, any> = {
    timestamp: new Date().toISOString(),
    level,
    service: 'akhyana-backend',
    event,
    message
  };

  if (context) {
    const sanitizedContext = sanitizeLogData(context);
    Object.assign(entry, sanitizedContext);
  }

  if (error) {
    entry.error = {
      name: error.name || 'Error',
      message: error.message || String(error),
      ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {})
    };
  }

  const jsonLine = JSON.stringify(entry);
  if (level === 'ERROR') {
    process.stderr.write(jsonLine + '\n');
  } else {
    process.stdout.write(jsonLine + '\n');
  }
}

export const logger = {
  debug(event: string, message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      writeLog('DEBUG', event, message, context);
    }
  },
  info(event: string, message: string, context?: LogContext) {
    writeLog('INFO', event, message, context);
  },
  warn(event: string, message: string, context?: LogContext, error?: any) {
    writeLog('WARN', event, message, context, error);
  },
  error(event: string, message: string, error?: any, context?: LogContext) {
    writeLog('ERROR', event, message, context, error);
  }
};
