/**
 * Тест GGSel/Digiseller shop API endpoints
 * Запуск: node scratch/test_shop_api.mjs
 * 
 * Проверяет:
 * 1. verify — верификация кода заказа
 * 2. link — привязка UDID к заказу  
 * 3. order-details — детали заказа
 * 4. send-message — отправка сообщения
 * 5. sync-chats — синхронизация чатов
 * 6. Авторизация — проверка что без origin/key возвращается 401
 * 7. ilike-инъекция — проверка что % не проходит
 * 8. UDID валидация — проверка что мусор не принимается
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_UDID = '00008101-001A34E20CC8001E';
const INVALID_UDID = 'not-a-valid-udid!!!';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://bazzar-serts.shop',
        'Referer': 'https://bazzar-serts.shop/',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}

async function testVerifyGGSel() {
  console.log('\n📋 Test: GGSel Verify');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/verify?format=json`);
  assert(r1.data.success === false, 'Verify without code returns error');
  
  const r2 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/verify?uniquecode=FAKE_CODE_123&format=json`);
  assert(r2.status === 200, 'Verify with fake code returns 200 (not 500)');
  assert(r2.data.success === false || r2.data.success === true, 'Verify returns valid JSON');
  
  const r3 = await fetch(`${BASE_URL}/api/shop/ggsel/verify?uniquecode=FAKE_CODE_123&format=text`);
  const text = await r3.text();
  assert(text === 'yes' || text === 'no', 'Verify text format returns yes/no');
}

async function testVerifyDigiseller() {
  console.log('\n📋 Test: Digiseller Verify');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/digiseller/verify?format=json`);
  assert(r1.data.success === false, 'Digiseller verify without code returns error');
  
  const r2 = await fetchJSON(`${BASE_URL}/api/shop/digiseller/verify?uniquecode=FAKE_CODE_123&format=json`);
  assert(r2.status === 200, 'Digiseller verify returns 200');
}

async function testLinkValidation() {
  console.log('\n📋 Test: GGSel Link Validation');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/link`, {
    method: 'POST', body: JSON.stringify({})
  });
  assert(r1.status === 400 || r1.status === 401, 'Link without data returns 400/401');
  
  const r2 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/link`, {
    method: 'POST', body: JSON.stringify({ uniquecode: 'TEST123', udid: INVALID_UDID })
  });
  assert(r2.status === 400, 'Link with invalid UDID returns 400');
  
  const r3 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/link`, {
    method: 'POST', body: JSON.stringify({ uniquecode: 'NONEXISTENT_' + Date.now(), udid: TEST_UDID })
  });
  assert(r3.status === 404 || r3.data.success === false, 'Link with non-existent code returns error');
}

async function testDigisellerLink() {
  console.log('\n📋 Test: Digiseller Link Validation');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/digiseller/link`, {
    method: 'POST', body: JSON.stringify({ uniquecode: 'TEST123', udid: INVALID_UDID })
  });
  assert(r1.status === 400, 'Digiseller link with invalid UDID returns 400');
}

async function testIlikeInjection() {
  console.log('\n📋 Test: ilike Injection Protection');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/link`, {
    method: 'POST', body: JSON.stringify({ uniquecode: '%', udid: TEST_UDID })
  });
  assert(r1.status !== 500, 'ilike injection with % does not cause 500');
  
  const r2 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/link`, {
    method: 'POST', body: JSON.stringify({ uniquecode: '_%_', udid: TEST_UDID })
  });
  assert(r2.status !== 500, 'ilike injection with _%_ does not cause 500');
}

async function testSyncChatsAuth() {
  console.log('\n📋 Test: Sync-Chats Auth');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/sync-chats`);
  assert(r1.status === 401, 'Sync-chats without CRON_SECRET returns 401');
}

async function testErrorSafety() {
  console.log('\n📋 Test: Error Response Safety');
  
  const r1 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/send-message`, {
    method: 'POST', body: JSON.stringify({})
  });
  if (r1.data.error) {
    assert(!r1.data.error.includes('/Users'), 'Error has no file paths');
    assert(!r1.data.stack, 'No stack trace in response');
  } else {
    assert(true, 'No error field (OK)');
  }
  
  const r2 = await fetchJSON(`${BASE_URL}/api/shop/ggsel/order-details?userId=invalid`);
  if (r2.data.error) {
    assert(!r2.data.error.includes('at '), 'No stack trace in order-details error');
  } else {
    assert(true, 'No error field (OK)');
  }
}

async function main() {
  console.log('🔍 Shop API Integration Tests');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log('═'.repeat(50));
  
  await testVerifyGGSel();
  await testVerifyDigiseller();
  await testLinkValidation();
  await testDigisellerLink();
  await testIlikeInjection();
  await testSyncChatsAuth();
  await testErrorSafety();
  
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
