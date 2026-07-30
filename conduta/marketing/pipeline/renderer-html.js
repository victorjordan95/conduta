const fs = require('node:fs');
const path = require('node:path');

const BRAND_LOGO_PATH = path.join(__dirname, '..', 'assets', 'conduta-logo.png');
const BRAND_LOGO_DATA_URI = fs.existsSync(BRAND_LOGO_PATH)
  ? `data:image/png;base64,${fs.readFileSync(BRAND_LOGO_PATH).toString('base64')}`
  : '';
const BRAND_LOGO_TRANSPARENT_PATH = path.join(__dirname, '..', 'assets', 'conduta-logo-transparent.png');
const BRAND_LOGO_TRANSPARENT_DATA_URI = fs.existsSync(BRAND_LOGO_TRANSPARENT_PATH)
  ? `data:image/png;base64,${fs.readFileSync(BRAND_LOGO_TRANSPARENT_PATH).toString('base64')}`
  : BRAND_LOGO_DATA_URI;
const PROTOCOL_ASSETS = {
  grid: path.join(__dirname, '..', 'assets', 'protocolos', 'protocolos-grid.png'),
  mobile: path.join(__dirname, '..', 'assets', 'protocolos', 'protocolos-mobile.png'),
  detail: path.join(__dirname, '..', 'assets', 'protocolos', 'protocolo-acls.png'),
};
const PROTOCOL_DATA_URIS = Object.fromEntries(Object.entries(PROTOCOL_ASSETS).map(([key, filePath]) => [
  key,
  fs.existsSync(filePath) ? `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}` : '',
]));
const CALCULATOR_SCREENSHOT_PATH = path.join(__dirname, '..', 'assets', 'calculadoras', 'calculadoras-grid.png');
const CALCULATOR_SCREENSHOT_DATA_URI = fs.existsSync(CALCULATOR_SCREENSHOT_PATH)
  ? `data:image/png;base64,${fs.readFileSync(CALCULATOR_SCREENSHOT_PATH).toString('base64')}`
  : '';

const PALETTE = {
  bg: '#f4f5f7',
  surface: '#ffffff',
  navy: '#1e2a35',
  teal: '#1a6b73',
  tealLight: '#eaf2f3',
  text: '#1a1a2e',
  secondary: '#5a6a7a',
  border: '#dde3ec',
  warning: '#e67e22',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dimensionsFor(format) {
  if (format === 'square') return { width: 1080, height: 1080 };
  return ['story', 'reel-cover'].includes(format)
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1350 };
}

function baseStyles(dimensions) {
  return `
    :root { --bg: ${PALETTE.bg}; --surface: ${PALETTE.surface}; --navy: ${PALETTE.navy}; --teal: ${PALETTE.teal}; --teal-light: ${PALETTE.tealLight}; --text: ${PALETTE.text}; --secondary: ${PALETTE.secondary}; --border: ${PALETTE.border}; --warning: ${PALETTE.warning}; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${dimensions.width}px; height: ${dimensions.height}px; overflow: hidden; }
    body { background: var(--bg); color: var(--text); font-family: 'Barlow', Arial, sans-serif; }
    .canvas { position: relative; width: ${dimensions.width}px; height: ${dimensions.height}px; padding: 88px 88px 78px; overflow: hidden; display: flex; flex-direction: column; }
    .canvas.centered { align-items: center; justify-content: center; text-align: center; }
    .canvas.centered .logo { position: absolute; left: 88px; top: 88px; z-index: 3; color: inherit; text-align: left; }
    .canvas.centered .eyebrow, .canvas.centered .title, .canvas.centered .body, .canvas.centered .mockup, .canvas.centered .visual-illustration, .canvas.centered .cta { margin-left: auto; margin-right: auto; }
    .canvas.centered .eyebrow { align-self: center; }
    .canvas.centered .title { max-width: 820px; margin-bottom: 52px; }
    .canvas.centered .body { max-width: 760px; }
    .canvas.centered .cta-copy { margin-top: 28px; font-weight: 700; }
    .canvas.centered.cta { justify-content: flex-end; padding-bottom: 190px; }
    .canvas.centered .mockup { width: 840px; text-align: left; }
    .canvas.centered .eyebrow { margin-top: 0; }
    .canvas.dark { background: var(--navy); color: #fff; }
    .canvas.teal { background: var(--teal); color: #fff; }
    .decor { position: absolute; width: 390px; height: 390px; border: 2px solid rgba(77,190,201,.22); border-radius: 50%; right: -170px; top: -110px; }
    .decor::after { content: ''; position: absolute; inset: 42px; border: 1px solid rgba(77,190,201,.2); border-radius: 50%; }
    .logo { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 12px; font: 800 26px/1 'Barlow Condensed', Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; }
    .brand-logo { position: absolute; left: 88px; top: 112px; z-index: 3; width: 300px; height: 108px; object-fit: cover; object-position: center center; mix-blend-mode: multiply; }
    .protocol-screenshot { width: 840px; height: 390px; margin-top: 28px; display: flex; align-items: center; justify-content: center; }
    .protocol-screenshot img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; border: 2px solid var(--border); border-radius: 16px; box-shadow: 0 16px 32px rgba(30,42,53,.16); background: var(--surface); }
    .protocol-screenshot.grid img { width: 840px; }
    .protocol-screenshot.mobile img { height: 390px; }
    .protocol-screenshot.detail img { width: 840px; }
    .calculator-screenshot { width: 840px; height: 390px; margin-top: 28px; display: flex; align-items: center; justify-content: center; }
    .calculator-screenshot img { display: block; width: 840px; max-height: 390px; object-fit: contain; border: 2px solid var(--border); border-radius: 16px; box-shadow: 0 16px 32px rgba(30,42,53,.16); background: var(--surface); }
    .interaction-options { width: 840px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 42px; }
    .interaction-card { min-height: 150px; padding: 24px 20px; border: 2px solid var(--border); border-radius: 18px; background: var(--surface); box-shadow: 0 12px 24px rgba(30,42,53,.12); color: #1a1a2e !important; text-align: left; }
    .interaction-number { display: block; margin-bottom: 18px; color: #1a6b73 !important; font-size: 28px; font-weight: 800; }
    .interaction-label { display: block; color: #1a1a2e !important; font-size: 27px; font-weight: 700; line-height: 1.12; }
    .panorama .decor { width: 360px; height: 360px; right: -130px; top: -118px; border-color: rgba(139,224,229,.28); }
    .panorama .decor::after { border-color: rgba(77,190,201,.25); }
    .panorama .brand-logo { top: 132px; mix-blend-mode: normal; background: transparent; border-radius: 0; padding: 0; }
    .panorama.save-slide .brand-logo { top: 14px; width: 190px; height: 68px; }
    .panorama.square { padding: 56px 56px 48px; justify-content: center; }
    .panorama.square.centered.cta { justify-content: center; padding-bottom: 48px; }
    .panorama.square .brand-logo { left: 56px; top: 72px; width: 230px; height: 83px; }
    .panorama.square.cover .brand-logo { top: 56px; width: 180px; height: 65px; }
    .panorama.square.save-slide .brand-logo { top: 56px; width: 180px; height: 65px; }
    .panorama.square .eyebrow { margin-top: 0; margin-bottom: 18px; }
    .panorama.square .title { max-width: 920px; margin-bottom: 18px; font-size: 62px; }
    .panorama.square.cover .title { font-size: 72px; }
    .panorama.square .body { max-width: 900px; font-size: 28px; line-height: 1.18; }
    .panorama.square .return-visual { width: 920px; min-height: 180px; margin-top: 12px; gap: 14px; }
    .panorama.square .return-panel { width: 390px; min-height: 142px; padding: 18px; }
    .panorama.square .return-panel.light { height: 165px; padding: 14px; }
    .panorama.square .return-kicker { margin-bottom: 8px; font-size: 15px; }
    .panorama.square .return-label { font-size: 28px; }
    .panorama.square .return-detail { margin-top: 6px; font-size: 17px; }
    .panorama.square .return-arrow { font-size: 34px; }
    .panorama.square .return-checks { width: 920px; margin-top: 12px; gap: 14px; }
    .panorama.square .return-check { min-height: 100px; padding: 14px; }
    .panorama.square .return-check strong { margin-bottom: 10px; font-size: 20px; }
    .panorama.square .return-check span { font-size: 24px; }
    .panorama.square .return-question { max-width: 800px; padding: 22px 28px; font-size: 38px; }
    .panorama.square .return-save { width: 920px; min-height: 210px; margin-top: 18px; gap: 24px; }
    .panorama.square .return-bookmark { width: 100px; height: 128px; }
    .panorama.square .return-bookmark::after { width: 34px; height: 18px; left: 29px; top: 43px; }
    .panorama.square .return-save-text { max-width: 650px; font-size: 46px; }
    .panorama.square.content:not(.save-slide) .eyebrow,
    .panorama.square.content:not(.save-slide) .title,
    .panorama.square.content:not(.save-slide) .body,
    .panorama.square.content:not(.save-slide) .return-visual,
    .panorama.square.content:not(.save-slide) .return-checks { position: static; }
    .return-visual { width: 840px; min-height: 245px; margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 20px; }
    .return-panel { width: 340px; min-height: 178px; padding: 24px; border: 2px solid rgba(139,224,229,.72); border-radius: 18px; background: rgba(255,255,255,.1); box-shadow: 0 16px 30px rgba(0,0,0,.18); }
    .return-panel.light { height: 236px; border-color: var(--teal); background: var(--surface); color: var(--text); box-shadow: 0 14px 28px rgba(30,42,53,.14); }
    .return-kicker { display: block; margin-bottom: 18px; color: #8be0e5; font-size: 20px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .return-panel.light .return-kicker { color: var(--teal); }
    .return-label { display: block; color: #fff; font: 800 38px/1.02 'Barlow Condensed', Arial, sans-serif; }
    .return-panel.light .return-label { color: var(--text); }
    .return-detail { display: block; margin-top: 16px; color: rgba(255,255,255,.78); font-size: 24px; line-height: 1.2; }
    .return-panel.light .return-detail { color: var(--secondary); }
    .return-arrow { color: #8be0e5; font-size: 42px; font-weight: 700; }
    .return-checks { width: 840px; margin-top: 34px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    .return-check { min-height: 150px; padding: 25px 22px; border: 2px solid rgba(139,224,229,.7); border-radius: 18px; background: rgba(255,255,255,.1); box-shadow: 0 14px 28px rgba(0,0,0,.16); }
    .return-check strong { display: block; margin-bottom: 24px; color: #8be0e5; font-size: 27px; }
    .return-check span { display: block; color: #fff; font: 800 34px/1.05 'Barlow Condensed', Arial, sans-serif; }
    .return-question { max-width: 740px; padding: 30px 38px; border: 2px solid #8be0e5; border-radius: 22px; background: rgba(255,255,255,.1); color: #fff; font: 800 48px/1.05 'Barlow Condensed', Arial, sans-serif; box-shadow: 0 18px 34px rgba(0,0,0,.18); }
    .return-save { width: 840px; min-height: 260px; margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 36px; }
    .return-bookmark { position: relative; width: 122px; height: 158px; border: 4px solid #8be0e5; border-radius: 18px 18px 8px 8px; background: rgba(77,190,201,.22); box-shadow: 0 16px 30px rgba(0,0,0,.18); }
    .return-bookmark::after { content: ''; position: absolute; width: 42px; height: 22px; left: 36px; top: 54px; border-left: 6px solid #8be0e5; border-bottom: 6px solid #8be0e5; transform: rotate(-45deg); }
    .return-save-text { max-width: 560px; color: #fff; font: 800 58px/1.02 'Barlow Condensed', Arial, sans-serif; text-align: left; }
    .logo-mark { width: 25px; height: 25px; border: 3px solid currentColor; border-radius: 50%; position: relative; }
    .logo-mark::after { content: ''; position: absolute; width: 7px; height: 7px; background: currentColor; border-radius: 50%; left: 6px; top: 6px; }
    .eyebrow { margin-top: auto; margin-bottom: 28px; color: var(--teal); font: 700 25px/1.1 'Barlow', Arial, sans-serif; letter-spacing: .04em; text-transform: uppercase; }
    .dark .eyebrow, .teal .eyebrow { color: #8be0e5; }
    .title { max-width: 870px; margin: 0 0 26px; font: 800 76px/1.02 'Barlow Condensed', Arial, sans-serif; letter-spacing: -.02em; }
    .cover .title { font-size: 92px; }
    .body { max-width: 830px; margin: 0; color: var(--secondary); font-size: 38px; line-height: 1.25; white-space: pre-wrap; }
    .dark .body, .teal .body { color: rgba(255,255,255,.82); }
    .highlight { display: inline-block; margin-top: 38px; padding: 22px 28px; border-left: 8px solid var(--teal); background: var(--teal-light); border-radius: 6px; color: var(--text); font-size: 32px; line-height: 1.25; }
    .dark .highlight, .teal .highlight { background: rgba(255,255,255,.12); color: #fff; }
    .mockup { margin-top: 38px; border: 2px solid rgba(26,107,115,.28); border-radius: 18px; background: var(--surface); box-shadow: 0 16px 40px rgba(30,42,53,.16); overflow: hidden; color: var(--text); }
    .mockup-bar { height: 58px; display: flex; align-items: center; gap: 10px; padding: 0 22px; border-bottom: 1px solid var(--border); background: #f8fafb; }
    .mockup-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--teal); }
    .mockup-label { color: var(--secondary); font-size: 22px; font-weight: 700; letter-spacing: .03em; }
    .mockup-content { padding: 28px 30px 34px; font-size: 31px; line-height: 1.3; }
    .visual-illustration { position: relative; width: 840px; height: 224px; margin-top: 28px; display: flex; align-items: center; justify-content: center; }
    .visual-scene-art { position: relative; width: 760px; height: 210px; }
    .visual-scene-art span { position: absolute; display: block; }
    .visual-scene-cover .visual-scene-art { transform: rotate(-2deg); }
    .cover-sheet { width: 420px; height: 148px; left: 165px; top: 28px; border: 3px solid var(--teal); border-radius: 14px; background: var(--surface); box-shadow: 0 18px 30px rgba(16,44,57,.22); }
    .dark .cover-sheet { background: rgba(255,255,255,.1); border-color: #8be0e5; }
    .cover-sheet.back { left: 130px; top: 48px; transform: rotate(-8deg); opacity: .48; }
    .cover-sheet.front { transform: rotate(4deg); }
    .cover-line { height: 10px; left: 48px; border-radius: 6px; background: var(--teal); opacity: .28; }
    .cover-line.one { width: 190px; top: 42px; }
    .cover-line.two { width: 260px; top: 70px; }
    .cover-line.three { width: 140px; top: 98px; background: var(--warning); opacity: .72; }
    .cover-orbit { width: 84px; height: 84px; border: 4px solid #8be0e5; border-radius: 50%; right: 44px; top: 28px; }
    .cover-orbit.two { width: 42px; height: 42px; right: 65px; top: 49px; border-color: var(--teal); }
    .dark .cover-orbit.two { border-color: #fff; }
    .cover-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--teal); right: 77px; top: 62px; }
    .dark .cover-dot { background: #8be0e5; }
    .context-sheet { width: 420px; height: 156px; left: 178px; top: 26px; border: 2px solid var(--border); border-radius: 10px; background: var(--surface); }
    .context-sheet.back { left: 112px; top: 48px; transform: rotate(-7deg); opacity: .72; background: var(--teal-light); }
    .context-sheet.mid { left: 145px; top: 35px; transform: rotate(5deg); opacity: .9; }
    .context-sheet.front { box-shadow: 0 16px 28px rgba(30,42,53,.14); }
    .context-line { height: 9px; left: 34px; border-radius: 4px; background: var(--secondary); opacity: .22; }
    .context-line.one { width: 180px; top: 34px; }
    .context-line.two { width: 290px; top: 60px; }
    .context-line.three { width: 220px; top: 86px; }
    .context-tag { width: 60px; height: 22px; right: 32px; top: 31px; border-radius: 4px; background: #fef3c7; }
    .context-dot { width: 18px; height: 18px; left: 34px; top: 112px; border-radius: 50%; background: var(--teal); }
    .timeline-track { width: 560px; height: 8px; left: 100px; top: 101px; border-radius: 8px; background: var(--border); }
    .timeline-progress { width: 290px; height: 8px; left: 100px; top: 101px; border-radius: 8px; background: var(--teal); }
    .timeline-dot { width: 34px; height: 34px; top: 88px; border: 5px solid var(--surface); border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 3px var(--teal); }
    .timeline-dot.one { left: 92px; }
    .timeline-dot.two { left: 334px; background: var(--warning); box-shadow: 0 0 0 3px var(--warning); }
    .timeline-dot.three { left: 642px; background: var(--surface); box-shadow: 0 0 0 3px var(--border); }
    .timeline-ring { width: 94px; height: 94px; left: 305px; top: 53px; border: 2px dashed var(--warning); border-radius: 50%; opacity: .72; }
    .timeline-notch { width: 3px; height: 26px; left: 554px; top: 91px; background: var(--teal); }
    .dark .timeline-track { background: rgba(255,255,255,.22); }
    .dark .timeline-dot { border-color: var(--navy); }
    .dark .timeline-dot.three { background: transparent; box-shadow: 0 0 0 3px rgba(255,255,255,.45); }
    .missing-form { width: 458px; height: 166px; left: 136px; top: 24px; border: 2px solid var(--border); border-radius: 10px; background: var(--surface); box-shadow: 0 14px 24px rgba(30,42,53,.12); }
    .form-row { height: 12px; left: 34px; border-radius: 5px; background: var(--secondary); opacity: .2; }
    .form-row.one { width: 230px; top: 34px; }
    .form-row.two { width: 160px; top: 70px; }
    .form-row.three { width: 250px; top: 106px; }
    .missing-slot { width: 116px; height: 34px; right: 30px; top: 60px; border: 3px dashed var(--warning); border-radius: 8px; background: #fffbeb; }
    .missing-slot::after { content: ''; width: 34px; height: 4px; left: 38px; top: 12px; position: absolute; border-radius: 4px; background: var(--warning); opacity: .7; }
    .magnifier { width: 118px; height: 118px; right: 74px; top: 8px; border: 8px solid var(--teal); border-radius: 50%; background: rgba(234,242,243,.68); }
    .magnifier-handle { width: 74px; height: 12px; right: 26px; top: 126px; border-radius: 12px; background: var(--teal); transform: rotate(45deg); transform-origin: right center; }
    .missing-dot { width: 18px; height: 18px; right: 122px; top: 59px; border-radius: 50%; background: var(--warning); }
    .route-start { width: 48px; height: 48px; left: 94px; top: 82px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 10px var(--teal-light); }
    .route-line { height: 6px; left: 126px; top: 104px; background: var(--teal); border-radius: 6px; transform-origin: left center; }
    .route-line.main { width: 250px; }
    .route-line.upper { width: 210px; transform: rotate(-29deg); }
    .route-line.lower { width: 210px; transform: rotate(29deg); }
    .route-node { width: 72px; height: 72px; border: 5px solid var(--teal); border-radius: 50%; background: var(--surface); }
    .route-node.upper { left: 330px; top: 22px; }
    .route-node.lower { left: 330px; top: 116px; border-color: var(--warning); }
    .route-halo { width: 120px; height: 120px; left: 462px; top: 43px; border: 2px dashed var(--teal); border-radius: 50%; opacity: .5; }
    .route-tail { width: 130px; height: 6px; left: 404px; top: 104px; background: var(--teal); border-radius: 6px; }
    .product-frame { width: 520px; height: 180px; left: 120px; top: 16px; overflow: hidden; border: 2px solid var(--border); border-radius: 10px; background: var(--surface); box-shadow: 0 16px 28px rgba(30,42,53,.16); }
    .product-sidebar { width: 102px; height: 180px; left: 0; top: 0; background: var(--navy); }
    .product-sidebar::before, .product-sidebar::after { content: ''; position: absolute; height: 9px; left: 20px; border-radius: 5px; background: #b0c4cc; opacity: .45; }
    .product-sidebar::before { width: 46px; top: 30px; }
    .product-sidebar::after { width: 64px; top: 58px; }
    .product-header { width: 300px; height: 12px; left: 138px; top: 28px; border-radius: 6px; background: var(--teal); opacity: .68; }
    .product-block { width: 340px; height: 26px; left: 138px; border-radius: 5px; background: var(--teal-light); }
    .product-block.one { top: 68px; }
    .product-block.two { top: 108px; width: 250px; background: #fef3c7; }
    .product-block.three { top: 148px; width: 290px; background: #d1fae5; }
    .product-pulse { width: 44px; height: 44px; right: 24px; top: 30px; border: 4px solid var(--teal); border-radius: 50%; }
    .product-pulse::after { content: ''; position: absolute; width: 12px; height: 12px; left: 12px; top: 12px; border-radius: 50%; background: var(--teal); }
    .save-page { width: 214px; height: 164px; left: 270px; top: 24px; border: 3px solid var(--teal); border-radius: 10px; background: var(--surface); transform: rotate(-5deg); box-shadow: 0 14px 24px rgba(30,42,53,.14); }
    .save-page::before, .save-page::after { content: ''; position: absolute; height: 10px; left: 30px; border-radius: 5px; background: var(--secondary); opacity: .2; }
    .save-page::before { width: 116px; top: 40px; }
    .save-page::after { width: 150px; top: 72px; }
    .bookmark { width: 66px; height: 92px; left: 348px; top: 10px; border-radius: 8px 8px 2px 2px; background: var(--teal); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%); transform: rotate(8deg); box-shadow: 0 12px 18px rgba(26,107,115,.25); }
    .save-ring { width: 122px; height: 122px; left: 184px; top: 58px; border: 3px dashed #8be0e5; border-radius: 50%; }
    .save-dot { width: 18px; height: 18px; left: 236px; top: 108px; border-radius: 50%; background: var(--warning); }
    .dark .save-page { background: rgba(255,255,255,.1); border-color: #8be0e5; }
    .dark .save-page::before, .dark .save-page::after { background: #fff; }
    .dark .save-ring { border-color: #8be0e5; }
    .doctor-scene .visual-scene-art { width: 760px; height: 210px; }
    .doctor-glow { width: 300px; height: 176px; left: 134px; top: 18px; border-radius: 50%; background: var(--teal-light); opacity: .86; transform: rotate(-8deg); }
    .doctor-desk { width: 580px; height: 16px; left: 92px; top: 166px; border-radius: 8px; background: var(--navy); }
    .doctor-desk::before, .doctor-desk::after { content: ''; position: absolute; width: 12px; height: 34px; top: 12px; border-radius: 6px; background: var(--navy); }
    .doctor-desk::before { left: 42px; }
    .doctor-desk::after { right: 42px; }
    .doctor-monitor { width: 300px; height: 136px; left: 382px; top: 18px; border: 3px solid var(--navy); border-radius: 10px; background: var(--surface); box-shadow: 0 14px 26px rgba(30,42,53,.16); }
    .doctor-screen { width: 266px; height: 102px; left: 14px; top: 14px; border-radius: 5px; background: var(--teal-light); }
    .doctor-screen-line { height: 9px; left: 20px; border-radius: 5px; background: var(--teal); opacity: .48; }
    .doctor-screen-line.one { width: 144px; top: 20px; }
    .doctor-screen-line.two { width: 196px; top: 44px; background: var(--secondary); opacity: .22; }
    .doctor-screen-line.three { width: 104px; top: 68px; background: var(--warning); opacity: .78; }
    .doctor-screen-mark { width: 34px; height: 34px; right: 18px; top: 18px; border: 4px solid var(--teal); border-radius: 50%; }
    .doctor-screen-mark::after { content: ''; position: absolute; width: 10px; height: 10px; left: 8px; top: 8px; border-radius: 50%; background: var(--teal); }
    .doctor-monitor-stand { width: 22px; height: 30px; left: 521px; top: 152px; background: var(--navy); }
    .doctor-monitor-base { width: 104px; height: 10px; left: 480px; top: 166px; border-radius: 8px; background: var(--navy); }
    .doctor-figure { width: 222px; height: 168px; left: 142px; top: 20px; }
    .doctor-chair { width: 108px; height: 150px; left: 46px; top: 10px; border-radius: 42px 42px 18px 18px; background: var(--navy); opacity: .9; }
    .doctor-body { width: 118px; height: 86px; left: 36px; top: 78px; border: 3px solid var(--teal); border-radius: 54px 54px 18px 18px; background: var(--surface); }
    .doctor-collar { width: 38px; height: 34px; left: 76px; top: 82px; border: 3px solid var(--teal); border-top: 0; transform: rotate(45deg); background: var(--surface); }
    .doctor-head { width: 62px; height: 62px; left: 64px; top: 30px; border: 3px solid var(--navy); border-radius: 50%; background: #d0a184; }
    .doctor-hair { width: 64px; height: 30px; left: 63px; top: 25px; border-radius: 34px 34px 12px 12px; background: var(--navy); }
    .doctor-face { width: 8px; height: 8px; left: 102px; top: 58px; border-radius: 50%; background: var(--navy); opacity: .7; }
    .doctor-arm { width: 126px; height: 23px; left: 112px; top: 124px; border-radius: 18px; background: #d0a184; transform: rotate(7deg); transform-origin: left center; }
    .doctor-hand { width: 24px; height: 18px; left: 230px; top: 138px; border-radius: 12px; background: #d0a184; }
    .doctor-note { width: 72px; height: 46px; left: 300px; top: 118px; border: 2px solid var(--teal); border-radius: 6px; background: #fef3c7; transform: rotate(-6deg); }
    .doctor-note::before, .doctor-note::after { content: ''; position: absolute; height: 5px; left: 12px; border-radius: 4px; background: var(--warning); opacity: .62; }
    .doctor-note::before { width: 38px; top: 14px; }
    .doctor-note::after { width: 26px; top: 26px; }
    .cta { margin-top: auto; padding-top: 40px; font-size: 30px; font-weight: 700; }
    .cta-copy { max-width: 760px; }
    .footer { position: absolute; left: 88px; right: 88px; bottom: 34px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; color: var(--secondary); font-size: 20px; line-height: 1.2; }
    .dark .footer, .teal .footer { color: rgba(255,255,255,.62); }
    .slide-number { font-weight: 700; letter-spacing: .06em; white-space: nowrap; }
    .disclaimer { max-width: 730px; }
    .warning { color: var(--warning); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  `;
}

function visualForSlide(post, slide, index) {
  const visualElement = String(post.visualElement || '').toLowerCase();
  const isP001Doctor = post.id === 'P001' && /m[eéê]dico diante do computador|ilustra[cç][aã]o editorial de m[eéê]dico/.test(visualElement);
  if (isP001Doctor) {
    return '<div class="visual-illustration doctor-scene visual-scene-doctor" role="img" aria-label="Ilustração editorial de um médico revisando informações diante do computador"><div class="visual-scene-art"><span class="doctor-glow"></span><span class="doctor-figure"><span class="doctor-chair"></span><span class="doctor-body"></span><span class="doctor-collar"></span><span class="doctor-head"></span><span class="doctor-hair"></span><span class="doctor-face"></span><span class="doctor-arm"></span><span class="doctor-hand"></span></span><span class="doctor-monitor"><span class="doctor-screen"><span class="doctor-screen-line one"></span><span class="doctor-screen-line two"></span><span class="doctor-screen-line three"></span><span class="doctor-screen-mark"></span></span></span><span class="doctor-monitor-stand"></span><span class="doctor-monitor-base"></span><span class="doctor-note"></span><span class="doctor-desk"></span></div></div>';
  }
  const isP003Demo = post.id === 'P003' && /mockup|centralizad|campo livre|linguagem natural/.test(visualElement);
  if (isP003Demo && index !== 2) {
    const scenes = [
      {
        name: 'input',
        label: 'Ilustração de um caso clínico sendo descrito em texto livre',
        art: '<span class="cover-sheet back"></span><span class="cover-sheet front"><span class="cover-line one"></span><span class="cover-line two"></span><span class="cover-line three"></span><span class="cover-orbit"></span><span class="cover-dot"></span></span>',
      },
      {
        name: 'context',
        label: 'Ilustração de contexto clínico organizado em camadas',
        art: '<span class="context-sheet back"></span><span class="context-sheet mid"></span><span class="context-sheet front"><span class="context-line one"></span><span class="context-line two"></span><span class="context-line three"></span><span class="context-tag"></span><span class="context-dot"></span></span>',
      },
      {
        name: 'missing-data',
        label: 'Ilustração de revisão de dados faltantes em um mockup fictício',
        art: '<span class="missing-form"><span class="form-row one"></span><span class="form-row two"></span><span class="form-row three"></span><span class="missing-slot"></span></span><span class="magnifier"></span><span class="magnifier-handle"></span><span class="missing-dot"></span>',
      },
      {
        name: 'save',
        label: 'Ilustração de uma revisão organizada pronta para conferência',
        art: '<span class="save-page"></span><span class="bookmark"></span><span class="save-ring"></span><span class="save-dot"></span>',
      },
    ];
    const scene = scenes[Math.min(index, scenes.length - 1)];
    return `<div class="visual-illustration visual-scene-${scene.name}" role="img" aria-label="${escapeHtml(scene.label)}"><div class="visual-scene-art">${scene.art}</div></div>`;
  }
  const isP101Protocols = post.id === 'P101' && /protocol|sequ[eê]ncia|screenshot|telas/.test(visualElement);
  if (isP101Protocols) {
    const scenes = {
      1: { type: 'grid', label: 'Tela real da biblioteca de Protocolos do Conduta', src: PROTOCOL_DATA_URIS.grid },
      2: { type: 'mobile', label: 'Tela real de busca e filtros dos Protocolos do Conduta', src: PROTOCOL_DATA_URIS.mobile },
      3: { type: 'detail', label: 'Tela real de uma sequência rápida de protocolo ACLS', src: PROTOCOL_DATA_URIS.detail },
    };
    const scene = scenes[index];
    if (!scene) return '';
    if (!scene.src) return '';
    return `<div class="protocol-screenshot ${scene.type}" role="img" aria-label="${escapeHtml(scene.label)}"><img src="${scene.src}" alt="${escapeHtml(scene.label)}"></div>`;
  }
  const isP102Calculators = post.id === 'P102' && /calculadora|f[oó]rmula|screenshot|captura/.test(visualElement);
  if (isP102Calculators && index === 1 && CALCULATOR_SCREENSHOT_DATA_URI) {
    const label = 'Tela real da nova área de Calculadoras clínicas do Conduta';
    return `<div class="calculator-screenshot" role="img" aria-label="${escapeHtml(label)}"><img src="${CALCULATOR_SCREENSHOT_DATA_URI}" alt="${escapeHtml(label)}"></div>`;
  }
  const isP100Interaction = post.id === 'P100' && /intera[cç][aã]o|op[cç][oõ]es|enquete|coment[aá]rios/.test(visualElement);
  if (isP100Interaction && index === 0) {
    const options = ['Organizar o caso', 'Revisar alertas', 'Pensar nos próximos passos'];
    const cards = options.map((label, optionIndex) => `<div class="interaction-card"><span class="interaction-number">0${optionIndex + 1}</span><span class="interaction-label">${escapeHtml(label)}</span></div>`).join('');
    return `<div class="interaction-options" role="img" aria-label="Três opções de interação sobre a rotina clínica"><div class="sr-only">${escapeHtml(options.join(', '))}</div>${cards}</div>`;
  }
  const isP099Demo = post.id === 'P099' && /mockup|logo|produto|entrada|an[aá]lise|revis[aã]o/.test(visualElement);
  const isP027Return = post.id === 'P027' && /retorno|sintoma|seguimento|reavali|prioridade|pergunta/.test(visualElement);
  if (isP027Return) {
    const scenes = [
      '<div class="return-panel"><span class="return-kicker">Primeiro momento</span><span class="return-label">O que já estava claro?</span><span class="return-detail">Queixa, evolução, exame e plano inicial.</span></div><div class="return-arrow">→</div><div class="return-panel"><span class="return-kicker">Retorno</span><span class="return-label">O que mudou?</span><span class="return-detail">Um sintoma novo pede uma nova leitura do conjunto.</span></div>',
      '<div class="return-panel light"><span class="return-kicker">Releia</span><span class="return-label">Evolução</span><span class="return-detail">Tempo, intensidade e resposta ao que já foi feito.</span></div><div class="return-panel light"><span class="return-kicker">Compare</span><span class="return-label">Sinais associados</span><span class="return-detail">Exame e dados que ainda faltam.</span></div>',
      '<div class="return-check"><strong>01</strong><span>Hipóteses</span></div><div class="return-check"><strong>02</strong><span>Alertas</span></div><div class="return-check"><strong>03</strong><span>Próximos passos</span></div>',
      '<div class="return-question">Qual pergunta você faria primeiro nesse retorno?</div>',
      '<div class="return-bookmark" aria-hidden="true"></div><div class="return-save-text">Salve este post para revisar no próximo retorno.</div>',
    ];
    const scene = scenes[Math.min(index, scenes.length - 1)];
    const label = ['Comparação entre o primeiro momento e o retorno', 'Cartões de revisão da evolução e dos sinais associados', 'Três pontos para atualizar a prioridade', 'Pergunta aberta sobre o retorno', 'Chamada para salvar o carrossel'][Math.min(index, 4)];
    const wrapperClass = index === 2 ? 'return-checks' : index === 4 ? 'return-save' : 'return-visual';
    return `<div class="${wrapperClass}" role="img" aria-label="${escapeHtml(label)}">${scene}</div>`;
  }
  if (isP099Demo) {
    const scenes = [
      { name: 'product', label: 'Mockup fictício de uma análise organizada pelo Conduta', art: '<span class="product-frame"><span class="product-sidebar"></span><span class="product-header"></span><span class="product-block one"></span><span class="product-block two"></span><span class="product-block three"></span><span class="product-pulse"></span></span>' },
      { name: 'cover', label: 'Mockup fictício de um caso descrito em linguagem natural', art: '<span class="cover-sheet back"></span><span class="cover-sheet front"><span class="cover-line one"></span><span class="cover-line two"></span><span class="cover-line three"></span><span class="cover-orbit"></span><span class="cover-dot"></span></span>' },
      { name: 'context', label: 'Mockup fictício de camadas de contexto clínico organizadas', art: '<span class="context-sheet back"></span><span class="context-sheet mid"></span><span class="context-sheet front"><span class="context-line one"></span><span class="context-line two"></span><span class="context-line three"></span><span class="context-tag"></span><span class="context-dot"></span></span>' },
      { name: 'escalation', label: 'Mockup fictício de possibilidades comparadas para revisão', art: '<span class="route-start"></span><span class="route-line upper"></span><span class="route-line lower"></span><span class="route-line main"></span><span class="route-node upper"></span><span class="route-node lower"></span><span class="route-halo"></span><span class="route-tail"></span>' },
      { name: 'missing-data', label: 'Mockup fictício de revisão de dados faltantes', art: '<span class="missing-form"><span class="form-row one"></span><span class="form-row two"></span><span class="form-row three"></span><span class="missing-slot"></span></span><span class="magnifier"></span><span class="magnifier-handle"></span><span class="missing-dot"></span>' },
      { name: 'save', label: 'Mockup fictício de uma revisão pronta para conferência', art: '<span class="save-page"></span><span class="bookmark"></span><span class="save-ring"></span><span class="save-dot"></span>' },
    ];
    const scene = scenes[Math.min(index, scenes.length - 1)];
    return `<div class="visual-illustration visual-scene-${scene.name}" role="img" aria-label="${escapeHtml(scene.label)}"><div class="visual-scene-art">${scene.art}</div></div>`;
  }
  const isP030Checklist = post.id === 'P030' && /checklist|cart[oõ]es|documentos|revis[aã]o/.test(visualElement);
  if (isP030Checklist) {
    const scenes = [
      { name: 'cover', label: 'Ilustração editorial de um documento organizado para revisão', art: '<span class="cover-sheet back"></span><span class="cover-sheet front"><span class="cover-line one"></span><span class="cover-line two"></span><span class="cover-line three"></span><span class="cover-orbit"></span><span class="cover-dot"></span></span>' },
      { name: 'context', label: 'Ilustração de um resumo organizado em camadas de contexto', art: '<span class="context-sheet back"></span><span class="context-sheet mid"></span><span class="context-sheet front"><span class="context-line one"></span><span class="context-line two"></span><span class="context-line three"></span><span class="context-tag"></span><span class="context-dot"></span></span>' },
      { name: 'missing-data', label: 'Ilustração de conferência de informações ausentes em um checklist fictício', art: '<span class="missing-form"><span class="form-row one"></span><span class="form-row two"></span><span class="form-row three"></span><span class="missing-slot"></span></span><span class="magnifier"></span><span class="magnifier-handle"></span><span class="missing-dot"></span>' },
      { name: 'escalation', label: 'Ilustração de um texto sendo revisado antes do registro', art: '<span class="route-start"></span><span class="route-line upper"></span><span class="route-line lower"></span><span class="route-line main"></span><span class="route-node upper"></span><span class="route-node lower"></span><span class="route-halo"></span><span class="route-tail"></span>' },
      { name: 'product', label: 'Ilustração abstrata de um resumo organizado pelo Conduta', art: '<span class="product-frame"><span class="product-sidebar"></span><span class="product-header"></span><span class="product-block one"></span><span class="product-block two"></span><span class="product-block three"></span><span class="product-pulse"></span></span>' },
      { name: 'save', label: 'Ilustração de uma página marcada para revisão posterior', art: '<span class="save-page"></span><span class="bookmark"></span><span class="save-ring"></span><span class="save-dot"></span>' },
    ];
    const scene = scenes[index] || scenes[scenes.length - 1];
    return `<div class="visual-illustration visual-scene-${scene.name}" role="img" aria-label="${escapeHtml(scene.label)}"><div class="visual-scene-art">${scene.art}</div></div>`;
  }
  const isP002Sequence = post.id === 'P002' && /sequ[eê]ncia editorial|diagrama de tr[eê]s perguntas/.test(visualElement);
  if (!isP002Sequence) return '';

  const scenes = [
    {
      name: 'cover',
      label: 'Ilustração de camadas de revisão clínica',
      art: '<span class="cover-sheet back"></span><span class="cover-sheet mid"></span><span class="cover-sheet front"><span class="cover-line one"></span><span class="cover-line two"></span><span class="cover-line three"></span><span class="cover-orbit"></span><span class="cover-orbit two"></span><span class="cover-dot"></span></span>',
    },
    {
      name: 'context',
      label: 'Ilustração de informações clínicas organizadas em camadas',
      art: '<span class="context-sheet back"></span><span class="context-sheet mid"></span><span class="context-sheet front"><span class="context-line one"></span><span class="context-line two"></span><span class="context-line three"></span><span class="context-tag"></span><span class="context-dot"></span></span>',
    },
    {
      name: 'timeline',
      label: 'Ilustração de uma linha do tempo com um ponto de mudança',
      art: '<span class="timeline-track"></span><span class="timeline-progress"></span><span class="timeline-dot one"></span><span class="timeline-dot two"></span><span class="timeline-dot three"></span><span class="timeline-ring"></span><span class="timeline-notch"></span>',
    },
    {
      name: 'missing-data',
      label: 'Ilustração de uma lupa sobre um dado ausente',
      art: '<span class="missing-form"><span class="form-row one"></span><span class="form-row two"></span><span class="form-row three"></span><span class="missing-slot"></span></span><span class="magnifier"></span><span class="magnifier-handle"></span><span class="missing-dot"></span>',
    },
    {
      name: 'escalation',
      label: 'Ilustração de caminhos diferentes para revisão e encaminhamento',
      art: '<span class="route-start"></span><span class="route-line upper"></span><span class="route-line lower"></span><span class="route-line main"></span><span class="route-node upper"></span><span class="route-node lower"></span><span class="route-halo"></span><span class="route-tail"></span>',
    },
    {
      name: 'product',
      label: 'Ilustração abstrata de uma análise estruturada do Conduta',
      art: '<span class="product-frame"><span class="product-sidebar"></span><span class="product-header"></span><span class="product-block one"></span><span class="product-block two"></span><span class="product-block three"></span><span class="product-pulse"></span></span>',
    },
    {
      name: 'save',
      label: 'Ilustração de uma página marcada para revisão posterior',
      art: '<span class="save-page"></span><span class="bookmark"></span><span class="save-ring"></span><span class="save-dot"></span>',
    },
  ];
  const scene = scenes[index] || scenes[scenes.length - 1];
  return `<div class="visual-illustration visual-scene-${scene.name}" role="img" aria-label="${escapeHtml(scene.label)}"><div class="visual-scene-art">${scene.art}</div></div>`;
}

function slideMarkup(post, slide) {
  const dark = post.id === 'P027' || ((slide.role === 'cover' || slide.role === 'cta') && !['P099', 'P100', 'P101', 'P102'].includes(post.id));
  const teal = slide.role === 'feature' && post.format === 'product-demo' && !['P099', 'P101', 'P102'].includes(post.id);
  const classes = ['canvas', `template-${post.template}`, slide.role];
  if (post.id === 'P027') classes.push('panorama');
  if (post.format === 'square') classes.push('square');
  if (post.id === 'P027' && Number(slide.number || 1) === 5) classes.push('save-slide');
  if (slide.role === 'cta' || /centralizad/i.test(String(post.visualGuidance || ''))) classes.push('centered');
  if (dark) classes.push('dark');
  if (teal) classes.push('teal');
  const isCta = slide.role === 'cta';
  const technicalCtaTitle = /^(cta|call to action)$/i.test(String(slide.title || '').trim());
  const title = escapeHtml(isCta && technicalCtaTitle ? 'Próximo passo' : (slide.title || post.title));
  const body = escapeHtml(slide.body || (isCta ? post.cta || '' : ''));
  const isDemo = post.format === 'product-demo' && slide.role === 'feature' && post.id !== 'P099';
  const disclaimer = /clin|hipotes|medic|racioc|conduta|risco|encamin/i.test(`${post.pillar} ${post.relatedFeature} ${post.title}`)
    ? 'Conteúdo educativo. Revise o contexto do caso real e os protocolos locais.'
    : '';
  const visual = visualForSlide(post, slide, Number(slide.number || 1) - 1);
  const logoDataUri = post.id === 'P027' ? BRAND_LOGO_TRANSPARENT_DATA_URI : BRAND_LOGO_DATA_URI;
  const eyebrow = post.id === 'P027'
    ? (slide.number === 2 ? 'Revisão do retorno' : slide.number === 3 ? 'Priorização do caso' : '')
    : (slide.role === 'feature' ? 'Como pode apoiar' : slide.role === 'cta' ? 'Próximo passo' : 'Raciocínio clínico');
  return `<main class="${classes.join(' ')}" aria-label="Slide ${slide.number} de ${post.slides.length}">
    <div class="decor" aria-hidden="true"></div>
    ${['P027', 'P099', 'P100', 'P101', 'P102'].includes(post.id) && logoDataUri ? `<img class="brand-logo" src="${logoDataUri}" alt="Conduta">` : '<div class="logo"><span class="logo-mark" aria-hidden="true"></span>Conduta</div>'}
    ${slide.role !== 'cover' && slide.role !== 'cta' && eyebrow ? `<div class="eyebrow">${escapeHtml(eyebrow)}</div>` : ''}
    <h1 class="title">${title}</h1>
    ${isDemo ? `<div class="mockup" aria-label="Mockup local, sem dados reais"><div class="mockup-bar"><span class="mockup-dot"></span><span class="mockup-label">Área de revisão do Conduta</span></div><div class="mockup-content">${body}</div></div>` : (body ? `<p class="body${isCta ? ' cta-copy' : ''}">${body}</p>` : '')}
    ${visual}
    <footer class="footer"><span class="disclaimer">${escapeHtml(disclaimer)}</span><span class="slide-number">${String(slide.number).padStart(2, '0')}/${String(post.slides.length).padStart(2, '0')}</span></footer>
  </main>`;
}

function renderSlideHtml(post, slide) {
  const dimensions = dimensionsFor(post.format);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(post.title)}</title><style>${baseStyles(dimensions)}</style></head><body>${slideMarkup(post, slide)}</body></html>`;
}

function renderPreviewHtml(post, report, generatedDirName) {
  const dimensions = dimensionsFor(post.format);
  const slides = post.slides.map((slide) => `<figure><img src="./slide-${String(slide.number).padStart(2, '0')}.png" alt="${escapeHtml(post.altText || `Slide ${slide.number}: ${slide.title || post.title}`)}"><figcaption>Slide ${slide.number} — ${escapeHtml(slide.role)}</figcaption></figure>`).join('\n');
  const errors = report.errors.length ? `<h2>Erros impeditivos</h2><ul>${report.errors.map((item) => `<li><strong>${escapeHtml(item.field)}:</strong> ${escapeHtml(item.message)}<br><small>${escapeHtml(item.suggestion)}</small></li>`).join('')}</ul>` : '<p class="ok">Nenhum erro impeditivo.</p>';
  const warnings = report.warnings.length ? `<h2>Alertas</h2><ul>${report.warnings.map((item) => `<li><strong>${escapeHtml(item.field)}:</strong> ${escapeHtml(item.message)}<br><small>${escapeHtml(item.suggestion)}</small></li>`).join('')}</ul>` : '<p class="ok">Nenhum alerta.</p>';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview — ${escapeHtml(post.title)}</title><style>
    body{margin:0;padding:32px;background:#eef1f4;color:#1a1a2e;font:16px/1.5 Barlow,Arial,sans-serif}main{max-width:1200px;margin:auto}h1{font:800 48px/1.05 'Barlow Condensed',Arial,sans-serif;color:#1e2a35}h2{margin-top:30px;color:#1a6b73}header{background:#fff;border:1px solid #dde3ec;border-radius:10px;padding:24px;margin-bottom:24px}.meta{color:#5a6a7a}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:24px}figure{margin:0;background:#fff;border:1px solid #dde3ec;border-radius:10px;padding:12px;box-shadow:0 4px 12px #1e2a3514}img{display:block;width:100%;height:auto}figcaption{padding:10px 2px 0;color:#5a6a7a}section{background:#fff;border:1px solid #dde3ec;border-radius:10px;padding:24px;margin-top:24px}li{margin:12px 0}.ok{color:#1a6b73;font-weight:700}pre{white-space:pre-wrap;font:16px/1.5 Barlow,Arial,sans-serif}
  </style></head><body><main><header><h1>${escapeHtml(post.title)}</h1><div class="meta"><strong>${escapeHtml(post.id)}</strong> · ${escapeHtml(post.format)} · template ${escapeHtml(post.template)} · ${dimensions.width} × ${dimensions.height}px<br>${escapeHtml(post.sourceFile)}</div></header><div class="gallery">${slides}</div><section><h2>Legenda</h2><pre>${escapeHtml(post.caption)}</pre><p><strong>CTA:</strong> ${escapeHtml(post.cta || '—')}</p><p>${post.hashtags.map(escapeHtml).join(' ')}</p></section><section><h2>Validação</h2>${errors}${warnings}</section></main></body></html>`;
}

function writePreviewHtml(filePath, post, report, generatedDirName) {
  fs.writeFileSync(filePath, renderPreviewHtml(post, report, generatedDirName), 'utf8');
}

module.exports = {
  PALETTE,
  dimensionsFor,
  escapeHtml,
  renderPreviewHtml,
  renderSlideHtml,
  slideMarkup,
  writePreviewHtml,
};
