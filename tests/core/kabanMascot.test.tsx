import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KabanMascot, BAULITO_ASSET_MAP, type BaulitoPose } from '../../src/ui/primitives/KabanMascot';

const POSES = Object.keys(BAULITO_ASSET_MAP) as BaulitoPose[];

describe('KabanMascot Primitive', () => {
  it('maps all 9 Figma poses to their exported assets', () => {
    expect(POSES).toHaveLength(9);
    for (const pose of POSES) {
      const html = renderToStaticMarkup(createElement(KabanMascot, { pose }));
      expect(html).toContain(`src="${BAULITO_ASSET_MAP[pose].src}"`);
    }
  });

  it('renders decorative by default with aria-hidden and empty alt', () => {
    const html = renderToStaticMarkup(createElement(KabanMascot, { variant: 'idle-sleep' }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('alt=""');
    expect(html).toContain('width="72"');
    expect(html).toContain('height="72"');
    expect(html).toContain('pointer-events-none');
  });

  it('exposes the label and drops aria-hidden when not decorative', () => {
    const html = renderToStaticMarkup(
      createElement(KabanMascot, { pose: 'vault-locked', size: 68, decorative: false })
    );
    expect(html).toContain(`alt="${BAULITO_ASSET_MAP['vault-locked'].label}"`);
    expect(html).not.toContain('aria-hidden');
    expect(html).toContain('width="68"');
    expect(html).toContain('height="68"');
  });

  it('keeps the legacy variant prop and the standalone default', () => {
    const alias = renderToStaticMarkup(createElement(KabanMascot, { variant: 'alert-peek', size: 48 }));
    expect(alias).toContain('src="/mascot/baulito-alert-peek.svg"');
    expect(alias).toContain('width="48"');
    const fallback = renderToStaticMarkup(createElement(KabanMascot, {}));
    expect(fallback).toContain('src="/mascot/baulito-standalone.svg"');
  });

  it('applies custom className cleanly to the image root', () => {
    const html = renderToStaticMarkup(
      createElement(KabanMascot, { variant: 'idle-sleep', className: 'custom-mascot-test' })
    );
    expect(html).toContain('custom-mascot-test');
    expect(html).toContain('select-none pointer-events-none object-contain shrink-0 custom-mascot-test');
  });
});
