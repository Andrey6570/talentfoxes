// Renders the Talent Foxes launcher icons with Chromium (needs: npm i -D playwright).
// Usage: node tools/make_icons.cjs android/app/src/main/res docs/icons
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [RES, OUT] = process.argv.slice(2);

// the fox head, drawn in the same style as the in-app pet (coordinates of a 200 x 200 box, head only)
const FOX = (main = '#FF8A3D', dark = '#D9621A', cream = '#FFF3E0', ink = '#2b2233') => `
  <path d="M54 72 L50 20 L92 52 Z" fill="${main}"/><path d="M60 62 L58 34 L80 52 Z" fill="${dark}"/>
  <path d="M146 72 L150 20 L108 52 Z" fill="${main}"/><path d="M140 62 L142 34 L120 52 Z" fill="${dark}"/>
  <ellipse cx="100" cy="92" rx="54" ry="45" fill="${main}"/>
  <ellipse cx="76" cy="110" rx="28" ry="21" fill="${cream}"/><ellipse cx="124" cy="110" rx="28" ry="21" fill="${cream}"/>
  <circle cx="64" cy="106" r="8" fill="#FF6FA5" opacity=".45"/><circle cx="136" cy="106" r="8" fill="#FF6FA5" opacity=".45"/>
  <path d="M70 90 Q80 78 90 90" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M110 90 Q120 78 130 90" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round"/>
  <ellipse cx="100" cy="102" rx="7" ry="5" fill="${ink}"/>
  <path d="M90 112 Q100 126 110 112" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>`;
const STAR = (fill = '#FFC83D', stroke = '#B7791F') => `<path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>`;

// 1024-unit artwork; content stays inside the central circle (adaptive-icon safe zone, 66%)
const ART = (color = true) => `
  <g transform="translate(512 585) scale(4.35) translate(-100 -80)">${color ? FOX() : FOX('#000', '#000', '#000', '#fff').replace(/fill="#000"/g, 'fill="#000"')}</g>
  <g transform="translate(512 262) rotate(-8) scale(7.4) translate(-12 -12)">${color ? STAR() : STAR('#000', '#000')}</g>`;
const BG = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C5CFF"/><stop offset="1" stop-color="#4B2FE0"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#g)"/><rect width="1024" height="1024" fill="url(#glow)"/>`;
const wrap = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${inner}</svg>`;
const svgs = {
  foreground: wrap(ART(true)),
  mono: wrap(ART(false)),
  square: wrap(`<clipPath id="c"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#c)">${BG}${ART(true)}</g>`),
  round: wrap(`<clipPath id="c"><circle cx="512" cy="512" r="512"/></clipPath><g clip-path="url(#c)">${BG}<g transform="translate(512 512) scale(1.08) translate(-512 -512)">${ART(true)}</g></g>`),
  full: wrap(`${BG}${ART(true)}`)
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [k, v] of Object.entries(svgs)) fs.writeFileSync(path.join(OUT, `icon-${k}.svg`), v);
  const b = await chromium.launch(), p = await b.newPage();
  const render = async (svg, size, file) => {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</body></html>`);
    await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  };
  const dens = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
  for (const [d, [legacy, adaptive]] of Object.entries(dens)) {
    const dir = path.join(RES, `mipmap-${d}`); fs.mkdirSync(dir, { recursive: true });
    await render(svgs.square, legacy, path.join(dir, 'ic_launcher.png'));
    await render(svgs.round, legacy, path.join(dir, 'ic_launcher_round.png'));
    await render(svgs.foreground, adaptive, path.join(dir, 'ic_launcher_foreground.png'));
    await render(svgs.mono, adaptive, path.join(dir, 'ic_launcher_monochrome.png'));
  }
  await render(svgs.square, 512, path.join(OUT, 'icon-512.png'));
  await render(svgs.full, 512, path.join(OUT, 'icon-512-full.png'));
  await render(svgs.square, 192, path.join(OUT, 'icon-192.png'));
  await render(svgs.square, 64, path.join(OUT, 'favicon.png'));
  await b.close();
})();
