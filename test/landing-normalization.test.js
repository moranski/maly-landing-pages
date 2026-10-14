// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { normalizeLandingPage, destination } from '../src/lib/landing/normalize.ts';
import { migrateLandingLayout } from '../src/lib/landing/migrate-layout.ts';
const hero = () => ({ _type: 'landing_hero', _version: 2, _key: 'hero', title: 'Heading', subtitle: 'Subtitle', body: [{ text: 'Body' }], cta_label: 'Join', cta_href: '#offer', visual_image: '/image.webp', visual_alt: 'Lesson', visual_title: 'Preview', visual_caption: 'Caption' });
const section = (extra = {}) => ({ _type: 'landing_content_section', _version: 2, _key: 'section', title: 'Section', background: 'שנהב', paragraph_format: 'paragraphs', paragraphs: [{ text: 'Text' }], ...extra });
const normalize = (...blocks) => normalizeLandingPage({ title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', layout: [hero(), ...blocks] });

test('section image placement uses only CMS choices and retains stacked legacy layouts', () => {
  for (const [choice, expected] of [[undefined, 'stacked'], ['', 'stacked'], ['תמונה מתחת לטקסט', 'stacked'], ['תמונה מימין, טקסט משמאל', 'image-right'], ['תמונה משמאל, טקסט מימין', 'image-left']]) {
    const result = normalize(section({ media_layout: choice, gallery: [{ image: '/photo.webp', alt: 'Photo' }] }));
    assert.equal(result.page.blocks[0].mediaLayout, expected);
    assert.deepEqual(result.diagnostics, []);
  }
  for (const invalid of ['image-right', '__proto__', 'position:fixed', { css: 'PRIVATE' }]) {
    const result = normalize(section({ media_layout: invalid }));
    assert.equal(result.page.blocks[0].mediaLayout, 'stacked');
    assert.ok(result.diagnostics.some(d => d.path.endsWith('.media_layout') && d.code === 'invalid_choice'));
    assert.ok(!JSON.stringify(result.page).includes('PRIVATE'));
  }
});

test('CMS brand logo uses media alt and dimensions without leaking internal fields', () => {
  const data = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', layout: [hero()] };
  const logo = { id: 'logo', alt: 'Brand logo', width: 450, height: 440, meta: { storageKey: 'logo.webp', agent_context: 'PRIVATE' } };
  const valid = normalizeLandingPage({ ...data, brand_logo: logo });
  assert.deepEqual(valid.page.brandLogo, { src: '/_emdash/api/media/file/logo.webp', alt: 'Brand logo', width: 450, height: 440 });
  assert.deepEqual(valid.diagnostics, []);
  assert.ok(!JSON.stringify(valid.page).includes('PRIVATE'));
  assert.equal(normalizeLandingPage(data).page.brandLogo, undefined);
  for (const invalid of [{ ...logo, alt: ' ' }, { src: 'javascript:alert(1)', alt: 'Logo' }]) {
    const result = normalizeLandingPage({ ...data, brand_logo: invalid });
    assert.equal(result.page.brandLogo, undefined);
    assert.ok(result.diagnostics.some(d => d.path === 'brand_logo' && d.code === 'invalid_image'));
  }
});

test('personal appeal portrait requires a safe source and alt and stays optional for existing pages', () => {
  const final = { _type: 'landing_final_cta', _version: 2, heading: 'Final', paragraphs: [{ text: 'Body' }], cta_label: 'Join', cta_href: '#offer' };
  const img = { src: '/portrait.webp', width: 668, height: 811, agent_context: 'PRIVATE' };
  const valid = normalize({ ...final, image: img, image_alt: 'Portrait' });
  assert.deepEqual(valid.page.blocks[0].image, { src: '/portrait.webp', alt: 'Portrait', width: 668, height: 811 });
  assert.deepEqual(valid.diagnostics, []);
  assert.equal(normalize(final).page.blocks[0].image, undefined);
  for (const extra of [{ image: img }, { image: img, image_alt: ' ' }, { image: 'javascript:alert(1)', image_alt: 'Portrait' }]) {
    const invalid = normalize({ ...final, ...extra });
    assert.equal(invalid.page.blocks[0].image, undefined);
    assert.ok(invalid.diagnostics.some(d => d.code === 'invalid_image'));
  }
});

test('brand copy comes from CMS strings and legacy pages have no invented brand', () => {
  const data = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', layout: [hero()] };
  const { page } = normalizeLandingPage({ ...data, brand_name: 'מותג אחר', brand_tagline: 'תיאור מהתוכן', agent_context: 'PRIVATE' });
  assert.equal(page.brandName, 'מותג אחר');
  assert.equal(page.brandTagline, 'תיאור מהתוכן');
  assert.ok(!JSON.stringify(page).includes('PRIVATE'));
  for (const invalid of [undefined, null, '', '  ', { text: 'PRIVATE' }]) {
    const legacy = normalizeLandingPage({ ...data, brand_name: invalid, brand_tagline: invalid });
    assert.equal(legacy.page.brandName, undefined);
    assert.equal(legacy.page.brandTagline, undefined);
    assert.deepEqual(legacy.diagnostics, []);
  }
});

test('CTA presets are allowlisted across every action and preserve legacy defaults', () => {
  const metadata = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl' };
  for (const [choice, style] of [[undefined, undefined], ['ברירת מחדל', undefined], ['כתום', 'orange'], ['כתום אדום', 'red-orange'], ['כחול כהה', 'navy'], ['מסגרת כחולה', 'outline'], ['לבן', 'white']]) {
    for (const version of [1, 2]) {
      const layout = [
        { ...hero(), _version: version, cta_style: choice },
        { _type: 'landing_offer', _version: version, title: 'Offer', body: 'Body', includes: [{ text: 'Item' }], submit_label: 'Pay', checkout_url: 'https://example.com', cta_style: choice },
        { _type: 'landing_final_cta', _version: version, heading: 'Final', paragraphs: [{ text: 'Body' }], cta_label: 'Join', cta_href: '#offer', cta_style: choice },
      ];
      const { page, diagnostics } = normalizeLandingPage({ ...metadata, layout });
      assert.deepEqual(diagnostics, []);
      for (const cta of [page.hero.primaryCta, ...page.blocks.map(b => b.cta)]) {
        assert.equal(cta.style, style);
        assert.equal(Object.hasOwn(cta, 'style'), style !== undefined);
      }
    }
  }
  for (const invalid of ['__proto__', 'constructor', 'background: red', {}, 123]) {
    const { page, diagnostics } = normalizeLandingPage({ ...metadata, layout: [{ ...hero(), cta_style: invalid }] });
    assert.equal(page.hero.primaryCta.style, undefined);
    assert.ok(diagnostics.some(d => d.path === 'layout[0].cta_style' && d.code === 'invalid_choice'));
  }
});

test('page CTA default is inherited unless the block selects its own preset', () => {
  const metadata = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl', cta_style: 'כתום אדום' };
  const offer = { _type: 'landing_offer', _version: 2, title: 'Offer', body: 'Body', includes: [{ text: 'Item' }], submit_label: 'Pay', checkout_url: 'https://example.com' };
  const final = { _type: 'landing_final_cta', _version: 2, heading: 'Final', paragraphs: [{ text: 'Body' }], cta_label: 'Join', cta_href: '#offer', cta_style: 'כחול כהה' };
  for (const inherited of [undefined, null, '', 'ברירת מחדל']) {
    const { page, diagnostics } = normalizeLandingPage({ ...metadata, layout: [{ ...hero(), cta_style: inherited }, { ...offer, cta_style: inherited }, final] });
    assert.deepEqual(diagnostics, []);
    assert.equal(page.hero.primaryCta.style, 'red-orange');
    assert.equal(page.blocks[0].cta.style, 'red-orange');
    assert.equal(page.blocks[1].cta.style, 'navy');
  }
  const invalidPage = normalizeLandingPage({ ...metadata, cta_style: '__proto__', layout: [hero()] });
  assert.equal(invalidPage.page.hero.primaryCta.style, undefined);
  assert.ok(invalidPage.diagnostics.some(d => d.path === 'cta_style' && d.code === 'invalid_choice'));
  const invalidBlock = normalizeLandingPage({ ...metadata, layout: [{ ...hero(), cta_style: 'arbitrary CSS' }] });
  assert.equal(invalidBlock.page.hero.primaryCta.style, 'red-orange');
  assert.ok(invalidBlock.diagnostics.some(d => d.path === 'layout[0].cta_style' && d.code === 'invalid_choice'));
});

test('all paragraph formats work for arbitrary IDs without changing prose', () => {
  for (const format of ['paragraphs', 'bullets', 'checklist', 'cross_list']) {
    const texts = ['✓ literal', '× literal', '✕ literal', '  whitespace around prose  '];
    const { page, diagnostics } = normalize(section({ id: 'unrelated', paragraph_format: format, paragraphs: texts.map(text => ({ text })) }));
    assert.deepEqual(diagnostics, []);
    assert.equal(page.blocks[0].listStyle, ['checklist', 'cross_list'].includes(format) ? format : 'standard');
    assert.equal(page.blocks[0].body[0].listItem, format === 'paragraphs' ? undefined : 'bullet');
    assert.deepEqual(page.blocks[0].body.map(b => b.children.map(s => s.text).join('')), texts);
  }
});

test('gallery, page slug, author spelling and preview cannot select styling', () => {
  const plain = normalize(section()).page.blocks[0];
  const gallery = normalize(section({ gallery: [{ image: '/photo.webp', alt: 'Photo' }] })).page.blocks[0];
  assert.equal(plain.surface, gallery.surface);
  assert.equal(gallery.listStyle, plain.listStyle);
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
    assert.equal(block.surface, surface); assert.equal(block.listStyle, 'standard'); assert.equal(block.body[0].listItem, undefined);
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
