// Akhyana Cover Storage Integration: Catbox (Primary) + Yukisbox (Fallback)
import { logger } from './logger.ts';

export interface UploadResult {
  success: boolean;
  url?: string;
  provider?: 'catbox' | 'yukisbox';
  fileId?: string;
  filename?: string;
  error?: string;
  catboxError?: string;
  yukisboxError?: string;
}

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  requestId?: string;
  customSlug?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB limit for novel and chapter covers

/**
 * Validate cover buffer format and size
 */
export function validateCoverFile(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file payload' };
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return { valid: false, error: `Invalid image type '${mimeType}'. Allowed formats: JPEG, PNG, WebP.` };
  }
  if (buffer.length > MAX_COVER_SIZE) {
    return { valid: false, error: `File size exceeds the 5MB limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)` };
  }
  return { valid: true };
}

/**
 * Upload to Catbox (Primary image host)
 */
async function uploadToCatbox(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  requestId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const startTime = Date.now();
  logger.info('cover.upload.catbox.start', 'Attempting primary cover upload to Catbox', {
    requestId,
    provider: 'catbox',
    filename
  });

  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    if (process.env.CATBOX_USERHASH) {
      formData.append('userhash', process.env.CATBOX_USERHASH.trim());
    }
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    formData.append('fileToUpload', blob, filename);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Akhyana-Platform/2.0'
      }
    });
    clearTimeout(timeout);

    const durationMs = Date.now() - startTime;
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Catbox HTTP error');
      logger.warn('cover.upload.catbox.failed', 'Catbox returned non-200 status', {
        requestId,
        provider: 'catbox',
        statusCode: res.status,
        durationMs,
        details: errorText.slice(0, 200)
      });
      return { success: false, error: `Catbox HTTP ${res.status}: ${errorText.slice(0, 100)}` };
    }

    const rawUrl = (await res.text()).trim();
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      logger.info('cover.upload.catbox.success', 'Catbox upload succeeded', {
        requestId,
        provider: 'catbox',
        durationMs,
        url: rawUrl
      });
      return { success: true, url: rawUrl };
    }

    logger.warn('cover.upload.catbox.invalid_response', 'Catbox response did not contain a valid URL', {
      requestId,
      provider: 'catbox',
      durationMs,
      response: rawUrl.slice(0, 150)
    });
    return { success: false, error: `Unexpected Catbox response: ${rawUrl.slice(0, 100)}` };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    logger.warn('cover.upload.catbox.error', isTimeout ? 'Catbox upload timed out' : 'Catbox upload network error', {
      requestId,
      provider: 'catbox',
      durationMs,
      errorMessage: err.message
    });
    return { success: false, error: isTimeout ? 'Catbox request timed out after 8s' : err.message };
  }
}

/**
 * Upload to Yukisbox (Documented fallback image host)
 * Endpoint: POST https://yukiapi.site/upload
 * Field: 'file'
 */
async function uploadToYukisbox(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  requestId?: string,
  customSlug?: string
): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
  const startTime = Date.now();
  const endpoint = (process.env.YUKISBOX_API_URL || 'https://yukiapi.site/upload').trim();

  logger.info('cover.upload.yukisbox.start', 'Attempting fallback cover upload to Yukisbox', {
    requestId,
    provider: 'yukisbox',
    endpoint,
    filename
  });

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    // Required parameter per documentation: 'file'
    formData.append('file', blob, filename);

    // Optional parameters per documentation
    if (process.env.YUKISBOX_USERHASH) {
      formData.append('userhash', process.env.YUKISBOX_USERHASH.trim());
    }
    if (customSlug) {
      formData.append('custom_slug', customSlug);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10-second timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Akhyana-Platform/2.0'
      }
    });
    clearTimeout(timeout);

    const durationMs = Date.now() - startTime;
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Yukisbox HTTP error');
      logger.warn('cover.upload.yukisbox.failed', 'Yukisbox returned non-200 status', {
        requestId,
        provider: 'yukisbox',
        statusCode: res.status,
        durationMs,
        details: errorText.slice(0, 200)
      });
      return { success: false, error: `Yukisbox HTTP ${res.status}: ${errorText.slice(0, 100)}` };
    }

    const json: any = await res.json().catch(() => null);
    if (!json) {
      logger.warn('cover.upload.yukisbox.invalid_json', 'Yukisbox response was not valid JSON', {
        requestId,
        provider: 'yukisbox',
        durationMs
      });
      return { success: false, error: 'Yukisbox response was not valid JSON' };
    }

    // Validate expected format: { success: true, uid: "...", url: "...", filename: "..." }
    const url = json.url || json.data?.url || (json.data?.file?.url) || null;
    const uid = json.uid || json.id || json.data?.id || undefined;

    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      logger.info('cover.upload.yukisbox.success', 'Yukisbox upload succeeded', {
        requestId,
        provider: 'yukisbox',
        durationMs,
        url,
        fileId: uid
      });
      return { success: true, url, fileId: uid };
    }

    logger.warn('cover.upload.yukisbox.missing_url', 'Yukisbox JSON missing valid URL', {
      requestId,
      provider: 'yukisbox',
      durationMs,
      responseSummary: JSON.stringify(json).slice(0, 150)
    });
    return { success: false, error: json.error || json.message || 'Yukisbox response missing URL' };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    logger.warn('cover.upload.yukisbox.error', isTimeout ? 'Yukisbox upload timed out' : 'Yukisbox upload network error', {
      requestId,
      provider: 'yukisbox',
      durationMs,
      errorMessage: err.message
    });
    return { success: false, error: isTimeout ? 'Yukisbox request timed out after 10s' : err.message };
  }
}

/**
 * Execute resilient dual-provider cover upload:
 * 1. Attempt Catbox
 * 2. If Catbox fails, attempt Yukisbox
 * 3. If both fail, return clear error
 */
export async function uploadCoverImage(options: UploadOptions): Promise<UploadResult> {
  const { buffer, filename, mimeType, requestId, customSlug } = options;

  // 1. Validate payload
  const validation = validateCoverFile(buffer, mimeType);
  if (!validation.valid) {
    logger.warn('cover.upload.validation_failed', validation.error || 'Invalid cover file', {
      requestId,
      filename,
      mimeType,
      byteLength: buffer?.length
    });
    return {
      success: false,
      error: validation.error || 'Invalid cover file'
    };
  }

  // 2. Primary: Catbox
  const catboxResult = await uploadToCatbox(buffer, filename, mimeType, requestId);
  if (catboxResult.success && catboxResult.url) {
    return {
      success: true,
      url: catboxResult.url,
      provider: 'catbox',
      filename
    };
  }

  // 3. Fallback: Yukisbox
  logger.warn('cover.upload.fallback_triggered', 'Catbox upload failed; falling back to Yukisbox', {
    requestId,
    catboxError: catboxResult.error
  });

  const yukisboxResult = await uploadToYukisbox(buffer, filename, mimeType, requestId, customSlug);
  if (yukisboxResult.success && yukisboxResult.url) {
    return {
      success: true,
      url: yukisboxResult.url,
      provider: 'yukisbox',
      fileId: yukisboxResult.fileId,
      filename
    };
  }

  // 4. Both failed
  logger.error('cover.upload.all_failed', 'Both Catbox and Yukisbox cover storage providers failed', null, {
    requestId,
    catboxError: catboxResult.error,
    yukisboxError: yukisboxResult.error
  });

  return {
    success: false,
    error: 'Cover upload failed across all storage providers. Please try again or verify image format.',
    catboxError: catboxResult.error,
    yukisboxError: yukisboxResult.error
  };
}
