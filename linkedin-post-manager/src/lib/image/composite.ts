import sharp from 'sharp'
import type {
  AnchorConfig,
  BigNumberAnchor,
  SimpleDiagramAnchor,
  BeforeAfterAnchor,
  IconClusterAnchor,
  PullQuoteAnchor,
  SupportedIcon,
} from '@/types/anchor'

const ACCENT = '#00BCD4'
const PANEL_BG = 'rgba(15,23,42,0.88)'
const WHITE = '#FFFFFF'
const WHITE_DIM = 'rgba(255,255,255,0.72)'

// ── Lucide icon SVG paths (24×24 viewBox) ───────────────────────────────────
const ICON_PATHS: Record<SupportedIcon, string> = {
  'file-text':
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  'bar-chart':
    'M12 20V10 M18 20V4 M6 20v-4',
  'git-branch':
    'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  'clock':
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  'zap':
    'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  'check-circle':
    'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
  'x-circle':
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M15 9l-6 6 M9 9l6 6',
  'arrow-right':
    'M5 12h14 M12 5l7 7-7 7',
  'users':
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'cpu':
    'M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
}

function iconSvg(name: SupportedIcon, x: number, y: number, size: number, color: string): string {
  const scale = size / 24
  return `<g transform="translate(${x},${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="${ICON_PATHS[name]}"/>
  </g>`
}

// ── Per-category anchor placement ────────────────────────────────────────────
// Returns the top-left corner (px, py) for a panel of size (pw, ph)
// anchored to the "canvas" zone of each base image category.

function anchorOrigin(
  baseCategory: string | undefined,
  w: number,
  h: number,
  pw: number,
  ph: number
): { px: number; py: number } {
  // Centre of the "canvas zone" as fractions of (w, h)
  const zones: Record<string, { cx: number; cy: number }> = {
    OVER_THE_SHOULDER: { cx: 0.28, cy: 0.50 }, // monitor is left of centre
    HANDS_CLOSE_UP:   { cx: 0.50, cy: 0.62 }, // laptop/tablet screen, lower-centre
    CLEAN_DESK:       { cx: 0.50, cy: 0.47 }, // monitor centred on desk
    TEAM_HUDDLE:      { cx: 0.50, cy: 0.68 }, // empty space below the huddle
    WIDE_OFFICE:      { cx: 0.50, cy: 0.58 }, // open foreground
  }
  const zone = zones[baseCategory ?? ''] ?? { cx: 0.50, cy: 0.50 }

  // Clamp so panel never bleeds outside image
  const idealPx = Math.round(zone.cx * w - pw / 2)
  const idealPy = Math.round(zone.cy * h - ph / 2)
  const px = Math.max(0, Math.min(idealPx, w - pw))
  const py = Math.max(0, Math.min(idealPy, h - ph))
  return { px, py }
}

// ── Anchor renderers ─────────────────────────────────────────────────────────
// All text is centered/anchored relative to the panel origin (px, py),
// never relative to the full image dimensions.

const PANEL_BORDER = `stroke="${ACCENT}" stroke-width="1.5" stroke-opacity="0.5"`

function renderBigNumber(anchor: BigNumberAnchor, w: number, h: number, baseCategory?: string): string {
  const accent = anchor.accentColor ?? ACCENT
  const pw = 480
  const ph = 280
  const { px, py } = anchorOrigin(baseCategory, w, h, pw, ph)
  const cx = px + pw / 2   // panel centre x
  const numY = py + 180    // baseline of the big number
  const lineY = py + 205
  const labelY = py + 252

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="20" fill="${PANEL_BG}" ${PANEL_BORDER}/>
  <text x="${cx}" y="${numY}" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="148" font-weight="900" fill="${WHITE}" text-anchor="middle">${escapeXml(anchor.number)}</text>
  <line x1="${cx - 56}" y1="${lineY}" x2="${cx + 56}" y2="${lineY}" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
  <text x="${cx}" y="${labelY}" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="600" fill="${WHITE_DIM}" text-anchor="middle" letter-spacing="1">${escapeXml(anchor.label)}</text>
</svg>`
}

function renderSimpleDiagram(anchor: SimpleDiagramAnchor, w: number, h: number, baseCategory?: string): string {
  // Narrow categories (monitor/screen) fit 3 elements max; wide scenes can fit 4
  const screenFit = baseCategory === 'OVER_THE_SHOULDER' || baseCategory === 'HANDS_CLOSE_UP'
  const maxEl = screenFit ? 3 : 4
  const items = anchor.elements.slice(0, maxEl)
  const count = items.length

  const boxW = 148
  const boxH = 88
  const gap = anchor.arrows ? 48 : 24
  const totalW = count * boxW + (count - 1) * gap
  const pw = totalW + 80
  const ph = boxH + 100
  const { px, py } = anchorOrigin(baseCategory, w, h, pw, ph)
  const startX = px + 40
  const centerY = py + ph / 2

  let shapes = ''
  for (let i = 0; i < count; i++) {
    const el = items[i]
    const bx = startX + i * (boxW + gap)
    const by = centerY - boxH / 2
    const isLast = i === count - 1
    const fill = isLast ? ACCENT : 'rgba(255,255,255,0.08)'
    const stroke = isLast ? ACCENT : 'rgba(255,255,255,0.7)'
    const textFill = isLast ? '#0a1628' : WHITE

    if (el.shape === 'circle') {
      const cx = bx + boxW / 2
      const cy = centerY
      shapes += `<circle cx="${cx}" cy="${cy}" r="${boxH / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`
      shapes += `<text x="${cx}" y="${cy}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700" fill="${textFill}" text-anchor="middle" dominant-baseline="middle">${escapeXml(el.label)}</text>`
    } else {
      shapes += `<rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`
      shapes += `<text x="${bx + boxW / 2}" y="${centerY}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700" fill="${textFill}" text-anchor="middle" dominant-baseline="middle">${escapeXml(el.label)}</text>`
    }

    if (anchor.arrows && i < count - 1) {
      const ax = bx + boxW + 6
      const ay = centerY
      shapes += `<line x1="${ax}" y1="${ay}" x2="${ax + gap - 14}" y2="${ay}" stroke="${WHITE_DIM}" stroke-width="2.5"/>`
      shapes += `<polygon points="${ax + gap - 14},${ay - 8} ${ax + gap - 2},${ay} ${ax + gap - 14},${ay + 8}" fill="${WHITE_DIM}"/>`
    }
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="${PANEL_BG}" ${PANEL_BORDER}/>
  ${shapes}
</svg>`
}

function renderIconCluster(anchor: IconClusterAnchor, w: number, h: number, baseCategory?: string): string {
  const items = anchor.items.slice(0, 4)
  const iconSize = 64
  const labelH = 28
  const cellW = 140
  const cellH = iconSize + 16 + labelH
  const gap = 28
  const count = items.length
  const totalW = count * cellW + (count - 1) * gap
  const pw = totalW + 80
  const ph = cellH + 80
  const { px, py } = anchorOrigin(baseCategory, w, h, pw, ph)

  let icons = ''
  for (let i = 0; i < count; i++) {
    const item = items[i]
    const cx = px + 40 + i * (cellW + gap) + cellW / 2
    const iconX = cx - iconSize / 2
    const iconY = py + 40
    icons += iconSvg(item.icon, iconX, iconY, iconSize, WHITE)
    icons += `<text x="${cx}" y="${iconY + iconSize + 22}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="600" fill="${WHITE_DIM}" text-anchor="middle">${escapeXml(item.label)}</text>`

    if (i < count - 1) {
      const lx = px + 40 + i * (cellW + gap) + cellW + gap / 2
      const ly = py + 40 + iconSize / 2
      icons += `<line x1="${lx - 10}" y1="${ly}" x2="${lx + 10}" y2="${ly}" stroke="${WHITE_DIM}" stroke-width="2" stroke-dasharray="4,4"/>`
    }
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="${PANEL_BG}" ${PANEL_BORDER}/>
  ${icons}
</svg>`
}

function renderPullQuote(anchor: PullQuoteAnchor, w: number, h: number): string {
  const font = anchor.style === 'editorial'
    ? 'Georgia,"Times New Roman",serif'
    : 'Arial Black,Arial,Helvetica,sans-serif'
  const gradH = Math.round(h * 0.48)
  const gradY = h - gradH
  const pad = 56
  const textY = h - 80
  const accentY = textY - 64

  // Word-wrap at ~28 chars for big bold text
  const words = anchor.quote.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (test.length > 28 && line) { lines.push(line); line = word } else { line = test }
  }
  if (line) lines.push(line)

  const lineH = 72
  const firstLineY = lines.length > 1 ? textY - (lines.length - 1) * lineH : textY

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fadeUp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050c1a" stop-opacity="0"/>
      <stop offset="60%" stop-color="#050c1a" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#050c1a" stop-opacity="0.94"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${gradY}" width="${w}" height="${gradH}" fill="url(#fadeUp)"/>
  <rect x="${pad}" y="${accentY}" width="80" height="5" rx="2.5" fill="${ACCENT}"/>
  ${lines.map((l, i) =>
    `<text x="${pad}" y="${firstLineY + i * lineH}" font-family="${font}" font-size="62" font-weight="900" fill="${WHITE}">${escapeXml(l)}</text>`
  ).join('\n  ')}
</svg>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Before/After (pixel-level split + SVG labels) ────────────────────────────

async function compositeBeforeAfter(
  imageBuffer: Buffer | Uint8Array,
  anchor: BeforeAfterAnchor
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata()
  const w = meta.width ?? 1024
  const h = meta.height ?? 1024
  const splitX = Math.floor(w / 2)

  // Left half: desaturate + warm tint
  const leftBuf = await sharp(imageBuffer)
    .extract({ left: 0, top: 0, width: splitX, height: h })
    .modulate({ saturation: 0.45, brightness: 0.88 })
    .tint({ r: 200, g: 130, b: 110 })
    .toBuffer()

  // Right half: slightly enhanced
  const rightBuf = await sharp(imageBuffer)
    .extract({ left: splitX, top: 0, width: w - splitX, height: h })
    .modulate({ saturation: 1.08, brightness: 1.02 })
    .toBuffer()

  // Stitch halves
  const stitched = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([
      { input: leftBuf, left: 0, top: 0 },
      { input: rightBuf, left: splitX, top: 0 },
    ])
    .jpeg({ quality: 95 })
    .toBuffer()

  // SVG label overlay — labels are large and sit at image bottom for readability
  const labelPad = 40
  const labelW = 220
  const labelH = 80
  const labelY = h - labelPad - labelH
  const labelSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <!-- Divider line -->
  <line x1="${splitX}" y1="0" x2="${splitX}" y2="${h}" stroke="white" stroke-width="3" opacity="0.75"/>
  <!-- Triangle pointer -->
  <polygon points="${splitX - 14},${h / 2 - 18} ${splitX + 14},${h / 2} ${splitX - 14},${h / 2 + 18}" fill="white" opacity="0.75"/>
  <!-- Before label -->
  <rect x="${labelPad}" y="${labelY}" width="${labelW}" height="${labelH}" rx="12" fill="rgba(10,18,40,0.88)" stroke="rgba(255,160,130,0.5)" stroke-width="1.5"/>
  <text x="${labelPad + labelW / 2}" y="${labelY + 34}" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="600" fill="rgba(255,180,160,0.85)" text-anchor="middle" letter-spacing="3">BEFORE</text>
  <text x="${labelPad + labelW / 2}" y="${labelY + 62}" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="24" font-weight="900" fill="${WHITE}" text-anchor="middle">${escapeXml(anchor.beforeLabel)}</text>
  <!-- After label -->
  <rect x="${splitX + labelPad}" y="${labelY}" width="${labelW}" height="${labelH}" rx="12" fill="rgba(10,18,40,0.88)" stroke="${ACCENT}" stroke-width="1.5" stroke-opacity="0.6"/>
  <text x="${splitX + labelPad + labelW / 2}" y="${labelY + 34}" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="600" fill="${ACCENT}" text-anchor="middle" letter-spacing="3">AFTER</text>
  <text x="${splitX + labelPad + labelW / 2}" y="${labelY + 62}" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="24" font-weight="900" fill="${WHITE}" text-anchor="middle">${escapeXml(anchor.afterLabel)}</text>
</svg>`

  return sharp(stitched)
    .composite([{ input: Buffer.from(labelSvg), blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer()
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function compositeAnchor(
  imageBuffer: Buffer | Uint8Array,
  anchor: AnchorConfig,
  baseCategory?: string
): Promise<Buffer> {
  if (anchor.type === 'before_after') {
    return compositeBeforeAfter(imageBuffer, anchor as BeforeAfterAnchor)
  }

  const meta = await sharp(imageBuffer).metadata()
  const w = meta.width ?? 1024
  const h = meta.height ?? 1024

  let svg: string
  switch (anchor.type) {
    case 'big_number':
      svg = renderBigNumber(anchor as BigNumberAnchor, w, h, baseCategory)
      break
    case 'simple_diagram':
      svg = renderSimpleDiagram(anchor as SimpleDiagramAnchor, w, h, baseCategory)
      break
    case 'icon_cluster':
      svg = renderIconCluster(anchor as IconClusterAnchor, w, h, baseCategory)
      break
    case 'pull_quote':
      svg = renderPullQuote(anchor as PullQuoteAnchor, w, h)
      break
    default:
      return Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer)
  }

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer()
}
