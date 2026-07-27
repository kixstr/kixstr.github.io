#!/usr/bin/env node
/**
 * 科幻风格静态站生成器 - SEO优化 + 商品展示 + 跳转原站
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DIST_DIR = path.join(__dirname, 'dist');

function loadJSON(name) {
    const fp = path.join(DATA_DIR, name);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function stripHtml(h) { return (h || '').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim(); }
function fixImg(url, base) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return base + url;
    return url;
}

// ── SEO 配置（从根目录 seo.json 读取）──
function loadRootJSON(name) {
    const fp = path.join(__dirname, name);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
}
const SEO = loadRootJSON('seo.json') || {};
const SEO_KEYWORDS = SEO.keywords || '';
const SEO_DESC = SEO.description || '';
const SITE_TITLE = SEO.title || '精选账号商城';
const SEO_TITLE_SUFFIX = SEO.titleSuffix || '';
const SEO_AUTHOR = SEO.author || SITE_TITLE;
const SEO_ROBOTS = SEO.robots || 'index, follow';
const SEO_CANONICAL = SEO.canonical || '';
const SEO_OG = SEO.og || {};
const SEO_TWITTER = SEO.twitter || {};
const SEO_JSON_LD = SEO.jsonLd || {};
const SEO_FAVICON = SEO.favicon || '';

// ── CSS: 科幻风格 ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --bg: #050810;
  --bg2: #0a0f1e;
  --bg3: #0d1225;
  --card: rgba(8, 14, 30, 0.85);
  --card-hover: rgba(12, 20, 42, 0.95);
  --border: rgba(0, 255, 255, 0.08);
  --border-light: rgba(0, 255, 255, 0.04);
  --primary: #00ffff;
  --primary-light: #66ffff;
  --primary-dark: #00cccc;
  --accent: #ff00ff;
  --accent-light: #ff66ff;
  --accent2: #00ff88;
  --text: #e0e8ff;
  --text2: #8892b0;
  --text3: #4a5280;
  --text-muted: #2d3560;
  --neon-cyan: 0 0 10px rgba(0,255,255,.3), 0 0 30px rgba(0,255,255,.15);
  --neon-magenta: 0 0 10px rgba(255,0,255,.3), 0 0 30px rgba(255,0,255,.15);
  --gradient-main: linear-gradient(135deg, #00ffff 0%, #0088ff 50%, #ff00ff 100%);
  --gradient-subtle: linear-gradient(135deg, rgba(0,255,255,.1) 0%, rgba(136,0,255,.08) 100%);
  --radius: 6px;
  --radius-lg: 10px;
  --max-w: 1200px;
  --shadow-sm: 0 2px 12px rgba(0,0,0,.5);
  --shadow-md: 0 4px 24px rgba(0,0,0,.6);
  --shadow-lg: 0 8px 48px rgba(0,0,0,.7);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Rajdhani', 'Inter', -apple-system, sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.7;
  min-height: 100vh; overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── 动态网格背景 ── */
body::before {
  content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background:
    linear-gradient(rgba(0,255,255,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,255,.02) 1px, transparent 1px),
    radial-gradient(ellipse at 15% 0%, rgba(0,255,255,.08) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 100%, rgba(255,0,255,.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(0,136,255,.04) 0%, transparent 60%);
  background-size: 50px 50px, 50px 50px, 100% 100%, 100% 100%, 100% 100%;
  pointer-events: none; z-index: 0;
  animation: gridPulse 8s ease-in-out infinite;
}
@keyframes gridPulse {
  0%, 100% { opacity: .6; }
  50% { opacity: 1; }
}

/* ── 扫描线效果 ── */
body::after {
  content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,255,255,.008) 2px,
    rgba(0,255,255,.008) 4px
  );
  pointer-events: none; z-index: 0;
  animation: scanMove 10s linear infinite;
}
@keyframes scanMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

a { color: var(--primary); text-decoration: none; transition: all .3s; }
a:hover { color: var(--primary-light); text-shadow: var(--neon-cyan); }
img { max-width: 100%; height: auto; }

.container { max-width: var(--max-w); margin: 0 auto; padding: 0 32px; position: relative; z-index: 1; }

/* ── Header ── */
.header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(5,8,16,.85);
  backdrop-filter: blur(20px) saturate(1.5);
  border-bottom: 1px solid rgba(0,255,255,.1);
  box-shadow: 0 1px 20px rgba(0,255,255,.05);
}
.header-inner {
  max-width: var(--max-w); margin: 0 auto; padding: 14px 32px;
  display: flex; align-items: center; justify-content: space-between;
}
.logo-area { display: flex; align-items: center; gap: 14px; }
.logo-wrap {
  display: flex; align-items: center; justify-content: center;
  padding: 5px 10px; border-radius: 8px;
  background: rgba(0,255,255,.04);
  border: 1px solid rgba(0,255,255,.12);
  box-shadow: var(--neon-cyan);
}
.logo-wrap img {
  height: 34px; max-width: 100px;
  filter: invert(1) brightness(1.15) drop-shadow(0 0 4px rgba(0,255,255,.3));
}
.logo-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem; font-weight: 700; letter-spacing: 2px;
  color: var(--primary);
  text-shadow: var(--neon-cyan);
}
.logo-sub {
  display: inline-block; margin-top: 4px; padding: 3px 10px;
  font-size: .68rem; color: var(--primary); letter-spacing: .5px;
  background: rgba(0,255,255,.05);
  border: 1px solid rgba(0,255,255,.12);
  border-radius: 3px;
}
.logo-sub a { color: var(--primary); font-weight: 600; }
.logo-sub a:hover { color: var(--primary-light); text-shadow: var(--neon-cyan); }

.header-right {
  display: flex; align-items: center; gap: 12px;
}
.header-badge {
  padding: 6px 16px; border-radius: 4px; font-size: .72rem; font-weight: 600;
  background: rgba(0,255,255,.06); color: var(--primary);
  border: 1px solid rgba(0,255,255,.15);
  letter-spacing: 1px; text-transform: uppercase;
  font-family: 'Orbitron', sans-serif;
}
.header-status {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent2);
  box-shadow: 0 0 8px rgba(0,255,136,.6);
  animation: statusPulse 2s ease-in-out infinite;
}
@keyframes statusPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(0,255,136,.6); }
  50% { opacity: .5; box-shadow: 0 0 4px rgba(0,255,136,.3); }
}

/* ── Hero ── */
.hero {
  text-align: center; padding: 70px 32px 50px; position: relative;
  overflow: hidden;
}
.hero::before {
  content: ''; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(0,255,255,.06) 0%, rgba(0,136,255,.03) 40%, transparent 70%);
  pointer-events: none;
}
.hero-label {
  display: inline-block; margin-bottom: 20px;
  padding: 5px 18px; border-radius: 3px;
  font-family: 'Orbitron', sans-serif;
  font-size: .65rem; font-weight: 600;
  color: var(--accent2); letter-spacing: 3px; text-transform: uppercase;
  border: 1px solid rgba(0,255,136,.2);
  background: rgba(0,255,136,.04);
}
.hero h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(1.6rem, 4vw, 2.6rem); font-weight: 800;
  color: var(--text);
  margin-bottom: 6px; letter-spacing: 3px;
  text-transform: uppercase;
}
.hero h1 span {
  background: var(--gradient-main);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-line {
  width: 60px; height: 2px; margin: 18px auto 18px;
  background: var(--gradient-main);
  box-shadow: 0 0 12px rgba(0,255,255,.4);
}
.hero p {
  font-size: .95rem; color: var(--text2); max-width: 520px; margin: 0 auto 32px;
  font-weight: 400; line-height: 1.8; letter-spacing: .3px;
}

/* ── Stats Grid ── */
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; max-width: 700px; margin: 0 auto;
}
.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 12px;
  text-align: center;
  transition: all .3s;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--gradient-main);
  opacity: .6;
}
.stat-card:hover {
  border-color: rgba(0,255,255,.25);
  box-shadow: var(--neon-cyan);
  transform: translateY(-3px);
}
.stat-num {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.6rem; font-weight: 700; color: var(--primary);
  display: block; line-height: 1.2;
  text-shadow: var(--neon-cyan);
}
.stat-label {
  font-size: .68rem; color: var(--text3); text-transform: uppercase;
  letter-spacing: 2px; font-weight: 600; margin-top: 6px;
  font-family: 'Orbitron', sans-serif;
}

/* ── Category Filter ── */
.filter-bar {
  display: flex; flex-wrap: wrap; justify-content: center;
  margin: 40px 0 36px; padding: 0 16px; gap: 8px;
}
.filter-btn {
  padding: 9px 22px; border-radius: 4px; cursor: pointer;
  font-size: .78rem; font-weight: 600; transition: all .3s;
  background: var(--card); color: var(--text2);
  border: 1px solid var(--border);
  letter-spacing: 1px; text-transform: uppercase;
  font-family: 'Rajdhani', sans-serif;
}
.filter-btn:hover {
  background: var(--card-hover); color: var(--text);
  border-color: var(--primary);
  box-shadow: var(--neon-cyan);
}
.filter-btn.active {
  background: rgba(0,255,255,.1);
  color: var(--primary);
  border-color: var(--primary);
  box-shadow: var(--neon-cyan);
}

/* ── Section Title ── */
.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: .75rem; font-weight: 600;
  color: var(--text3); letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 28px; padding-left: 4px;
  display: flex; align-items: center; gap: 12px;
}
.section-title::before {
  content: '//'; color: var(--primary); font-weight: 700;
}
.section-title::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, rgba(0,255,255,.15), transparent);
}

/* ── Product Grid ── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-bottom: 60px;
}
@media (max-width: 1024px) {
  .products-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}

.product-card {
  background: var(--card);
  border-radius: var(--radius-lg); overflow: hidden;
  border: 1px solid var(--border);
  transition: all .4s ease;
  cursor: pointer; position: relative;
  display: flex; flex-direction: column;
}
.product-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--gradient-main);
  opacity: 0; transition: opacity .4s;
}
.product-card:hover {
  transform: translateY(-6px);
  border-color: rgba(0,255,255,.3);
  box-shadow: 0 8px 32px rgba(0,0,0,.5), var(--neon-cyan);
}
.product-card:hover::before { opacity: 1; }

.card-img-wrap {
  position: relative; overflow: hidden;
  height: 180px; background: var(--bg2);
}
.card-img-wrap img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform .5s ease, filter .5s ease;
  filter: brightness(.85) saturate(1.1);
}
.product-card:hover .card-img-wrap img {
  transform: scale(1.08);
  filter: brightness(1) saturate(1.2);
}

.card-tag {
  position: absolute; top: 10px; left: 10px;
  padding: 4px 10px; border-radius: 3px; font-size: .62rem; font-weight: 700;
  background: rgba(5,8,16,.85); color: var(--primary);
  backdrop-filter: blur(8px); letter-spacing: 1px;
  border: 1px solid rgba(0,255,255,.2);
  font-family: 'Orbitron', sans-serif;
  text-transform: uppercase;
}

.card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.card-cat {
  font-size: .62rem; color: var(--accent); font-weight: 700;
  text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;
  font-family: 'Orbitron', sans-serif;
}
.card-title {
  font-size: .88rem; font-weight: 600; line-height: 1.5; margin-bottom: 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; color: var(--text);
  flex: 1;
}
.card-price-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto;
}
.card-price {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem; font-weight: 700; color: var(--primary);
  text-shadow: 0 0 8px rgba(0,255,255,.2);
}
.card-price .from {
  font-size: .6rem; font-weight: 400; color: var(--text3);
  margin-right: 2px; font-family: 'Rajdhani', sans-serif;
  text-shadow: none;
}
.card-arrow {
  width: 30px; height: 30px; border-radius: 4px;
  background: rgba(0,255,255,.04); display: flex;
  align-items: center; justify-content: center;
  color: var(--primary); font-size: .8rem;
  transition: all .3s; border: 1px solid rgba(0,255,255,.1);
}
.product-card:hover .card-arrow {
  background: rgba(0,255,255,.15); color: #fff;
  border-color: var(--primary);
  box-shadow: var(--neon-cyan);
}

/* ── Features ── */
.features {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin: 50px 0;
}
.feature-card {
  background: var(--card);
  border-radius: var(--radius-lg); padding: 28px 20px;
  border: 1px solid var(--border);
  text-align: center;
  transition: all .3s;
  position: relative;
}
.feature-card::after {
  content: ''; position: absolute; bottom: 0; left: 20%; right: 20%;
  height: 1px;
  background: var(--gradient-main);
  opacity: 0; transition: all .3s;
}
.feature-card:hover {
  border-color: rgba(0,255,255,.2);
  transform: translateY(-4px);
  box-shadow: var(--neon-cyan);
}
.feature-card:hover::after { opacity: .6; left: 10%; right: 10%; }
.feature-icon {
  width: 48px; height: 48px; border-radius: 8px; margin: 0 auto 14px;
  background: var(--gradient-subtle);
  display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
  border: 1px solid rgba(0,255,255,.08);
}
.feature-card h3 {
  font-family: 'Orbitron', sans-serif;
  font-size: .82rem; font-weight: 700; margin-bottom: 6px;
  color: var(--text); letter-spacing: 1px;
}
.feature-card p { font-size: .78rem; color: var(--text2); font-weight: 400; }

/* ── Footer ── */
.footer {
  text-align: center; padding: 40px 32px;
  border-top: 1px solid var(--border);
  color: var(--text3); font-size: .75rem;
  position: relative;
}
.footer::before {
  content: ''; position: absolute; top: 0; left: 30%; right: 30%;
  height: 1px;
  background: var(--gradient-main);
  opacity: .3;
}
.footer-line {
  width: 40px; height: 2px; margin: 0 auto 18px;
  background: var(--gradient-main);
  box-shadow: 0 0 8px rgba(0,255,255,.3);
}
.footer a { color: var(--text3); transition: all .3s; }
.footer a:hover { color: var(--primary); text-shadow: var(--neon-cyan); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero { padding: 50px 20px 36px; }
  .hero h1 { font-size: 1.4rem; letter-spacing: 2px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-num { font-size: 1.3rem; }
  .card-img-wrap { height: 140px; }
  .card-body { padding: 12px; }
  .card-title { font-size: .82rem; }
  .header-badge { display: none; }
  .container { padding: 0 16px; }
  .header-inner { padding: 12px 16px; }
  .features { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .feature-card { padding: 20px 14px; }
}
@media (max-width: 480px) {
  .products-grid { gap: 8px; }
  .card-img-wrap { height: 120px; }
  .card-body { padding: 10px; }
  .card-price { font-size: .95rem; }
  .logo-text { font-size: .9rem; letter-spacing: 1px; }
}

/* ── Animations ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 8px rgba(0,255,255,.1); } 50% { box-shadow: 0 0 20px rgba(0,255,255,.25); } }
.animate { animation: fadeUp .5s ease forwards; opacity: 0; }
`;

// ── JS ──
const JS = `
function filterCategory(id, el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.product-card').forEach((c, i) => {
    if (id === 'all' || c.dataset.cat == id) {
      c.style.display = '';
      c.style.animation = 'fadeUp .35s ease forwards';
      c.style.animationDelay = (i * 0.04) + 's';
    } else {
      c.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fadeUp .5s ease forwards';
        e.target.style.animationDelay = (i * 0.06) + 's';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(c => observer.observe(c));
});
`;

function main() {
    const config = loadJSON('config.json') || {};
    const categories = loadJSON('categories.json') || [];
    const products = loadJSON('products.json') || [];
    const meta = loadJSON('meta.json') || {};

    if (!products.length) { console.error('❌ 没有商品数据'); process.exit(1); }

    const siteUrl = meta.siteUrl || process.env.SITE_URL;
    const siteName = SITE_TITLE;
    const GITHUB_PAGES_URL = process.env.GITHUB_PAGES_URL;

    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

    const activeCats = categories.filter(c => products.some(p => p.category_id === c.id));
    const catBtns = activeCats
        .sort((a, b) => (b.sort || 0) - (a.sort || 0))
        .map(c => `<div class="filter-btn" onclick="filterCategory(${c.id}, this)">${esc(c.name)}</div>`)
        .join('\n            ');

    const cards = products.filter(p => p.active !== 0).sort((a, b) => (b.sort||0) - (a.sort||0)).map((p, i) => {
        const cat = categories.find(c => c.id === p.category_id);
        const catName = cat ? cat.name : '';
        const img = p.image_url ? fixImg(p.image_url, siteUrl) : '';
        const variants = p.variants || [];
        const minPrice = variants.length ? Math.min(...variants.map(v => v.price)) : 0;
        const tags = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        const cleanTag = t => t.replace(/b[12]#[0-9a-fA-F]{3,6}/g, '').replace(/#[0-9a-fA-F]{3,6}$/g, '').replace(/\s+/g, ' ').trim();
        const tagLabel = cleanTag(tags[0] || '');

        return `
        <a class="product-card animate" href="${siteUrl}/product?id=${p.id}" target="_blank" rel="noopener"
           data-cat="${p.category_id}" style="animation-delay:${i*0.06}s;text-decoration:none;color:inherit;">
            <div class="card-img-wrap">
                ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy"
                    onerror="this.parentElement.style.background='var(--bg2)'">` : ''}
                ${tagLabel ? `<div class="card-tag">${esc(tagLabel)}</div>` : ''}
            </div>
            <div class="card-body">
                <div class="card-cat">${esc(catName)}</div>
                <div class="card-title">${esc(p.name)}</div>
                <div class="card-price-row">
                    <div class="card-price"><span class="from">起</span>¥${minPrice.toFixed(2)}</div>
                    <div class="card-arrow">→</div>
                </div>
            </div>
        </a>`;
    }).join('\n');

    const ogImage = products[0]?.image_url
        ? fixImg(products[0].image_url, siteUrl)
        : (meta.siteLogo ? fixImg(meta.siteLogo, siteUrl) : '');

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "description": SEO_DESC,
        "url": GITHUB_PAGES_URL,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/product?id={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    const itemListLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": products.filter(p => p.active !== 0).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "Product",
                "name": p.name,
                "url": `${siteUrl}/product?id=${p.id}`,
                "image": p.image_url ? fixImg(p.image_url, siteUrl) : '',
                "offers": {
                    "@type": "Offer",
                    "price": p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : 0,
                    "priceCurrency": "CNY"
                }
            }
        }))
    };

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(siteName)}${SEO_TITLE_SUFFIX ? ' - ' + esc(SEO_TITLE_SUFFIX) : ''}</title>
    <meta name="description" content="${esc(SEO_DESC)}">
    <meta name="keywords" content="${esc(SEO_KEYWORDS)}">
    <meta name="author" content="${esc(SEO_AUTHOR)}">
    <meta name="robots" content="${esc(SEO_ROBOTS)}">
    <meta name="googlebot" content="${esc(SEO_ROBOTS)}">
    ${SEO_CANONICAL ? `<link rel="canonical" href="${esc(SEO_CANONICAL)}">` : ''}
    <meta property="og:type" content="${esc(SEO_OG.type || 'website')}">
    <meta property="og:url" content="${esc(SEO_OG.url || GITHUB_PAGES_URL)}">
    <meta property="og:title" content="${esc(siteName)}">
    <meta property="og:description" content="${esc(SEO_DESC)}">
    ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
    <meta property="og:locale" content="${esc(SEO_OG.locale || 'zh_CN')}">
    <meta property="og:site_name" content="${esc(SEO_OG.siteName || siteName)}">
    <meta name="twitter:card" content="${esc(SEO_TWITTER.card || 'summary_large_image')}">
    <meta name="twitter:title" content="${esc(siteName)}">
    <meta name="twitter:description" content="${esc(SEO_DESC)}">
    ${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}
    <script type="application/ld+json">${JSON.stringify({...SEO_JSON_LD, ...jsonLd})}</script>
    <script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
    ${SEO_FAVICON ? `<link rel="icon" href="${esc(SEO_FAVICON)}">` : ''}
    <style>${CSS}</style>
</head>
<body>

<header class="header">
    <div class="header-inner">
        <div class="logo-area">
            <div class="logo-wrap"><img src="${esc(fixImg(meta.siteLogo || '', siteUrl))}" alt="${esc(siteName)}"></div>
            <div>
                <div class="logo-text">${esc(siteName)}</div>
                <div class="logo-sub">原址：<a href="${siteUrl}" target="_blank" rel="noopener">${esc(siteUrl)}</a></div>
            </div>
        </div>
        <div class="header-right">
            <div class="header-status"></div>
            <div class="header-badge">SYSTEM ONLINE</div>
        </div>
    </div>
</header>

<section class="hero">
    <div class="container">
        <div class="hero-label">// ACCOUNT RESOURCE CENTER</div>
        <h1>精选<span>优质账号</span>资源</h1>
        <div class="hero-line"></div>
        <p>自动发货，安全快捷，一站式解决账号与网站需求，稳定可靠，支持长期使用。</p>
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-num">${categories.length}</span>
                <span class="stat-label">分类</span>
            </div>
            <div class="stat-card">
                <span class="stat-num">${products.filter(p=>p.active!==0).length}</span>
                <span class="stat-label">商品</span>
            </div>
            <div class="stat-card">
                <span class="stat-num">${products.reduce((s,p) => s + (p.variants?.length||0), 0)}</span>
                <span class="stat-label">规格</span>
            </div>
            <div class="stat-card">
                <span class="stat-num">24H</span>
                <span class="stat-label">发货</span>
            </div>
        </div>
    </div>
</section>

<div class="container">

    <div class="section-title">PRODUCTS</div>

    <div class="filter-bar">
            <div class="filter-btn active" onclick="filterCategory('all', this)">ALL</div>
            ${catBtns}
    </div>

    <div class="products-grid">
        ${cards}
    </div>

    <div class="section-title">FEATURES</div>

    <div class="features">
        <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>即时发货</h3>
            <p>付款后自动发货，无需等待</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h3>品质保障</h3>
            <p>质保期内首登有问题可换</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>价格实惠</h3>
            <p>源头资源，性价比高</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>可选号码</h3>
            <p>支持自选靓号，精准匹配</p>
        </div>
    </div>

</div>

<footer class="footer">
    <div class="container">
        <div class="footer-line"></div>
        <p style="margin-bottom:8px">© ${new Date().getFullYear()} ${esc(siteName)} · 所有商品均为虚拟数字商品</p>
        <p style="margin-bottom:8px">
            <a href="${siteUrl}" target="_blank" rel="noopener">进入商城</a>
        </p>
        <p style="color:var(--text-muted);font-size:.7rem;letter-spacing:1px;">商城原址：<a href="${siteUrl}" target="_blank" rel="noopener">${esc(siteUrl)}</a></p>
    </div>
</footer>

<script>${JS}</script>
</body>
</html>`;

    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
    console.log(`✅ dist/index.html (${(Buffer.byteLength(html)/1024).toFixed(1)}KB)`);
    console.log(`   商品: ${products.filter(p=>p.active!==0).length} 个`);
    console.log(`   分类: ${activeCats.length} 个`);
    console.log(`   SEO: keywords + description + OG + JSON-LD`);
    console.log(`   风格: 科幻`);
    console.log(`   链接: 全部指向 ${siteUrl}/product?id=xxx`);
}

main();
