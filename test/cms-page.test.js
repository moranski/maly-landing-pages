// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCmsPage } from '../src/lib/cms-page.ts';
import { plainTextToRichText } from '../src/lib/landing/rich-text.ts';

test('generic CMS pages support their entry locale and safe rich content without landing blocks', () => {
  const data = { title: 'test-ssss', content: plainTextToRichText(['this is a testy test']), agent_context: 'PRIVATE' };
  const { page, diagnostics } = normalizeCmsPage(data, 'en');
  assert.deepEqual(diagnostics, []);
  assert.equal(page.title, data.title); assert.equal(page.body[0].children[0].text, 'this is a testy test');
  assert.equal(page.lang, 'en'); assert.equal(page.dir, 'ltr');
  assert.equal(normalizeCmsPage(data, 'he').page.dir, 'rtl');
  assert.equal(normalizeCmsPage(data, 'en-GB').page.dir, 'ltr');
  assert.equal(normalizeCmsPage(data, 'ar').page.dir, 'rtl');
  assert.ok(!JSON.stringify(page).includes('PRIVATE'));
});

test('generic pages validate titles and render title-only pages while rejecting unsupported content', () => {
  assert.equal(normalizeCmsPage({ title: ' ' }, 'he').page, undefined);
  assert.deepEqual(normalizeCmsPage({ title: 'Title' }, 'he').page.body, []);
  const unsafe = normalizeCmsPage({ title: 'Title', content: [{ _type: 'html', html: '<script>PRIVATE</script>' }] }, 'invalid<script>');
  assert.deepEqual(unsafe.page.body, []);
  assert.equal(unsafe.page.lang, 'he');
  assert.ok(unsafe.diagnostics.some(d => d.code === 'unsupported_rich_text_type'));
});
