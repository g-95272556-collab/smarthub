// Splash Perasmian — dipindah dari index.html untuk CSP compliance
/* ── Splash: semak flag SEGERA sebelum page render ── */
/* ── Splash dipaparkan SELEPAS login — dipanggil oleh app.js (checkAndShowSplash) ── */
window.showSplashPerasmian = function (previewMode) {
  var splash = document.getElementById('splashLaunch');
  if (!splash) return;

  if (window._splashAutoCloseTimer) {
    clearTimeout(window._splashAutoCloseTimer);
    window._splashAutoCloseTimer = null;
  }

  /* Reset state sekiranya dipanggil semula (preview) */
  splash.style.opacity = '1';
  splash.style.display = 'flex';
  var card = document.getElementById('splashCard');
  if (card) { card.style.opacity = '1'; card.style.transition = ''; }
  var prs = document.getElementById('splashPerasmian');
  if (prs) { prs.style.display = 'none'; prs.style.opacity = '1'; }
  var celeb = document.getElementById('splashCelebration');
  if (celeb) { celeb.style.display = 'none'; }
  var flash = document.getElementById('splashFlash');
  if (flash) { flash.style.opacity = '0'; flash.style.transition = ''; }
  var btn = document.getElementById('splashBtn');
  if (btn) { btn.disabled = false; var bt = btn.querySelector('.btn-text'); if (bt) bt.textContent = 'RASMIKAN SEKARANG'; }

  /* Preview badge */
  var prevBadge = document.getElementById('splashPreviewBadge');
  if (previewMode) {
    if (!prevBadge) {
      prevBadge = document.createElement('div');
      prevBadge.id = 'splashPreviewBadge';
      prevBadge.style.cssText = 'position:absolute;top:18px;right:18px;z-index:10;background:rgba(255,100,0,0.85);color:#fff;font-size:8pt;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;text-transform:uppercase';
      prevBadge.textContent = 'PREVIEW';
      splash.appendChild(prevBadge);
    }
    /* Butang tutup preview */
    var closeBtn = document.getElementById('splashClosePreview');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.id = 'splashClosePreview';
      closeBtn.style.cssText = 'position:absolute;top:18px;left:18px;z-index:10;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:8.5pt;padding:6px 14px;border-radius:999px;cursor:pointer';
      closeBtn.textContent = '✕ Tutup Preview';
      closeBtn.onclick = function() {
        splash.style.transition = 'opacity 0.4s ease';
        splash.style.opacity = '0';
        setTimeout(function(){ splash.style.display = 'none'; splash.style.transition = ''; splash.style.opacity = '1'; }, 400);
        if (window._splashRaf) { cancelAnimationFrame(window._splashRaf); window._splashRaf = null; }
      };
      splash.appendChild(closeBtn);
    }
  } else {
    if (prevBadge) prevBadge.remove();
    var cb = document.getElementById('splashClosePreview');
    if (cb) cb.remove();

    var skipBtn = document.getElementById('splashCloseSkip');
    if (!skipBtn) {
      skipBtn = document.createElement('button');
      skipBtn.id = 'splashCloseSkip';
      skipBtn.style.cssText = 'position:absolute;top:18px;left:18px;z-index:10;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:8.5pt;padding:6px 14px;border-radius:999px;cursor:pointer';
      skipBtn.textContent = 'Tutup Sementara';
      skipBtn.onclick = function() {
        splash.style.transition = 'opacity 0.4s ease';
        splash.style.opacity = '0';
        setTimeout(function(){ splash.style.display = 'none'; splash.style.transition = ''; splash.style.opacity = '1'; }, 400);
        if (window._splashRaf) { cancelAnimationFrame(window._splashRaf); window._splashRaf = null; }
        if (window._splashAutoCloseTimer) { clearTimeout(window._splashAutoCloseTimer); window._splashAutoCloseTimer = null; }
      };
      splash.appendChild(skipBtn);
    }
  }

  /* Tarikh */
  var t = new Date();
  var HARI  = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
  var BULAN = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
  var tEl = document.getElementById('splashTarikh');
  if (tEl) tEl.textContent = HARI[t.getDay()] + ', ' + t.getDate() + ' ' + BULAN[t.getMonth()] + ' ' + t.getFullYear();

  /* Versi */
  var cfgVer = '';
  try { cfgVer = (localStorage.getItem('SPLASH_CFG_VERSI') || '').trim() || ((window.SMARTSCHOOLHUB_RUNTIME_CONFIG || {}).appVersion || ''); } catch(e) {}
  var verEl = document.getElementById('splashVer');
  if (verEl && cfgVer) verEl.textContent = 'Versi ' + cfgVer + '  ·  ' + HARI[t.getDay()] + ', ' + t.getDate() + ' ' + BULAN[t.getMonth()] + ' ' + t.getFullYear();

  /* Nama GB */
  (function () {
    var el = document.getElementById('splashGBName');
    if (!el) return;
    var cfgGb = ((window.SMARTSCHOOLHUB_RUNTIME_CONFIG || {}).gbName || '').trim();
    if (cfgGb) { el.textContent = cfgGb; return; }
    var lsGb = ''; try { lsGb = (localStorage.getItem('AMARAN_CFG_GB') || '').trim(); } catch(e) {}
    if (lsGb) { el.textContent = lsGb; return; }
    if (window.APP && window.APP.user && window.APP.user.name) {
      el.textContent = window.APP.user.name;
      return;
    }
    el.textContent = '';
  })();

  /* Sequential reveal */
  var rvEls = document.querySelectorAll('#splashCard .splash-rv');
  rvEls.forEach(function (el, i) {
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 250 + i * 110);
  });

  /* Starfield */
  if (window._splashRaf) { cancelAnimationFrame(window._splashRaf); window._splashRaf = null; }
  var canvas = document.getElementById('splashCanvas');
  if (!canvas) return;
  function rsz() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  rsz();
  window.addEventListener('resize', rsz);
  var ctx = canvas.getContext('2d');
  var stars = [];
  for (var i = 0; i < 140; i++) {
    stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.6+0.3, phase: Math.random()*Math.PI*2,
      spd: Math.random()*0.013+0.004, gold: Math.random()>0.62 });
  }
  function animStars(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(function (s) {
      var a = 0.12 + 0.55 * Math.abs(Math.sin(s.phase + (ts||0) * s.spd * 0.01));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = s.gold ? 'rgba(255,215,0,'+a+')' : 'rgba(155,210,255,'+a+')';
      ctx.fill();
    });
    window._splashRaf = requestAnimationFrame(animStars);
  }
  animStars();

  if (!previewMode) {
    window._splashAutoCloseTimer = setTimeout(function() {
      var curSplash = document.getElementById('splashLaunch');
      if (!curSplash) return;
      curSplash.style.transition = 'opacity 0.5s ease';
      curSplash.style.opacity = '0';
      setTimeout(function() {
        if (curSplash && curSplash.parentNode) curSplash.parentNode.removeChild(curSplash);
        if (window._splashRaf) { cancelAnimationFrame(window._splashRaf); window._splashRaf = null; }
        if (window._splashAutoCloseTimer) { clearTimeout(window._splashAutoCloseTimer); window._splashAutoCloseTimer = null; }
      }, 500);
    }, 12000);
  }
};

/* ── Fungsi Rasmikan ─────────────────────────────────────────────── */
function splashRasmikan() {
  var btn = document.getElementById('splashBtn');
  if (btn) {
    btn.disabled = true;
    var btnTxt = btn.querySelector('.btn-text');
    if (btnTxt) btnTxt.textContent = '✦ Merakamkan perasmian...';
  }
  try { localStorage.setItem('smarthubLaunched', '1'); } catch (e) {}
  if (window._splashAutoCloseTimer) {
    clearTimeout(window._splashAutoCloseTimer);
    window._splashAutoCloseTimer = null;
  }

  /* Shoot particles from button */
  splashShootParticles();

  setTimeout(function () {
    /* Fade out card */
    var card = document.getElementById('splashCard');
    if (card) { card.style.transition = 'opacity 0.5s ease'; card.style.opacity = '0'; }

    /* ── Isi data perasmian ── */
    var prs = document.getElementById('splashPerasmian');
    var prsGBName = document.getElementById('splashPrsGBName');
    var prsDatetime = document.getElementById('splashPrsDatetime');

    /* Nama perasmi — ambil dari konfigurasi splash, fallback bertingkat */
    if (prsGBName) {
      var gbEl = document.getElementById('splashGBName');
      /* Guna nama yang sudah dimuatkan pada kad splash */
      var gbName = (gbEl && gbEl.textContent.trim() !== '——————————————') ? gbEl.textContent.trim() : '';
      if (gbName) {
        prsGBName.textContent = gbName;
      } else {
        prsGBName.textContent = (window.SMARTSCHOOLHUB_RUNTIME_CONFIG || {}).gbName || localStorage.getItem('AMARAN_CFG_GB') || (window.APP && window.APP.user && window.APP.user.name) || '——————————';
      }
    }

    /* Tarikh & masa perasmian */
    if (prsDatetime) {
      var t = new Date();
      var HARI  = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
      var BULAN = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
      var hh = t.getHours().toString().padStart(2,'0');
      var mm = t.getMinutes().toString().padStart(2,'0');
      prsDatetime.textContent = HARI[t.getDay()] + ', ' + t.getDate() + ' ' + BULAN[t.getMonth()] + ' ' + t.getFullYear() + '  ·  ' + hh + ':' + mm;
    }

    /* ── Tunjuk screen perasmian ── */
    setTimeout(function () {
      if (prs) prs.style.display = 'flex';

      /* Flash kilat pada saat perasmian */
      var flash = document.getElementById('splashFlash');
      if (flash) {
        flash.style.opacity = '1';
        setTimeout(function () { flash.style.transition = 'opacity 0.55s ease'; flash.style.opacity = '0'; }, 80);
      }

      /* Fanfare + Fireworks + Confetti mula selepas kad perasmian muncul */
      setTimeout(function () {
        splashDoFireworks();
        splashDoConfetti();
      }, 600);

      /* Selepas ~4.5s — fade screen perasmian, tunjuk teks sambutan */
      setTimeout(function () {
        if (prs) { prs.style.transition = 'opacity 0.9s ease'; prs.style.opacity = '0'; }

        var celeb = document.getElementById('splashCelebration');
        var ct    = document.getElementById('splashCelebTitle');
        setTimeout(function () {
          if (celeb) celeb.style.display = 'flex';
          if (ct) {
            ct.style.animation = 'splashCelebPop 0.55s cubic-bezier(0.175,0.885,0.32,1.275) forwards';
            ct.textContent = '🎊 RASMI DILANCARKAN! 🎊';
          }
        }, 500);
      }, 4500);

      /* Fade out keseluruhan splash & buang dari DOM — pause 8 saat selepas celebration */
      setTimeout(function () {
        var splash = document.getElementById('splashLaunch');
        if (!splash) return;
        splash.style.transition = 'opacity 1.2s ease';
        splash.style.opacity = '0';
        setTimeout(function () {
        if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
        if (window._splashRaf) cancelAnimationFrame(window._splashRaf);
        if (window._splashAutoCloseTimer) { clearTimeout(window._splashAutoCloseTimer); window._splashAutoCloseTimer = null; }
      }, 1200);
    }, 14000); /* 4500ms (perasmian screen) + 1000ms (transition) + 8000ms (pause) = ~13500 */
  }, 600);

  }, 700);
}

function splashShootParticles() {
  var canvas = document.getElementById('splashCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var cx = canvas.width / 2, cy = canvas.height * 0.8;
  var pw = [];
  for (var i = 0; i < 70; i++) {
    var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
    var spd = Math.random() * 9 + 3;
    pw.push({ x: cx, y: cy, dx: Math.cos(ang)*spd, dy: Math.sin(ang)*spd,
      r: Math.random()*3+0.8, a: 1, g: 0.2,
      c: ['#ffd700','#fff','#90c4ff','#ffb300'][Math.floor(Math.random()*4)] });
  }
  function a() {
    pw = pw.filter(function (p) {
      p.x+=p.dx; p.y+=p.dy; p.dy+=p.g; p.a-=0.032;
      if (p.a<=0) return false;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c; ctx.globalAlpha=p.a; ctx.fill(); ctx.globalAlpha=1;
      return true;
    });
    if (pw.length>0) requestAnimationFrame(a);
  }
  a();
}

function splashDoFireworks() {
  var canvas = document.getElementById('splashCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._splashRaf) cancelAnimationFrame(window._splashRaf);
  var W = canvas.width, H = canvas.height;
  var particles = [];

  /* ── Palet warna premium ── */
  var PAL = {
    gold:    ['#ffd700','#ffe566','#fff4b0','#ffec80','#ffc200'],
    silver:  ['#ffffff','#e8f4ff','#c8e6ff','#a0d0ff','#ddeeff'],
    rose:    ['#ffb3cc','#ffccdd','#ff88aa','#ffaabb','#ee6699'],
    mint:    ['#88ffee','#aaffdd','#55eedd','#ccfff4','#00ddbb'],
    violet:  ['#cc99ff','#ddb8ff','#bb77ff','#eeddff','#9944ee'],
    champagne:['#f7e7ce','#eedcba','#fff4e0','#ffeac0','#e8c87a'],
  };
  var PALS = [PAL.gold, PAL.silver, PAL.rose, PAL.mint, PAL.violet, PAL.champagne];

  /* ── Jenis letupan ── */
  function burstCircular(x, y, pal, n, spd) {
    n = n || 80; spd = spd || 1;
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI*2/n)*i + (Math.random()-0.5)*0.25;
      var s = (Math.random()*3+3)*spd;
      particles.push({ x:x, y:y, dx:Math.cos(ang)*s, dy:Math.sin(ang)*s,
        r:Math.random()*2+0.8, a:1, fade:0.007+Math.random()*0.005, g:0.055,
        c:pal[i%pal.length], trail:[], mt:5 });
    }
  }

  function burstChrysanthemum(x, y, pal) {
    [1.0, 0.62, 0.38].forEach(function(sp, wi) {
      setTimeout(function() {
        var n = 52 - wi*10;
        for (var i = 0; i < n; i++) {
          var ang = (Math.PI*2/n)*i;
          var s = (Math.random()*1.5+4)*sp;
          particles.push({ x:x, y:y, dx:Math.cos(ang)*s, dy:Math.sin(ang)*s-0.3,
            r:Math.random()*1.8+0.6, a:1, fade:0.005+Math.random()*0.004, g:0.045,
            c:pal[wi%pal.length], trail:[], mt:7 });
        }
      }, wi*90);
    });
  }

  function burstRing(x, y, pal) {
    var n = 55, s = 7.5;
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI*2/n)*i;
      particles.push({ x:x, y:y, dx:Math.cos(ang)*s, dy:Math.sin(ang)*s,
        r:2.2, a:1, fade:0.008, g:0.04, c:pal[0], trail:[], mt:4 });
    }
    /* pusat berkilat */
    for (var j = 0; j < 25; j++) {
      var a2 = Math.random()*Math.PI*2, s2 = Math.random()*2.5+0.5;
      particles.push({ x:x, y:y, dx:Math.cos(a2)*s2, dy:Math.sin(a2)*s2-0.5,
        r:Math.random()*1.2+0.4, a:1, fade:0.018, g:0.07, c:'#ffffff', trail:[], mt:3 });
    }
  }

  function burstStar(x, y, pal) {
    for (var arm = 0; arm < 5; arm++) {
      var base = (Math.PI*2/5)*arm - Math.PI/2;
      for (var i = 0; i < 14; i++) {
        var t = i/13;
        var ang = base + (t-0.5)*0.22;
        var s = 3 + (1-Math.abs(t-0.5)*2)*5.5;
        particles.push({ x:x, y:y, dx:Math.cos(ang)*s, dy:Math.sin(ang)*s,
          r:Math.random()*1.8+0.7, a:1, fade:0.006, g:0.06,
          c:pal[arm%pal.length], trail:[], mt:6 });
      }
    }
  }

  /* ── Roket naik kemudian meletup ── */
  function launchRocket(tx, ty, pal, type, delay) {
    setTimeout(function() {
      var sx = tx + (Math.random()-0.5)*80;
      var dur = 700 + Math.random()*350;
      var t0 = performance.now();
      var trail = [];
      function animR(now) {
        var t = Math.min((now-t0)/dur, 1);
        var e = 1 - Math.pow(1-t, 3);
        var cx = sx+(tx-sx)*e, cy = (H+10)+(ty-H-10)*e;
        trail.push({x:cx, y:cy});
        if (trail.length > 10) trail.shift();
        trail.forEach(function(tp, i) {
          var ta = (i/trail.length)*0.55;
          ctx.beginPath(); ctx.arc(tp.x, tp.y, 1.8*(i/trail.length), 0, Math.PI*2);
          ctx.fillStyle = pal[0]; ctx.globalAlpha = ta; ctx.fill(); ctx.globalAlpha = 1;
        });
        /* kepala roket */
        ctx.beginPath(); ctx.arc(cx, cy, 2.8, 0, Math.PI*2);
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
        if (t < 1) { requestAnimationFrame(animR); }
        else {
          switch(type) {
            case 'chrysanthemum': burstChrysanthemum(tx, ty, pal); break;
            case 'ring':  burstRing(tx, ty, pal); break;
            case 'star':  burstStar(tx, ty, pal); break;
            default:      burstCircular(tx, ty, pal, 85); break;
          }
          burstCircular(tx, ty, ['#fff', pal[0]], 18, 0.45); /* kilat pusat */
        }
      }
      requestAnimationFrame(animR);
    }, delay);
  }

  /* ── Jadual pelancaran ── */
  var cx = W/2, cy = H/2;
  [
    { x:cx,       y:cy*0.28, p:PAL.gold,      t:'chrysanthemum', d:0    },
    { x:cx*0.28,  y:cy*0.38, p:PAL.silver,    t:'ring',          d:320  },
    { x:cx*1.72,  y:cy*0.38, p:PAL.violet,    t:'ring',          d:320  },
    { x:cx*0.5,   y:cy*0.22, p:PAL.rose,      t:'star',          d:780  },
    { x:cx*1.5,   y:cy*0.22, p:PAL.mint,      t:'star',          d:900  },
    { x:cx,       y:cy*0.18, p:PAL.champagne, t:'chrysanthemum', d:1300 },
    { x:cx*0.22,  y:cy*0.32, p:PAL.gold,      t:'circular',      d:1750 },
    { x:cx*1.78,  y:cy*0.32, p:PAL.silver,    t:'circular',      d:1950 },
    { x:cx,       y:cy*0.25, p:PAL.violet,    t:'ring',          d:2400 },
    { x:cx*0.38,  y:cy*0.18, p:PAL.mint,      t:'star',          d:2850 },
    { x:cx*1.62,  y:cy*0.18, p:PAL.rose,      t:'star',          d:3050 },
    { x:cx,       y:cy*0.2,  p:PAL.gold,      t:'chrysanthemum', d:3500 },
    { x:cx*0.3,   y:cy*0.28, p:PAL.champagne, t:'ring',          d:4000 },
    { x:cx*1.7,   y:cy*0.28, p:PAL.silver,    t:'ring',          d:4200 },
  ].forEach(function(l){ launchRocket(l.x, l.y, l.p, l.t, l.d); });

  /* ── Loop utama zarah ── */
  function animP() {
    ctx.fillStyle = 'rgba(3,7,30,0.14)';
    ctx.fillRect(0, 0, W, H);
    particles = particles.filter(function(p) {
      p.trail.push({x:p.x, y:p.y});
      if (p.trail.length > p.mt) p.trail.shift();
      p.trail.forEach(function(tp, i) {
        var ta = p.a*(i/p.trail.length)*0.35;
        if (ta < 0.01) return;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, p.r*(i/p.trail.length)*0.6, 0, Math.PI*2);
        ctx.fillStyle = p.c; ctx.globalAlpha = ta; ctx.fill(); ctx.globalAlpha = 1;
      });
      p.x += p.dx; p.y += p.dy; p.dy += p.g; p.dx *= 0.992; p.a -= p.fade;
      if (p.a <= 0) return false;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.c; ctx.globalAlpha = p.a; ctx.fill(); ctx.globalAlpha = 1;
      return true;
    });
    requestAnimationFrame(animP);
  }
  animP();
}

function splashDoConfetti() {
  var canvas = document.getElementById('splashCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  /* Palet premium — tiada warna terlalu terang */
  var COLS = ['#ffd700','#f7e7ce','#ffffff','#ffb3cc','#c8e6ff','#ddb8ff','#aaffdd','#ffe566','#eeccff','#fff4b0'];

  /* Bentuk: 0=bulat, 1=diamond, 2=ribbon */
  var pieces = [];
  for (var i = 0; i < 180; i++) {
    var shape = Math.floor(Math.random()*3);
    pieces.push({
      x: Math.random()*W, y: -30 - Math.random()*H*0.6,
      vx: (Math.random()-0.5)*2.2,
      vy: Math.random()*3+1.2,
      swing: Math.random()*0.08+0.02,
      swingOff: Math.random()*Math.PI*2,
      rot: Math.random()*360, rs: (Math.random()-0.5)*4,
      w: shape===2 ? Math.random()*14+6 : Math.random()*8+4,
      h: shape===2 ? Math.random()*3+1.5 : Math.random()*8+4,
      c: COLS[Math.floor(Math.random()*COLS.length)],
      a: 0.88 + Math.random()*0.12,
      shape: shape, age: 0
    });
  }

  var frame = 0;
  function animC() {
    frame++;
    pieces = pieces.filter(function(p) {
      p.age++;
      p.vx += Math.sin(frame*p.swing + p.swingOff) * 0.04;
      p.x += p.vx; p.y += p.vy; p.rot += p.rs;
      /* fade bila hampir ke bawah */
      if (p.y > H*0.75) p.a -= 0.018;
      if (p.a <= 0 || p.y > H+30) return false;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI/180);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      if (p.shape === 0) {
        /* bulat */
        ctx.beginPath(); ctx.arc(0, 0, p.w/2, 0, Math.PI*2); ctx.fill();
      } else if (p.shape === 1) {
        /* diamond */
        ctx.beginPath();
        ctx.moveTo(0, -p.h); ctx.lineTo(p.w/2, 0);
        ctx.lineTo(0, p.h); ctx.lineTo(-p.w/2, 0);
        ctx.closePath(); ctx.fill();
      } else {
        /* ribbon — pita nipis */
        ctx.beginPath();
        ctx.moveTo(-p.w/2, -p.h/2);
        ctx.quadraticCurveTo(0, p.h, p.w/2, -p.h/2);
        ctx.quadraticCurveTo(0, -p.h*2, -p.w/2, -p.h/2);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore(); ctx.globalAlpha = 1;
      return true;
    });
    if (pieces.length > 0) requestAnimationFrame(animC);
  }
  animC();
}


function _splashNote(freq, t0, dur, type, vol, filt) {
  var ctx = _splashAudio.ctx; if (!ctx) return;
  var osc = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  osc.type = type || 'sawtooth';
  osc.frequency.setValueAtTime(freq, t0);
  f.type = 'lowpass'; f.frequency.setValueAtTime(filt || 2000, t0); f.Q.setValueAtTime(1.8, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol || 0.4, t0 + 0.025);
  g.gain.setValueAtTime(vol || 0.4, t0 + dur * 0.65);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  osc.connect(f); f.connect(g); g.connect(_splashAudio.masterGain);
  if (_splashAudio.reverbNode) f.connect(_splashAudio.reverbNode);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function _splashDrum(t0, pitch, vol) {
  var ctx = _splashAudio.ctx; if (!ctx) return;
  var osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitch || 85, t0);
  osc.frequency.exponentialRampToValueAtTime(28, t0 + 0.38);
  g.gain.setValueAtTime(vol || 0.55, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.42);
  osc.connect(g); g.connect(_splashAudio.masterGain);
  osc.start(t0); osc.stop(t0 + 0.48);
}

function splashPlayFanfare() {
  var ctx = _splashAudio.ctx; if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  splashStopAmbient();
  var t = ctx.currentTime + 0.08;

  /* Fanfare — C major, gaya terompet upacara */
  /* Baris utama (terompet tinggi) */
  var hi = [
    [523.25,0.00,0.16,'sawtooth',0.52,1900], [523.25,0.18,0.16,'sawtooth',0.52,1900],
    [523.25,0.36,0.16,'sawtooth',0.52,1900], [659.25,0.55,0.20,'sawtooth',0.56,2100],
    [783.99,0.78,0.26,'sawtooth',0.56,2300], [1046.5,1.08,0.85,'sawtooth',0.60,2700],
    /* frasa kedua — ascending */
    [523.25,2.20,0.14,'sawtooth',0.48,1900], [587.33,2.38,0.14,'sawtooth',0.48,2000],
    [659.25,2.56,0.14,'sawtooth',0.48,2100], [698.46,2.74,0.14,'sawtooth',0.50,2200],
    [783.99,2.92,0.20,'sawtooth',0.54,2400], [880.00,3.16,0.26,'sawtooth',0.56,2600],
    [1046.5,3.46,1.60,'sawtooth',0.62,3000],
  ];
  /* Harmonik rendah */
  var lo = [
    [392.00,0.00,0.16,'sawtooth',0.30,1400], [392.00,0.18,0.16,'sawtooth',0.30,1400],
    [392.00,0.36,0.16,'sawtooth',0.30,1400], [493.88,0.55,0.20,'sawtooth',0.30,1600],
    [587.33,0.78,0.26,'sawtooth',0.30,1800], [783.99,1.08,0.85,'sawtooth',0.34,2000],
    [392.00,2.20,0.14,'sawtooth',0.28,1400], [440.00,2.38,0.14,'sawtooth',0.28,1500],
    [493.88,2.56,0.14,'sawtooth',0.28,1600], [523.25,2.74,0.14,'sawtooth',0.30,1700],
    [587.33,2.92,0.20,'sawtooth',0.32,1900], [659.25,3.16,0.26,'sawtooth',0.34,2100],
    [783.99,3.46,1.60,'sawtooth',0.36,2300],
  ];
  /* Bass */
  var bs = [
    [130.81,0.00,0.40,'sawtooth',0.38,550], [130.81,0.55,0.35,'sawtooth',0.36,550],
    [130.81,1.08,0.85,'sawtooth',0.42,550], [130.81,2.20,0.55,'sawtooth',0.36,550],
    [130.81,2.92,0.45,'sawtooth',0.38,550], [130.81,3.46,1.60,'sawtooth',0.44,550],
  ];
  /* Akord akhir (C major triad) */
  var ch = [
    [523.25,3.46,1.60,'sawtooth',0.48,2200],
    [659.25,3.46,1.60,'sawtooth',0.42,2400],
  ];
  [hi,lo,bs,ch].forEach(function(arr){ arr.forEach(function(n){ _splashNote(n[0],t+n[1],n[2],n[3],n[4],n[5]); }); });

  /* Timpani */
  [0.00,0.36,0.78,1.08,2.20,2.92,3.46,3.75,4.10].forEach(function(dt,i){
    _splashDrum(t+dt, [90,80,90,70,85,90,70,70,68][i], [0.55,0.45,0.55,0.68,0.45,0.52,0.72,0.55,0.60][i]);
  });
}

function splashPlayAmbient() {
  var ctx = _splashAudio.ctx; if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  splashStopAmbient();

  /* F major arpeggiated pad — lembut, ceremonial */
  var arp = [349.23, 440.00, 523.25, 698.46]; /* F4 A4 C5 F5 */
  var cycDur = 2.6, repeat = 14;
  var t0 = ctx.currentTime + 0.8;
  var noteDur = cycDur / arp.length;

  for (var rep = 0; rep < repeat; rep++) {
    for (var ni = 0; ni < arp.length; ni++) {
      (function(freq, tStart) {
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, tStart);
        g.gain.setValueAtTime(0, tStart);
        g.gain.linearRampToValueAtTime(0.13, tStart + 0.12);
        g.gain.setValueAtTime(0.13, tStart + 0.48);
        g.gain.linearRampToValueAtTime(0, tStart + 0.68);
        osc.connect(g); g.connect(_splashAudio.masterGain);
        if (_splashAudio.reverbNode) g.connect(_splashAudio.reverbNode);
        osc.start(tStart); osc.stop(tStart + 0.75);
        _splashAudio.ambientNodes.push(osc);
      })(arp[ni], t0 + rep * cycDur + ni * noteDur);
    }
    /* Bass F3 — sekali per kitar */
    (function(tStart) {
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(174.61, tStart);
      g.gain.setValueAtTime(0, tStart);
      g.gain.linearRampToValueAtTime(0.10, tStart + 0.25);
      g.gain.setValueAtTime(0.10, tStart + cycDur - 0.35);
      g.gain.linearRampToValueAtTime(0, tStart + cycDur);
      osc.connect(g); g.connect(_splashAudio.masterGain);
      osc.start(tStart); osc.stop(tStart + cycDur + 0.1);
      _splashAudio.ambientNodes.push(osc);
    })(t0 + rep * cycDur);
  }
}

function splashStopAmbient() {
  (_splashAudio.ambientNodes || []).forEach(function(n){ try { n.stop(); } catch(e){} });
  _splashAudio.ambientNodes = [];
}

function splashToggleMute() {
  if (!_splashAudio.masterGain || !_splashAudio.ctx) return;
  _splashAudio.muted = !_splashAudio.muted;
  _splashAudio.masterGain.gain.linearRampToValueAtTime(
    _splashAudio.muted ? 0 : 0.72, _splashAudio.ctx.currentTime + 0.25);
  var btn = document.getElementById('splashMuteBtn');
  if (btn) btn.textContent = _splashAudio.muted ? '🔇' : '🔊';
}

function splashAudioFadeOut() {
  if (!_splashAudio.masterGain || !_splashAudio.ctx) return;
  _splashAudio.masterGain.gain.linearRampToValueAtTime(0, _splashAudio.ctx.currentTime + 2.2);
  setTimeout(function() {
    splashStopAmbient();
    try { if (_splashAudio.ctx) _splashAudio.ctx.close(); } catch(e) {}
    _splashAudio.ctx = null; _splashAudio.masterGain = null;
  }, 2800);
}
