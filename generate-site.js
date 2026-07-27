#!/usr/bin/env node
/**
 * 轻奢风格静态站生成器 - SEO优化 + 商品展示 + 跳转原站
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

// ── CSS: 轻奢风格 ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --bg: #faf8f5;
  --bg2: #f5f0ea;
  --card: #ffffff;
  --card-hover: #fffdfb;
  --border: #e8e0d6;
  --border-light: #f0ebe4;
  --primary: #b8965a;
  --primary-light: #d4b478;
  --primary-dark: #9a7a42;
  --accent: #c9a96e;
  --accent-light: #e8d5a8;
  --text: #2c2520;
  --text2: #6b5e52;
  --text3: #9b8e82;
  --text-muted: #b8ada2;
  --gold-gradient: linear-gradient(135deg, #d4b478 0%, #b8965a 50%, #c9a96e 100%);
  --gold-shine: linear-gradient(135deg, #e8d5a8 0%, #d4b478 30%, #b8965a 60%, #c9a96e 100%);
  --radius: 12px;
  --radius-lg: 20px;
  --max-w: 1200px;
  --shadow-sm: 0 2px 8px rgba(44,37,32,.04);
  --shadow-md: 0 4px 20px rgba(44,37,32,.06);
  --shadow-lg: 0 8px 40px rgba(44,37,32,.08);
  --shadow-gold: 0 4px 20px rgba(184,150,90,.12);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.7;
  min-height: 100vh; overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── 背景纹理 ── */
body::before {
  content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(184,150,90,.04) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 100%, rgba(201,169,110,.03) 0%, transparent 60%);
  pointer-events: none; z-index: 0;
}

a { color: var(--primary); text-decoration: none; transition: color .3s; }
a:hover { color: var(--primary-dark); }
img { max-width: 100%; height: auto; }

.container { max-width: var(--max-w); margin: 0 auto; padding: 0 32px; position: relative; z-index: 1; }

/* ── Header ── */
.header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(250,248,245,.92); backdrop-filter: blur(24px) saturate(1.2);
  border-bottom: 1px solid var(--border-light);
}
.header-inner {
  max-width: var(--max-w); margin: 0 auto; padding: 18px 32px;
  display: flex; align-items: center; justify-content: space-between;
}
.logo-area { display: flex; align-items: center; }
.logo-area > *:first-child { margin-right: 14px; }
.logo-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--gold-gradient);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 700; color: #fff;
  box-shadow: var(--shadow-gold);
}
.logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem; font-weight: 600; letter-spacing: .5px;
  color: var(--text);
}
.header-badge {
  padding: 7px 18px; border-radius: 24px; font-size: .75rem; font-weight: 500;
  background: rgba(184,150,90,.08); color: var(--primary);
  border: 1px solid rgba(184,150,90,.15);
  letter-spacing: .5px;
}

/* ── Hero ── */
.hero {
  text-align: center; padding: 80px 32px 60px; position: relative;
}
.hero::before {
  content: ''; position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%; max-width: 800px; height: 100%;
  background: radial-gradient(ellipse, rgba(184,150,90,.06) 0%, transparent 70%);
  pointer-events: none;
}
.hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 600;
  color: var(--text);
  margin-bottom: 8px; letter-spacing: 1px;
}
.hero-divider {
  width: 48px; height: 2px; margin: 16px auto 20px;
  background: var(--gold-gradient);
  border-radius: 2px;
}
.hero p {
  font-size: 1rem; color: var(--text2); max-width: 560px; margin: 0 auto 36px;
  font-weight: 300; line-height: 1.8;
}
.hero-stats {
  display: flex; justify-content: center; flex-wrap: wrap;
}
.hero-stats .stat-item { margin: 0 24px; }
.stat-item { text-align: center; }
.stat-num {
  font-family: 'Playfair Display', serif;
  font-size: 2rem; font-weight: 600; color: var(--primary);
  display: block; line-height: 1.2;
}
.stat-label {
  font-size: .72rem; color: var(--text3); text-transform: uppercase;
  letter-spacing: 2px; font-weight: 500; margin-top: 4px;
}

/* ── Category Filter ── */
.filter-bar {
  display: flex; flex-wrap: wrap; justify-content: center;
  margin-bottom: 40px; padding: 0 16px;
}
.filter-bar .filter-btn { margin: 5px; }
.filter-btn {
  padding: 10px 24px; border-radius: 24px; cursor: pointer;
  font-size: .85rem; font-weight: 500; transition: all .3s;
  background: var(--card); color: var(--text2); border: 1px solid var(--border);
  letter-spacing: .3px;
}
.filter-btn:hover {
  background: var(--card-hover); color: var(--text);
  border-color: var(--primary-light); box-shadow: var(--shadow-sm);
}
.filter-btn.active {
  background: var(--gold-gradient);
  color: #fff; border-color: transparent; box-shadow: var(--shadow-gold);
}

/* ── Product Grid ── */
.products-grid {
  display: flex; flex-wrap: wrap;
  margin: -12px; margin-bottom: 60px;
}
.products-grid .product-card {
  flex: 1 1 260px; margin: 12px;
  max-width: calc(25% - 24px);
}
@media (max-width: 768px) {
  .products-grid .product-card { flex: 0 0 calc(50% - 14px); margin: 7px; max-width: none; }
}

.product-card {
  background: var(--card); border-radius: var(--radius-lg); overflow: hidden;
  border: 1px solid var(--border-light); transition: all .4s ease;
  cursor: pointer; position: relative;
  box-shadow: var(--shadow-sm);
}
.product-card:hover {
  transform: translateY(-8px); border-color: var(--accent-light);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(184,150,90,.08);
}

.card-img-wrap {
  position: relative; overflow: hidden;
  height: 200px; background: var(--bg2);
}
.card-img-wrap img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform .5s ease;
}
.product-card:hover .card-img-wrap img { transform: scale(1.06); }

.card-tag {
  position: absolute; top: 14px; left: 14px;
  padding: 5px 12px; border-radius: 6px; font-size: .68rem; font-weight: 600;
  background: rgba(255,255,255,.92); color: var(--primary-dark);
  backdrop-filter: blur(8px); letter-spacing: .5px;
  border: 1px solid rgba(184,150,90,.12);
  box-shadow: var(--shadow-sm);
}

.card-body { padding: 20px; }
.card-cat {
  font-size: .7rem; color: var(--primary); font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;
}
.card-title {
  font-size: .92rem; font-weight: 600; line-height: 1.5; margin-bottom: 14px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; color: var(--text);
}
.card-price-row {
  display: flex; align-items: center; justify-content: space-between;
}
.card-price {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem; font-weight: 600; color: var(--primary-dark);
}
.card-price .from { font-size: .7rem; font-weight: 400; color: var(--text3); margin-right: 2px; }
.card-arrow {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(184,150,90,.06); display: flex;
  align-items: center; justify-content: center;
  color: var(--primary); font-size: .85rem;
  transition: all .3s; border: 1px solid rgba(184,150,90,.1);
}
.product-card:hover .card-arrow {
  background: var(--gold-gradient); color: #fff;
  border-color: transparent; box-shadow: var(--shadow-gold);
}

/* ── Features ── */
.features {
  display: flex; flex-wrap: wrap;
  margin: 60px -10px;
}
.feature-card {
  flex: 1 1 240px; margin: 10px;
}
.feature-card {
  background: var(--card); border-radius: var(--radius-lg); padding: 32px;
  border: 1px solid var(--border-light); text-align: center;
  transition: all .3s; box-shadow: var(--shadow-sm);
}
.feature-card:hover {
  border-color: var(--accent-light); transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.feature-icon {
  width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 18px;
  background: linear-gradient(135deg, rgba(184,150,90,.08), rgba(201,169,110,.05));
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  border: 1px solid rgba(184,150,90,.08);
}
.feature-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1rem; font-weight: 600; margin-bottom: 8px;
  color: var(--text);
}
.feature-card p { font-size: .82rem; color: var(--text2); font-weight: 300; }

/* ── Footer ── */
.footer {
  text-align: center; padding: 48px 32px;
  border-top: 1px solid var(--border-light);
  color: var(--text3); font-size: .8rem;
}
.footer-divider {
  width: 32px; height: 1px; margin: 0 auto 20px;
  background: var(--gold-gradient);
}
.footer a { color: var(--text3); transition: color .3s; }
.footer a:hover { color: var(--primary); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero { padding: 50px 20px 40px; }
  .hero h1 { font-size: 1.6rem; }
  .hero-stats .stat-item { margin: 0 14px; }
  .stat-num { font-size: 1.5rem; }
  .card-img-wrap { height: 150px; }
  .card-body { padding: 14px; }
  .card-title { font-size: .85rem; }
  .header-badge { display: none; }
  .container { padding: 0 16px; }
  .header-inner { padding: 14px 16px; }
  .features .feature-card { flex: 0 0 calc(50% - 20px); margin: 10px; }
  .feature-card { padding: 20px; }
}
@media (max-width: 480px) {
  .products-grid .product-card { flex: 0 0 calc(50% - 10px); margin: 5px; max-width: none; }
  .card-img-wrap { height: 130px; }
  .card-body { padding: 10px; }
  .features { grid-template-columns: 1fr; }
}

/* ── Animations ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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

    // 确保输出目录存在
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

    // ── 分类按钮 ──
    const activeCats = categories.filter(c => products.some(p => p.category_id === c.id));
    const catBtns = activeCats
        .sort((a, b) => (b.sort || 0) - (a.sort || 0))
        .map(c => `<div class="filter-btn" onclick="filterCategory(${c.id}, this)">${esc(c.name)}</div>`)
        .join('\n            ');

    // ── 商品卡片 ──
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

    // ── OG 图片 ──
    const ogImage = products[0]?.image_url
        ? fixImg(products[0].image_url, siteUrl)
        : (meta.siteLogo ? fixImg(meta.siteLogo, siteUrl) : '');

    // ── 结构化数据 (JSON-LD) ──
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

    // ── 首页 HTML ──
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- SEO Meta -->
    <title>${esc(siteName)}${SEO_TITLE_SUFFIX ? ' - ' + esc(SEO_TITLE_SUFFIX) : ''}</title>
    <meta name="description" content="${esc(SEO_DESC)}">
    <meta name="keywords" content="${esc(SEO_KEYWORDS)}">
    <meta name="author" content="${esc(SEO_AUTHOR)}">
    <meta name="robots" content="${esc(SEO_ROBOTS)}">
    <meta name="googlebot" content="${esc(SEO_ROBOTS)}">
    ${SEO_CANONICAL ? `<link rel="canonical" href="${esc(SEO_CANONICAL)}">` : ''}

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${esc(SEO_OG.type || 'website')}">
    <meta property="og:url" content="${esc(SEO_OG.url || GITHUB_PAGES_URL)}">
    <meta property="og:title" content="${esc(siteName)}">
    <meta property="og:description" content="${esc(SEO_DESC)}">
    ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
    <meta property="og:locale" content="${esc(SEO_OG.locale || 'zh_CN')}">
    <meta property="og:site_name" content="${esc(SEO_OG.siteName || siteName)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="${esc(SEO_TWITTER.card || 'summary_large_image')}">
    <meta name="twitter:title" content="${esc(siteName)}">
    <meta name="twitter:description" content="${esc(SEO_DESC)}">
    ${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}

    <!-- Structured Data -->
    <script type="application/ld+json">${JSON.stringify({...SEO_JSON_LD, ...jsonLd})}</script>
    <script type="application/ld+json">${JSON.stringify(itemListLd)}</script>

    <!-- Favicon -->
    ${SEO_FAVICON ? `<link rel="icon" href="${esc(SEO_FAVICON)}">` : ''}

    <style>${CSS}</style>
</head>
<body>

<header class="header">
    <div class="header-inner">
        <div class="logo-area">
            <img src="${esc(fixImg(meta.siteLogo || '', siteUrl))}" alt="${esc(siteName)}" style="height:40px;max-width:120px;">
            <div>
                <div class="logo-text">${esc(siteName)}</div>
                <div style="font-size:.78rem;color:var(--text3);margin-top:-5px;">商城原址：<a href="${siteUrl}" target="_blank" rel="noopener" style="color:var(--text3)">${esc(siteUrl)}</a></div>
            </div>
        </div>
        <div class="header-badge">🔒 自动发货 · 安全可靠</div>
    </div>
</header>

<section class="hero">
    <div class="container">
        <h1>精选优质账号资源</h1>
        <div class="hero-divider"></div>
        <p>自动发货，安全快捷，一站式解决账号与网站需求，稳定可靠，支持长期使用。</p>
        <div class="hero-stats">
            <div class="stat-item">
                <span class="stat-num">${categories.length}</span>
                <span class="stat-label">商品分类</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${products.filter(p=>p.active!==0).length}</span>
                <span class="stat-label">在售商品</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${products.reduce((s,p) => s + (p.variants?.length||0), 0)}</span>
                <span class="stat-label">可选规格</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">24h</span>
                <span class="stat-label">自动发货</span>
            </div>
        </div>
    </div>
</section>

<div class="container">

    <!-- 分类过滤 -->
    <div class="filter-bar">
            <div class="filter-btn active" onclick="filterCategory('all', this)">全部商品</div>
            ${catBtns}
    </div>

    <!-- 商品网格 -->
    <div class="products-grid">
        ${cards}
    </div>

    <!-- 特性介绍 -->
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
        <div class="footer-divider"></div>
        <p style="margin-bottom:8px">© ${new Date().getFullYear()} ${esc(siteName)} · 所有商品均为虚拟数字商品</p>
        <p style="margin-bottom:8px">
            <a href="${siteUrl}" target="_blank" rel="noopener">进入商城</a>
        </p>
        <p style="color:var(--text-muted);font-size:.75rem;">商城原址：<a href="${siteUrl}" target="_blank" rel="noopener">${esc(siteUrl)}</a></p>
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
    console.log(`   风格: 轻奢`);
    console.log(`   链接: 全部指向 ${siteUrl}/product?id=xxx`);
}

main();
