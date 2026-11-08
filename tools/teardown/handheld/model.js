// Concept handheld game console for the home page teardown.
//
// Registered the way the teardown skill's worker and proof script expect
// (`self.DrawingModels.handheld`), and exposed as `self.Handheld` so
// scripts/generate-teardown.mjs can read the parts and camera directly. Runs
// wherever the skill's geometry and projection helpers are loaded as
// globals: a vm context in Node, or the viewer's worker.
//
// Units are millimetres. World x runs left to right across the console, y
// from the near edge (toward the player) to the far edge, where the game
// card slot is, and z up out of the face. The shells part at z = PARTING.
//
// This is a concept, not any one product: every dimension is invented to
// read well at home page size. See evidence.md beside this file.

self.DrawingModels ??= {};

self.Handheld = (() => {
  'use strict';
  const G = TechnicalGeometry;
  const TAU = Math.PI * 2;

  /** From the front and above, square to the face so the layout reads like a table top. */
  const CAMERA = {azimuth: -90, elevation: 52, roll: 0};

  // ---- Body -----------------------------------------------------------------

  const W = 176, D = 80, RC = 18;   // plan size and corner radius
  const PARTING = 6, H = 14;        // parting line and overall thickness
  const T = 1.6;                    // wall, floor and face skin
  const R = 4.5;                    // front shell's top fillet
  const RB = 3;                     // back shell's bottom round
  const CORNER_STEPS = 12;

  /**
   * The body outline offset `d` inward: the same four corner centres with a
   * smaller radius, sampled at the same angles, so every offset ring has the
   * same point count and lofts against its neighbours. Straight sides carry
   * no intermediate points, which the skill's profile cleanup would drop.
   */
  function inset(d) {
    const r = RC - d, qx = W / 2 - RC, qy = D / 2 - RC;
    return [[1, -1, -90], [1, 1, 0], [-1, 1, 90], [-1, -1, 180]].flatMap(([sx, sy, start]) =>
      Array.from({length: CORNER_STEPS + 1}, (_, i) => {
        const t = (start + 90 * i / CORNER_STEPS) * Math.PI / 180;
        return [sx * qx + r * Math.cos(t), sy * qy + r * Math.sin(t)];
      }));
  }

  // ---- Face layout ------------------------------------------------------------

  const SCREEN = {center: [0, 4], window: [92, 54], module: [98, 60], active: [88, 50]};
  /** Thumbsticks, one per grip: left above the D-pad, right below the face buttons. */
  const STICKS = [[-67, 19], [67, -8]];
  const DPAD = [-67, -6];
  const FACE = [67, 18], FACE_STEP = 9.2, FACE_R = 4;
  const FACE_KEYS = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([u, v]) => [FACE[0] + u * FACE_STEP, FACE[1] + v * FACE_STEP]);
  const MENU = [[-10, -30], [10, -30]];
  const GRILLES = [[-67, -27], [67, -27]];
  /** Screw bosses in the back shell, and the board's mounting holes over them. */
  const BOSSES = [[-73, -27], [73, -27], [73, 27], [-73, 27]];
  const BATTERY = {center: [-14, -6], size: [64, 32], z: [T + .06, 6.1]};
  /** Game card, inserted along -y through the far edge; [x0, x1], [y0, y1], [z0, z1]. */
  const CARD = {x: [-15.5, 15.5], y: [15.3, 51.3], z: [6.6, 9.8]};
  const FAN = {center: [26, -4], size: 30, inlet: 10.5};
  /** Speakers under the grilles, on the back shell's floor. */
  const SPEAKERS = [[-60, -27], [60, -27]];
  /** Intake vents in the back shell's floor, clear of the battery bay; the model sticker beside them. */
  const VENTS = [32, -5];
  const STICKER = [60, 0];
  const BOARD = {z: [6.4, 7.4]};

  const circle2 = ([cx, cy], r, segments) =>
    Array.from({length: segments}, (_, i) => [cx + r * Math.cos(TAU * i / segments), cy + r * Math.sin(TAU * i / segments)]);
  const rrect = (width, height, radius, center) => G.roundedRectangle(width, height, radius, {center, tolerance: .02});
  const corner = ([ox, oy], r, start, steps) => Array.from({length: steps + 1}, (_, i) => {
    const t = (start + 90 * i / steps) * Math.PI / 180;
    return [ox + r * Math.cos(t), oy + r * Math.sin(t)];
  });

  /** A plus-shaped key outline: arms `arm` wide, `span` tip to tip, rounded at the tips. */
  function crossShape([cx, cy], arm, span, radius) {
    const a = arm / 2, l = span / 2, points = [];
    for (let k = 0; k < 4; k++) {
      const c = Math.cos(k * Math.PI / 2), s = Math.sin(k * Math.PI / 2);
      const turn = ([x, y]) => [cx + x * c - y * s, cy + x * s + y * c];
      points.push(turn([a, -a]));
      for (const [o, start] of [[[l - radius, -a + radius], -90], [[l - radius, a - radius], 0]]) {
        points.push(...corner(o, radius, start, 4).map(turn));
      }
    }
    return points;
  }

  const HOLES = [
    rrect(...SCREEN.window, 3, SCREEN.center),
    crossShape(DPAD, 8.4, 21, 1.8),
    ...FACE_KEYS.map(c => circle2(c, FACE_R + .35, 48)),
    ...STICKS.map(c => circle2(c, 8.4, 64)),
    ...MENU.map(c => rrect(9.2, 4, 2, c))
  ];

  // ---- Mesh helpers -------------------------------------------------------------

  /** Appends ring points as new vertices and returns their indices. */
  function addRing(p, points) {
    const base = p.vertices.length;
    for (const v of points) p.vertices.push([...v]);
    return points.map((_, i) => base + i);
  }

  /** Joins consecutive closed rings of vertex indices into one band. */
  function band(p, rings) {
    for (let i = 0; i + 1 < rings.length; i++) {
      const a = rings[i], b = rings[i + 1], n = a.length;
      for (let j = 0; j < n; j++) {
        const k = (j + 1) % n;
        p.triangles.push([a[j], a[k], b[k]], [a[j], b[k], b[j]]);
      }
    }
  }

  /**
   * A plate between two copies of `loop` (z = 0 and z = depth) with real
   * openings, built by the skill's `extrude` so its caps are triangulated
   * around the holes. The outer wall is removed: the caller replaces it with
   * a band that rounds the edge, joined to the loop indices returned here in
   * the order of `loop`.
   */
  function plate(loop, holes, depth) {
    const s = G.piece();
    G.extrude(s, loop, {depth, holes, creaseAngle: 30});
    const n = s.vertices.length / 2, at = new Map();
    for (let i = 0; i < n; i++) at.set(s.vertices[i][0] + ',' + s.vertices[i][1], i);
    const bottom = loop.map(([x, y]) => {
      const i = at.get(x + ',' + y);
      if (i === undefined) throw Error('Plate outline lost a point to profile cleanup');
      return i;
    });
    if (new Set(bottom).size !== loop.length || Math.max(...bottom) >= loop.length) throw Error('Plate outline was reordered');
    const top = bottom.map(i => i + n), outer = new Set([...bottom, ...top]);
    s.triangles = s.triangles.filter(f => !(f.every(i => outer.has(i)) && f.some(i => i < n) && f.some(i => i >= n)));
    const keys = new Set([...outer].map(i => s.vertices[i].join(',')));
    s.lines = s.lines.filter(l => !(keys.has(l.a.join(',')) && keys.has(l.b.join(','))));
    return {piece: s, bottom, top};
  }

  /**
   * Winds every triangle of each closed shell consistently, outward. Custom
   * shells join plate caps and lofted bands whose windings were never
   * coordinated; a single reversed patch would swap silhouette and crease.
   */
  function orient(p) {
    const edges = new Map(), key = (a, b) => (a < b ? a + ':' + b : b + ':' + a);
    p.triangles.forEach((f, t) => {
      for (let j = 0; j < 3; j++) {
        const k = key(f[j], f[(j + 1) % 3]);
        if (!edges.has(k)) edges.set(k, []);
        edges.get(k).push(t);
      }
    });
    for (const [k, list] of edges) {
      if (list.length !== 2) throw Error(`${p.id}: edge ${k} borders ${list.length} triangles; the shell is not closed`);
    }
    const done = new Uint8Array(p.triangles.length);
    for (let start = 0; start < p.triangles.length; start++) {
      if (done[start]) continue;
      done[start] = 1;
      const queue = [start], component = [];
      while (queue.length) {
        const t = queue.pop(), f = p.triangles[t];
        component.push(t);
        for (let j = 0; j < 3; j++) {
          const a = f[j], b = f[(j + 1) % 3];
          for (const u of edges.get(key(a, b))) {
            if (done[u]) continue;
            const g = p.triangles[u];
            if ([0, 1, 2].some(i => g[i] === a && g[(i + 1) % 3] === b)) g.reverse();
            done[u] = 1;
            queue.push(u);
          }
        }
      }
      const volume = component.reduce((sum, t) => {
        const [a, b, c] = p.triangles[t].map(i => p.vertices[i]);
        return sum + G.dot(a, G.cross(b, c));
      }, 0);
      if (volume < 0) for (const t of component) p.triangles[t].reverse();
    }
    return p;
  }

  const at3 = (points, z) => points.map(([x, y]) => [x, y, z]);
  const quarter = (k, steps) => (Math.PI / 2) * k / steps;
  /** A closed feature line through 2D points lying on the plane z. */
  const outlineAt = (p, points, z, role = 'detail') => G.polyline(p, at3(points, z), {closed: true, role});
  const lineAt = (p, points, z, role = 'detail') => G.polyline(p, at3(points, z), {role});
  /** Flat rings for a turned part standing on the plane z = 0 at `center`. */
  const turned = (p, center, profile, segments, creaseAngle) =>
    G.lathe(p, profile, {axis: 'z', at: [...center, 0], segments, creaseAngle});

  /**
   * A block standing on `z0`, lifted a hair so its base edges ink against
   * the surface it sits on instead of fighting it for visibility.
   */
  const block = (p, [x, y], [w, d], [z0, z1], radius = 0, tone = null) => {
    if (tone) tint(p.id, [x - w / 2, y - d / 2, z0 + .06], [x + w / 2, y + d / 2, z1], tone);
    return G.box(p, [x - w / 2, y - d / 2, z0 + .06], [x + w / 2, y + d / 2, z1], radius ? {radius} : {});
  };

  // ---- Printed marks ------------------------------------------------------------

  /**
   * Text and tinted shapes printed flat on a part's horizontal faces:
   * silkscreen, labels, the screen's contents. The renderer draws only
   * lines, so these travel beside the parts and the generator projects
   * them onto the page with the same camera.
   *
   *   {part, kind: 'text', text, at: [x, y, z], size, anchor, tone, weight, angle}
   *   {part, kind: 'shape', points: [[x, y], …], holes: [[[x, y], …], …], z, tone}
   *   {part, kind: 'block', min: [x, y, z], max: [x, y, z], tone}
   *   {part, kind: 'disc', center: [x, y], radius, z: [z0, z1], tone}
   *
   * Shapes, blocks and discs are colour: flat regions painted over the
   * part's fill and under its lines (a block or disc as the outline of the
   * solid seen from the camera). Text is printed over the lines. `tone`
   * names a colour in the page's stylesheet; `angle` turns text in its
   * plane, in degrees counterclockwise seen from above.
   */
  let marks = [];
  const text = (part, value, at, size, options = {}) =>
    marks.push({part, kind: 'text', text: value, at, size, anchor: 'start', tone: 'detail', weight: 400, angle: 0, ...options});
  const shape = (part, points, z, tone, holes = []) => marks.push({part, kind: 'shape', points, holes, z, tone});
  const tint = (part, min, max, tone) => marks.push({part, kind: 'block', min, max, tone});
  const disc = (part, center, radius, z, tone) => marks.push({part, kind: 'disc', center, radius, z, tone});

  /** A printed trace: straight runs joined by 45° corners. */
  const traceAt = (p, points, z) => G.polyline(p, at3(points, z), {role: 'texture'});
  const via = (p, [x, y], z, r = .45) => G.circle(p, [x, y, z], r, [0, 0, 1], {role: 'texture', segments: 12});
  /**
   * A route from `a` to `b` the way boards are drawn: a straight run along
   * the longer axis and one 45° run, the diagonal last unless `diagonalFirst`.
   */
  const route = (a, b, diagonalFirst = false) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.min(Math.abs(dx), Math.abs(dy));
    const diagonal = [Math.sign(dx) * d, Math.sign(dy) * d];
    return diagonalFirst ? [a, [a[0] + diagonal[0], a[1] + diagonal[1]], b] : [a, [b[0] - diagonal[0], b[1] - diagonal[1]], b];
  };

  // ---- Parts --------------------------------------------------------------------

  /**
   * Back shell: a shallow tub with a rounded underside. Inside: screw bosses,
   * the battery bay (corner ribs, adhesive strips with pull tabs), two
   * speaker boxes under the grilles, intake vents, a honeycomb of stiffening
   * ribs and the model sticker. Nothing on the floor overlaps.
   */
  function backShell() {
    const p = G.part('back-shell', 'Back shell'), id = 'back-shell';
    const {piece, bottom, top} = plate(inset(RB), [], T);
    piece.lines = [];
    const base = p.vertices.length;
    G.merge(p, piece);
    const ring = (d, z) => addRing(p, at3(inset(d), z));
    const rings = [bottom.map(i => i + base)];
    const outer = 6;
    for (let k = outer - 1; k > 0; k--) {
      const a = quarter(k, outer);
      rings.push(ring(RB * (1 - Math.cos(a)), RB * (1 - Math.sin(a))));
    }
    const outerEdge = at3(inset(0), PARTING), innerEdge = at3(inset(T), PARTING);
    rings.push(ring(0, RB), addRing(p, outerEdge), addRing(p, innerEdge));
    const ri = RB - T, inner = 4;
    rings.push(ring(T, T + ri));
    for (let k = 1; k < inner; k++) {
      const a = quarter(k, inner);
      rings.push(ring(T + ri * (1 - Math.cos(a)), T + ri * (1 - Math.sin(a))));
    }
    rings.push(top.map(i => i + base));
    band(p, rings);
    // The rim's two edges sit a wall's thickness apart: drawn fine, they read as one rim.
    G.polyline(p, outerEdge, {closed: true, role: 'detail'});
    G.polyline(p, innerEdge, {closed: true, role: 'detail'});
    orient(p);
    // The tub's interior, as far as the opening shows it, in its own colour.
    shape(id, inset(T), PARTING, 'interior');
    const floor = T + .05;
    // Screw bosses standing up to the board, a step darker than the floor.
    for (const c of BOSSES) {
      turned(p, c, [[T - .3, 1.1], [T - .3, 2.6], [BOARD.z[0] - .06, 2.6], [BOARD.z[0] - .06, 1.1]], 48);
      disc(id, c, 2.6, [T, BOARD.z[0] - .06], 'rib');
    }
    // The battery bay: ribs at its corners, two adhesive strips with pull tabs, and the warning.
    const [bx, by] = BATTERY.center, hw = BATTERY.size[0] / 2 + 1.4, hd = BATTERY.size[1] / 2 + 1.4;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = bx + sx * hw, cy = by + sy * hd;
      block(p, [cx - sx * 3, cy + sy * .6], [7.2, 1.2], [T - .06, T + 2.4], 0, 'rib');
      block(p, [cx + sx * .6, cy - sy * 3], [1.2, 7.2], [T - .06, T + 2.4], 0, 'rib');
    }
    for (const dy of [-7, 7]) {
      const strip = [[bx - 24, by + dy - 1.8], [bx + 22, by + dy - 1.8], [bx + 22, by + dy + 1.8], [bx - 24, by + dy + 1.8], [bx - 24, by + dy + 1.2], [bx - 28, by + dy + 1.2], [bx - 28, by + dy - 1.2], [bx - 24, by + dy - 1.2]];
      shape(id, strip, floor, 'adhesive');
      outlineAt(p, strip, floor, 'texture');
    }
    text(id, 'PULL', [bx - 26, by - 7.6, floor], 1, {anchor: 'middle', tone: 'texture'});
    text(id, 'PULL', [bx - 26, by + 6.4, floor], 1, {anchor: 'middle', tone: 'texture'});
    text(id, 'LI-ION ONLY  ·  DO NOT PUNCTURE', [bx, by - hd + 2.6, floor], 1.4, {anchor: 'middle'});
    // Speakers: a box with a dotted grille under each grille in the face.
    for (const [x, y] of SPEAKERS) {
      block(p, [x, y], [12, 7], [T, T + 3], .8, 'speaker');
      for (let i = 0; i < 5; i++) for (let k = 0; k < 2; k++) G.circle(p, [x - 4 + 2 * i, y - 1 + 2 * k, T + 3.05], .45, [0, 0, 1], {role: 'texture', segments: 10});
    }
    // Intake vents beside the battery bay, under the fan.
    for (let i = 0; i < 6; i++) {
      const slot = rrect(1.8, 18, .9, [VENTS[0] - 7.5 + 3 * i, VENTS[1]]);
      shape(id, slot, floor, 'vent');
      outlineAt(p, slot, floor);
    }
    // Honeycomb ribs under the left grip.
    const r = 2.4, w = r * Math.sqrt(3);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = -76 + col * w + (row % 2) * w / 2, y = -6 + row * r * 1.5;
        outlineAt(p, Array.from({length: 6}, (_, k) => [x + r * .9 * Math.cos(Math.PI / 6 + k * Math.PI / 3), y + r * .9 * Math.sin(Math.PI / 6 + k * Math.PI / 3)]), floor, 'texture');
      }
    }
    // Model sticker under the right grip.
    const sticker = STICKER;
    shape(id, rrect(24, 12, 1, sticker), floor, 'sticker');
    outlineAt(p, rrect(24, 12, 1, sticker), floor, 'texture');
    text(id, 'PSRAY HANDHELD', [sticker[0] - 11, sticker[1] + 3, floor], 1.7, {weight: 700, tone: 'edge'});
    text(id, 'MODEL PSR-01  DC 5V 3A', [sticker[0] - 11, sticker[1] + .2, floor], 1.1);
    text(id, 'SN 0420-2026-0001', [sticker[0] - 11, sticker[1] - 2.2, floor], 1.1, {tone: 'texture'});
    const bars = [1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1];
    bars.forEach((on, i) => { if (on) lineAt(p, [[sticker[0] - 11 + i * .5, sticker[1] - 5.2], [sticker[0] - 11 + i * .5, sticker[1] - 3.3]], floor, 'edge'); });
    return p;
  }

  /**
   * Battery: a soft-cornered pouch with its printed label, a barcode, a
   * charge gauge and a short lead to its plug.
   */
  function battery() {
    const p = G.part('battery', 'Battery');
    const [cx, cy] = BATTERY.center, [w, d] = BATTERY.size, [z0, z1] = BATTERY.z, top = z1 + .05;
    G.box(p, [cx - w / 2, cy - d / 2, z0], [cx + w / 2, cy + d / 2, z1], {radius: 2.4});
    const x0 = cx - w / 2 + 4, y1 = cy + d / 2 - 4;
    outlineAt(p, rrect(w - 8, d - 8, 1.5, [cx, cy]), top, 'texture');
    shape('battery', rrect(w - 8, d - 8, 1.5, [cx, cy]), top, 'sticker');
    text('battery', 'Li-ion Polymer Battery', [x0 + 2, y1 - 4.2, top], 2.5, {weight: 700, tone: 'edge'});
    text('battery', '3.87V  5000mAh  19.35Wh', [x0 + 2, y1 - 7.6, top], 1.7, {tone: 'detail'});
    text('battery', 'MODEL PSR-B01 · RECHARGEABLE', [x0 + 2, y1 - 10.4, top], 1.35, {tone: 'texture'});
    // Barcode.
    const bars = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1];
    bars.forEach((on, i) => { if (on) lineAt(p, [[x0 + 2 + i * .55, y1 - 19.6], [x0 + 2 + i * .55, y1 - 14]], top, 'texture'); });
    text('battery', '6 942051 70218', [x0 + 2, y1 - 21.2, top], 1.1, {tone: 'texture'});
    // Charge gauge: an outlined cell with four bars, lit in turn by the page.
    const gx = cx + 9, gy = y1 - 18.4, gw = 13, gh = 5.2;
    outlineAt(p, [[gx, gy], [gx + gw, gy], [gx + gw, gy + 1.5], [gx + gw + 1, gy + 1.5], [gx + gw + 1, gy + gh - 1.5], [gx + gw, gy + gh - 1.5], [gx + gw, gy + gh], [gx, gy + gh]], top, 'detail');
    for (let i = 0; i < 4; i++) {
      const a = gx + .8 + i * 2.95;
      shape('battery', [[a, gy + .8], [a + 2.45, gy + .8], [a + 2.45, gy + gh - .8], [a, gy + gh - .8]], top, `cell cell${i}`);
    }
    // Warning triangle.
    outlineAt(p, [[cx + 25.5, y1 - 12.5], [cx + 23.2, y1 - 8.6], [cx + 27.8, y1 - 8.6]].map(([x, y]) => [x, y - 2]), top, 'texture');
    lineAt(p, [[cx + 25.5, y1 - 13.2], [cx + 25.5, y1 - 11.6]], top, 'texture');
    // A plus mark at the positive end.
    lineAt(p, [[cx + 24, cy - 2], [cx + 24, cy + 2]].map(([x, y]) => [x + 3, y + 7]), top, 'texture');
    lineAt(p, [[cx + 22, cy], [cx + 26, cy]].map(([x, y]) => [x + 3, y + 7]), top, 'texture');
    // Lead: an open strip off the right end into a small plug.
    const x = cx + w / 2, y = cy + 7, z = 3.4;
    const s = p.vertices.length;
    p.vertices.push([x - .5, y - 1.6, z], [x + 4.5, y - 1.6, z], [x + 4.5, y + 1.6, z], [x - .5, y + 1.6, z]);
    p.triangles.push([s, s + 1, s + 2], [s, s + 2, s + 3]);
    block(p, [x + 7, y], [5.5, 4.4], [T, 4.4], .6, 'plug');
    return p;
  }

  /** Mainboard outline: a rounded board with a notch where the game card reader sits. */
  function boardOutline() {
    const qx = 72, qy = 25, r = 7, top = qy + r;
    return [
      ...corner([qx, -qy], r, -90, 6), ...corner([qx, qy], r, 0, 6),
      [CARD.x[1] + 2, top], [CARD.x[1] + 2, 15], [CARD.x[0] - 2, 15], [CARD.x[0] - 2, top],
      ...corner([-qx, qy], r, 90, 6), ...corner([-qx, -qy], r, 180, 6)
    ];
  }

  /**
   * Mainboard: system chip with its decoupling, two memory packages and
   * storage on their own buses, the power stage, the radio under a shield
   * with its antenna, connectors, the card reader, thumbstick modules,
   * contact pads under every key and the copper joining them. Every trace
   * runs straight and at 45°, from a pin or pad to a via or another pin.
   */
  function mainboard() {
    const p = G.part('mainboard', 'Mainboard'), id = 'mainboard';
    const [z0, z1] = BOARD.z, top = z1 + .05;
    const board = G.piece();
    G.extrude(board, boardOutline(), {depth: z1 - z0, holes: BOSSES.map(c => circle2(c, 1.5, 24))});
    G.transform(board, {origin: [0, 0, z0]});
    G.merge(p, board);
    const silk = (value, [x, y], size, options = {}) => text(id, value, [x, y, top], size, {tone: 'light', ...options});
    const run = points => traceAt(p, points, top);
    const bus = (from, to, step, count, diagonalFirst) => {
      for (let k = 0; k < count; k++) run(route(from.map((n, i) => n + step[i] * k), to.map((n, i) => n + step[i] * k), diagonalFirst));
    };
    const pin = ([x, y], r = .55) => {
      shape(id, circle2([x, y], r, 12), top, 'gold');
      via(p, [x, y], top, r);
    };
    // Plated mounting holes.
    for (const c of BOSSES) {
      shape(id, circle2(c, 2.6, 32), top, 'gold', [circle2(c, 1.5, 24)]);
      G.circle(p, [...c, top], 2.6, [0, 0, 1], {role: 'texture', segments: 32});
    }

    // System chip, with decoupling capacitors down its right side.
    const soc = [-24, 0];
    block(p, soc, [17, 17], [z1, z1 + .6], 0, 'substrate');
    block(p, soc, [12, 12], [z1 + .6, z1 + 1.5], 1, 'metal');
    text(id, 'PSR X1', [soc[0], soc[1] + .9, z1 + 1.55], 2.4, {anchor: 'middle', weight: 700, tone: 'edge'});
    text(id, '2026 · 4NM', [soc[0], soc[1] - 2.4, z1 + 1.55], 1.3, {anchor: 'middle'});
    silk('U1', [-34.6, -11.6], 1.4);
    for (let i = 0; i < 5; i++) block(p, [-13.8, -6 + i * 3], [.9, 1.6], [z1, z1 + .5], 0, 'passive');
    silk('C10', [-12.6, 7.4], 1.1);

    // Memory: each package on its own straight bus.
    for (const [c, name] of [[[-44, 8], 'U2'], [[-44, -9], 'U3']]) {
      block(p, c, [9, 12], [z1, z1 + .9], 0, 'chip');
      text(id, 'LPDDR5X', [c[0], c[1] - .5, z1 + .95], 1.25, {anchor: 'middle', tone: 'light'});
      silk(name, [c[0] - 4.5, c[1] + 6.9], 1.4);
    }
    bus([-32.5, 3.2], [-39.5, 3.2], [0, 1.2], 5);
    bus([-32.5, -7.6], [-39.5, -7.6], [0, 1.2], 4);
    // Storage below the chip.
    block(p, [-24, -21], [11, 8], [z1, z1 + .8], 0, 'chip');
    text(id, 'UFS 4.0', [-24, -21.5, z1 + .85], 1.4, {anchor: 'middle', tone: 'light'});
    silk('U4', [-30, -27.4], 1.4);
    bus([-27, -8.5], [-27, -17], [1.2, 0], 5);
    // Crystal by the chip's corner.
    block(p, [-13.5, -13], [3.4, 1.8], [z1, z1 + .7], .5, 'metal');
    silk('Y1', [-11, -13.6], 1.1);
    bus([-15.2, -12], [-17, -8.5], [-.9, 0], 2, true);

    // Display connector above the chip, on a short wide bus.
    block(p, [-28, 13], [13, 3], [z1, z1 + 1.1], 0, 'plug');
    for (let i = 0; i < 10; i++) lineAt(p, [[-33.4 + i * 1.2, 12], [-33.4 + i * 1.2, 14]], z1 + 1.15, 'texture');
    silk('J1 LCD', [-34.4, 15.6], 1.1);
    bus([-32.4, 8.5], [-32.4, 11.5], [1.1, 0], 8);
    // Card reader along the notch, wired to the chip's corner.
    block(p, [0, 13.2], [CARD.x[1] - CARD.x[0] + 4, 3.4], [z1, CARD.z[1] - .4], 0, 'metal');
    silk('J4 CARD', [8, 9], 1.1);
    bus([-13.4, 11.5], [-16.4, 8.5], [1.1, 0], 3, true);

    // Power: controller, inductors, capacitors, the battery and USB-C inputs.
    block(p, [0, -20], [7, 7], [z1, z1 + .7], 0, 'chip');
    text(id, 'PMIC', [0, -20.5, z1 + .75], 1.2, {anchor: 'middle', tone: 'light'});
    silk('U5', [-3.5, -15], 1.1);
    for (const [y, name] of [[-19.2, 'L1'], [-25, 'L2']]) {
      block(p, [-9.5, y], [4.2, 4.2], [z1, z1 + 2], .4, 'inductor');
      G.circle(p, [-9.5, y, z1 + 2.05], 1.3, [0, 0, 1], {role: 'texture', segments: 20});
      silk(name, [-15.4, y - .6], 1.1);
    }
    bus([-3.5, -19.8], [-7.4, -19.8], [0, .9], 2);
    run(route([-3.5, -22.6], [-7.4, -24.6]));
    [[6, -22], [11, -22], [16, -22]].forEach((c, i) => {
      turned(p, c, [[z1 + .06, 0], [z1 + .06, 2.1], [z1 + 2.55, 2.1], [z1 + 2.75, 1.9], [z1 + 2.75, 0]], 36, 30);
      disc(id, c, 2.1, [z1 + .06, z1 + 2.75], 'metal');
      const h = z1 + 2.8;
      lineAt(p, [[c[0] - 1.1, c[1]], [c[0] + 1.1, c[1]]], h, 'texture');
      lineAt(p, [[c[0], c[1] - 1.1], [c[0], c[1] + 1.1]], h, 'texture');
      silk(`C${i + 1}`, [c[0] - 1.2, c[1] - 4.4], 1.1);
    });
    block(p, [10, -28.2], [7, 3.2], [z1, z1 + 1.1], 0, 'plug');
    silk('J2 BAT', [14.2, -28.8], 1.1);
    bus([6.5, -27.4], [3.5, -23.5], [0, -1], 2, true);
    block(p, [0, -35], [9.2, 7.4], [z1, z1 + 3.1], .8, 'metal');
    outlineAt(p, rrect(7.2, 1.6, .8, [0, -35.6]), z1 + 3.15, 'texture');
    silk('J3 USB-C', [-14, -30.4], 1.1);
    bus([-2, -31.3], [-2, -23.5], [1, 0], 5);

    // Thumbstick modules and shoulder switches.
    STICKS.forEach((c, i) => {
      block(p, c, [12, 12], [z1, z1 + 2.2], .6, 'metal');
      turned(p, c, [[z1 + 2.2, 0], [z1 + 2.2, 4.4], [z1 + 2.6, 4.2], [z1 + 2.9, 3], [z1 + 3, 0]], 48, 30);
      disc(id, c, 4.4, [z1 + 2.2, z1 + 3], 'stick-base');
      const side = -Math.sign(c[0]), y0 = c[1] - 3;
      bus([c[0] + side * 6, y0], [c[0] + side * 12.5, y0], [0, 2], 4);
      for (let k = 0; k < 4; k++) pin([c[0] + side * 13.3, y0 + 2 * k]);
      silk(i ? 'RS' : 'LS', [c[0] - 6, c[1] + 7.2], 1.2);
    });
    for (const x of [-52, 52]) {
      block(p, [x, 28.5], [6, 4], [z1, z1 + 1.2], 0, 'chip');
      turned(p, [x, 28.5], [[z1 + 1.2, 0], [z1 + 1.2, 1.1], [z1 + 2, 1.1], [z1 + 2, 0]], 24);
      disc(id, [x, 28.5], 1.1, [z1 + 1.2, z1 + 2], 'metal');
    }
    silk('SW L', [-57, 25], 1.1);
    silk('SW R', [47, 25], 1.1);

    // Contact pads under the keys, each wired to a via.
    const keyPad = ([x, y], r) => {
      shape(id, circle2([x, y], r, 32), top, 'gold');
      outlineAt(p, circle2([x, y], r, 32), top);
      shape(id, circle2([x, y], r * .5, 20), top, 'board');
      outlineAt(p, circle2([x, y], r * .5, 20), top, 'texture');
    };
    const dpadPads = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([u, v]) => [DPAD[0] + u * 6.6, DPAD[1] + v * 6.6]);
    dpadPads.forEach(c => keyPad(c, 2.3));
    run(route([dpadPads[0][0] + 2.3, dpadPads[0][1]], [-55, DPAD[1]]));
    run(route([dpadPads[1][0] + 2.3, dpadPads[1][1]], [-55, dpadPads[1][1] + 2.6], true));
    run(route([dpadPads[3][0] + 2.3, dpadPads[3][1]], [-55, dpadPads[3][1] - 2.6], true));
    run(route([dpadPads[2][0], dpadPads[2][1] - 2.3], [dpadPads[2][0], -16.5]));
    for (const v of [[-55, DPAD[1]], [-55, dpadPads[1][1] + 2.6], [-55, dpadPads[3][1] - 2.6], [dpadPads[2][0], -17]]) pin(v);
    FACE_KEYS.forEach(c => keyPad(c, 2.6));
    run(route([FACE_KEYS[3][0] - 2.6, FACE_KEYS[3][1]], [52, FACE_KEYS[3][1]]));
    run(route([FACE_KEYS[0][0] - 2.6, FACE_KEYS[0][1]], [52, FACE_KEYS[0][1] - 4]));
    run(route([FACE_KEYS[2][0] - 2.6, FACE_KEYS[2][1]], [52, FACE_KEYS[2][1] + 4]));
    run(route([FACE_KEYS[1][0], FACE_KEYS[1][1] - 2.6], [FACE_KEYS[1][0], 4.5]));
    for (const v of [[52, FACE_KEYS[3][1]], [52, FACE_KEYS[0][1] - 4], [52, FACE_KEYS[2][1] + 4], [FACE_KEYS[1][0], 4]]) pin(v);

    // Radio under a perforated shield, and its meander antenna.
    const shield = [50, -24];
    block(p, shield, [14, 9], [z1, z1 + 1.1], 0, 'metal');
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) via(p, [shield[0] - 5 + i * 2.5, shield[1] + 2 + j * 1.6], z1 + 1.15, .35);
    text(id, 'WIFI 6E · BT 5.3', [shield[0], shield[1] - 2.6, z1 + 1.15], 1.05, {anchor: 'middle'});
    const meander = [[76.2, -22.5]];
    for (let k = 0; k < 4; k++) {
      const y = -22.5 + k * 2.4;
      meander.push([78, y], [78, y + 1.2], [74.5, y + 1.2], [74.5, y + 2.4]);
    }
    run(meander);
    silk('ANT', [71.8, -10], 1.1);
    run(route([shield[0] + 7, shield[1] + 1.5], [74.5, -22.5]));

    // Test points, stitching vias and the board's own markings.
    for (const [x, name] of [[26, 'TP1'], [33, 'TP2']]) {
      pin([x, 22], .9);
      silk(name, [x - 2, 24.2], 1);
    }
    for (let i = 0; i < 8; i++) pin([-45 + i * 2.6, 29.4], .4);
    for (let i = 0; i < 6; i++) pin([20 + i * 2.6, -30.2], .4);
    const qr = [-60, -25], cell = .75;
    const bits = ['1110101', '1010110', '1110001', '0001011', '1101101', '0110110', '1011011'];
    bits.forEach((row, r) => [...row].forEach((bit, c) => {
      if (bit === '1') shape(id, rrect(cell, cell, .05, [qr[0] - 2.6 + c * cell, qr[1] + 2.6 - r * cell]), top, 'silk');
    }));
    silk('PSRAY', [-54.5, -23.4], 2.6, {weight: 700});
    silk('MAIN BOARD REV 1.0', [-54.5, -26.4], 1.2);
    silk('PSR-MB-01', [-54.5, -28.6], 1.2);
    const label = [38, 26];
    shape(id, rrect(14, 5, .5, label), top, 'sticker');
    for (let i = 0; i < 20; i++) if ((i * 7) % 3) lineAt(p, [[label[0] - 6 + i * .55, label[1] - 1.8], [label[0] - 6 + i * .55, label[1] + .6]], top, 'edge');
    text(id, 'PSR-0420', [label[0] - 6, label[1] + 1.1, top], .9, {tone: 'edge'});
    return p;
  }

  /**
   * Cooling fan: a frame with a round inlet over a hub and swept blades,
   * each blade one open sheet so its edges ink once.
   */
  function fan() {
    const p = G.part('fan', 'Cooling fan');
    const {center, size, inlet} = FAN, [z0, z1] = [BOARD.z[1] + .06, 10.4];
    const frame = G.piece();
    G.extrude(frame, rrect(size, size, 6, center), {depth: z1 - z0, holes: [circle2(center, inlet, 72)]});
    G.transform(frame, {origin: [0, 0, z0]});
    G.merge(p, frame);
    turned(p, center, [[z0, 0], [z0, 4.2], [z1 - .25, 4.2], [z1 - .25, 0]], 48);
    disc('fan', center, 4.2, [z0, z1 - .25], 'hub');
    G.circle(p, [...center, z1 - .2], 1.6, [0, 0, 1], {role: 'detail', segments: 24});
    const blades = 11, b0 = z0 + .5, b1 = z1 - .5;
    for (let k = 0; k < blades; k++) {
      const s = p.vertices.length, steps = 6;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps, r = 4 + (inlet - .6 - 4) * u, a = TAU * k / blades + .62 * u;
        const [x, y] = [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)];
        p.vertices.push([x, y, b0], [x, y, b1]);
      }
      for (let i = 0; i < steps; i++) {
        const a = s + 2 * i;
        p.triangles.push([a, a + 2, a + 3], [a, a + 3, a + 1]);
      }
    }
    for (const [u, v] of [[1, 1], [-1, -1]]) {
      G.circle(p, [center[0] + u * 10.4, center[1] + v * 10.4, z1 + .05], 1.1, [0, 0, 1], {role: 'detail', segments: 20});
    }
    text('fan', 'DC 5V 0.3A', [center[0], center[1] - 13.8, z1 + .05], 1.25, {anchor: 'middle', tone: 'detail'});
    return p;
  }

  /** The trophy shown on the screen, in screen millimetres around its centre. */
  function trophy() {
    const half = [[-7.4, 9], [-7.2, 5.2], [-6.4, 2.4], [-4.8, .2], [-2.6, -1.2], [-1.3, -1.6], [-1.3, -4.6], [-4.6, -5.6], [-4.6, -7.6]];
    const cup = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
    const handle = sign => Array.from({length: 9}, (_, i) => {
      const a = (-80 + 160 * i / 8) * Math.PI / 180;
      return [sign * (7 + 2.6 * Math.cos(a)), 5.4 + 2.6 * Math.sin(a)];
    });
    const star = Array.from({length: 10}, (_, i) => {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.05 : 2.4;
      return [r * Math.cos(a), 4.4 + r * Math.sin(a)];
    });
    return {cup, handles: [handle(1), handle(-1)], plinth: [[-6, -7.6], [6, -7.6], [6, -9.8], [-6, -9.8]], star};
  }

  /** Display: the panel module, its screen showing a trophy unlocked, and its flex tail. */
  function display() {
    const p = G.part('display', 'Display');
    const [cx, cy] = SCREEN.center, [z0, z1] = [10.6, 12.2], top = z1 + .05;
    G.box(p, [cx - SCREEN.module[0] / 2, cy - SCREEN.module[1] / 2, z0], [cx + SCREEN.module[0] / 2, cy + SCREEN.module[1] / 2, z1], {radius: 2});
    outlineAt(p, rrect(...SCREEN.active, 1, SCREEN.center), top);
    shape('display', rrect(...SCREEN.active, 1, SCREEN.center), top, 'screen');
    const {cup, handles, plinth, star} = trophy(), at = ([x, y]) => [cx + x, cy + 5 + y];
    shape('display', cup.map(at), top, 'gold');
    shape('display', plinth.map(at), top, 'gold');
    outlineAt(p, cup.map(at), top);
    for (const h of handles) lineAt(p, h.map(at), top);
    outlineAt(p, plinth.map(at), top);
    outlineAt(p, star.map(at), top, 'texture');
    text('display', 'TROPHY UNLOCKED', [cx, cy - 9.6, top], 2.8, {anchor: 'middle', weight: 700, tone: 'light'});
    text('display', 'PLATINUM  ·  100%', [cx, cy - 13.4, top], 1.7, {anchor: 'middle', tone: 'texture'});
    // Status bar.
    const [aw, ah] = SCREEN.active, sy = cy + ah / 2 - 3.4;
    text('display', 'PSRAY', [cx - aw / 2 + 2.5, sy, top], 1.5, {weight: 700, tone: 'light'});
    text('display', '12:00', [cx, sy, top], 1.5, {anchor: 'middle', tone: 'light'});
    const bx = cx + aw / 2 - 7.5;
    outlineAt(p, [[bx, sy - .1], [bx + 4.2, sy - .1], [bx + 4.2, sy + 1.6], [bx, sy + 1.6]], top, 'texture');
    shape('display', [[bx + .5, sy + .35], [bx + 3.1, sy + .35], [bx + 3.1, sy + 1.15], [bx + .5, sy + 1.15]], top, 'level');
    // Flex tail, folded under toward the board's connector.
    const s = p.vertices.length, y0 = cy - SCREEN.module[1] / 2, z = z0 + .05;
    p.vertices.push([2, y0 + 1, z], [14, y0 + 1, z], [14, y0 - 5.5, z], [2, y0 - 5.5, z]);
    p.triangles.push([s, s + 1, s + 2], [s, s + 2, s + 3]);
    text('display', 'FPC 40P', [cx - SCREEN.module[0] / 2 + 3, y0 + 2, top], 1.3, {tone: 'texture'});
    return p;
  }

  /**
   * Front shell: a 1.6 mm skin over the face, rounded into the walls with a
   * 4.5 mm fillet and open toward the parting line, with the screen window
   * and every key opening cut through it, and the ports on its near wall.
   */
  function frontShell() {
    const p = G.part('front-shell', 'Front shell');
    const {piece, bottom, top} = plate(inset(R), HOLES, T);
    G.transform(piece, {origin: [0, 0, H - T]});
    const base = p.vertices.length;
    G.merge(p, piece);
    const ring = (d, z) => addRing(p, at3(inset(d), z));
    const rings = [bottom.map(i => i + base)];
    const inner = 3;
    for (let k = inner - 1; k > 0; k--) {
      const a = quarter(k, inner);
      rings.push(ring(R - (R - T) * Math.cos(a), H - R + (R - T) * Math.sin(a)));
    }
    const innerEdge = at3(inset(T), PARTING), outerEdge = at3(inset(0), PARTING);
    rings.push(ring(T, H - R), addRing(p, innerEdge), addRing(p, outerEdge), ring(0, H - R));
    const outer = 8;
    for (let k = 1; k < outer; k++) {
      const a = quarter(k, outer);
      rings.push(ring(R - R * Math.cos(a), H - R + R * Math.sin(a)));
    }
    rings.push(top.map(i => i + base));
    band(p, rings);
    G.polyline(p, innerEdge, {closed: true});
    G.polyline(p, outerEdge, {closed: true});
    orient(p);
    const face = H + .05;
    shape('front-shell', inset(R), face, 'face', HOLES);
    // Cover glass over the window: two faint diagonal glints.
    const [wx, wy] = SCREEN.center, [ww, wh] = SCREEN.window;
    for (const [u, w] of [[-25, 9], [-11, 3.5]]) {
      shape('front-shell', [[wx + u, wy + wh / 2 - 1.5], [wx + u + w, wy + wh / 2 - 1.5], [wx + u + w - 20, wy - wh / 2 + 1.5], [wx + u - 20, wy - wh / 2 + 1.5]], H - .1, 'glare');
    }
    for (const [gx, gy] of GRILLES) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) G.circle(p, [gx - 3.75 + 2.5 * i, gy - 2.5 + 2.5 * j, face], .7, [0, 0, 1], {role: 'texture', segments: 12});
      }
    }
    text('front-shell', 'PSRAY', [0, SCREEN.center[1] + SCREEN.window[1] / 2 + 1.3, face], 2.2, {anchor: 'middle', weight: 700, tone: 'detail'});
    text('front-shell', 'SELECT', [MENU[0][0], MENU[0][1] - 4.6, face], 1.3, {anchor: 'middle', tone: 'texture'});
    text('front-shell', 'START', [MENU[1][0], MENU[1][1] - 4.6, face], 1.3, {anchor: 'middle', tone: 'texture'});
    G.circle(p, [77, 29, face], .7, [0, 0, 1], {role: 'detail', segments: 16});
    // USB-C and headphone jack on the near wall.
    const wall = -D / 2 - .05;
    G.polyline(p, rrect(8.6, 2.6, 1.3, [0, 0]).map(([x, z]) => [x, wall, 7.9 + z]), {closed: true, role: 'detail'});
    G.circle(p, [-30, wall, 7.9], 1.5, [0, 1, 0], {role: 'detail', segments: 24});
    return p;
  }

  /** Keys stand in their openings, sunk 0.3 mm below the face. */
  const KEY_Z = H - .3;

  function dpad() {
    const p = G.part('dpad', 'D-pad');
    const s = G.piece();
    G.extrude(s, crossShape(DPAD, 7.4, 20, 1.3), {depth: 1.9});
    G.transform(s, {origin: [0, 0, KEY_Z]});
    G.merge(p, s);
    const top = KEY_Z + 1.95;
    G.circle(p, [...DPAD, top], 2.2, [0, 0, 1], {role: 'detail', segments: 32});
    for (let k = 0; k < 4; k++) {
      const c = Math.cos(k * Math.PI / 2), sn = Math.sin(k * Math.PI / 2);
      const turn = ([x, y]) => [DPAD[0] + x * c - y * sn, DPAD[1] + x * sn + y * c];
      outlineAt(p, [[8, 0], [6.4, -1], [6.4, 1]].map(turn), top, 'texture');
    }
    return p;
  }

  function faceButtons() {
    const p = G.part('face-buttons', 'Face buttons');
    const z = KEY_Z, profile = [[z, 0], [z, FACE_R], [z + 1.1, FACE_R], [z + 1.45, FACE_R - .15], [z + 1.7, FACE_R - .5], [z + 1.85, FACE_R - 1], [z + 1.95, FACE_R - 2], [z + 2, 0]];
    FACE_KEYS.forEach((c, i) => {
      turned(p, c, profile, 48, 30);
      disc('face-buttons', c, FACE_R, [z, z + 2], ['key-x', 'key-a', 'key-b', 'key-y'][i]);
      text('face-buttons', ['X', 'A', 'B', 'Y'][i], [c[0], c[1] - 1, z + 2.02], 2.8, {anchor: 'middle', weight: 700, tone: 'edge'});
    });
    return p;
  }

  function menuButtons() {
    const p = G.part('menu-buttons', 'Menu buttons');
    for (const c of MENU) {
      const s = G.piece();
      G.extrude(s, rrect(8.2, 3, 1.5, c), {depth: 1.3});
      G.transform(s, {origin: [0, 0, KEY_Z]});
      G.merge(p, s);
    }
    return p;
  }

  /**
   * Game card: chamfered at the leading corner, gold contacts at that end,
   * grip ridges at the other, and a label with its cover art: a title band
   * over a pixel landscape with a hero and a trophy.
   */
  function gameCard() {
    const p = G.part('game-card', 'Game card'), id = 'game-card';
    const [x0, x1] = CARD.x, [y0, y1] = CARD.y, [z0, z1] = CARD.z, r = 2, c = 3.5, top = z1 + .05;
    const outline = [
      [x0 + c, y0], ...corner([x1 - r, y0 + r], r, -90, 4), ...corner([x1 - r, y1 - r], r, 0, 4),
      ...corner([x0 + r, y1 - r], r, 90, 4), [x0, y0 + c]
    ];
    const s = G.piece();
    G.extrude(s, outline, {depth: z1 - z0});
    G.transform(s, {origin: [0, 0, z0]});
    G.merge(p, s);
    const mid = (x0 + x1) / 2, ly = y1 - 14.6, lw = x1 - x0 - 6, lh = 23;
    const at = ([u, v]) => [mid + u, ly + v];
    const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(at);
    // Label: paper, title band, sky, sun, hills, ground, hero and trophy.
    shape(id, rrect(lw, lh, 1.2, [mid, ly]), top, 'paper');
    shape(id, rect(-lw / 2 + .7, 6, lw / 2 - .7, lh / 2 - .7), top, 'title');
    shape(id, rect(-lw / 2 + .7, -5.6, lw / 2 - .7, 6), top, 'sky');
    shape(id, circle2(at([6.2, 2.6]), 1.9, 24), top, 'sun');
    shape(id, [[-11.8, -5.6], [-11.8, -.6], [-7.2, 3.6], [-3.4, .4], [.8, 4.4], [5, .6], [8.2, 2.4], [11.8, -.8], [11.8, -5.6]].map(at), top, 'mountain');
    shape(id, [[-11.8, -5.6], [-11.8, -2.6], [-6.2, -.8], [-.4, -3], [5.6, -1.2], [11.8, -3.2], [11.8, -5.6]].map(at), top, 'hill');
    shape(id, rect(-11.8, -5.6, 11.8, -4.4), top, 'ground');
    shape(id, rect(-6.6, -4.4, -4.4, -2.4), top, 'hero');
    shape(id, rect(-6.3, -2.4, -4.7, -1), top, 'skin');
    shape(id, [[2.4, -2.6], [4.8, -2.6], [4.8, -2.1], [4.1, -2.1], [4.1, -1.2], [5.2, .4], [5.2, 1.2], [2, 1.2], [2, .4], [3.1, -1.2], [3.1, -2.1], [2.4, -2.1]].map(at), top, 'gold');
    outlineAt(p, rrect(lw, lh, 1.2, [mid, ly]), top);
    lineAt(p, [at([-lw / 2, 6]), at([lw / 2, 6])], top, 'texture');
    lineAt(p, [at([-lw / 2, -5.6]), at([lw / 2, -5.6])], top, 'texture');
    text(id, 'TROPHY QUEST', [mid, ly + 7.6, top], 2.15, {anchor: 'middle', weight: 700, tone: 'light'});
    text(id, 'PSRAY GAMES', [mid - lw / 2 + 1.2, ly - 8.6, top], 1.15, {weight: 700, tone: 'edge'});
    text(id, '32GB', [mid - lw / 2 + 1.2, ly - 10.4, top], 1, {tone: 'detail'});
    outlineAt(p, rect(lw / 2 - 4.2, -10.8, lw / 2 - 1.2, -6.6), top);
    text(id, 'ALL', [mid + lw / 2 - 2.7, ly - 9.2, top], 1.1, {anchor: 'middle', weight: 700, tone: 'edge'});
    // Contacts and grip ridges.
    for (let i = 0; i < 7; i++) {
      const x = x0 + 6.4 + 3.1 * i;
      shape(id, [[x - .8, y0 + 1], [x + .8, y0 + 1], [x + .8, y0 + 4.6], [x - .8, y0 + 4.6]], top, 'gold');
      outlineAt(p, [[x - .8, y0 + 1], [x + .8, y0 + 1], [x + .8, y0 + 4.6], [x - .8, y0 + 4.6]], top, 'texture');
    }
    for (const y of [y1 - 1.1, y1 - 1.9]) lineAt(p, [[x0 + 4, y], [x1 - 4, y]], top, 'texture');
    return p;
  }

  /** A thumbstick: a stem rising through the face into a dished cap with a grip ring. */
  function stick(index) {
    const id = index ? 'stick-r' : 'stick-l';
    const p = G.part(id, index ? 'Right stick' : 'Left stick'), c = STICKS[index];
    const z = BOARD.z[1] + 3, rim = H + .6;
    turned(p, c, [[z, 0], [z, 2.4], [rim, 2.4], [rim, 6.6], [rim + .6, 7], [rim + 1.3, 6.9], [rim + 1.7, 6.3], [rim + 1.7, 5.4], [rim + 1.25, 3.4], [rim + 1.1, 0]], 64, 28);
    disc(id, c, 7, [rim, rim + 1.7], 'cap');
    G.circle(p, [...c, rim + 1.75], 5.9, [0, 0, 1], {role: 'texture', segments: 48});
    G.circle(p, [...c, rim + 1.75], 6.5, [0, 0, 1], {role: 'texture', segments: 48});
    return p;
  }
  const stickL = () => stick(0), stickR = () => stick(1);

  /**
   * Stacking order, bottom first. A part's lines and fill paint over the
   * parts before it, so a later part must sit wholly above the earlier ones
   * wherever the two overlap on the page.
   */
  const STACK = [backShell, battery, gameCard, mainboard, fan, display, frontShell, dpad, faceButtons, menuButtons, stickL, stickR];

  /** A plain vertical explosion for the skill's own viewer and proofs; the home page lays the parts out itself. */
  const LIFT = {'back-shell': 0, 'battery': 14, 'game-card': 26, 'mainboard': 30, 'fan': 44, 'display': 58, 'front-shell': 76, 'dpad': 96, 'face-buttons': 96, 'menu-buttons': 96, 'stick-l': 100, 'stick-r': 100};

  function build() {
    marks = [];
    const parts = STACK.map(make => make());
    for (const p of parts) p.explosion = [0, 0, LIFT[p.id]];
    return {parts, camera: CAMERA, trails: [], marks};
  }

  return {build, camera: CAMERA, screen: SCREEN, card: CARD, body: {W, D, H, PARTING}};
})();

self.DrawingModels.handheld = (parameters, options) => {
  const {parts, camera, trails} = self.Handheld.build(parameters);
  return TechnicalProjection.render(parts, {...options, camera, trails});
};
