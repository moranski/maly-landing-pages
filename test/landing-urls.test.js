// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { landingPagePath, withCheckoutAttribution } from '../src/lib/landing/urls.ts';

test('landing redirects use the shared prefix and keep slugs inside a single path segment', () => {
  assert.equal(landingPagePath('reading'), '/landing/reading/');
  assert.equal(landingPagePath('english-reading'), '/landing/english-reading/');
  assert.equal(landingPagePath('עברית'), '/landing/%D7%A2%D7%91%D7%A8%D7%99%D7%AA/');
  for (const slug of ['a/b', 'a?b', 'a#b', '//evil.example']) {
    const url = new URL(landingPagePath(slug), 'https://example.com');
    assert.equal(url.origin, 'https://example.com');
    assert.equal(url.pathname.split('/').length, 4);
    assert.equal(url.search, ''); assert.equal(url.hash, '');
  }
});

test('checkout receives campaign and click identifiers while retaining payment parameters and fragment', () => {
  const landing = new URL('https://maly.example/landing/reading/?utm_source=facebook&utm_campaign=%D7%A7%D7%A8%D7%99%D7%90%D7%94&utm_content=a%26b%2Bc&fbp=browser&fbc=click&_fbp=cookie-browser&_fbc=cookie-click&fbclid=meta&gclid=google&gbraid=braid&wbraid=web&msclkid=bing&ttclid=tiktok&dclid=display&preview=secret&email=private%40example.com');
  const checkout = new URL(withCheckoutAttribution('https://pay.example/buy?product=reading&utm_source=old#payment', landing));
  assert.equal(checkout.origin, 'https://pay.example');
  assert.equal(checkout.pathname, '/buy');
  assert.equal(checkout.hash, '#payment');
  assert.equal(checkout.searchParams.get('product'), 'reading');
  for (const [key, value] of landing.searchParams) {
    assert.equal(checkout.searchParams.get(key), ['preview', 'email'].includes(key) ? null : value);
  }
  assert.equal(checkout.searchParams.getAll('utm_source').length, 1);
});

test('checkout attribution ignores empty values and uses the first non-empty duplicate', () => {
  const landing = new URL('https://maly.example/landing/reading/?utm_source=&utm_source=facebook&utm_source=google&fbc=%20&fbp=');
  const checkout = new URL(withCheckoutAttribution('https://pay.example/?fbc=existing', landing));
  assert.equal(checkout.searchParams.get('utm_source'), 'facebook');
  assert.equal(checkout.searchParams.get('fbc'), 'existing');
  assert.equal(checkout.searchParams.has('fbp'), false);
});

test('attribution preserves links when absent and leaves anchors and non-web links intact', () => {
  const plain = new URL('https://maly.example/landing/reading/?preview=secret');
  const tracked = new URL('https://maly.example/landing/reading/?utm_source=facebook');
  const href = 'https://pay.example/buy?product=a%20b#payment';
  assert.equal(withCheckoutAttribution(href, plain), href);
  for (const link of ['#offer', 'https://maly.example/landing/reading/#offer', 'mailto:hello@example.com', 'tel:123', 'javascript:alert(1)', 'http://[invalid']) {
    assert.equal(withCheckoutAttribution(link, tracked), link);
  }
  const relative = new URL(withCheckoutAttribution('/checkout?product=reading', tracked));
  assert.equal(relative.pathname, '/checkout');
  assert.equal(relative.searchParams.get('utm_source'), 'facebook');
});
