export type AnchorType = 'big_number' | 'simple_diagram' | 'before_after' | 'icon_cluster' | 'pull_quote'

export interface BigNumberAnchor {
  type: 'big_number'
  number: string       // e.g. "20+", "4x", "3/12"
  label: string        // e.g. "hours/week saved"
  accentColor?: string // hex, default "#00BCD4"
}

export interface SimpleDiagramAnchor {
  type: 'simple_diagram'
  elements: Array<{
    shape: 'box' | 'circle'
    label: string // max 3 words
  }>
  arrows: boolean // draw connecting arrows between elements
}

export interface BeforeAfterAnchor {
  type: 'before_after'
  beforeLabel: string // e.g. "Manual"
  afterLabel: string  // e.g. "Automated"
}

export interface IconClusterAnchor {
  type: 'icon_cluster'
  items: Array<{
    icon: SupportedIcon
    label: string // max 2 words
  }>
}

// Lucide icons available — SVG paths embedded in composite.ts
export type SupportedIcon =
  | 'file-text'
  | 'bar-chart'
  | 'git-branch'
  | 'clock'
  | 'zap'
  | 'check-circle'
  | 'x-circle'
  | 'arrow-right'
  | 'users'
  | 'cpu'

export interface PullQuoteAnchor {
  type: 'pull_quote'
  quote: string              // max 8 words, distilled from hook
  style: 'editorial' | 'modern'
}

export type AnchorConfig =
  | BigNumberAnchor
  | SimpleDiagramAnchor
  | BeforeAfterAnchor
  | IconClusterAnchor
  | PullQuoteAnchor
