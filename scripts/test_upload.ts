import http from 'http';
import fs from 'fs';
import path from 'path';

// Helper to make HTTP request
function request(options: http.RequestOptions, body?: any): Promise<{ statusCode: number; data: any; raw: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let data = null;
        try {
          data = JSON.parse(raw.toString('utf-8'));
        } catch {
          data = raw.toString('utf-8');
        }
        resolve({ statusCode: res.statusCode || 0, data, raw });
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE COVER UPLOAD TESTS ===\n');

  // 1. Test unauthorized access
  console.log('Test 1: Unauthorized access to /api/upload/cover');
  const res1 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/upload/cover',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { data: 'data:image/png;base64,invalid', filename: 'test.png' });

  if (res1.statusCode === 401) {
    console.log('  PASSED: Unauthorized upload rejected with 401\n');
  } else {
    throw new Error(`Test 1 Failed: Expected 401, got ${res1.statusCode}`);
  }

  // 2. Login to get token
  console.log('Test 2: Admin Login for Authorization');
  const loginRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'owner@akhyana.lit', password: 'akhyana_owner_2026' });

  if (loginRes.statusCode !== 200 || !loginRes.data.token) {
    throw new Error(`Test 2 Failed: Login failed with status ${loginRes.statusCode}`);
  }
  const token = loginRes.data.token;
  console.log('  PASSED: Admin authenticated, token acquired\n');

  // 3. Test invalid file type (e.g. text/html)
  console.log('Test 3: Reject unsupported MIME type (text/html)');
  const res3 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/upload/cover',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { data: 'data:text/html;base64,PGgxPkhlbGxvPC9oMT4=', filename: 'malicious.html' });

  if (res3.statusCode === 400) {
    console.log('  PASSED: Unsupported file type rejected with 400:', res3.data.error, '\n');
  } else {
    throw new Error(`Test 3 Failed: Expected 400 for text/html, got ${res3.statusCode}`);
  }

  // 4. Test corrupted / fake magic bytes
  console.log('Test 4: Reject fake image with invalid magic bytes');
  const fakePngData = Buffer.from('NOT_A_REAL_PNG_FILE_HEADER').toString('base64');
  const res4 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/upload/cover',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { data: `data:image/png;base64,${fakePngData}`, filename: 'fake.png' });

  if (res4.statusCode === 400) {
    console.log('  PASSED: Invalid binary magic bytes rejected with 400:', res4.data.error, '\n');
  } else {
    throw new Error(`Test 4 Failed: Expected 400 for corrupt image, got ${res4.statusCode}`);
  }

  // 5. Test valid PNG image upload with genuine PNG magic bytes
  console.log('Test 5: Valid PNG image upload');
  // Minimal valid 1x1 transparent PNG
  const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const res5 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/upload/cover',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { data: `data:image/png;base64,${validPngBase64}`, filename: 'test_cover.png' });

  if (res5.statusCode === 201 && res5.data.url) {
    console.log('  PASSED: Valid PNG uploaded successfully. URL:', res5.data.url, '\n');
  } else {
    throw new Error(`Test 5 Failed: Expected 201 with URL, got ${res5.statusCode} ${JSON.stringify(res5.data)}`);
  }

  const uploadedCoverUrl = res5.data.url;

  // 6. Test static file serving of the uploaded cover
  console.log('Test 6: Verify uploaded file is statically accessible at', uploadedCoverUrl);
  const res6 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: uploadedCoverUrl,
    method: 'GET'
  });

  if (res6.statusCode === 200 && res6.raw.length > 0) {
    console.log('  PASSED: Uploaded cover served with HTTP 200 and length', res6.raw.length, 'bytes\n');
  } else {
    throw new Error(`Test 6 Failed: Static file request failed with status ${res6.statusCode}`);
  }

  // 7. Test updating novel cover in database
  console.log('Test 7: Update novel cover with uploaded image URL');
  const novelSlug = 'the-whispering-canopy';
  const res7 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/novels/${novelSlug}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { cover_url: uploadedCoverUrl });

  if (res7.statusCode === 200 && res7.data.cover_url === uploadedCoverUrl) {
    console.log('  PASSED: Novel updated with new cover URL\n');
  } else {
    throw new Error(`Test 7 Failed: Expected 200 with updated cover_url, got ${res7.statusCode}`);
  }

  // Verify persistence via GET /api/novels/:slug
  console.log('Test 8: Verify persistence of novel cover across requests');
  const res8 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/novels/${novelSlug}`,
    method: 'GET'
  });

  if (res8.data.cover_url === uploadedCoverUrl) {
    console.log('  PASSED: Novel cover verified persistent:', res8.data.cover_url, '\n');
  } else {
    throw new Error(`Test 8 Failed: Expected ${uploadedCoverUrl}, got ${res8.data.cover_url}`);
  }

  // 9. Test chapter cover upload & creation
  console.log('Test 9: Create chapter with custom chapter cover/illustration');
  const res9 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/chapters',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    novel_slug: novelSlug,
    chapter_number: 99,
    title: 'Test Chapter With Custom Illustration',
    body: 'Prose with custom illustration attached.',
    cover_url: uploadedCoverUrl,
    status: 'draft'
  });

  if (res9.statusCode === 201 && res9.data.cover_url === uploadedCoverUrl) {
    console.log('  PASSED: Chapter created with custom cover_url:', res9.data.cover_url, '\n');
  } else {
    throw new Error(`Test 9 Failed: Chapter creation with cover_url failed: ${res9.statusCode} ${JSON.stringify(res9.data)}`);
  }

  // Clean up test chapter
  if (res9.data.id) {
    await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/chapters/${res9.data.id}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('  Cleaned up test chapter\n');
  }

  // Restore novel original cover
  await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/novels/${novelSlug}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { cover_url: '/src/assets/images/novel_cover_whispering_canopy_1792815709554.jpg' });
  console.log('  Restored original novel cover\n');

  console.log('=== ALL 9 COVER UPLOAD & PERSISTENCE TESTS PASSED ===');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
