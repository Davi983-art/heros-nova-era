// =====================================================================
//  cenario.js — DESERTO COM BASE MILITAR SECRETA
//  Tudo é desenhado em código (nenhuma imagem de cenário).
//  Este arquivo define a drawBackground() que o game.js já chama.
//  Usa do game.js: ctx, W, H, ground, camera, WORLD_W
// =====================================================================

// ---------- AJUSTES (mexa só aqui) ----------
const CN_PROP_SCALE = 1;     // tamanho de veículos, caixas, torres (maior = maiores)
const CN_HORIZON = 0.17;     // altura do horizonte acima dos pés (fração da tela)
const CN_RES = 1;            // nitidez das camadas de fundo (1 leve, 1.5 mais nítido)
const CN_SAND = 46;          // grãos de areia no vento
const CN_LEAVES = 7;         // folhas secas no vento
const CN_SMOKE_ON = true;    // fumaça dos veículos
const CN_APRON_X = 4640;     // onde começa o piso de concreto da base
const CN_DROP = 0;        // maior = personagem mais baixo no cenário

// ---------- PALETA (dessaturada: areia, bege, cinza, verde militar) ----------
const CN_C = {
    skyTop: "#6f92aa", skyMid: "#a6bcc5", skyLow: "#e0d2b0",
    rockLit: "#a68d72", rockMid: "#8d7660", rockShade: "#6c5849",
    conc: "#9b978d", concLit: "#b3afa4", concDark: "#6e6b64",
    metal: "#5b6158", metalDark: "#3a3f38",
    olive: "#5f6a42", oliveDark: "#434c2e",
    wood: "#8f7144", woodDark: "#6a5232",
    rust: "#7c4a35", light: "#f3e6b0", red: "#d8402f"
};
const CN_PAL = {
    army: { cover: "#5a6640", coverLit: "rgba(255,240,200,0.14)", cab: "#4a5435", glass: "#7f989f" },
    dead: { cover: "#2f2d2a", coverLit: "rgba(255,255,255,0.05)", cab: "#262522", glass: "#141414" }
};
const CN_ROWS = [
    { p: 1.00, sc: 1.00 },   // 0 = faixa onde o jogador anda
    { p: 0.84, sc: 0.80 },   // 1 = meio (mais longe)
    { p: 0.68, sc: 0.62 }    // 2 = fundo (bem longe)
];

// ---------- ESTADO ----------
const CN = {
    ready: false, W: 0, H: 0, t: 0, hor: 0, k: 1, apronTop: 0,
    rows: [[], [], []], decals: [], lights: [], dishes: [], parts: []
};

// ---------- FERRAMENTAS ----------
function cnRnd(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
}
function cnEll(g, x, y, rx, ry) {
    g.beginPath();
    g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, 6.2832);
    g.fill();
}
function cnCirc(g, x, y, r) {
    g.beginPath();
    g.arc(x, y, Math.max(0.01, r), 0, 6.2832);
    g.fill();
}
function cnMake(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w * CN_RES));
    c.height = Math.max(1, Math.ceil(h * CN_RES));
    const g = c.getContext("2d");
    g.scale(CN_RES, CN_RES);
    return { c: c, g: g, w: w, h: h };
}
function cnWind(t) {
    const base = 0.55 + 0.25 * Math.sin(t * 0.31);
    const gust = Math.max(0, Math.sin(t * 0.83 + Math.sin(t * 0.19) * 2.3) - 0.35) * 1.4;
    return base + gust;   // de ~0.3 (calmo) até ~1.9 (rajada)
}
function cnBlink(g, x, y, r, ph, t, col) {
    const on = Math.sin(t * 3 + ph) > 0.5;
    g.fillStyle = col || CN_C.red;
    g.globalAlpha = on ? 0.28 : 0.05;
    cnCirc(g, x, y, r * 3);
    g.globalAlpha = on ? 1 : 0.35;
    cnCirc(g, x, y, r);
    g.globalAlpha = 1;
}
function cnShadow(g, rx) {
    g.fillStyle = "rgba(70,48,24,0.22)";   // sol à direita: sombra cai para a esquerda
    g.beginPath();
    g.ellipse(-rx * 0.18, 1, rx, 6, 0, 0, 6.2832);
    g.fill();
}

// =====================================================================
//  CAMADAS PRÉ-DESENHADAS (feitas uma vez, ficam em memória)
// =====================================================================
function cnPaintSky(g, w, hor) {
    const sky = g.createLinearGradient(0, 0, 0, hor);
    sky.addColorStop(0, CN_C.skyTop);
    sky.addColorStop(0.55, CN_C.skyMid);
    sky.addColorStop(1, CN_C.skyLow);
    g.fillStyle = sky;
    g.fillRect(0, 0, w, hor + 2);
    // sol baixo, luz natural de fim de tarde
    const sx = w * 0.76, sy = hor * 0.42;
    const glow = g.createRadialGradient(sx, sy, 0, sx, sy, hor * 0.9);
    glow.addColorStop(0, "rgba(255,246,222,0.95)");
    glow.addColorStop(0.12, "rgba(255,236,196,0.55)");
    glow.addColorStop(1, "rgba(255,226,180,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, hor + 2);
}

function cnRidge(g, width, baseY, hMin, hMax, seed, top, bottom, mesa) {
    const pts = [];
    let x = -20, i = 0;
    while (x < width + 80) {
        const r = cnRnd(seed + i * 3.1);
        const hh = hMin + cnRnd(seed + i * 5.7) * (hMax - hMin);
        if (mesa && r > 0.6) {
            const wm = 60 + cnRnd(seed + i * 7.3) * 140;
            pts.push([x, baseY - hh * 0.25]);
            pts.push([x + 12, baseY - hh]);
            pts.push([x + wm - 12, baseY - hh * (0.9 + cnRnd(seed + i) * 0.1)]);
            pts.push([x + wm, baseY - hh * 0.25]);
            x += wm + 10 + cnRnd(seed + i * 2.2) * 40;
        } else {
            const st = 50 + cnRnd(seed + i * 9.1) * 90;
            pts.push([x, baseY - hh * 0.3]);
            pts.push([x + st * 0.5, baseY - hh]);
            x += st;
        }
        i++;
    }
    const gr = g.createLinearGradient(0, baseY - hMax, 0, baseY);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-20, baseY + 2);
    for (let j = 0; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]);
    g.lineTo(width + 80, baseY - hMin * 0.3);
    g.lineTo(width + 80, baseY + 2);
    g.closePath();
    g.fill();
}

function cnMesa(g, x, baseY, w, h, seed) {
    const topY = baseY - h;
    g.fillStyle = CN_C.rockShade;           // lado esquerdo na sombra
    g.beginPath();
    g.moveTo(x, baseY); g.lineTo(x + w * 0.05, topY + h * 0.18); g.lineTo(x + w * 0.14, topY);
    g.lineTo(x + w * 0.62, topY + h * 0.02); g.lineTo(x + w * 0.6, baseY);
    g.closePath(); g.fill();
    g.fillStyle = CN_C.rockLit;             // lado direito iluminado
    g.beginPath();
    g.moveTo(x + w * 0.6, baseY); g.lineTo(x + w * 0.62, topY + h * 0.02); g.lineTo(x + w * 0.88, topY + h * 0.06);
    g.lineTo(x + w * 0.97, topY + h * 0.3); g.lineTo(x + w, baseY);
    g.closePath(); g.fill();
    g.strokeStyle = "rgba(60,40,28,0.28)";  // camadas da rocha
    g.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
        const yy = topY + h * (k / 5) + (cnRnd(seed + k) - 0.5) * 4;
        g.beginPath();
        g.moveTo(x + w * 0.04, yy);
        g.lineTo(x + w * 0.98, yy + (cnRnd(seed + k + 9) - 0.5) * 5);
        g.stroke();
    }
    g.fillStyle = "rgba(226,204,160,0.65)"; // areia acumulada na base
    g.beginPath();
    g.moveTo(x - w * 0.1, baseY + 1); g.lineTo(x + w * 0.2, baseY - h * 0.12); g.lineTo(x + w * 0.55, baseY - h * 0.07);
    g.lineTo(x + w * 0.9, baseY - h * 0.13); g.lineTo(x + w * 1.1, baseY + 1);
    g.closePath(); g.fill();
}

// posto militar bem distante (torre + cabine + mastro)
function cnMiniOutpost(L, p, cx, y, u) {
    const g = L.g;
    g.fillStyle = "#7b776a";
    g.fillRect(cx - 2 * u, y - 52 * u, 4 * u, 52 * u);
    g.fillRect(cx - 9 * u, y - 62 * u, 18 * u, 10 * u);
    g.fillStyle = "#6a675c";
    g.fillRect(cx + 16 * u, y - 18 * u, 26 * u, 18 * u);
    g.fillRect(cx - 40 * u, y - 12 * u, 20 * u, 12 * u);
    g.strokeStyle = "#6a675c";
    g.lineWidth = Math.max(1, u * 1.2);
    g.beginPath();
    g.moveTo(cx + 30 * u, y - 18 * u); g.lineTo(cx + 30 * u, y - 70 * u);
    g.moveTo(cx - 2 * u, y - 62 * u); g.lineTo(cx - 2 * u, y - 78 * u);
    g.stroke();
    CN.lights.push({ p: p, x: cx + 30 * u, y: y - 71 * u, r: Math.max(1, 1.6 * u), ph: cx * 0.01 });
    CN.lights.push({ p: p, x: cx - 2 * u, y: y - 79 * u, r: Math.max(1, 1.4 * u), ph: cx * 0.01 + 1.7 });
}

function cnPaintRocks(L, hor, k) {
    const g = L.g;
    let x = 20, i = 0;
    while (x < L.w) {
        const w = 120 + cnRnd(i * 2.7 + 3) * 170;
        const h = hor * (0.2 + cnRnd(i * 4.1 + 1) * 0.3);
        cnMesa(g, x, hor, w, h, i * 13);
        x += w * (0.5 + cnRnd(i * 6.3) * 1.1) + 30;
        i++;
    }
    cnMiniOutpost(L, 0.26, 1100 * 0.26 + W / 2, hor, k * 0.45);
    cnMiniOutpost(L, 0.26, 2600 * 0.26 + W / 2, hor, k * 0.45);
    g.globalCompositeOperation = "source-atop";   // névoa só onde já tem pedra
    const hz = g.createLinearGradient(0, hor * 0.2, 0, hor);
    hz.addColorStop(0, "rgba(220,205,175,0)");
    hz.addColorStop(1, "rgba(220,205,175,0.55)");
    g.fillStyle = hz;
    g.fillRect(0, 0, L.w, hor + 2);
    g.globalCompositeOperation = "source-over";
}

// a base militar distante (aparece mais forte nos trechos 3 e 4)
function cnPaintBase(L, p, cx, baseY, u) {
    const g = L.g;
    const X = function (v) { return cx + v * u; };
    const Y = function (v) { return baseY - v * u; };
    // muro baixo
    g.fillStyle = "#8d897e"; g.fillRect(X(-460), Y(30), 920 * u, 30 * u);
    g.fillStyle = "#a29e92"; g.fillRect(X(-460), Y(30), 920 * u, 4 * u);
    // hangar em arco
    g.fillStyle = "#6f766a";
    g.beginPath(); g.moveTo(X(-380), Y(30)); g.lineTo(X(-380), Y(70));
    g.quadraticCurveTo(X(-300), Y(115), X(-220), Y(70)); g.lineTo(X(-220), Y(30)); g.closePath(); g.fill();
    g.fillStyle = "#838a7c";
    g.beginPath(); g.moveTo(X(-300), Y(30)); g.lineTo(X(-300), Y(92));
    g.quadraticCurveTo(X(-262), Y(98), X(-220), Y(70)); g.lineTo(X(-220), Y(30)); g.closePath(); g.fill();
    g.fillStyle = "#3d423b"; g.fillRect(X(-335), Y(58), 70 * u, 28 * u);
    // prédio principal com janelas
    g.fillStyle = "#8a8d85"; g.fillRect(X(-150), Y(95), 210 * u, 65 * u);
    g.fillStyle = "#a0a399"; g.fillRect(X(30), Y(95), 30 * u, 65 * u);
    g.fillStyle = "#6c6f68"; g.fillRect(X(-156), Y(100), 222 * u, 6 * u);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            const on = cnRnd(r * 31 + c * 7 + 3) > 0.7;
            g.fillStyle = on ? "#e8d48a" : "#2e3a3f";
            g.fillRect(X(-140 + c * 22), Y(86 - r * 18), 12 * u, 9 * u);
        }
    }
    // torre de controle
    g.fillStyle = "#9a968b"; g.fillRect(X(120), Y(140), 12 * u, 110 * u);
    g.fillStyle = "#3b4a50"; g.fillRect(X(104), Y(162), 44 * u, 22 * u);
    g.fillStyle = "#6c6f68"; g.fillRect(X(100), Y(167), 52 * u, 5 * u);
    g.strokeStyle = "#6c6f68"; g.lineWidth = Math.max(1, 1.3 * u);
    g.beginPath(); g.moveTo(X(126), Y(167)); g.lineTo(X(126), Y(200)); g.stroke();
    CN.lights.push({ p: p, x: X(126), y: Y(201), r: Math.max(1, 1.8 * u), ph: 0.5 });
    // domo de radar
    g.fillStyle = "#8d897e"; g.fillRect(X(215), Y(70), 40 * u, 40 * u);
    g.fillStyle = "#d8d4c6"; g.beginPath(); g.arc(X(235), Y(70), 26 * u, Math.PI, 0); g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.arc(X(242), Y(80), 8 * u, Math.PI, 0); g.fill();
    // radar giratório em cima do prédio
    CN.dishes.push({ p: p, x: X(-90), y: Y(112), u: u });
    // mastros com luz
    g.strokeStyle = "#6c6f68"; g.lineWidth = Math.max(1, 1.6 * u);
    g.beginPath();
    g.moveTo(X(-420), Y(30)); g.lineTo(X(-420), Y(150));
    g.moveTo(X(340), Y(30)); g.lineTo(X(340), Y(115));
    g.stroke();
    CN.lights.push({ p: p, x: X(-420), y: Y(151), r: Math.max(1, 1.6 * u), ph: 2.1 });
    CN.lights.push({ p: p, x: X(340), y: Y(116), r: Math.max(1, 1.6 * u), ph: 3.4 });
    // containers
    g.fillStyle = "#6a7358"; g.fillRect(X(280), Y(48), 46 * u, 18 * u);
    g.fillStyle = "#7a6a52"; g.fillRect(X(332), Y(48), 40 * u, 18 * u);
    g.fillStyle = "#70704f"; g.fillRect(X(296), Y(66), 40 * u, 18 * u);
    // postes de luz no muro
    g.fillStyle = "#575a52";
    for (let i = -1; i <= 3; i++) {
        g.fillRect(X(i * 200 - 3), Y(66), 3 * u, 36 * u);
        g.fillStyle = "#e6d9a0"; g.fillRect(X(i * 200 - 10), Y(68), 16 * u, 4 * u);
        g.fillStyle = "#575a52";
    }
    // névoa de distância
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "rgba(214,200,170,0.26)";
    g.fillRect(0, 0, L.w, baseY + 2);
    g.globalCompositeOperation = "source-over";
}

function cnPaintDunes(L, hor) {
    const g = L.g;
    const gr = g.createLinearGradient(0, hor - 34, 0, hor + 2);
    gr.addColorStop(0, "#e3cfa3");
    gr.addColorStop(1, "#d4bb8d");
    const pts = [];
    for (let x = 0; x <= L.w + 6; x += 6) {
        const y = hor - (10 + 8 * Math.sin(x * 0.0115 + 1.3) + 6 * Math.sin(x * 0.029 + 4.1) + 3 * Math.sin(x * 0.07));
        pts.push([x, y]);
    }
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, hor + 2);
    for (let i = 0; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineTo(L.w + 6, hor + 2);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(255,240,205,0.5)";   // brilho na crista
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i < pts.length; i++) {
        if (i) g.lineTo(pts[i][0], pts[i][1]); else g.moveTo(pts[i][0], pts[i][1]);
    }
    g.stroke();
}

// =====================================================================
//  OBJETOS (desenhados em "unidades"; origem = base do objeto no chão)
// =====================================================================
function cnTruck(g, pal) {
    cnShadow(g, 100);
    g.fillStyle = CN_C.metalDark; g.fillRect(-98, -30, 198, 10);
    g.fillStyle = pal.cover;                                   // caçamba com lona
    g.beginPath();
    g.moveTo(-98, -30); g.lineTo(-98, -82); g.quadraticCurveTo(-98, -96, -84, -96);
    g.lineTo(12, -96); g.quadraticCurveTo(26, -96, 26, -82); g.lineTo(26, -30);
    g.closePath(); g.fill();
    g.fillStyle = pal.coverLit; g.fillRect(10, -80, 16, 50);
    g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 1.2;
    for (let x = -78; x < 20; x += 24) { g.beginPath(); g.moveTo(x, -92); g.lineTo(x, -30); g.stroke(); }
    g.fillStyle = pal.cab;                                     // cabine
    g.beginPath();
    g.moveTo(30, -30); g.lineTo(30, -80); g.lineTo(44, -92); g.lineTo(80, -92);
    g.lineTo(92, -72); g.lineTo(100, -72); g.lineTo(100, -30);
    g.closePath(); g.fill();
    g.fillStyle = pal.glass;
    g.beginPath(); g.moveTo(48, -86); g.lineTo(78, -86); g.lineTo(88, -68); g.lineTo(48, -68); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(52, -84, 6, 14);
    g.fillStyle = CN_C.metalDark; g.fillRect(96, -42, 8, 12);
    g.fillStyle = CN_C.light; g.fillRect(98, -58, 3, 8);
    const wx = [-72, -38, 66];
    for (let i = 0; i < wx.length; i++) {
        g.fillStyle = "#1c1e1b"; cnCirc(g, wx[i], -17, 17);
        g.fillStyle = "#666a60"; cnCirc(g, wx[i], -17, 7);
    }
}

function cnJeep(g, pal) {
    cnShadow(g, 70);
    g.fillStyle = pal.cab;
    g.fillRect(-62, -42, 124, 20);
    g.fillRect(24, -46, 40, 14);
    g.fillStyle = pal.coverLit; g.fillRect(40, -42, 22, 20);
    g.fillStyle = pal.glass;
    g.beginPath(); g.moveTo(2, -42); g.lineTo(10, -66); g.lineTo(22, -66); g.lineTo(30, -42); g.closePath(); g.fill();
    g.strokeStyle = CN_C.metalDark; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-50, -42); g.lineTo(-50, -64); g.lineTo(-8, -64); g.lineTo(-8, -42); g.stroke();
    g.fillStyle = "#1c1e1b"; cnCirc(g, -68, -36, 13);
    g.fillStyle = "#666a60"; cnCirc(g, -68, -36, 5);
    const wx = [-38, 40];
    for (let i = 0; i < wx.length; i++) {
        g.fillStyle = "#1c1e1b"; cnCirc(g, wx[i], -15, 15);
        g.fillStyle = "#666a60"; cnCirc(g, wx[i], -15, 6);
    }
    g.fillStyle = CN_C.light; g.fillRect(62, -38, 3, 7);
}

function cnBarrier(g, v) {
    cnShadow(g, 56);
    if (v === 1) {                       // muro de sacos de areia
        for (let r = 0; r < 3; r++) {
            const n = 6 - r;
            for (let i = 0; i < n; i++) {
                const x = -n * 9 + 9 + i * 18, y = -r * 13 - 7;
                g.fillStyle = (i + r) % 2 ? "#b49a68" : "#a58b5c";
                cnEll(g, x, y, 10, 7);
                g.fillStyle = "rgba(255,240,200,0.18)";
                cnEll(g, x + 3, y - 2, 5, 3);
            }
        }
    } else if (v === 2) {                // ouriço antitanque
        g.strokeStyle = CN_C.metalDark; g.lineWidth = 5; g.lineCap = "round";
        g.beginPath();
        g.moveTo(-24, -2); g.lineTo(24, -44);
        g.moveTo(24, -2); g.lineTo(-24, -44);
        g.moveTo(0, -48); g.lineTo(0, -2);
        g.stroke();
        g.lineCap = "butt";
    } else {                             // barreira de concreto
        g.fillStyle = CN_C.conc;
        g.beginPath(); g.moveTo(-46, 0); g.lineTo(-38, -36); g.lineTo(38, -36); g.lineTo(46, 0); g.closePath(); g.fill();
        g.fillStyle = CN_C.concLit;
        g.beginPath(); g.moveTo(14, 0); g.lineTo(14, -36); g.lineTo(38, -36); g.lineTo(46, 0); g.closePath(); g.fill();
        for (let i = 0; i < 6; i++) {
            g.fillStyle = i % 2 ? "#e9e6dc" : CN_C.red;
            g.fillRect(-38 + i * 12.7, -36, 12.7, 7);
        }
        g.strokeStyle = "rgba(40,36,30,0.35)"; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(-20, -28); g.lineTo(-14, -14); g.lineTo(-18, -4); g.stroke();
    }
}

function cnCrate(g, x, y, w, h, wood) {
    g.fillStyle = wood ? CN_C.wood : CN_C.olive;
    g.fillRect(x, y - h, w, h);
    g.fillStyle = "rgba(255,240,200,0.12)"; g.fillRect(x + w * 0.65, y - h, w * 0.35, h);
    g.strokeStyle = wood ? CN_C.woodDark : CN_C.oliveDark; g.lineWidth = 2.4;
    g.strokeRect(x + 1.2, y - h + 1.2, w - 2.4, h - 2.4);
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x + 2, y - h + 2); g.lineTo(x + w - 2, y - 2);
    g.moveTo(x + w - 2, y - h + 2); g.lineTo(x + 2, y - 2);
    g.stroke();
    if (!wood) {
        g.fillStyle = "rgba(235,235,220,0.7)";
        g.fillRect(x + w * 0.2, y - h * 0.62, w * 0.34, 3);
        g.fillRect(x + w * 0.2, y - h * 0.42, w * 0.22, 3);
    }
}
function cnCrates(g, v) {
    cnShadow(g, 50);
    if (v === 0) {
        cnCrate(g, -22, 0, 44, 38, false);
    } else if (v === 1) {
        cnCrate(g, -46, 0, 44, 38, false);
        cnCrate(g, 0, 0, 44, 38, true);
        cnCrate(g, -34, -38, 40, 34, true);
    } else {
        cnCrate(g, -40, 0, 36, 30, true);
        cnCrate(g, 0, 0, 36, 30, false);
        cnCrate(g, -20, -30, 34, 28, false);
    }
}

function cnBarrels(g, v) {
    cnShadow(g, 44);
    const cols = [CN_C.rust, "#4a5a3a", "#34373a"];
    const xs = v === 0 ? [-20, 0, 20] : [-12, 12];
    for (let i = 0; i < xs.length; i++) {
        const x = xs[i], c = cols[(i + v) % 3];
        g.fillStyle = c; g.fillRect(x - 11, -34, 22, 34);
        g.fillStyle = "rgba(255,240,200,0.14)"; g.fillRect(x + 3, -34, 8, 34);
        g.fillStyle = c; cnEll(g, x, -34, 11, 4);
        g.fillStyle = "rgba(255,255,255,0.12)"; cnEll(g, x, -34, 11, 4);
        g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(x - 11, -24); g.lineTo(x + 11, -24);
        g.moveTo(x - 11, -11); g.lineTo(x + 11, -11);
        g.stroke();
    }
}

function cnTent(g, t, wind) {
    cnShadow(g, 78);
    g.fillStyle = "#78774f";
    g.beginPath(); g.moveTo(-72, 0); g.lineTo(-72, -22); g.lineTo(0, -66); g.lineTo(72, -22); g.lineTo(72, 0); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,240,200,0.16)";
    g.beginPath(); g.moveTo(0, -66); g.lineTo(72, -22); g.lineTo(72, 0); g.lineTo(10, 0); g.closePath(); g.fill();
    const sw = Math.sin(t * 2.3) * 1.6 * wind;       // aba da porta balançando
    g.fillStyle = "#2f3126";
    g.beginPath(); g.moveTo(-15, 0); g.lineTo(-10 + sw, -34); g.lineTo(10 + sw, -34); g.lineTo(15, 0); g.closePath(); g.fill();
    g.fillStyle = "#6b6a45";
    g.beginPath(); g.moveTo(-15, 0); g.lineTo(-10 + sw, -34); g.lineTo(-2 + sw, -34); g.lineTo(-4, 0); g.closePath(); g.fill();
    g.strokeStyle = "rgba(40,35,25,0.6)"; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-72, -22); g.lineTo(-96, 0);
    g.moveTo(72, -22); g.lineTo(96, 0);
    g.stroke();
}

function cnSign(g, a, b) {
    g.fillStyle = CN_C.metalDark; g.fillRect(-3, -78, 6, 78);
    g.fillStyle = "#d1b44a"; g.fillRect(-38, -112, 76, 44);
    g.strokeStyle = "#2a2a26"; g.lineWidth = 3; g.strokeRect(-36, -110, 72, 40);
    g.fillStyle = "#2a2a26";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "bold 14px sans-serif"; g.fillText(a || "", 0, -97);
    g.font = "bold 9px sans-serif"; g.fillText(b || "", 0, -80);
}

function cnRocks(g, v) {
    cnShadow(g, 50);
    const s = v === 0 ? 1 : (v === 1 ? 0.7 : 1.4);
    g.save();
    g.scale(s, s);
    g.fillStyle = CN_C.rockShade;
    g.beginPath(); g.moveTo(-34, 0); g.lineTo(-28, -22); g.lineTo(-8, -34); g.lineTo(4, -30); g.lineTo(4, 0); g.closePath(); g.fill();
    g.fillStyle = CN_C.rockMid;
    g.beginPath(); g.moveTo(4, 0); g.lineTo(4, -30); g.lineTo(22, -26); g.lineTo(36, -8); g.lineTo(40, 0); g.closePath(); g.fill();
    g.fillStyle = CN_C.rockLit;
    g.beginPath(); g.moveTo(4, -30); g.lineTo(-8, -34); g.lineTo(2, -24); g.lineTo(18, -22); g.closePath(); g.fill();
    g.fillStyle = CN_C.rockMid;
    g.beginPath(); g.moveTo(46, 0); g.lineTo(50, -12); g.lineTo(58, -14); g.lineTo(66, -4); g.lineTo(68, 0); g.closePath(); g.fill();
    g.restore();
}

function cnBush(g, t, wind) {
    g.strokeStyle = "#7a6a3e"; g.lineWidth = 2; g.lineCap = "round";
    for (let i = 0; i < 9; i++) {
        const a = -2.9 + i * 0.34 + Math.sin(t * 2 + i) * 0.06 * wind;
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(Math.cos(a) * 14, Math.sin(a) * 14, Math.cos(a) * 26, Math.sin(a) * 26);
        g.stroke();
    }
    g.lineCap = "butt";
}

function cnTower(g, o, t) {
    cnShadow(g, 46);
    g.strokeStyle = CN_C.metalDark; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-32, 0); g.lineTo(-22, -130); g.moveTo(32, 0); g.lineTo(22, -130); g.stroke();
    g.lineWidth = 2.4;
    const lv = [0, -34, -68, -102, -130];
    for (let i = 0; i < lv.length - 1; i++) {
        const y0 = lv[i], y1 = lv[i + 1];
        const w0 = 32 - (Math.abs(y0) / 130) * 10, w1 = 32 - (Math.abs(y1) / 130) * 10;
        g.beginPath();
        g.moveTo(-w0, y0); g.lineTo(w1, y1);
        g.moveTo(w0, y0); g.lineTo(-w1, y1);
        g.moveTo(-w1, y1); g.lineTo(w1, y1);
        g.stroke();
    }
    g.fillStyle = CN_C.metalDark; g.fillRect(-36, -136, 72, 7);
    g.fillStyle = CN_C.olive; g.fillRect(-30, -176, 60, 40);
    g.fillStyle = "rgba(255,240,200,0.14)"; g.fillRect(8, -176, 22, 40);
    const lit = Math.sin(t * 0.7 + o.lx) > -0.2;               // luz da cabine acende e apaga
    g.fillStyle = lit ? "#d6c37a" : "#3a4a50"; g.fillRect(-24, -168, 48, 14);
    g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(-1, -168, 2, 14);
    g.fillStyle = CN_C.metalDark;
    g.beginPath(); g.moveTo(-38, -176); g.lineTo(-26, -192); g.lineTo(26, -192); g.lineTo(38, -176); g.closePath(); g.fill();
    g.fillStyle = CN_C.metal; g.fillRect(30, -166, 12, 9);      // holofote
    const a = 1.9 + Math.sin(t * 0.5 + o.lx * 0.01) * 0.55;     // feixe varrendo o chão
    g.fillStyle = "rgba(255,245,200,0.08)";
    g.beginPath();
    g.moveTo(36, -161);
    g.lineTo(36 + Math.cos(a - 0.1) * 260, -161 + Math.sin(a - 0.1) * 260);
    g.lineTo(36 + Math.cos(a + 0.1) * 260, -161 + Math.sin(a + 0.1) * 260);
    g.closePath(); g.fill();
    cnBlink(g, 0, -197, 2.4, o.lx, t);
}

function cnAntenna(g, o, t) {
    cnShadow(g, 24);
    g.strokeStyle = "#4a4f47"; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-6, 0); g.lineTo(-3, -170); g.moveTo(6, 0); g.lineTo(3, -170); g.stroke();
    g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
        const y0 = -i * 19, y1 = -(i + 1) * 19;
        const w0 = 6 - i * 0.33, w1 = 6 - (i + 1) * 0.33;
        g.beginPath(); g.moveTo(-w0, y0); g.lineTo(w1, y1); g.moveTo(w0, y0); g.lineTo(-w1, y1); g.stroke();
    }
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -170); g.lineTo(0, -192); g.stroke();
    g.strokeStyle = "rgba(60,60,52,0.7)"; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(0, -120); g.lineTo(-52, 0); g.moveTo(0, -120); g.lineTo(52, 0); g.stroke();
    g.fillStyle = "#b8b4a6";
    g.beginPath(); g.ellipse(9, -108, 7, 11, 0.2, 0, 6.2832); g.fill();
    cnBlink(g, 0, -193, 2.2, o.lx * 0.37, t);
    cnBlink(g, 0, -120, 1.8, o.lx * 0.37 + 1.6, t);
}

function cnFlag(g, t, wind, col) {
    g.fillStyle = CN_C.metal; g.fillRect(-1.6, -132, 3.2, 132);
    cnCirc(g, 0, -134, 3);
    const amp = 2 + wind * 3.2, n = 9;
    g.fillStyle = col || "#6a7447";
    g.beginPath();
    for (let i = 0; i <= n; i++) {
        const x = 2 + i * 7, y = -128 + Math.sin(t * 4 - i * 0.7) * amp * (i / n);
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    for (let i = n; i >= 0; i--) {
        const x = 2 + i * 7, y = -100 + Math.sin(t * 4 - i * 0.7) * amp * (i / n) - i * 0.8;
        g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    g.fillStyle = "rgba(240,236,220,0.5)";
    cnCirc(g, 24, -114 + Math.sin(t * 4 - 3) * amp * 0.35, 5);
}

function cnFlood(g) {
    g.fillStyle = CN_C.metalDark; g.fillRect(-2.5, -150, 5, 150);
    g.fillStyle = CN_C.metal; g.fillRect(-14, -160, 28, 10);
    g.fillStyle = CN_C.light; g.fillRect(-12, -158, 24, 6);
    g.fillStyle = "rgba(255,241,184,0.09)";
    g.beginPath(); g.moveTo(-12, -152); g.lineTo(12, -152); g.lineTo(46, -4); g.lineTo(-46, -4); g.closePath(); g.fill();
}

function cnBooth(g) {
    cnShadow(g, 44);
    g.fillStyle = CN_C.concLit; g.fillRect(-28, -62, 56, 62);
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(-28, -62, 20, 62);
    g.fillStyle = "#3f4a4f"; g.fillRect(-18, -50, 36, 24);
    g.fillStyle = "rgba(255,240,180,0.45)"; g.fillRect(-18, -50, 36, 6);
    g.fillStyle = CN_C.metalDark; g.fillRect(-34, -70, 68, 8);
    g.fillStyle = CN_C.metal; g.fillRect(-6, -20, 12, 20);
}

function cnGateArm(g, t) {
    cnShadow(g, 40);
    g.fillStyle = CN_C.metalDark; g.fillRect(-10, -42, 20, 42);
    g.save();
    g.translate(0, -36);
    g.rotate(-0.28 + Math.sin(t * 0.6) * 0.02);
    for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? "#e9e6dc" : CN_C.red;
        g.fillRect(8 + i * 14, -4, 14, 8);
    }
    g.restore();
}

function cnGate(g, o, t) {
    cnShadow(g, 120);
    g.fillStyle = CN_C.concDark; g.fillRect(-112, -128, 28, 128); g.fillRect(84, -128, 28, 128);
    g.fillStyle = "rgba(255,240,200,0.12)"; g.fillRect(96, -128, 16, 128);
    g.fillStyle = "#4b5148"; g.fillRect(-84, -116, 168, 116);
    g.fillStyle = "#596057"; g.fillRect(-84, -116, 82, 116);
    g.fillStyle = "#525a50"; g.fillRect(2, -116, 82, 116);
    g.fillStyle = "#1f221e"; g.fillRect(-2, -116, 4, 116);
    g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 2;
    for (let yy = -92; yy < -20; yy += 24) {
        g.beginPath(); g.moveTo(-84, yy); g.lineTo(84, yy); g.stroke();
    }
    for (let i = 0; i < 12; i++) {                              // faixa de perigo
        g.fillStyle = i % 2 ? "#1d1d1b" : "#d9b73a";
        g.fillRect(-84 + i * 14, -18, 14, 18);
    }
    g.fillStyle = CN_C.conc; g.fillRect(-112, -138, 224, 22);   // viga e placa
    g.fillStyle = "#2b2e29"; g.fillRect(-84, -135, 168, 16);
    g.fillStyle = "#e8e2cc";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "bold 11px sans-serif"; g.fillText("ACESSO RESTRITO", 0, -127);
    g.fillStyle = CN_C.metalDark;                                // câmeras
    g.fillRect(-120, -146, 12, 6); g.fillRect(108, -146, 12, 6);
    cnBlink(g, -98, -143, 3, 0, t, "#f0a030");
    cnBlink(g, 98, -143, 3, 1.5, t, "#f0a030");
}

// ---- trechos contínuos (cerca, muro, postes) ----
function cnFenceRun(sx0, sx1, y, sc, t) {
    const h = 58 * sc, gap = 44 * sc, step = 8 * sc;
    const a = Math.max(sx0, -20), b = Math.min(sx1, W + 20);
    if (b <= a) return;
    ctx.fillStyle = "rgba(70,48,24,0.2)";
    ctx.fillRect(a, y - 1, b - a, 3 * sc);
    ctx.save();
    ctx.beginPath(); ctx.rect(a, y - h, b - a, h); ctx.clip();
    ctx.strokeStyle = "rgba(60,62,56,0.55)"; ctx.lineWidth = Math.max(0.7, 0.9 * sc);
    ctx.beginPath();
    const s0 = sx0 + Math.floor((a - sx0 - h) / step) * step;
    for (let x = s0; x < b; x += step) {
        ctx.moveTo(x, y); ctx.lineTo(x + h, y - h);
        ctx.moveTo(x, y - h); ctx.lineTo(x + h, y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = CN_C.metalDark;
    ctx.fillRect(a, y - h - 2 * sc, b - a, 2.6 * sc);
    ctx.fillRect(a, y - 3 * sc, b - a, 2 * sc);
    const i0 = Math.floor((a - sx0) / gap) - 1;
    for (let i = i0; sx0 + i * gap < b + gap; i++) {
        const x = sx0 + i * gap;
        if (x < a - 5 || x > b + 5) continue;
        ctx.fillStyle = CN_C.metalDark;
        ctx.fillRect(x - 1.6 * sc, y - h - 4 * sc, 3.2 * sc, h + 4 * sc);
        ctx.strokeStyle = "rgba(50,52,46,0.8)"; ctx.lineWidth = Math.max(0.7, 0.9 * sc);
        ctx.beginPath();
        ctx.moveTo(x, y - h - 2 * sc); ctx.lineTo(x + 9 * sc, y - h - 9 * sc);   // arame farpado
        ctx.stroke();
    }
    ctx.strokeStyle = "rgba(50,52,46,0.7)"; ctx.lineWidth = Math.max(0.7, 0.9 * sc);
    ctx.beginPath();
    ctx.moveTo(a, y - h - 8 * sc); ctx.lineTo(b, y - h - 8 * sc);
    ctx.stroke();
}

function cnWallRun(sx0, sx1, y, sc, t) {
    const h = 98 * sc, pw = 84 * sc;
    const a = Math.max(sx0, -20), b = Math.min(sx1, W + 20);
    if (b <= a) return;
    ctx.fillStyle = CN_C.conc; ctx.fillRect(a, y - h, b - a, h);
    ctx.fillStyle = "rgba(255,240,200,0.10)"; ctx.fillRect(a, y - h, b - a, h * 0.45);
    ctx.fillStyle = "rgba(90,70,45,0.20)"; ctx.fillRect(a, y - 16 * sc, b - a, 16 * sc);
    ctx.strokeStyle = "rgba(50,48,42,0.35)"; ctx.lineWidth = Math.max(1, 1.4 * sc);
    ctx.beginPath();
    const i0 = Math.floor((a - sx0) / pw) - 1;
    for (let i = i0; sx0 + i * pw < b + pw; i++) {
        const x = sx0 + i * pw;
        if (x < a - 2 || x > b + 2) continue;
        ctx.moveTo(x, y - h); ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = CN_C.concLit; ctx.fillRect(a, y - h, b - a, 8 * sc);
    ctx.fillStyle = CN_C.concDark; ctx.fillRect(a, y - h + 8 * sc, b - a, 3 * sc);
    ctx.strokeStyle = "rgba(40,40,36,0.8)"; ctx.lineWidth = Math.max(0.8, 1 * sc);
    ctx.beginPath();
    ctx.moveTo(a, y - h - 7 * sc); ctx.lineTo(b, y - h - 7 * sc);
    ctx.moveTo(a, y - h - 13 * sc); ctx.lineTo(b, y - h - 13 * sc);
    ctx.stroke();
    for (let i = i0; sx0 + i * pw < b + pw; i++) {               // luminárias a cada 3 painéis
        if (((i % 3) + 3) % 3 !== 1) continue;
        const x = sx0 + i * pw + pw / 2;
        if (x < a - 20 || x > b + 20) continue;
        ctx.fillStyle = CN_C.metalDark; ctx.fillRect(x - 1.5 * sc, y - h - 16 * sc, 3 * sc, 16 * sc);
        ctx.fillStyle = CN_C.light; ctx.fillRect(x - 9 * sc, y - h - 20 * sc, 18 * sc, 5 * sc);
        ctx.fillStyle = "rgba(255,241,184,0.10)";
        ctx.beginPath();
        ctx.moveTo(x - 9 * sc, y - h - 15 * sc); ctx.lineTo(x + 9 * sc, y - h - 15 * sc);
        ctx.lineTo(x + 34 * sc, y - h + 40 * sc); ctx.lineTo(x - 34 * sc, y - h + 40 * sc);
        ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(226,204,160,0.55)";                    // areia soprada contra o muro
    for (let i = i0; sx0 + i * pw < b + pw; i++) {
        const x = sx0 + i * pw;
        if (x < a - 40 || x > b + 40) continue;
        cnEll(ctx, x + pw * 0.5, y, pw * (0.45 + cnRnd(i * 3.3) * 0.3), (3 + cnRnd(i * 5.1) * 5) * sc);
    }
}

function cnPoleRun(sx0, sx1, y, sc, t) {
    const gap = 300 * sc, h = 120 * sc;
    const i0 = Math.max(0, Math.floor((-60 - sx0) / gap) - 1);
    for (let i = i0; ; i++) {
        const x = sx0 + i * gap;
        if (x > sx1 || x > W + gap) break;
        if (x < -gap) continue;
        ctx.fillStyle = "#4a3b2a"; ctx.fillRect(x - 2 * sc, y - h, 4 * sc, h);
        ctx.fillRect(x - 14 * sc, y - h + 8 * sc, 28 * sc, 3 * sc);
        if (x + gap <= sx1) {
            ctx.strokeStyle = "rgba(40,36,30,0.7)"; ctx.lineWidth = 1;
            const sag = 20 * sc;
            ctx.beginPath();
            ctx.moveTo(x + 12 * sc, y - h + 10 * sc);
            ctx.quadraticCurveTo(x + gap / 2, y - h + 10 * sc + sag, x + gap - 12 * sc, y - h + 10 * sc);
            ctx.moveTo(x - 12 * sc, y - h + 10 * sc);
            ctx.quadraticCurveTo(x + gap / 2 - 24 * sc, y - h + 10 * sc + sag, x + gap + 12 * sc, y - h + 10 * sc);
            ctx.stroke();
        }
    }
}

function cnSmoke(x, y, sc, t, wind, seed) {
    for (let j = 0; j < 9; j++) {
        const ph = (t * 0.16 + j / 9 + seed) % 1;
        const px = x + (ph * 70 * (0.5 + wind) + Math.sin(ph * 5 + j + seed * 7) * 6) * sc;
        const py = y - ph * 120 * sc;
        const r = (5 + ph * 24) * sc;
        ctx.globalAlpha = 0.34 * (1 - ph) * Math.min(1, ph * 8 + 0.15);
        ctx.fillStyle = ph < 0.25 ? "#3d3a38" : "#66625e";
        cnCirc(ctx, px, py, r);
    }
    ctx.globalAlpha = 1;
}

function cnDrawObj(o, sx, y, sc, t, wind) {
    const g = ctx;
    g.save();
    g.translate(sx, y);
    g.scale(sc * o.f, sc);
    switch (o.t) {
        case "truck": cnTruck(g, CN_PAL.army); break;
        case "wreck": g.rotate(-0.03); cnTruck(g, CN_PAL.dead); break;
        case "jeep": cnJeep(g, CN_PAL.army); break;
        case "jeepwreck": cnJeep(g, CN_PAL.dead); break;
        case "barrier": cnBarrier(g, o.v); break;
        case "crates": cnCrates(g, o.v); break;
        case "barrels": cnBarrels(g, o.v); break;
        case "tent": cnTent(g, t, wind); break;
        case "sign": cnSign(g, o.a, o.b); break;
        case "rocks": cnRocks(g, o.v); break;
        case "bush": cnBush(g, t, wind); break;
        case "tower": cnTower(g, o, t); break;
        case "antenna": cnAntenna(g, o, t); break;
        case "flag": cnFlag(g, t, wind, o.col); break;
        case "flood": cnFlood(g); break;
        case "booth": cnBooth(g); break;
        case "arm": cnGateArm(g, t); break;
        case "gate": cnGate(g, o, t); break;
    }
    g.restore();
    if (CN_SMOKE_ON && o.smoke) {
        cnSmoke(sx + o.smoke[0] * sc * o.f, y + o.smoke[1] * sc, sc, t, wind, (o.lx * 0.001) % 1);
    }
}

// =====================================================================
//  A FASE: onde cada coisa fica (coordenadas do mundo, 0 a WORLD_W)
//  d = profundidade: 0 faixa do jogador, 1 meio, 2 fundo
// =====================================================================
function cnBuildWorld() {
    const rows = [[], [], []];
    const dec = [];
    const add = function (d, t, lx, o) {
        rows[d].push(Object.assign({ t: t, lx: lx, f: 1, v: 0 }, o || {}));
    };

        // ---- TRECHO 1 (0–1500): área de aterrissagem ----
    dec.push({ t: "crater", lx: 150 });
    add(2, "rocks", 260, { v: 2 });
    add(1, "rocks", 760, { v: 0 });
    add(0, "rocks", 1000, { v: 1, f: -1 });
    add(0, "bush", 180);
    add(0, "bush", 860);
    add(1, "bush", 1180);
    add(2, "bush", 520);
    add(2, "poles", 120, { lx1: 1900 });
    add(2, "antenna", 700);
    add(2, "tower", 1300);
    add(2, "tent", 1020);
    add(1, "crates", 1240, { v: 0 });
    add(0, "sign", 1380, { a: "ZONA", b: "MILITAR" });

    // ---- TRECHO 2 (1500–3050): área de conflito ----
    dec.push({ t: "tracks", lx: 1650, lx1: 3050 });
    add(1, "truck", 1700, { f: -1 });
    add(2, "jeepwreck", 1850, { smoke: [10, -70] });
    add(0, "barrier", 1880, { v: 0 });
    add(0, "crates", 2020, { v: 1 });
    add(2, "truck", 2150);
    add(0, "jeep", 2230, { f: -1 });
    add(1, "barrels", 2300, { v: 0 });
    add(0, "barrier", 2400, { v: 1 });
    add(1, "flag", 2480);
    add(1, "tent", 2530);
    add(2, "tent", 2690);
    add(0, "wreck", 2660, { smoke: [24, -98] });
    add(1, "barrier", 2800, { v: 2 });
    add(0, "barrels", 2920, { v: 1 });
    add(0, "crates", 3020, { v: 2 });

    // ---- TRECHO 3 (3050–4500): aproximação da instalação ----
    add(0, "sign", 3090, { a: "PERIGO", b: "ÁREA VIGIADA" });
    add(1, "fence", 3100, { lx1: 4560 });
    add(0, "crates", 3230, { v: 0 });
    add(1, "tower", 3350);
    add(0, "truck", 3560);
    add(2, "antenna", 3650);
    add(1, "flood", 3800);
    add(0, "jeep", 3900);
    add(0, "barrier", 4080, { v: 0 });
    add(1, "tower", 4150);
    add(0, "barrels", 4260, { v: 0 });
    add(2, "antenna", 4400);
    add(0, "barrier", 4420, { v: 1 });

    // ---- TRECHO 4 (4500–6000): entrada da base ----
    add(1, "wall", 4800, { lx1: 6200 });
    add(1, "gate", 5650);
    add(1, "tower", 5400);
    add(1, "tower", 5900);
    add(1, "flag", 5500);
    add(1, "flag", 5800, { col: "#7a3b30" });
    add(1, "flood", 5000);
    add(0, "booth", 5100);
    add(0, "arm", 5250);
    add(0, "barrier", 5380, { v: 0 });
    add(0, "crates", 5520, { v: 1 });
    add(0, "barrier", 5880, { v: 0 });
    add(2, "antenna", 5200);
    add(2, "tower", 4900);

    for (let d = 0; d < 3; d++) rows[d].sort(function (a, b) { return a.lx - b.lx; });
    return { rows: rows, decals: dec };
}

// =====================================================================
//  CONSTRUÇÃO (roda uma vez, e de novo se a tela mudar de tamanho)
// =====================================================================
function cnMakeParticles() {
    const arr = [];
    for (let i = 0; i < CN_SAND + CN_LEAVES; i++) {
        const leaf = i >= CN_SAND;
        arr.push({
            leaf: leaf,
            x: cnRnd(i * 1.3) * W,
            y: CN.hor * 0.6 + cnRnd(i * 2.9) * (H - CN.hor * 0.6),
            v: 0.5 + cnRnd(i * 4.1) * 1.1,
            s: leaf ? 2.6 + cnRnd(i) * 1.8 : 0.8 + cnRnd(i * 5.3) * 1.5,
            a: 0.25 + cnRnd(i * 6.7) * 0.4,
            ph: cnRnd(i * 8.9) * 6.28
        });
    }
    return arr;
}

function cnBuild() {
    CN.W = W; CN.H = H;
    CN.hor = ground - H * CN_HORIZON;
    CN.k = (Math.min(H, W * 0.6) / 420) * CN_PROP_SCALE;
    CN.lights = []; CN.dishes = [];
    const hor = CN.hor, k = CN.k;
    const need = function (p) { return WORLD_W * p + W * 1.5 + 80; };

    CN.sky = cnMake(W, hor + 2);
    cnPaintSky(CN.sky.g, W, hor);

    CN.m1 = cnMake(need(0.05), hor + 2);
    cnRidge(CN.m1.g, CN.m1.w, hor, hor * 0.14, hor * 0.40, 11, "#b8aa99", "#d9cdb1", true);
    CN.m2 = cnMake(need(0.12), hor + 2);
    cnRidge(CN.m2.g, CN.m2.w, hor, hor * 0.10, hor * 0.32, 47, "#a69482", "#cfbf9f", true);

    CN.m3 = cnMake(need(0.26), hor + 2);
    cnPaintRocks(CN.m3, hor, k);

    CN.base = cnMake(need(0.42), hor + 2);
    cnPaintBase(CN.base, 0.42, 4350 * 0.42 + W / 2, hor, k * 0.5);

    CN.dunes = cnMake(need(0.55), hor + 2);
    cnPaintDunes(CN.dunes, hor);

    CN.apronTop = hor + (ground - hor) * 0.35;

    CN.gGrad = ctx.createLinearGradient(0, hor, 0, H);
    CN.gGrad.addColorStop(0, "#d9c8a1");
    CN.gGrad.addColorStop(0.25, "#d0b88a");
    CN.gGrad.addColorStop(0.6, "#c1a375");
    CN.gGrad.addColorStop(1, "#a98a5d");

    CN.cGrad = ctx.createLinearGradient(0, CN.apronTop, 0, H);
    CN.cGrad.addColorStop(0, "#a09c91");
    CN.cGrad.addColorStop(1, "#86837a");

    CN.hazeGrad = ctx.createLinearGradient(0, hor - 36 * k, 0, hor + 44 * k);
    CN.hazeGrad.addColorStop(0, "rgba(224,210,176,0)");
    CN.hazeGrad.addColorStop(0.45, "rgba(224,210,176,0.55)");
    CN.hazeGrad.addColorStop(1, "rgba(224,210,176,0)");

    const y0 = hor - 230 * k;
    CN.depthGrad = ctx.createLinearGradient(0, y0, 0, ground);
    CN.depthGrad.addColorStop(0, "rgba(222,208,176,1)");
    CN.depthGrad.addColorStop(0.74, "rgba(222,208,176,1)");
    CN.depthGrad.addColorStop(1, "rgba(222,208,176,0)");
    CN.depthTop = y0;

    const world = cnBuildWorld();
    CN.rows = world.rows;
    CN.decals = world.decals;
    CN.parts = cnMakeParticles();
    CN.t = performance.now() / 1000;
    CN.ready = true;
}

// =====================================================================
//  DESENHO A CADA QUADRO
// =====================================================================
function cnLayer(L, p, cam) {
    ctx.drawImage(L.c, -p * (cam + W / 2), 0, L.w, L.h);
}

function cnClouds(cam, t) {
    const span = W + 400;
    ctx.fillStyle = "#f6ecdc";
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
        const x = (((i * span / 5 + t * (4 + i * 1.5) - cam * 0.03) % span) + span) % span - 200;
        const y = CN.hor * (0.1 + ((i * 0.37) % 0.5));
        const w = (70 + i * 16) * (CN.k + 0.3);
        cnEll(ctx, x, y, w, w * 0.07);
        cnEll(ctx, x + w * 0.3, y - w * 0.04, w * 0.6, w * 0.06);
        cnEll(ctx, x - w * 0.35, y + w * 0.02, w * 0.5, w * 0.05);
    }
    ctx.globalAlpha = 1;
}

function cnFarLights(cam, t) {
    for (let i = 0; i < CN.lights.length; i++) {
        const L = CN.lights[i];
        const x = L.x - L.p * (cam + W / 2);
        if (x < -10 || x > W + 10) continue;
        cnBlink(ctx, x, L.y, L.r, L.ph, t);
    }
    for (let i = 0; i < CN.dishes.length; i++) {
        const D = CN.dishes[i];
        const x = D.x - D.p * (cam + W / 2);
        if (x < -40 || x > W + 40) continue;
        const a = Math.cos(t * 1.1), u = D.u;
        ctx.fillStyle = "#6c6f66";
        ctx.fillRect(x - 1.5 * u, D.y, 3 * u, 14 * u);
        ctx.fillStyle = "#c9c5b8";
        cnEll(ctx, x, D.y, Math.abs(a) * 13 * u + 1.5 * u, 6 * u);
    }
}

function cnApron(cam) {
    const x0 = CN_APRON_X - cam;
    if (x0 > W + 30) return;
    const top = CN.apronTop, k = CN.k;
    ctx.fillStyle = CN.cGrad;
    ctx.beginPath();
    ctx.moveTo(x0, top);
    for (let yy = top; yy <= H + 14; yy += 12) {
        ctx.lineTo(x0 + Math.sin(yy * 0.23) * 8 + cnRnd(yy) * 7, yy);
    }
    ctx.lineTo(W + 30, H + 14);
    ctx.lineTo(W + 30, top);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(55,52,46,0.25)"; ctx.lineWidth = 1.4;     // juntas do concreto
    ctx.beginPath();
    const j0 = Math.max(0, Math.floor((cam - CN_APRON_X) / 150));
    for (let j = j0; CN_APRON_X + 40 + j * 150 - cam < W + 160; j++) {
        const x = CN_APRON_X + 40 + j * 150 - cam;
        ctx.moveTo(x, top);
        ctx.lineTo(x + (x - W / 2) * 0.25, H);
    }
    const hs = [0.32, 0.62, 0.88];
    for (let i = 0; i < hs.length; i++) {
        const yy = top + (H - top) * hs[i];
        ctx.moveTo(Math.max(0, x0), yy); ctx.lineTo(W, yy);
    }
    ctx.stroke();
    ctx.save();                                                       // faixa amarela pintada
    ctx.strokeStyle = "rgba(224,190,60,0.55)";
    ctx.lineWidth = 3 * k;
    ctx.setLineDash([30 * k, 22 * k]);
    ctx.lineDashOffset = cam;
    const yl = ground + (H - ground) * 0.45;
    ctx.beginPath(); ctx.moveTo(Math.max(0, x0), yl); ctx.lineTo(W, yl); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(226,204,160,0.5)";                          // areia invadindo o concreto
    for (let i = 0; i < 8; i++) {
        const yy = top + (H - top) * (i / 8) + cnRnd(i * 4.3) * 10;
        cnEll(ctx, x0 + cnRnd(i * 7.9) * 50 + 6, yy, (20 + cnRnd(i * 2.2) * 40) * k, (4 + cnRnd(i * 3.1) * 5) * k);
    }
}

function cnDrawGround(cam) {
    const hor = CN.hor, k = CN.k;
    ctx.fillStyle = CN.gGrad;
    ctx.fillRect(0, hor, W, H - hor + 1);

    ctx.fillStyle = "rgba(120,90,55,0.07)";                           // sombras largas de dunas
    const big = 520, f0 = Math.floor(cam / big) - 1;
    for (let i = f0; i * big - cam < W + big; i++) {
        const x = i * big + cnRnd(i * 2.1) * 260 - cam;
        const y = hor + 18 + cnRnd(i * 3.7) * (H - hor - 30);
        cnEll(ctx, x, y, (120 + cnRnd(i * 5.1) * 160) * k, (10 + cnRnd(i * 7.3) * 12) * k);
    }

    cnApron(cam);

    const slot = 70, first = Math.floor(cam / slot) - 1;              // detalhes do chão (presos ao mundo)
    for (let i = first; i * slot - cam < W + slot; i++) {
        const lx = i * slot;
        const r1 = cnRnd(i * 1.7), r2 = cnRnd(i * 3.3 + 5), r3 = cnRnd(i * 5.9 + 9), r4 = cnRnd(i * 7.7 + 2);
        const x = lx + r1 * slot - cam;
        const y = hor + 8 + r3 * (H - hor - 12);
        const sz = (0.5 + (y - hor) / (H - hor)) * k;
        if (lx > CN_APRON_X + 20 && y > CN.apronTop) {
            if (r2 > 0.8) {                                           // manchas de óleo no concreto
                ctx.fillStyle = "rgba(40,38,34,0.12)";
                cnEll(ctx, x, y, 16 * sz, 3 * sz);
            }
            continue;
        }
        if (r2 > 0.5) {                                               // pedrinhas
            ctx.fillStyle = "rgba(120,92,58,0.55)";
            cnEll(ctx, x, y, 3 * sz, 1.8 * sz);
            ctx.fillStyle = "rgba(240,222,180,0.5)";
            cnEll(ctx, x + 0.8 * sz, y - 0.8 * sz, 1.5 * sz, 0.8 * sz);
        }
        if (r4 > 0.72) {                                              // ondas de areia
            ctx.lineWidth = Math.max(0.8, 1 * sz);
            ctx.strokeStyle = "rgba(255,238,200,0.22)";
            ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18 * sz, y - 3 * sz, x + 38 * sz, y); ctx.stroke();
            ctx.strokeStyle = "rgba(130,100,60,0.16)";
            ctx.beginPath(); ctx.moveTo(x, y + 1.8 * sz); ctx.quadraticCurveTo(x + 18 * sz, y - 1.2 * sz, x + 38 * sz, y + 1.8 * sz); ctx.stroke();
        }
        if (r2 < 0.08) {                                              // rachaduras
            ctx.strokeStyle = "rgba(70,50,30,0.22)"; ctx.lineWidth = Math.max(0.8, 1 * sz);
            ctx.beginPath(); ctx.moveTo(x, y);
            for (let s = 1; s <= 4; s++) ctx.lineTo(x + s * 7 * sz, y + (s % 2 ? 2 : -2) * sz);
            ctx.stroke();
        }
        if (r4 < 0.1) {                                               // mato seco
            ctx.strokeStyle = "#7d6a3d"; ctx.lineWidth = Math.max(0.8, 1 * sz);
            ctx.beginPath();
            for (let s = -2; s <= 2; s++) { ctx.moveTo(x, y); ctx.lineTo(x + s * 3 * sz, y - 8 * sz); }
            ctx.stroke();
        }
    }
}

function cnShimmer(t) {
    ctx.strokeStyle = "rgba(255,246,222,0.10)";
    ctx.lineWidth = 1.2;
    for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 14) {
            const y = CN.hor + 4 + r * 5 + Math.sin(x * 0.045 + t * 1.8 + r * 1.7) * 1.6;
            if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
    }
}

function cnCrater(lx, cam) {
    const k = CN.k, sx = lx - cam;
    if (sx < -260 * k || sx > W + 260 * k) return;
   const y = ground + PLAYER_DROP;
    ctx.fillStyle = "rgba(110,84,52,0.20)"; cnEll(ctx, sx, y, 190 * k, 30 * k);
    ctx.fillStyle = "#b99b6a"; cnEll(ctx, sx, y, 140 * k, 22 * k);
    ctx.fillStyle = "#7a5f3c"; cnEll(ctx, sx + 4 * k, y + 2 * k, 118 * k, 17 * k);
    ctx.fillStyle = "#4e3b27"; cnEll(ctx, sx + 8 * k, y + 3 * k, 80 * k, 11 * k);
    ctx.strokeStyle = "rgba(60,42,28,0.45)"; ctx.lineWidth = 1.6 * k;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.2832 + 0.3, r = cnRnd(i * 3.9);
        ctx.moveTo(sx + Math.cos(a) * 122 * k, y + Math.sin(a) * 18 * k);
        ctx.lineTo(sx + Math.cos(a) * (165 + r * 40) * k, y + Math.sin(a) * (25 + r * 6) * k);
    }
    ctx.stroke();
    ctx.fillStyle = CN_C.rockShade;                                   // pedras arremessadas
    for (let i = 0; i < 7; i++) {
        const a = cnRnd(i * 5.1) * 6.2832, d = 150 + cnRnd(i * 2.7) * 60;
        cnEll(ctx, sx + Math.cos(a) * d * k, y + Math.sin(a) * 24 * k, (3 + cnRnd(i) * 4) * k, (2 + cnRnd(i) * 2) * k);
    }
}

function cnTracks(lx0, lx1, cam) {
    const k = CN.k, a = lx0 - cam, b = lx1 - cam;
    if (b < -20 || a > W + 20) return;
    const start = Math.max(a, -10), end = Math.min(b, W + 10);
    ctx.strokeStyle = "rgba(118,90,56,0.22)";
    ctx.lineWidth = 3.2 * k;
    ctx.lineCap = "round";
    const offs = [16, 27];
    for (let n = 0; n < offs.length; n++) {
        ctx.beginPath();
        for (let x = start; x <= end; x += 20) {
            const yy = ground + offs[n] * k + Math.sin((x + cam) * 0.01) * 3 * k;
            if (x === start) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
    }
    ctx.lineCap = "butt";
}

function cnDrawRun(o, sx0, sx1, y, sc, t) {
    if (o.t === "fence") cnFenceRun(sx0, sx1, y, sc, t);
    else if (o.t === "wall") cnWallRun(sx0, sx1, y, sc, t);
    else if (o.t === "poles") cnPoleRun(sx0, sx1, y, sc, t);
}

function cnRowY(d) {
    if (d === 0) return ground - 5;
    if (d === 1) return CN.hor + (ground - CN.hor) * 0.62;
    return CN.hor + (ground - CN.hor) * 0.26;
}

function cnDepthHaze(a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = CN.depthGrad;
    ctx.fillRect(0, CN.depthTop, W, ground - CN.depthTop);
    ctx.globalAlpha = 1;
}

function cnDust(t) {
    ctx.fillStyle = "#e2cd9e";
    for (let j = 0; j < 7; j++) {
        const sp = 0.012 + (j % 3) * 0.006;
        const ph = (t * sp + j / 7) % 1;
        const x = ph * (W + 360) - 180;
        const y = ground + (cnRnd(j * 3.7) * 0.9 - 0.15) * (H - ground);
        const rx = (60 + cnRnd(j * 9.1) * 80) * CN.k;
        ctx.globalAlpha = 0.07 + 0.05 * Math.sin(ph * 3.1416);
        cnEll(ctx, x, y, rx, rx * 0.16);
        cnEll(ctx, x + rx * 0.35, y - rx * 0.05, rx * 0.6, rx * 0.12);
    }
    ctx.globalAlpha = 1;
}

function cnParticles(dt, t, wind) {
    for (let i = 0; i < CN.parts.length; i++) {
        const q = CN.parts[i];
        q.x += (35 + 150 * wind) * q.v * dt * (q.leaf ? 0.8 : 1);
        q.y += Math.sin(t * (q.leaf ? 2.2 : 1.4) + q.ph) * (q.leaf ? 16 : 7) * dt;
        if (q.x > W + 16) {
            q.x = -16;
            q.y = CN.hor * 0.6 + Math.random() * (H - CN.hor * 0.6);
        }
        if (q.leaf) {
            ctx.save();
            ctx.translate(q.x, q.y);
            ctx.rotate(t * 2.4 + q.ph);
            ctx.globalAlpha = 0.75;
            ctx.fillStyle = q.s > 3.6 ? "#8b6b3a" : "#a98450";
            cnEll(ctx, 0, 0, q.s, q.s * 0.45);
            ctx.restore();
        } else {
            ctx.globalAlpha = q.a * (0.7 + 0.3 * Math.min(1, wind));
            ctx.fillStyle = "#ecd8ac";
            const len = wind > 1.15 ? q.s * (1.5 + wind * 2) : q.s;
            ctx.fillRect(q.x, q.y, len, q.s * 0.75);
        }
    }
    ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  A função que o game.js chama (substitui a drawBackground antiga)
// ---------------------------------------------------------------------
function drawBackground() {
    if (!CN.ready || CN.W !== W || CN.H !== H) cnBuild();
    const cam = Math.max(0, Math.min(camera || 0, WORLD_W));
    const t = performance.now() / 1000;
    const dt = Math.min(0.05, Math.max(0, t - CN.t));
    CN.t = t;
    const wind = cnWind(t);

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.setLineDash([]);

    // céu e camadas distantes (parallax: quanto mais longe, mais devagar)
    ctx.drawImage(CN.sky.c, 0, 0, CN.sky.w, CN.sky.h);
    cnClouds(cam, t);
    cnLayer(CN.m1, 0.05, cam);
    cnLayer(CN.m2, 0.12, cam);
    cnLayer(CN.m3, 0.26, cam);
    cnLayer(CN.base, 0.42, cam);
    cnFarLights(cam, t);
    cnLayer(CN.dunes, 0.55, cam);

    // chão
    cnDrawGround(cam);
    cnShimmer(t);
    ctx.fillStyle = CN.hazeGrad;
    ctx.fillRect(0, CN.hor - 36 * CN.k, W, 80 * CN.k);
    for (let i = 0; i < CN.decals.length; i++) {
        const d = CN.decals[i];
        if (d.t === "crater") cnCrater(d.lx, cam);
        else if (d.t === "tracks") cnTracks(d.lx, d.lx1, cam);
    }

    // objetos, do fundo para a frente
    for (let d = 2; d >= 0; d--) {
        const row = CN_ROWS[d], y = cnRowY(d), sc = row.sc * CN.k;
        const list = CN.rows[d];
        for (let i = 0; i < list.length; i++) {
            const o = list[i];
            const sx = W / 2 * (1 - row.p) + row.p * (o.lx - cam);
            if (o.lx1 !== undefined) {
                const sx1 = W / 2 * (1 - row.p) + row.p * (o.lx1 - cam);
                if (sx1 < -60 || sx > W + 60) continue;
                cnDrawRun(o, sx, sx1, y, sc, t);
            } else {
                const e = 130 * sc;
                if (sx < -e || sx > W + e) continue;
                cnDrawObj(o, sx, y, sc, t, wind);
            }
        }
        if (d === 2) cnDepthHaze(0.30);
        else if (d === 1) cnDepthHaze(0.16);
    }

    // ambiente vivo (atrás do personagem, bem sutil)
    cnDust(t);
    cnParticles(dt, t, wind);
    ctx.restore();
}
