// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { landingPagePath } from '../src/lib/landing/urls.ts';

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
