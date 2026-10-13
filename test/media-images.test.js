// Co-authored-by: Codex <codex@openai.com>
import assert from 'node:assert/strict';
import test from 'node:test';
import { mediaImageUrl, responsiveMediaImage, landingBackgroundStyle } from '../src/lib/landing/media-images.ts';

const path = '/_emdash/api/media/file/01M3PD0EF0J5H8GPARHVHHBC4C.webp';
const origin = 'https://maly-landing-pages.moranski.workers.dev';

test('relative and known-site CMS images use the same bounded EmDash transform', () => {
  const relative = mediaImageUrl(path, 352, true);
  assert.equal(relative, mediaImageUrl(origin + path, 352, true));
  const url = new URL(relative, origin);
  assert.equal(url.pathname, '/_image');
  assert.equal(url.searchParams.get('href'), path);
  assert.equal(url.searchParams.get('w'), '352');
  assert.equal(url.searchParams.get('f'), 'webp');
  assert.equal(url.searchParams.get('q'), '85');
});

test('development, external sources and non-raster files remain unchanged', () => {
  assert.deepEqual(responsiveMediaImage(origin + path, [168, 336], '168px', false), { src: origin + path });
  for (const src of ['/images/blocks-demo/lesson.svg', 'https://example.com' + path, '//example.com' + path, path + '?v=2', path + '#fragment', path.replace('.webp', '.svg'), path.replace('/file/', '/file/../'), '/\\example.com' + path]) {
    assert.deepEqual(responsiveMediaImage(src, [168, 336], '168px', true), { src });
  }
  for (const width of [0, -1, 1.5, 4001, NaN, Infinity]) assert.equal(mediaImageUrl(path, width, true), path);
});

test('responsive candidates are sorted, deduplicated and carry their actual widths', () => {
  const result = responsiveMediaImage(path, [336, 168, 336, 0, 4001], '168px', true, 382);
  assert.equal(result.sizes, '168px');
  const candidates = result.srcset.split(', ');
  assert.equal(candidates.length, 2);
  candidates.forEach((candidate, i) => {
    const [src, descriptor] = candidate.split(' ');
    const width = [168, 336][i];
    assert.equal(new URL(src, origin).searchParams.get('w'), String(width));
    assert.equal(descriptor, `${width}w`);
  });
  assert.deepEqual(responsiveMediaImage(path, [], '168px', true), { src: path });
});

test('small originals cap every descriptor and unknown dimensions omit srcset', () => {
  const result = responsiveMediaImage(path, [224, 320, 416, 640, 832], '416px', true, 364);
  assert.ok(result.srcset.endsWith('364w'));
  assert.ok(!result.srcset.includes('416w'));
  const tiny = responsiveMediaImage(path, [224, 320], '416px', true, 160);
  assert.ok(tiny.srcset.endsWith('160w'));
  const unknown = responsiveMediaImage(path, [224, 320], '416px', true);
  assert.equal('srcset' in unknown, false);
  assert.equal(new URL(unknown.src, origin).searchParams.get('w'), '320');
});

test('the background preserves the 2x tile resolution and avoids PNG delivery in production', () => {
  assert.match(landingBackgroundStyle(true), /w=724&f=webp&q=65/);
  assert.match(landingBackgroundStyle(false), /https:\/\/.*\.png/);
});

test('compression overrides are bounded and do not change the default for lesson images', () => {
  assert.equal(new URL(mediaImageUrl(path, 724, true, 65), origin).searchParams.get('q'), '65');
  for (const quality of [0, -1, 101, 65.5, NaN, Infinity]) {
    assert.equal(new URL(mediaImageUrl(path, 724, true, quality), origin).searchParams.get('q'), '85');
  }
});
