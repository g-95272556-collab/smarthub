
export const COLORS = {
  navy: "#1B2F55",
  blue: "#3A78C2",
  gold: "#D6AD26",
  ink: "#203040",
  muted: "#5F6C84",
  paper: "#F6F8FC",
  white: "#FFFFFF",
  paleBlue: "#EAF1FB",
  paleGold: "#FFF7DD",
  paleGreen: "#E8F7ED",
  paleRed: "#FDEDEE",
  border: "#D8E1EE"
};

export function fullBleed(ctx, slide, color) {
  return ctx.addShape(slide, { x: 0, y: 0, w: 1280, h: 720, fill: color, line: ctx.line("transparent", 0) });
}

export function topBar(ctx, slide, kicker, title, subtitle, opts = {}) {
  const titleColor = opts.titleColor || COLORS.navy;
  const subtitleColor = opts.subtitleColor || COLORS.muted;
  ctx.addText(slide, {
    x: 72, y: 54, w: 260, h: 24,
    text: kicker.toUpperCase(),
    fontSize: 14, bold: true, color: COLORS.blue, face: ctx.fonts.body
  });
  ctx.addText(slide, {
    x: 72, y: 82, w: 980, h: 54,
    text: title,
    fontSize: 28, bold: true, color: titleColor, face: ctx.fonts.title
  });
  if (subtitle) {
    ctx.addText(slide, {
      x: 72, y: 138, w: 980, h: 38,
      text: subtitle,
      fontSize: 16, color: subtitleColor, face: ctx.fonts.body
    });
  }
}

export function footer(ctx, slide, page) {
  ctx.addText(slide, {
    x: 72, y: 684, w: 420, h: 18,
    text: "SmartSchoolHub / xbasmarthub / SK Kiandongo",
    fontSize: 10, color: COLORS.muted
  });
  ctx.addText(slide, {
    x: 1160, y: 684, w: 48, h: 18,
    text: String(page), fontSize: 10, bold: true, color: COLORS.muted, align: "right"
  });
}

export function card(ctx, slide, x, y, w, h, title, body, options = {}) {
  ctx.addShape(slide, {
    x, y, w, h,
    fill: options.fill || COLORS.white,
    line: ctx.line(options.border || COLORS.border, 1.5)
  });
  ctx.addText(slide, {
    x: x + 18, y: y + 16, w: w - 36, h: 28,
    text: title, fontSize: 18, bold: true, color: options.titleColor || COLORS.navy
  });
  ctx.addText(slide, {
    x: x + 18, y: y + 50, w: w - 36, h: h - 62,
    text: body, fontSize: options.bodySize || 15, color: COLORS.ink
  });
}

export function bulletLines(ctx, slide, x, y, width, items, options = {}) {
  items.forEach((item, index) => {
    ctx.addShape(slide, {
      x, y: y + index * (options.gap || 54), w: 16, h: 16,
      fill: options.dotColor || COLORS.gold, line: ctx.line("transparent", 0)
    });
    ctx.addText(slide, {
      x: x + 26, y: y - 4 + index * (options.gap || 54), w: width - 26, h: 34,
      text: item, fontSize: options.size || 18, color: options.color || COLORS.ink
    });
  });
}
