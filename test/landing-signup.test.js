// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { handleSignup } from '../src/lib/landing/signup-api.ts';
import { normalizeSignupDetails } from '../src/lib/landing/signup-details.ts';
import { readingCheckoutUrl, withCheckoutAttribution } from '../src/lib/landing/urls.ts';

const origin = 'https://land.example';
const details = { name: '  מלי   כהן  ', phone: '+972-50-1234567', email: 'parent+reading@example.com' };
const input = { ...details, funnel: 'reading', consent: true, website: '', turnstileToken: 'test-token' };
const env = {
  SITE_URL: origin,
  SIGNUP_RATE_LIMITER: { limit: async () => ({ success: true }) },
  TURNSTILE_SECRET: 'turnstile-test-secret',
  RESPONDER_CLIENT_ID: '1',
  RESPONDER_CLIENT_SECRET: 'responder-test-secret',
  RESPONDER_USER_TOKEN: 'responder-test-token',
  RESPONDER_LIST_IDS: { reading: '122801' },
};

function request(body = input) {
  return new Request(`${origin}/api/signup`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockProviders(t, { action = 'signup_reading', subscriber = () => Response.json({ status: true }) } = {}) {
  return t.mock.fn(async (url, options) => {
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      return Response.json({ success: true, hostname: 'land.example', action });
    }
    if (url === 'https://graph.responder.live/v2/oauth/token') return Response.json({ status: true, token: 'test-access-token' });
    assert.equal(url, 'https://graph.responder.live/v2/subscribers');
    return subscriber(JSON.parse(options.body));
  });
}

test('verified funnels each submit to their own configured Responder list', async t => {
  const configured = { ...env, RESPONDER_LIST_IDS: { reading: '122801', 'test-funnel': '9000' } };
  for (const [funnel, listId] of [['reading', 122801], ['test-funnel', 9000]]) {
    const fetcher = mockProviders(t, { action: `signup_${funnel}` });
    const result = await handleSignup(request({ ...input, funnel }), configured, fetcher);
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { ok: true, checkoutAllowed: true });
    assert.equal(fetcher.mock.callCount(), 3);
    assert.deepEqual(JSON.parse(fetcher.mock.calls[2].arguments[1].body), {
      name: 'מלי כהן', phone: '0501234567', email: details.email, list_ids: [listId], override: false,
    });
  }
});

test('invalid details, missing consent, and unknown or shared list mappings never reach a provider', async t => {
  const fetcher = mockProviders(t);
  t.mock.method(console, 'error', () => {});
  for (const body of [{ ...input, funnel: undefined }, { ...input, funnel: 'unknown' }, { ...input, consent: false }, { ...input, phone: '123' }]) {
    const result = await handleSignup(request(body), env, fetcher);
    assert.equal(result.status, 400);
    assert.equal((await result.json()).checkoutAllowed, undefined);
  }
  const shared = { ...env, RESPONDER_LIST_IDS: { reading: '122801', 'test-funnel': '122801' } };
  const result = await handleSignup(request(), shared, fetcher);
  assert.equal(result.status, 503);
  assert.equal((await result.json()).checkoutAllowed, undefined);
  assert.equal(fetcher.mock.callCount(), 0);
});

test('Turnstile verifies the specific funnel before checkout or Responder calls', async t => {
  const fetcher = mockProviders(t, { action: 'signup_test-funnel' });
  const result = await handleSignup(request(), env, fetcher);
  assert.equal(result.status, 400);
  assert.deepEqual(await result.json(), { ok: false, error: 'verification_failed' });
  assert.equal(fetcher.mock.callCount(), 1);
});

test('verified submissions can proceed to checkout on duplicates, upstream errors, and timeouts', async t => {
  t.mock.method(console, 'error', () => {});
  const cases = [
    [() => Response.json({ duplicate: true }), 409, 'duplicate'],
    [() => new Response(null, { status: 503 }), 502, 'upstream_error'],
    [() => { throw new DOMException('Timed out', 'TimeoutError'); }, 502, 'upstream_error'],
  ];
  for (const [subscriber, status, error] of cases) {
    const fetcher = mockProviders(t, { subscriber });
    const result = await handleSignup(request(), env, fetcher);
    assert.equal(result.status, status);
    assert.deepEqual(await result.json(), { ok: false, error, checkoutAllowed: true });
  }
});

test('only the reading course Cardcom URL receives normalized contact details and attribution', () => {
  const href = 'https://secure.cardcom.solutions/EA/EA5/bTTx0BGcMEqeDCr0cVizMg/PaymentSP';
  const landing = new URL(`${origin}/landing/reading/?utm_source=search&preview=private&subscribers_name=untrusted`);
  const template = readingCheckoutUrl(withCheckoutAttribution(`${href}?subscribers_name=stale&product=reading#pay`, landing));
  assert.equal(new URL(template).searchParams.has('subscribers_name'), false);
  const destination = new URL(readingCheckoutUrl(template, normalizeSignupDetails(details)));
  assert.deepEqual(Object.fromEntries(destination.searchParams), {
    product: 'reading', utm_source: 'search', subscribers_email: details.email, subscribers_name: 'מלי כהן', subscribers_phone: '0501234567',
  });
  assert.equal(destination.hash, '#pay');
  for (const invalid of [href.replace('https:', 'http:'), href.replace('bTTx0BGcMEqeDCr0cVizMg', 'other'), href.replace('cardcom.solutions', 'cardcom.solutions.example.com')]) {
    assert.equal(readingCheckoutUrl(invalid, details), undefined);
  }
});
