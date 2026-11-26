import { HardDrive, ImageDown, Rows3, type IconNode } from 'lucide'

/**
 * The tools listed on `/tools`, in display order. A new tool adds an entry
 * here, its page under `pages/tools/`, its `tools.items.<key>` messages and,
 * for the card's picture, a branch in `ToolsCardArt`.
 */
export interface ToolEntry {
  key: string
  to: string
  icon: IconNode
  /** Short facts shown as tags on the card: `tools.tags.<key>`. */
  tags: { key: string, icon: IconNode }[]
}

export const TOOLS: readonly ToolEntry[] = [
  {
    key: 'tierlist',
    to: '/tools/tierlist',
    icon: Rows3,
    tags: [
      { key: 'local', icon: HardDrive },
      { key: 'export', icon: ImageDown },
    ],
  },
]
