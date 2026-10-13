// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { normalizeLandingPage, destination } from '../src/lib/landing/normalize.ts';
import { migrateLandingLayout } from '../src/lib/landing/migrate-layout.ts';
const hero = () => ({ _type: 'landing_hero', _version: 2, _key: 'hero', title: 'Heading', subtitle: 'Subtitle', body: [{ text: 'Body' }], cta_label: 'Join', cta_href: '#offer', visual_image: '/image.webp', visual_alt: 'Lesson', visual_title: 'Preview', visual_caption: 'Caption' });
const section = (extra = {}) => ({ _type: 'landing_content_section', _version: 2, _key: 'section', title: 'Section', background: 'שנהב', paragraph_format: 'paragraphs', paragraphs: [{ text: 'Text' }], ...extra });
const normalize = (...blocks) => normalizeLandingPage({ title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', layout: [hero(), ...blocks] });

test('all paragraph formats work for arbitrary IDs without changing prose', () => {
  for (const format of ['paragraphs', 'bullets', 'checklist', 'cross_list']) {
    const texts = ['✓ literal', '× literal', '✕ literal', '  whitespace around prose  '];
    const { page, diagnostics } = normalize(section({ id: 'unrelated', paragraph_format: format, paragraphs: texts.map(text => ({ text })) }));
    assert.deepEqual(diagnostics, []);
    assert.equal(page.blocks[0].paragraphFormat, format);
    assert.deepEqual(page.blocks[0].paragraphs, texts);
  }
});

test('gallery, page slug, author spelling and preview cannot select styling', () => {
  const plain = normalize(section()).page.blocks[0];
  const gallery = normalize(section({ gallery: [{ image: '/photo.webp', alt: 'Photo' }] })).page.blocks[0];
  assert.equal(plain.surface, gallery.surface);
  assert.equal(gallery.paragraphFormat, plain.paragraphFormat);
  const base = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', layout: [hero(), section()] };
  assert.deepEqual(normalizeLandingPage({ ...base, slug: 'reading', preview: true }), normalizeLandingPage({ ...base, slug: 'other', preview: false }));
  for (const attribution of ['Alice', 'Bob', '   ', undefined]) {
    const testimonial = normalize({ _type: 'landing_testimonials', _version: 2, title: 'Quotes', testimonials: [{ quote: 'Quote', attribution }] }).page.blocks[0].items[0];
    assert.equal(testimonial.attribution, attribution?.trim() ? attribution : undefined);
    assert.equal('color' in testimonial, false);
  }
});

test('blank optional fields, invalid images, CTAs and repeated items are omitted', () => {
  const { page, diagnostics } = normalize(section({ kicker: '  ', profile_image: '/photo.webp', profile_alt: '', cards: [{ title: ' ', body: 'Secret' }, { title: 'Valid', body: 'Body' }], gallery: [{ image: 'javascript:alert(1)', alt: 'Alt' }, { image: '/valid.webp', alt: 'Alt', caption: '  ' }], faq_items: [{ question: 'Valid', answer: ' ' }] }), { _type: 'landing_offer', _version: 2, title: 'Offer', body: 'Body', includes: [{ text: 'Item' }], submit_label: 'Pay', checkout_url: 'http://example.com', kicker: ' ' });
  const s = page.blocks[0];
  assert.equal(s.kicker, undefined); assert.equal(s.profile, undefined);
  assert.equal(s.cards.length, 1); assert.equal(s.gallery.length, 1); assert.equal(s.gallery[0].caption, undefined); assert.deepEqual(s.faq, []);
  assert.equal(page.blocks[1].cta, undefined);
  assert.ok(diagnostics.every(d => d.path && d.code));
  assert.ok(diagnostics.some(d => d.blockKey === 'section'));
  assert.ok(!JSON.stringify(diagnostics).includes('Secret'));
});

test('required content failures omit blocks and page metadata failures reject the page', () => {
  assert.equal(normalize(section({ title: ' ' })).page.blocks.length, 0);
  assert.equal(normalize(section({ paragraphs: [], cards: [], gallery: [], faq_items: [] })).page.blocks.length, 0);
  assert.equal(normalize({ _type: 'landing_offer', _version: 2, title: 'Offer', body: ' ', includes: [] }).page.blocks.length, 0);
  assert.equal(normalize({ _type: 'landing_testimonials', _version: 2, title: 'Quotes', testimonials: [{ quote: '' }] }).page.blocks.length, 0);
  assert.equal(normalizeLandingPage({ title: ' ', description: 'Description', lang: 'he', dir: 'rtl' }).page, undefined);
  const h = hero(); h.cta_href = ''; h.visual_image = { id: 'unresolved' };
  const result = normalizeLandingPage({ title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', layout: [h] });
  assert.equal(result.page.hero.primaryCta, undefined); assert.equal(result.page.hero.visual, undefined);
});

test('hero ordering, multiplicity, unsupported versions and malformed blocks are diagnosed', () => {
  const metadata = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl' };
  const misplaced = normalizeLandingPage({ ...metadata, layout: [section(), hero()] });
  assert.equal(misplaced.page.hero, undefined);
  assert.ok(misplaced.diagnostics.some(d => d.code === 'hero_contract'));
  const duplicate = normalize(hero()); assert.ok(duplicate.page.hero); assert.ok(duplicate.diagnostics.some(d => d.code === 'misplaced_or_duplicate_hero'));
  const unknown = normalize(section({ _version: 999 }), { _type: 'unknown' }, null);
  assert.equal(unknown.page.blocks.length, 0);
  assert.ok(unknown.diagnostics.some(d => d.code === 'unsupported_version'));
});

test('retained versions resolve declared tone only and never inspect content IDs', () => {
  for (const [tone, surface] of [['plain', 'ivory'], ['tinted', 'stone'], ['deep', 'navy'], ['unknown', 'ivory']]) {
    const block = normalize(section({ _version: 1, background: undefined, tone, id: 'why_it_didnt_work', gallery: [{ image: '/photo.webp', alt: 'Photo' }] })).page.blocks[0];
    assert.equal(block.surface, surface); assert.equal(block.paragraphFormat, 'paragraphs');
  }
});

test('normalization allowlists every nested field', () => {
  const result = normalize(section({ agent_context: 'PRIVATE', paragraphs: [{ text: 'Visible', agent_context: 'PRIVATE' }], cards: [{ title: 'Title', body: 'Body', password: 'PRIVATE' }] }));
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});

test('media dimensions survive normalization only as a valid numeric pair', () => {
  const img = { src: '/photo.webp', width: 364, height: 363, agent_context: 'PRIVATE' };
  const profile = normalize(section({ profile_image: img, profile_alt: 'Portrait' })).page.blocks[0].profile;
  assert.equal(profile.width, 364); assert.equal(profile.height, 363);
  assert.ok(!JSON.stringify(profile).includes('PRIVATE'));
  for (const invalid of [-1, 0, '364', 1.5, Infinity, NaN, undefined]) {
    const image = normalize(section({ profile_image: { ...img, width: invalid }, profile_alt: 'Portrait' })).page.blocks[0].profile;
    assert.equal('width' in image, false); assert.equal('height' in image, false);
  }
});

test('destinations reject executable, protocol-relative, malformed and empty URLs', () => {
  for (const href of ['', ' ', 'javascript:alert(1)', '//evil.example', '/\\evil.example', 'https://bad host', '#']) assert.equal(destination(href), undefined);
  assert.equal(destination('#offer'), '#offer'); assert.equal(destination('/reading#offer'), '/reading#offer');
  assert.equal(destination('https://example.com', true), 'https://example.com'); assert.equal(destination('#offer', true), undefined);
});

test('migration is idempotent and preserves keys, order and unrelated data', () => {
  const blocks = [hero(), section({ _version: 1, _key: 'reasons', tone: 'deep', background: undefined, paragraphs: [{ text: '✓ reason', custom: 'preserve' }] }), { _type: 'landing_offer', _version: 1, _key: 'offer', lead_endpoint: 'unused', consent_label: 'unused', checkout_url: 'https://example.com', custom: 'preserve' }];
  const migrated = migrateLandingLayout(blocks, 'reasons');
  assert.deepEqual(migrateLandingLayout(migrated, 'reasons'), migrated);
  assert.deepEqual(migrated.map(b => b._key), blocks.map(b => b._key));
  assert.equal(migrated[1].background, 'כחול כהה'); assert.equal(migrated[1].paragraph_format, 'cross_list'); assert.equal(migrated[1].paragraphs[0].text, 'reason'); assert.equal(migrated[1].paragraphs[0].custom, 'preserve');
  assert.equal('tone' in migrated[1], false); assert.equal('lead_endpoint' in migrated[2], false); assert.equal('consent_label' in migrated[2], false); assert.equal(migrated[2].custom, 'preserve');
});

test('components have one FAQ layout, fixed author color and no content placeholders', async () => {
  const read = path => readFile(new URL(path, import.meta.url), 'utf8');
  const renderer = await read('../src/components/landing/EmDashLandingPage.astro');
  const testimonials = await read('../src/components/landing/TestimonialsBlock.astro');
  const offer = await read('../src/components/landing/OfferBlock.astro');
  const route = await read('../src/pages/[slug].astro');
  assert.ok(renderer.includes('<FaqList')); assert.ok(!renderer.includes('presentation'));
  assert.ok(!renderer.includes('block.id ===')); assert.ok(!renderer.includes('.replace('));
  assert.ok(!testimonials.includes('colorForAuthor')); assert.ok(!testimonials.includes('שם לא צוין')); assert.ok(!testimonials.includes('ההודעה נקראה'));
  assert.ok(!offer.includes('missing-url')); assert.ok(!route.includes('slug ==='));
});


test('the MCP draft snapshot normalizes without diagnostics and carries only active fields', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../src/data/blocks-demo/reading-preview.json', import.meta.url), 'utf8'));
  const result = normalizeLandingPage(snapshot.page);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.page.hero);
  for (const block of snapshot.page.layout) {
    const schema = JSON.parse(await readFile(new URL(`../src/data/blocks-demo/${block._type}.json`, import.meta.url), 'utf8'));
    assert.equal(block._version, schema.version);
    const allowed = new Set(['_type', '_version', '_key', ...schema.fields.map(f => f.slug)]);
    assert.ok(Object.keys(block).every(k => allowed.has(k)));
  }
});
