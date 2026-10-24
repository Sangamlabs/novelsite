import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3000';

async function testSuite() {
  console.log('=== Akhyana Production Readiness & Bug Fix Verification ===\n');
  let token = '';

  // 1. Authenticate with owner credentials via POST body
  console.log('[Test 1] Testing secure POST /api/auth/login...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@akhyana.lit',
      password: 'akhyana_owner_2026'
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  const loginData = await loginRes.json();
  token = loginData.token;
  if (!token) throw new Error('No token returned from login');
  console.log('✓ Login succeeded. Secure token acquired.\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Test Novel Creation (Fix for "Novel Not Found")
  console.log('[Test 2] Testing novel creation (POST /api/novels)...');
  const testSlug = `test-novel-${Date.now()}`;
  const createNovelRes = await fetch(`${API_BASE}/api/novels`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Echoes of the Green Spires',
      slug: testSlug,
      synopsis: 'A test serial created to verify creation and retrieval without 404.',
      author: 'Test Scribe',
      cover_url: '/src/assets/images/novel_cover_whispering_canopy_1792815709554.jpg',
      genres: ['Botanical Fantasy'],
      status: 'ongoing',
      available_languages: ['en']
    })
  });

  if (createNovelRes.status !== 201) {
    const errText = await createNovelRes.text();
    throw new Error(`Novel creation failed: ${createNovelRes.status} ${errText}`);
  }
  const createdNovel = await createNovelRes.json();
  console.log(`✓ Novel created successfully with slug: ${createdNovel.slug}`);

  // 3. Test Retrieval of the Newly Created Novel
  console.log('[Test 3] Testing novel retrieval (GET /api/novels/:slug)...');
  const getNovelRes = await fetch(`${API_BASE}/api/novels/${testSlug}`);
  if (!getNovelRes.ok) {
    throw new Error(`Novel retrieval failed for newly created slug: ${getNovelRes.status}`);
  }
  const fetchedNovel = await getNovelRes.json();
  if (fetchedNovel.title !== 'Echoes of the Green Spires') {
    throw new Error(`Fetched novel title mismatch: ${fetchedNovel.title}`);
  }
  console.log('✓ Novel retrieved successfully without "Novel Not Found" error.\n');

  // 4. Test Duplicate Slug Conflict Prevention
  console.log('[Test 4] Testing duplicate slug conflict rejection (409 Conflict)...');
  const dupRes = await fetch(`${API_BASE}/api/novels`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Duplicate Title',
      slug: testSlug,
      synopsis: 'Should be rejected',
      author: 'Test'
    })
  });
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate slug, got: ${dupRes.status}`);
  }
  console.log('✓ Duplicate slug correctly rejected with HTTP 409 Conflict.\n');

  // 5. Test Cover Image Upload (Catbox / Yukisbox / Local Fallback)
  console.log('[Test 5] Testing cover upload (POST /api/upload/cover)...');
  // 1x1 valid PNG in base64
  const png1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadRes = await fetch(`${API_BASE}/api/upload/cover`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      data: png1x1,
      filename: 'production_test_cover.png'
    })
  });

  if (uploadRes.status !== 201) {
    const err = await uploadRes.text();
    throw new Error(`Cover upload failed: ${uploadRes.status} ${err}`);
  }
  const uploadData = await uploadRes.json();
  if (!uploadData.url) throw new Error('Cover upload response missing url');
  console.log(`✓ Cover uploaded successfully: ${uploadData.url} (Provider: ${uploadData.provider})\n`);

  // 6. Test Chapter Creation with the Cover
  console.log('[Test 6] Testing chapter creation with cover (POST /api/chapters)...');
  const createChapterRes = await fetch(`${API_BASE}/api/chapters`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      novel_slug: testSlug,
      chapter_number: 1,
      title: 'Prologue: The First Sprout',
      slug: 'prologue-the-first-sprout',
      body: 'Leaves rustled softly as the morning dew gathered upon the elder branches.',
      language: 'en',
      status: 'published',
      cover_url: uploadData.url
    })
  });

  if (createChapterRes.status !== 201) {
    const err = await createChapterRes.text();
    throw new Error(`Chapter creation failed: ${createChapterRes.status} ${err}`);
  }
  const createdChapter = await createChapterRes.json();
  console.log(`✓ Chapter 1 created with cover: ${createdChapter.title}\n`);

  // 7. Test Chapter Retrieval
  console.log('[Test 7] Testing chapter retrieval (GET /api/chapters/:idOrSlug)...');
  const getChapterRes = await fetch(`${API_BASE}/api/chapters/${createdChapter.slug}?novel=${testSlug}`);
  if (!getChapterRes.ok) {
    throw new Error(`Failed to retrieve chapter: ${getChapterRes.status}`);
  }
  const fetchedChapter = await getChapterRes.json();
  if (fetchedChapter.cover_url !== uploadData.url) {
    throw new Error(`Chapter cover_url mismatch: ${fetchedChapter.cover_url}`);
  }
  console.log('✓ Chapter retrieved with correct cover URL.\n');

  // 8. Test Unauthorized Security Protection
  console.log('[Test 8] Testing security & authorization guards (401 Unauthorized)...');
  const unauthNovel = await fetch(`${API_BASE}/api/novels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hacker Novel', slug: 'hacker-novel' })
  });
  if (unauthNovel.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${unauthNovel.status}`);
  }

  const unauthUpload = await fetch(`${API_BASE}/api/upload/cover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: png1x1 })
  });
  if (unauthUpload.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for cover upload, got ${unauthUpload.status}`);
  }
  console.log('✓ Unauthorized novel creation and cover upload strictly rejected.\n');

  // 9. Cleanup test novel and chapter
  console.log('[Test 9] Cleaning up test novel and chapter...');
  const delRes = await fetch(`${API_BASE}/api/novels/${testSlug}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  if (!delRes.ok) throw new Error(`Failed to delete test novel: ${delRes.status}`);
  console.log('✓ Test novel cleaned up cleanly.\n');

  console.log('====================================================');
  console.log('🎉 ALL 9 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

testSuite().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
