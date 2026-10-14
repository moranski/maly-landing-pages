// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeRichText, plainTextToRichText } from '../src/lib/landing/rich-text.ts';
import { migrateRichTextLayout } from '../src/lib/landing/migrate-rich-text.ts';
import { normalizeLandingPage, destination } from '../src/lib/landing/normalize.ts';
const text = (value, extra = {}) => ({ ...plainTextToRichText([value])[0], ...extra });
const metadata = { title: 'Page', description: 'Description', lang: 'he', dir: 'rtl' };
const hero = { _type: 'landing_hero', _version: 3, _key: 'hero', title: 'Heading', subtitle: 'Subtitle', body: [text('Body')], cta_label: 'Join', cta_href: '#offer', visual_image: '/image.webp', visual_alt: 'Lesson', visual_title: 'Preview', visual_caption: 'Caption' };
const section = extra => ({ _type: 'landing_content_section', _version: 3, _key: 'section', title: 'Section', background: 'שנהב', list_style: 'standard', ...extra });
const normalize = (...layout) => normalizeLandingPage({ ...metadata, layout: [hero, ...layout] });

test('rich prose retains supported structure and strips every non-display field', () => {
  const issues = [];
  const source = [text('Words', { style: 'h3', agent_context: 'PRIVATE', markDefs: [{ _type: 'link', _key: 'link', href: '#offer', secret: 'PRIVATE' }], children: [{ _type: 'span', _key: 'a', text: 'Bold', marks: ['strong'], secret: 'PRIVATE' }, { _type: 'span', _key: 'b', text: ' and linked', marks: ['em', 'link'] }] }), text('Subheading', { style: 'h4' }), text('Quote', { style: 'blockquote' }), text('Bullet', { listItem: 'bullet', level: 2 }), text('Number', { listItem: 'number', level: 1 })];
  const result = normalizeRichText(source, (...issue) => issues.push(issue), destination);
  assert.deepEqual(issues, []);
  assert.equal(result[0].children[0].marks[0], 'strong');
  assert.deepEqual(result[0].markDefs, [{ _type: 'link', _key: 'link', href: '#offer' }]);
  assert.equal(result[1].style, 'h4'); assert.equal(result[2].style, 'blockquote');
  assert.equal(result[3].level, 2); assert.equal(result[4].listItem, 'number');
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.equal(source[0].agent_context, 'PRIVATE');
});

test('unsupported types and unsafe links never become active markup and diagnoses contain no values', () => {
  const issues = [];
  const body = [ { _type: 'html', html: '<script>PRIVATE</script>' }, text('Safe words', { style: 'h1', css: 'PRIVATE', markDefs: [{ _type: 'link', _key: 'bad', href: 'javascript:PRIVATE' }, { _type: 'link', _key: 'good', href: '/reading' }], children: [{ _type: 'span', text: '<script>literal</script>', marks: ['bad', 'good', 'color', 'strong'] }, { _type: 'iframe', src: 'PRIVATE' }] }) ];
  const result = normalizeRichText(body, (...issue) => issues.push(issue), destination);
  assert.equal(result.length, 1); assert.equal(result[0].style, 'normal');
  assert.deepEqual(result[0].children[0].marks, ['good', 'strong']);
  assert.equal(result[0].children[0].text, '<script>literal</script>');
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  assert.ok(issues.length >= 4); assert.ok(!JSON.stringify(issues).includes('PRIVATE'));
  for (const href of ['//evil.example', '/\\evil.example', 'data:text/html,test', 'http://example.com']) {
    assert.equal(normalizeRichText([text('Body', { markDefs: [{ _type: 'link', _key: 'x', href }] })], () => {}, destination)[0].markDefs.length, 0);
  }
});

test('empty rich text fails required bodies while structural-only sections stay useful', () => {
  const empty = [text('  ')];
  assert.equal(normalize(section({ body: empty })).page.blocks.length, 0);
  assert.equal(normalize(section({ body: empty, cards: [{ title: 'Card', body: 'Text' }] })).page.blocks.length, 1);
  assert.equal(normalize(section({ gallery: [{ image: '/photo.webp', alt: 'Photo' }] })).page.blocks.length, 1);
  for (const body of [undefined, [], empty, 'plaintext', [{ _type: 'image' }]]) {
    const result = normalizeLandingPage({ ...metadata, layout: [{ ...hero, body }] });
    assert.equal(result.page.hero, undefined);
    assert.ok(result.diagnostics.some(d => d.path === 'layout[0].body' && d.code === 'required'));
    const final = normalize({ _type: 'landing_final_cta', _version: 3, heading: 'Final', body, cta_label: 'Join', cta_href: '#offer' });
    assert.equal(final.page.blocks.length, 0);
    const offer = normalize({ _type: 'landing_offer', _version: 3, title: 'Offer', body, includes: [{ text: 'Item' }], submit_label: 'Pay', checkout_url: 'https://example.com' });
    assert.equal(offer.page.blocks.length, 0);
  }
});

test('list style does not convert paragraphs or override numbered lists', () => {
  const body = [text('Paragraph'), text('Bullet', { listItem: 'bullet', level: 1 }), text('Number', { listItem: 'number', level: 1 })];
  for (const list_style of ['standard', 'checklist', 'cross_list']) {
    const result = normalize(section({ body, list_style }));
    assert.deepEqual(result.diagnostics, []);
    assert.deepEqual(result.page.blocks[0].body, body);
    assert.equal(result.page.blocks[0].listStyle, list_style);
  }
  assert.equal(normalize(section({ body, list_style: 'arbitrary CSS' })).page.blocks.length, 0);
});

test('migration preserves exact text, keys, order, media, other blocks and is idempotent', () => {
  const literal = ['**literal Markdown**', '<b>literal HTML</b>', '  Text with spaces  '];
  const source = [ { ...hero, _version: 2, body: literal.map(text => ({ text })) }, { ...section({ paragraphs: literal.map(text => ({ text })), paragraph_format: 'cross_list', profile_image: { id: 'portrait' }, custom: 'preserved' }), _version: 2, body: undefined, list_style: undefined }, { _type: 'landing_offer', _version: 2, _key: 'offer', body: 'Offer\nwith line break', includes: [{ text: 'Item' }] }, { _type: 'landing_final_cta', _version: 2, _key: 'final', paragraphs: [{ text: 'Personal' }], image: { id: 'portrait' }, signature: 'Name' }, { _type: 'landing_testimonials', _version: 2, _key: 'quote', testimonials: [{ quote: 'Unchanged' }] } ];
  const migrated = migrateRichTextLayout(source);
  assert.deepEqual(migrateRichTextLayout(migrated), migrated);
  assert.deepEqual(migrated.map(b => b._key), source.map(b => b._key));
  assert.deepEqual(migrated[0].body.map(b => b.children[0].text), literal);
  assert.deepEqual(migrated[1].body.map(b => b.children[0].text), literal);
  assert.equal(migrated[1].list_style, 'cross_list');
  assert.ok(migrated[1].body.every(b => b.listItem === 'bullet'));
  assert.equal(migrated[1].custom, 'preserved');
  assert.deepEqual(migrated[1].profile_image, source[1].profile_image);
  assert.equal(migrated[2].body[0].children[0].text, source[2].body);
  assert.deepEqual(migrated[3].image, source[3].image);
  assert.deepEqual(migrated[4], source[4]);
  assert.ok(!('paragraphs' in migrated[1])); assert.ok(!('paragraph_format' in migrated[1]));
  assert.equal(source[0]._version, 2);
  assert.throws(() => migrateRichTextLayout([{ ...source[0], body: [{ text: null }] }]));
});
