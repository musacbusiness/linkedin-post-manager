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

// ── Anchor renderers ─────────────────────────────────────────────────────────

function renderBigNumber(anchor: BigNumberAnchor, w: number, h: number): string {
  const accent = anchor.accentColor ?? ACCENT
  const pw = 480
  const ph = 260
  const px = (w - pw) / 2
  const py = (h - ph) / 2

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="20" fill="${PANEL_BG}"/>
  <text x="${w / 2}" y="${py + 155}" font-family="Arial,Helvetica,sans-serif" font-size="130" font-weight="bold" fill="${WHITE}" text-anchor="middle" dominant-baseline="auto">${escapeXml(anchor.number)}</text>
  <line x1="${w / 2 - 60}" y1="${py + 175}" x2="${w / 2 + 60}" y2="${py + 175}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
  <text x="${w / 2}" y="${py + 218}" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="${WHITE_DIM}" text-anchor="middle">${escapeXml(anchor.label)}</text>
</svg>`
}

function renderSimpleDiagram(anchor: SimpleDiagramAnchor, w: number, h: number): string {
  const items = anchor.elements.slice(0, 5)
  const count = items.length
  const boxW = 130
  const boxH = 70
  const gap = anchor.arrows ? 44 : 20
  const totalW = count * boxW + (count - 1) * gap
  const pw = totalW + 80
  const ph = boxH + 100
  const px = (w - pw) / 2
  const py = (h - ph) / 2
  const startX = px + 40
  const centerY = py + ph / 2

  let shapes = ''
  for (let i = 0; i < count; i++) {
    const el = items[i]
    const bx = startX + i * (boxW + gap)
    const by = centerY - boxH / 2
    const isLast = i === count - 1
    const fill = isLast ? ACCENT : 'none'
    const stroke = isLast ? ACCENT : WHITE
    const textColor = isLast ? '#0f172a' : WHITE

    if (el.shape === 'circle') {
      const cx = bx + boxW / 2
      const cy = centerY
      shapes += `<circle cx="${cx}" cy="${cy}" r="${boxH / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      shapes += `<text x="${cx}" y="${cy}" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(el.label)}</text>`
    } else {
      shapes += `<rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      shapes += `<text x="${bx + boxW / 2}" y="${centerY}" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(el.label)}</text>`
    }

    if (anchor.arrows && i < count - 1) {
      const ax = bx + boxW + 6
      const ay = centerY
      shapes += `<line x1="${ax}" y1="${ay}" x2="${ax + gap - 12}" y2="${ay}" stroke="${WHITE_DIM}" stroke-width="2"/>`
      shapes += `<polygon points="${ax + gap - 12},${ay - 5} ${ax + gap - 2},${ay} ${ax + gap - 12},${ay + 5}" fill="${WHITE_DIM}"/>`
    }
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="16" fill="${PANEL_BG}"/>
  ${shapes}
</svg>`
}

function renderIconCluster(anchor: IconClusterAnchor, w: number, h: number): string {
  const items = anchor.items.slice(0, 4)
  const iconSize = 52
  const labelH = 22
  const cellW = 120
  const cellH = iconSize + 12 + labelH
  const gap = 24
  const count = items.length
  const totalW = count * cellW + (count - 1) * gap
  const pw = totalW + 72
  const ph = cellH + 72
  const px = (w - pw) / 2
  const py = (h - ph) / 2

  let icons = ''
  for (let i = 0; i < count; i++) {
    const item = items[i]
    const cx = px + 36 + i * (cellW + gap) + cellW / 2
    const iconX = cx - iconSize / 2
    const iconY = py + 36
    icons += iconSvg(item.icon, iconX, iconY, iconSize, WHITE)
    icons += `<text x="${cx}" y="${iconY + iconSize + 18}" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="${WHITE_DIM}" text-anchor="middle">${escapeXml(item.label)}</text>`

    if (i < count - 1) {
      const lx = px + 36 + i * (cellW + gap) + cellW + gap / 2
      const ly = py + 36 + iconSize / 2
      icons += `<line x1="${lx - 8}" y1="${ly}" x2="${lx + 8}" y2="${ly}" stroke="${WHITE_DIM}" stroke-width="1.5" stroke-dasharray="3,3"/>`
    }
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="16" fill="${PANEL_BG}"/>
  ${icons}
</svg>`
}

function renderPullQuote(anchor: PullQuoteAnchor, w: number, h: number): string {
  const font = anchor.style === 'editorial'
    ? 'Georgia,"Times New Roman",serif'
    : 'Arial,Helvetica,sans-serif'
  const gradH = Math.round(h * 0.42)
  const gradY = h - gradH
  const textY = h - 68
  const accentY = textY - 52

  // Word-wrap naively at ~42 chars
  const words = anchor.quote.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (test.length > 32 && line) { lines.push(line); line = w } else { line = test }
  }
  if (line) lines.push(line)

  const lineH = 62
  const firstLineY = lines.length > 1 ? textY - lineH : textY

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fadeUp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.84"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${gradY}" width="${w}" height="${gradH}" fill="url(#fadeUp)"/>
  <rect x="48" y="${accentY}" width="72" height="4" rx="2" fill="${ACCENT}"/>
  ${lines.map((l, i) =>
    `<text x="48" y="${firstLineY + i * lineH}" font-family="${font}" font-size="54" font-weight="bold" fill="${WHITE}">${escapeXml(l)}</text>`
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

  // SVG label overlay
  const labelSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <!-- Divider -->
  <line x1="${splitX}" y1="0" x2="${splitX}" y2="${h}" stroke="white" stroke-width="2" opacity="0.7"/>
  <!-- Before label -->
  <rect x="32" y="32" width="140" height="48" rx="8" fill="rgba(15,23,42,0.78)"/>
  <text x="102" y="64" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="bold" fill="rgba(255,180,160,0.9)" text-anchor="middle">Before</text>
  <text x="102" y="96" font-family="Arial,Helvetica,sans-serif" font-size="16" fill="rgba(255,255,255,0.75)" text-anchor="middle">${escapeXml(anchor.beforeLabel)}</text>
  <!-- After label -->
  <rect x="${splitX + 32}" y="32" width="140" height="48" rx="8" fill="rgba(15,23,42,0.78)"/>
  <text x="${splitX + 102}" y="64" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="bold" fill="${ACCENT}" text-anchor="middle">After</text>
  <text x="${splitX + 102}" y="96" font-family="Arial,Helvetica,sans-serif" font-size="16" fill="rgba(255,255,255,0.75)" text-anchor="middle">${escapeXml(anchor.afterLabel)}</text>
</svg>`

  return sharp(stitched)
    .composite([{ input: Buffer.from(labelSvg), blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer()
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function compositeAnchor(
  imageBuffer: Buffer | Uint8Array,
  anchor: AnchorConfig
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
      svg = renderBigNumber(anchor as BigNumberAnchor, w, h)
      break
    case 'simple_diagram':
      svg = renderSimpleDiagram(anchor as SimpleDiagramAnchor, w, h)
      break
    case 'icon_cluster':
      svg = renderIconCluster(anchor as IconClusterAnchor, w, h)
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
