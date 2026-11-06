window.onerror = (m, s, l) => { document.body.innerHTML = "<pre style='color:#fff;background:#000;padding:12px;font-size:15px;white-space:pre-wrap'>ERRO: " + m + " (linha " + l + ")</pre>"; };
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W, H, ground, camera = 0;

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ground = H * 0.78;
}

window.addEventListener("resize", resize);
resize();

// JOGADOR
const player = {
    x: 150,
    y: 0,
    vy: 0,
    speed: 4,
    direction: 1,
    attacking: false,
    attackTime: 0,
    hp: 100,
  invulnerable: 0,
      jumpPrev: false,
    jumpQueued: false,
    fallTick: 0,
    landTick: 0,
};

// INIMIGO
const enemy = {
    x: 450,
    hp: 100,
    alive: false
};

let keys = {};
let touch = { left: false, right: false };
let activePointers = {};
let score = 0;
const WORLD_W = 6000;
// ===== SPRITES DO PLAYER =====
const ANIM_PATH = "assets/player/punch/";
const PUNCH_FILES = [
    "punch-1793605993487_0000.png",
    "punch-1793605993807_0001.png",
    "punch-1793605993907_0002.png",
    "punch-1793605993974_0003.png",
    "punch-1793605994041_0004.png",
    "punch-1793605994125_0005.png",
    "punch-1793605994269_0006.png",
    "punch-1793605994382_0007.png",
    "punch-1793605994493_0008.png",
    "punch-1793605994592_0009.png",
    "punch-1793605994692_0010.png",
    "punch-1793605994773_0011.png",
    "punch-1793605994845_0012.png",
    "punch-1793605994908_0013.png",
    "punch-1793605994979_0014.png",
    "punch-1793605995048_0015.png"
];
const PUNCH_FRAMES = PUNCH_FILES.length;

const ATTACK_TIME = 24;      // duração do soco (maior = mais lento)
const SLIDE_SPEED = 4;       // força da arrastada (maior = vai mais longe)
const SLIDE_FRICTION = 0.78; // menor = para mais rápido
const SPRITE_SCALE = 0.5;      // tamanho do boneco
const SPRITE_FEET = 0.80;    // onde ficam os pés no quadro (0 a 1)
const SPRITE_OFFSET_X = 0;
const SPRITE_OFFSET_Y = 0;

const punchImgs = [];
let punchReady = 0;

for (let i = 0; i < PUNCH_FRAMES; i++) {
    const img = new Image();
    img.onload = () => punchReady++;
      img.src = encodeURI(ANIM_PATH + PUNCH_FILES[i]);
    punchImgs.push(img);
}
// ===== SOCO 2 =====
const PUNCH2_PATH = "assets/player/punch2/";
const PUNCH2_FILES = [
    "punch2-1793661555717_0000.png",
    "punch2-1793661555976_0001.png",
    "punch2-1793661556071_0002.png",
    "punch2-1793661556170_0003.png",
    "punch2-1793661556310_0004.png",
    "punch2-1793661556429_0005.png",
    "punch2-1793661556532_0006.png",
    "punch2-1793661556645_0007.png",
    "punch2-1793661556766_0008.png",
    "punch2-1793661556841_0009.png",
    "punch2-1793661556907_0010.png"
];
const punch2Imgs = [];
let punch2Ready = 0;

for (let i = 0; i < PUNCH2_FILES.length; i++) {
    const img = new Image();
    img.onload = () => punch2Ready++;
    img.src = encodeURI(PUNCH2_PATH + PUNCH2_FILES[i]);
    punch2Imgs.push(img);
}
const ATTACK2_TIME = 17;   // duração do soco 2 (maior = mais lento)
const CANCEL1 = 0.56;      // soco 1 corta no frame 9 (9/16)
const HIT2_START = 0.44;   // dano do soco 2 no frame 5
const HIT2_END = 0.56;
// ===== SOCO 3 =====
const PUNCH3_PATH = "assets/player/punch3/";
const PUNCH3_FILES = [
    "punch3-1793891821153_0000.png",
    "punch3-1793891821385_0001.png",
    "punch3-1793891821468_0002.png",
    "punch3-1793891821572_0003.png",
    "punch3-1793891821669_0004.png",
    "punch3-1793891821767_0005.png",
    "punch3-1793891821832_0006.png",
    "punch3-1793891821968_0007.png",
    "punch3-1793891822090_0008.png",
    "punch3-1793891822193_0009.png",
    "punch3-1793891822339_0010.png",
    "punch3-1793891822443_0011.png",
    "punch3-1793891822566_0012.png",
    "punch3-1793891822660_0013.png",
    "punch3-1793891822779_0014.png",
    "punch3-1793891822836_0015.png",
    "punch3-1793891823089_0016.png",
    "punch3-1793891823169_0017.png",
    "punch3-1793891823239_0018.png",
    "punch3-1793891823319_0019.png",
    "punch3-1793891823388_0020.png",
    "punch3-1793891823470_0021.png",
    "punch3-1793891823540_0022.png",
    "punch3-1793891823604_0023.png"
];
const punch3Imgs = [];
let punch3Ready = 0;
for (let i = 0; i < PUNCH3_FILES.length; i++) {
    const img = new Image();
    img.onload = () => punch3Ready++;
    img.src = encodeURI(PUNCH3_PATH + PUNCH3_FILES[i]);
    punch3Imgs.push(img);
}
const ATTACK3_TIME = 30;   // duração (valor chutado, ajuste)
const HIT3_START = 0.40;   // quando começa o dano (chutado, ajuste)
const HIT3_END = 0.60;
const KNOCKBACK3 = 14;     // empurrão no inimigo (só soco 3)
const HOLD3_FRAME = 6;   // frame onde o soco 3 trava
const HOLD3_TICKS = 6;   // quanto tempo trava (maior = trava mais)
const LUNGE3 = 8;        // avanço do jogador no hit (menor que o 14 do inimigo)

// ===== SOCO 4 =====
const PUNCH4_PATH = "assets/player/punch4/";
const PUNCH4_FILES = [
    "punch4-1793936710455_0000.png",
    "punch4-1793936710828_0001.png",
    "punch4-1793936711070_0002.png",
    "punch4-1793936711304_0003.png",
    "punch4-1793936711520_0004.png",
    "punch4-1793936711826_0005.png",
    "punch4-1793936712146_0006.png",
    "punch4-1793936712711_0007.png",
    "punch4-1793936712958_0008.png",
    "punch4-1793936713176_0009.png",
    "punch4-1793936713435_0010.png",
    "punch4-1793936713659_0011.png",
    "punch4-1793936713877_0012.png",
    "punch4-1793936714103_0013.png",
    "punch4-1793936714327_0014.png",
    "punch4-1793936714561_0015.png",
    "punch4-1793936714777_0016.png"
];
const punch4Imgs = [];
let punch4Ready = 0;
for (let i = 0; i < PUNCH4_FILES.length; i++) {
    const img = new Image();
    img.onload = () => punch4Ready++;
    img.src = encodeURI(PUNCH4_PATH + PUNCH4_FILES[i]);
    punch4Imgs.push(img);
}
const ATTACK4_TIME = 26;   // duração (valor chutado, ajuste)
const HIT4_START = 0.40;   // início do dano (chutado)
const HIT4_END = 0.60;
const KNOCKBACK4 = 18;     // empurrão no inimigo
const PUNCH4_SCALE = 0.25;    // tamanho do soco 4 (menor = personagem menor)
const PUNCH4_OFFSET_X = 0;   // mover para os lados
const PUNCH4_OFFSET_Y = 0;   // negativo sobe, positivo desce
player.combo = 0;
player.attackMax = ATTACK_TIME;
player.queued = 0;
player.hold = 0;
player.held = false;

function startPunch2() {
    player.combo = 2;
    player.attackMax = ATTACK2_TIME;
    player.attackTime = ATTACK2_TIME;
    player.hitList = [];
    player.queued = 0;
    player.slide = player.y === 0 ? player.direction * SLIDE2_SPEED : 0;
}
// ===== IDLE =====
const IDLE_PATH = "assets/player/idle/";
const IDLE_FPS = 12;
const IDLE_FILES = [
    "idle-1793607261032_0000.png",
    "idle-1793607261305_0001.png",
    "idle-1793607261391_0002.png",
    "idle-1793607261474_0003.png",
    "idle-1793607261539_0004.png",
    "idle-1793607261606_0005.png",
    "idle-1793607261674_0006.png",
    "idle-1793607261742_0007.png",
    "idle-1793607261806_0008.png",
    "idle-1793607261875_0009.png",
    "idle-1793607261959_0010.png",
    "idle-1793607262023_0011.png",
    "idle-1793607262109_0012.png",
    "idle-1793607262175_0013.png",
    "idle-1793607262260_0014.png",
    "idle-1793607262327_0015.png",
    "idle-1793607262392_0016.png",
    "idle-1793607262459_0017.png",
    "idle-1793607262527_0018.png",
    "idle-1793607262591_0019.png",
    "idle-1793607262659_0020.png"
];
const idleImgs = [];
let idleReady = 0;

for (let i = 0; i < IDLE_FILES.length; i++) {
    const img = new Image();
    img.onload = () => idleReady++;
    img.src = encodeURI(IDLE_PATH + IDLE_FILES[i]);
    idleImgs.push(img);
}
// ===== RUN e JUMP =====
function loadAnim(path, files) {
    const anim = { imgs: [], ready: 0, total: files.length };
    files.forEach(f => {
        const img = new Image();
        img.onload = () => anim.ready++;
        img.src = encodeURI(path + f);
        anim.imgs.push(img);
    });
    return anim;
}

const RUN_FPS = 24;
const RUN_SCALE = 1;    // se o run aparecer gigante, use 0.5
const JUMP_SCALE = 1;   // idem
const RUN_OFFSET_Y = -12;    // negativo sobe, positivo desce
const JUMP_OFFSET_Y = 0;
const RUN_OFFSET_X = 100;
const JUMP_OFFSET_X = 0;
const JUMP_VY = 13;          // força do pulo (maior = mais alto)
const JUMP_CUT = 6;          // altura do toque rápido (menor = mais baixo)
const JUMP_FALL_START = 12;  // frame onde começa a cair
const JUMP_LAND_FRAME = 23;  // frame do pouso
const JUMP_ANIM_SPEED = 0.4; // velocidade da queda

const runAnim = loadAnim("assets/player/run/", [
    "run-1793560222892_0000.png",
    "run-1793560223255_0001.png",
    "run-1793560223355_0002.png",
    "run-1793560223577_0003.png",
    "run-1793560223652_0004.png",
    "run-1793560223736_0005.png",
    "run-1793560223818_0006.png",
    "run-1793560223952_0007.png",
    "run-1793560224019_0008.png",
    "run-1793560224086_0009.png",
    "run-1793560224151_0010.png",
    "run-1793560224235_0011.png"
]);
const START_FPS = 14;          // menor = transição mais lenta
const START_OFFSET_X = 0;
const START_OFFSET_Y = -30;    // comece igual ao do run
const START_SCALE = 1;

const startAnim = loadAnim("assets/player/transicaopracorrida/", [
    "transicaopracorrida-1793613437868_0000.png",
    "transicaopracorrida-1793613438155_0001.png",
    "transicaopracorrida-1793613438238_0002.png",
    "transicaopracorrida-1793613438321_0003.png"
]);

let startTick = -1;     // -1 = não está tocando
let wasMoving = false;

const jumpAnim = loadAnim("assets/player/jumlp/", [
    "jumlp-1793565156598_0000.png",
    "jumlp-1793565156778_0001.png",
    "jumlp-1793565156859_0002.png",
    "jumlp-1793565156944_0003.png",
    "jumlp-1793565157142_0004.png",
    "jumlp-1793565157233_0005.png",
    "jumlp-1793565157320_0006.png",
    "jumlp-1793565157433_0007.png",
    "jumlp-1793565157584_0008.png",
    "jumlp-1793565157657_0009.png",
    "jumlp-1793565157748_0010.png",
    "jumlp-1793565157850_0011.png",
    "jumlp-1793565157948_0012.png",
    "jumlp-1793565158028_0013.png",
    "jumlp-1793565158111_0014.png",
    "jumlp-1793565158198_0015.png",
    "jumlp-1793565158262_0016.png",
    "jumlp-1793565158396_0017.png",
    "jumlp-1793565158489_0018.png",
    "jumlp-1793565158549_0019.png",
    "jumlp-1793565158632_0020.png",
    "jumlp-1793565158704_0021.png",
    "jumlp-1793565158788_0022.png",
    "jumlp-1793565158862_0023.png"
]);
function drawPlayer() {
    let img = null;
    let scale = SPRITE_SCALE;
let offY = 0;
  let offX = 0;
    const moving = keys["arrowright"] || keys["arrowleft"] ||
                   keys["d"] || keys["a"] || touch.left || touch.right;
    const inAir = player.y > 0;
// controla a transição idle -> run
if (moving && !wasMoving && !inAir && !player.attacking) {
    startTick = performance.now();
}
if (!moving || inAir || player.attacking) startTick = -1;
wasMoving = !!moving;

let startFrame = -1;
if (startTick >= 0 && startAnim.ready === startAnim.total) {
    const f = Math.floor((performance.now() - startTick) / 1000 * START_FPS);
    if (f < startAnim.total) startFrame = f;
    else startTick = -1;
}
        if (player.attacking && player.combo === 4 && punch4Ready === PUNCH4_FILES.length) {
    const p = 1 - player.attackTime / player.attackMax;
    img = punch4Imgs[Math.min(PUNCH4_FILES.length - 1, Math.floor(p * PUNCH4_FILES.length))];
          scale *= PUNCH4_SCALE;
offX = PUNCH4_OFFSET_X;
offY = PUNCH4_OFFSET_Y;

} else if (player.attacking && player.combo === 3 && punch3Ready === PUNCH3_FILES.length) {
    const p = 1 - player.attackTime / player.attackMax;
    img = punch3Imgs[Math.min(PUNCH3_FILES.length - 1, Math.floor(p * PUNCH3_FILES.length))];

} else if (player.attacking && player.combo === 2 && punch2Ready === PUNCH2_FILES.length) {
        const p = 1 - player.attackTime / player.attackMax;
        img = punch2Imgs[Math.min(PUNCH2_FILES.length - 1, Math.floor(p * PUNCH2_FILES.length))];

    } else if (player.attacking && punchReady === PUNCH_FRAMES) {
        const p = 1 - player.attackTime / player.attackMax;
        img = punchImgs[Math.min(PUNCH_FRAMES - 1, Math.floor(p * PUNCH_FRAMES))];

    } else if ((inAir || player.landTick > 0) && jumpAnim.ready === jumpAnim.total) {
        let f;
        if (!inAir) {
            f = JUMP_LAND_FRAME;
        } else if (player.vy > 0) {
            const p = 1 - player.vy / JUMP_VY;
            f = Math.min(JUMP_FALL_START - 1, Math.floor(p * JUMP_FALL_START));
        } else {
            f = Math.min(JUMP_LAND_FRAME - 1,
                JUMP_FALL_START + Math.floor(player.fallTick * JUMP_ANIM_SPEED));
        }
        img = jumpAnim.imgs[f];
        scale *= JUMP_SCALE;
offY = JUMP_OFFSET_Y;
    } else if (startFrame >= 0) {
    img = startAnim.imgs[startFrame];
    scale *= START_SCALE;
    offY = START_OFFSET_Y;
    offX = START_OFFSET_X;

} else if (moving && runAnim.ready === runAnim.total) {
        const i = Math.floor(performance.now() / 1000 * RUN_FPS) % runAnim.total;
        img = runAnim.imgs[i];
        scale *= RUN_SCALE;
offY = RUN_OFFSET_Y;
      offX = RUN_OFFSET_X;
      offX = JUMP_OFFSET_X;
    } else if (!moving && !inAir && idleReady === IDLE_FILES.length) {
        const i = Math.floor(performance.now() / 1000 * IDLE_FPS) % IDLE_FILES.length;
        img = idleImgs[i];
    }

    if (img) {
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.translate(player.x - camera, ground - player.y);
        ctx.scale(player.direction, 1);
        ctx.drawImage(img, -w / 2 + SPRITE_OFFSET_X + offX, -h * SPRITE_FEET + SPRITE_OFFSET_Y + offY, w, h);
        ctx.restore();
    } else {
        drawStickman(player.x, player.y, "#ffffff", player.direction, player.attacking);
    }
}
// CONTROLES DO TECLADO
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// BOTÕES NA TELA
const buttons = {
    left:  { x: 25, y: 0, w: 65, h: 65 },
    right: { x: 105, y: 0, w: 65, h: 65 },
    jump:  { x: 0, y: 0, w: 65, h: 65 },
    hit:   { x: 0, y: 0, w: 80, h: 80 }
};

function updateButtons() {
    buttons.left.y = H - 100;
    buttons.right.y = H - 100;
    buttons.jump.x = W - 185;
    buttons.jump.y = H - 100;
    buttons.hit.x = W - 95;
    buttons.hit.y = H - 110;
}


canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);

    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    if (inside(x, y, buttons.left)) {
        activePointers[e.pointerId] = "left";
        touch.left = true;
    }

    else if (inside(x, y, buttons.right)) {
        activePointers[e.pointerId] = "right";
        touch.right = true;
    }

    else if (inside(x, y, buttons.jump)) {
        activePointers[e.pointerId] = "jump";

                touch.jump = true;
        player.jumpQueued = true;
    }

    else if (inside(x, y, buttons.hit)) {
        activePointers[e.pointerId] = "hit";
        attack();
    }
});

function releasePointer(e) {
    delete activePointers[e.pointerId];

    touch.left = Object.values(activePointers).includes("left");
    touch.right = Object.values(activePointers).includes("right");
      touch.jump = Object.values(activePointers).includes("jump");
}

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);


function inside(x, y, b) {
    return x >= b.x && x <= b.x + b.w &&
           y >= b.y && y <= b.y + b.h;
}

// ATAQUE
function attack() {
    if (gameState !== "playing") return;
    if (player.attacking) {
        if (player.combo >= 1 && player.combo <= 3) player.queued = 12;
        return;
    }
    player.attacking = true;
    player.combo = 1;
    player.attackMax = ATTACK_TIME;
    player.attackTime = ATTACK_TIME;
    player.hitList = [];
    player.queued = 0;
    const mv = keys["arrowright"] || keys["d"] || keys["arrowleft"] || keys["a"] ||
               touch.left || touch.right;
    player.slide = (mv && player.y === 0) ? player.direction * SLIDE_SPEED : 0;
}


// DESENHAR STICKMAN
function drawStickman(x, y, color, direction, attacking) {
    ctx.save();
    ctx.translate(x - camera, ground - y);
    ctx.scale(direction, 1);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    // CABEÇA
    ctx.beginPath();
    ctx.arc(0, -65, 13, 0, Math.PI * 2);
    ctx.stroke();

    // CORPO
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(0, -20);
    ctx.stroke();

    // BRAÇOS
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(-15, -30);

    if (attacking) {
        ctx.lineTo(35, -43);
    } else {
        ctx.lineTo(-25, -15);
    }

    ctx.moveTo(0, -45);
    ctx.lineTo(15, -30);
    ctx.lineTo(25, -15);
    ctx.stroke();

    // PERNAS
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(15, 0);
    ctx.stroke();

    ctx.restore();
}



// INTERFACE
function drawUI() {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("STICK FIGHT", 20, 35);
    ctx.fillText("Pontos: " + score, 20, 65);

    // VIDA
    ctx.fillStyle = "#555";
    ctx.fillRect(20, 80, 130, 12);
    ctx.fillStyle = "#35df72";
    ctx.fillRect(20, 80, 130 * player.hp / 100, 12);

    // INIMIGO
    if (enemy.alive) {
        ctx.fillStyle = "#555";
        ctx.fillRect(W - 145, 25, 120, 10);
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(W - 145, 25, 120 * enemy.hp / 100, 10);
    }

    updateButtons();

    drawButton(buttons.left, "◀");
    drawButton(buttons.right, "▶");
    drawButton(buttons.jump, "↑");
    drawButton(buttons.hit, "SOCO");
}

function drawButton(b, label) {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

// ATUALIZAÇÃO
function update() {
  if (player.invulnerable > 0) {
    player.invulnerable--;
  }
    let moving = false;
      const canMove = !player.attacking || player.y > 0;

    if (canMove && (keys["arrowright"] || keys["d"] || touch.right)) {
        player.x += player.speed;
        player.direction = 1;
        moving = true;
    }

    if (canMove && (keys["arrowleft"] || keys["a"] || touch.left)) {
        player.x -= player.speed;
        player.direction = -1;
        moving = true;
    }
      if (player.attacking && player.slide) {
        player.x += player.slide;
        player.slide *= SLIDE_FRICTION;
        if (Math.abs(player.slide) < 0.2) player.slide = 0;
      }

    player.x = Math.max(20, player.x);
      // PULO
    const jumpHeld = keys["w"] || keys["arrowup"] || keys[" "] || touch.jump;
    if (jumpHeld && !player.jumpPrev) player.jumpQueued = true;
    player.jumpPrev = !!jumpHeld;

    if (player.landTick > 0) player.landTick--;

    if (player.jumpQueued && player.y === 0) {
        player.vy = JUMP_VY;
        player.fallTick = 0;
        player.landTick = 0;
    }
    player.jumpQueued = false;

    // soltou cedo = pulo baixo
    if (!jumpHeld && player.vy > JUMP_CUT) player.vy = JUMP_CUT;

    const wasInAir = player.y > 0;
    player.y += player.vy;
    player.vy -= 0.6;

    if (player.y > 0 && player.vy <= 0) player.fallTick++;

    if (player.y < 0) {
        player.y = 0;
        player.vy = 0;
        if (wasInAir) player.landTick = 6;
    }
    


    if (keys["j"] || keys["z"]) {
        attack();
        keys["j"] = false;
        keys["z"] = false;
    }

    if (player.attacking) {
        player.attackTime--;
        if (player.attackTime <= 0) {
            player.attacking = false;
        }
    }

    camera = Math.max(0, player.x - W * 0.4);

    if (enemy.alive && enemy.hp > 0) {
    if (Math.abs(player.x - enemy.x) > 65) {
        enemy.x += enemy.x > player.x ? -0.7 : 0.7;
    } else if (player.invulnerable <= 0) {
        player.hp = Math.max(0, player.hp - 5);
        player.invulnerable = 60;
       }
      }
     }

// ===== COMBATE =====
const DEBUG_HITBOX = false;   // true = mostra as caixas de golpe

const PUNCH_DMG = 25;
const PUNCH_PUSH = 9;
const PUSH1 = 2;           // empurrão do soco 1 (pequeno)
const PUSH2 = 10;          // empurrão do soco 2 (forte)
const SLIDE2_SPEED = 5;    // avanço do Pyro no soco 2
const PUNCH_REACH = 100;
const HIT_START = 0.43;
const HIT_END = 0.56;

const ENEMY_HP = 75;
const ENEMY_RANGE = 70;
const ENEMY_REACH = 85;
const ENEMY_DMG = 10;
const ENEMY_WINDUP = 28;
const ENEMY_ATTACK_TIME = 14;
const MAX_ATTACKERS = 2;

const WAVES = [3, 2, 3, 4];
const WAVE_PAUSE = 90;

let enemies = [];
let wave = 0;
let waveDelay = 60;
let gameState = "menu";
let endTimer = 0;
let hitStop = 0;
let shake = 0;
player.hitList = [];

function makeEnemy(x) {
    return {
        x: x, y: 0, hp: ENEMY_HP,
        state: "walk", timer: 0, dir: -1, vx: 0,
        hitFlash: 0,
        cooldown: 60 + Math.random() * 60,
        speed: 1.1 + Math.random() * 0.5,
        hitDone: false
    };
}

function spawnWave(n) {
    for (let i = 0; i < n; i++) {
        let x;
        if ((i % 2 === 0 && camera + W + 60 <= WORLD_W) || camera - 60 < 0) {
            x = camera + W + 60 + i * 40;
        } else {
            x = camera - 60 - i * 40;
        }
        enemies.push(makeEnemy(Math.max(0, Math.min(WORLD_W, x))));
    }
}

function attackersCount() {
    let n = 0;
    for (const e of enemies) {
        if (e.state === "windup" || e.state === "attack") n++;
    }
    return n;
}

function hitEnemy(e) {
    e.hp -= PUNCH_DMG;
    e.hitFlash = 8;
    e.vx = player.direction * (player.combo === 4 ? KNOCKBACK4 : player.combo >= 2 ? 0 : PUNCH_PUSH);
  if (player.combo === 4) player.slide = player.direction * LUNGE3;
    hitStop = 5;
    shake = 8;
    if (e.hp <= 0) {
        e.state = "dead";
        e.timer = 40;
        e.vx = player.direction * (PUNCH_PUSH + 4);
        score += 100;
        hitStop = 9;
        shake = 14;
    } else {
        e.state = "hit";
        e.timer = 18;
    }
}

function hurtPlayer(e, dmg) {
    if (player.invulnerable > 0) return;
    player.hp = Math.max(0, player.hp - dmg);
    player.invulnerable = 60;
    player.x = Math.max(20, Math.min(WORLD_W - 20, player.x + e.dir * 28));
    hitStop = 6;
    shake = 10;
}

function updateCombat() {
    // HITBOX DO SOCO
      if (player.queued > 0) player.queued--;
  if (player.attacking && player.combo === 3) {
    const p3 = 1 - player.attackTime / player.attackMax;
    if (!player.held && p3 >= HOLD3_FRAME / PUNCH3_FILES.length) {
        player.held = true;
        player.hold = HOLD3_TICKS;
    }
}
if (player.hold > 0) {
    player.hold--;
    player.attackTime++;
}
    if (player.attacking && player.combo === 1 && player.queued > 0) {
        const pc = 1 - player.attackTime / player.attackMax;
        if (pc >= CANCEL1) startPunch2();
    }
  function startPunch3() {
    player.combo = 3;
    player.attackMax = ATTACK3_TIME;
    player.attackTime = ATTACK3_TIME;
    player.hitList = [];
    player.queued = 0;
    player.slide = 0;
        player.hold = 0;
    player.held = false;
  }
  if (player.attacking && player.combo === 2 && player.queued > 0) {
    const pc2 = 1 - player.attackTime / player.attackMax;
    if (pc2 >= 0.65) startPunch3();   // 0.65 = quando o soco 2 pode virar o 3 (ajuste)
  }
        if (player.attacking) {
        const p = 1 - player.attackTime / player.attackMax;
        const hs = player.combo >= 3 ? HIT3_START : player.combo === 2 ? HIT2_START : HIT_START;
        const he = player.combo >= 3 ? HIT3_END : player.combo === 2 ? HIT2_END : HIT_END;
        if (p >= hs && p <= he) {
            for (const e of enemies) {
                if (e.state === "dead" || player.hitList.includes(e)) continue;
                const dx = (e.x - player.x) * player.direction;
                if (dx > -10 && dx < PUNCH_REACH && player.y < 70) {
                    player.hitList.push(e);
                    hitEnemy(e);
                }
            }
        }
    }
function startPunch4() {
    player.combo = 4;
    player.attackMax = ATTACK4_TIME;
    player.attackTime = ATTACK4_TIME;
    player.hitList = [];
    player.queued = 0;
    player.hold = 0;
    player.held = false;
    player.slide = 0;
}
if (player.attacking && player.combo === 3 && player.queued > 0) {
    const pc3 = 1 - player.attackTime / player.attackMax;
    if (pc3 >= 0.70) startPunch4();   // quando o soco 3 vira o 4 (ajuste)
}
    // INIMIGOS
    for (const e of enemies) {
        if (e.hitFlash > 0) e.hitFlash--;
        if (e.cooldown > 0) e.cooldown--;

        if (e.state === "dead") {
            e.x += e.vx;
            e.vx *= 0.85;
            e.timer--;
            continue;
        }

        const dist = Math.abs(player.x - e.x);

        if (e.state === "hit") {
            e.x += e.vx;
            e.vx *= 0.85;
            if (--e.timer <= 0) {
                e.state = "walk";
                e.cooldown = 40;
            }

        } else if (e.state === "walk") {
            e.dir = player.x > e.x ? 1 : -1;
            if (dist > ENEMY_RANGE) e.x += e.dir * e.speed;
            if (dist <= ENEMY_RANGE + 10 && e.cooldown <= 0 &&
                attackersCount() < MAX_ATTACKERS) {
                e.state = "windup";
                e.timer = ENEMY_WINDUP;
                e.hitDone = false;
            }

        } else if (e.state === "windup") {
            if (--e.timer <= 0) {
                e.state = "attack";
                e.timer = ENEMY_ATTACK_TIME;
            }

        } else if (e.state === "attack") {
            if (!e.hitDone && e.timer > ENEMY_ATTACK_TIME - 6) {
                const dx = (player.x - e.x) * e.dir;
                if (dx > -10 && dx < ENEMY_REACH && player.y < 50) {
                    e.hitDone = true;
                    hurtPlayer(e, ENEMY_DMG);
                }
            }
            if (--e.timer <= 0) {
                e.state = "walk";
                e.cooldown = 80 + Math.random() * 80;
            }
        }

        e.x = Math.max(0, Math.min(WORLD_W, e.x));
    }

    // INIMIGOS NÃO FICAM EMPILHADOS
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            const a = enemies[i], b = enemies[j];
            if (a.state === "dead" || b.state === "dead") continue;
            const d = b.x - a.x;
            if (Math.abs(d) < 40) {
                const push = (40 - Math.abs(d)) * 0.1 * (d >= 0 ? 1 : -1);
                a.x -= push;
                b.x += push;
            }
        }
    }

    enemies = enemies.filter(e => !(e.state === "dead" && e.timer <= 0));

    // ONDAS
    if (enemies.length === 0) {
        if (wave >= WAVES.length) {
            gameState = "win";
            endTimer = 0;
        } else if (--waveDelay <= 0) {
            spawnWave(WAVES[wave]);
            wave++;
            waveDelay = WAVE_PAUSE;
        }
    }

    // GAME OVER
    if (player.hp <= 0) {
        gameState = "gameover";
        endTimer = 0;
        player.invulnerable = 0;
    }
}

function restartGame() {
    player.hp = 100;
    player.x = 150;
    player.y = 0;
    player.vy = 0;
    player.attacking = false;
    player.invulnerable = 0;
    enemies = [];
    wave = 0;
    waveDelay = 60;
    score = 0;
    hitStop = 0;
    shake = 0;
    gameState = "playing";
}

window.addEventListener("pointerdown", () => {
    if (gameState !== "playing" && endTimer > 60) restartGame();
});

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (gameState !== "playing" && endTimer > 30 && (k === "r" || k === "enter")) {
        restartGame();
    }
});

// DESENHO DO INIMIGO
function drawEnemy(e) {
    ctx.save();
    if (e.state === "dead") ctx.globalAlpha = Math.max(0, e.timer / 40);

    let color = "#ff4545";
    if (e.state === "windup" && Math.floor(e.timer / 3) % 2 === 0) color = "#ffd24a";
    if (e.hitFlash > 0) color = "#ffffff";

    drawStickman(e.x, 0, color, e.dir, e.state === "attack");

    if (e.state !== "dead") {
        const bx = e.x - camera - 20;
        ctx.fillStyle = "#333";
        ctx.fillRect(bx, ground - 100, 40, 5);
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(bx, ground - 100, 40 * Math.max(0, e.hp) / ENEMY_HP, 5);
    }

    if (e.state === "windup") {
        ctx.fillStyle = "#ffd24a";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("!", e.x - camera, ground - 112);
    }
    ctx.restore();
}

function drawCombatUI() {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Onda " + Math.min(wave, WAVES.length) + "/" + WAVES.length, W - 20, 35);

    if (gameState === "playing" && enemies.length === 0 && wave < WAVES.length) {
        ctx.textAlign = "center";
        ctx.font = "bold 36px Arial";
        ctx.fillText("ONDA " + (wave + 1), W / 2, H * 0.3);
    }
    ctx.textAlign = "left";

    if (DEBUG_HITBOX) {
        ctx.lineWidth = 2;
        if (player.attacking) {
            const p = 1 - player.attackTime / ATTACK_TIME;
            ctx.strokeStyle = (p >= HIT_START && p <= HIT_END) ? "#00ff88" : "#666666";
            const px = player.x - camera;
            ctx.strokeRect(player.direction === 1 ? px : px - PUNCH_REACH,
                           ground - player.y - 90, PUNCH_REACH, 80);
        }
        ctx.strokeStyle = "#ff3030";
        for (const e of enemies) {
            if (e.state !== "attack") continue;
            const ex = e.x - camera;
            ctx.strokeRect(e.dir === 1 ? ex : ex - ENEMY_REACH, ground - 90, ENEMY_REACH, 80);
        }
    }
}

function drawEndScreen() {
    if (gameState === "playing") return;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 40px Arial";
    ctx.fillText(gameState === "win" ? "FASE COMPLETA!" : "GAME OVER", W / 2, H / 2 - 10);
    ctx.font = "bold 18px Arial";
    ctx.fillText("Pontos: " + score, W / 2, H / 2 + 25);
    if (endTimer > 60) ctx.fillText("Toque na tela para jogar de novo", W / 2, H / 2 + 55);
    ctx.textAlign = "left";
}
// ===== TELA INICIAL =====
const menuBtn = { x: 0, y: 0, w: 220, h: 64 };

function startGame() {
    restartGame();
    player.jumpQueued = false;
    touch.left = false;
    touch.right = false;
    touch.jump = false;
}

function drawMenu() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();
    drawPlayer();

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, W, H);

    const t = performance.now() / 1000;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // TÍTULO
    ctx.font = "bold " + Math.round(Math.min(64, W * 0.1)) + "px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("STICK FIGHT", W / 2 + 3, H * 0.28 + 3);
    ctx.fillStyle = "#ff9a3c";
    ctx.fillText("STICK FIGHT", W / 2, H * 0.28);

    // BOTÃO JOGAR (pulsando)
    const pulse = 1 + Math.sin(t * 3) * 0.04;
    const bw = menuBtn.w * pulse;
    const bh = menuBtn.h * pulse;
    menuBtn.x = W / 2 - menuBtn.w / 2;
    menuBtn.y = H * 0.48;

    ctx.fillStyle = "#e8541e";
    ctx.strokeStyle = "#ffd06a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(W / 2 - bw / 2, menuBtn.y + menuBtn.h / 2 - bh / 2, bw, bh, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.textBaseline = "middle";
    ctx.fillText("JOGAR", W / 2, menuBtn.y + menuBtn.h / 2);
    ctx.textBaseline = "alphabetic";

    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(255,255,255," + (0.5 + Math.sin(t * 2) * 0.3) + ")";
    ctx.fillText("Toque em JOGAR para começar", W / 2, menuBtn.y + menuBtn.h + 40);

    ctx.textAlign = "left";
}

canvas.addEventListener("pointerdown", e => {
    if (gameState !== "menu") return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (inside(x, y, menuBtn)) startGame();
});

window.addEventListener("keydown", e => {
    if (gameState === "menu" && (e.key === "Enter" || e.key === " ")) startGame();
});

// LOOP PRINCIPAL
function gameLoop() {
      if (gameState === "menu") {
        drawMenu();
        requestAnimationFrame(gameLoop);
        return;
      }
    if (gameState === "playing") {
        if (hitStop > 0) {
            hitStop--;
        } else {
            update();
            updateCombat();
        }
    } else {
        endTimer++;
    }

    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake = shake > 0.5 ? shake * 0.85 : 0;
    }

    drawBackground();

    for (const e of enemies) drawEnemy(e);

    if (player.invulnerable > 0 && Math.floor(player.invulnerable / 4) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }
    drawPlayer();
    ctx.globalAlpha = 1;

    ctx.restore();

    drawUI();
    drawCombatUI();
    drawEndScreen();

    requestAnimationFrame(gameLoop);
}

gameLoop();