import { describe, expect, it } from 'vitest'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  TIER_COLORS,
  num,
  platformLabel,
  profileCardHtml,
  trophyCardHtml,
} from '../server/utils/ogCard'

const trophies = { platinum: 42, gold: 310, silver: 1204, bronze: 5678 }

const profile = {
  psnid: 'ShionAri',
  trophyLevel: 512,
  rank: 1234,
  trophies,
  playedGames: 987,
  avatar: 'data:image/png;base64,AAAA',
  flag: 'data:image/svg+xml;base64,BBBB',
}

const set = {
  platforms: ['PS5', 'PSVITA'],
  trophies,
  owners: 12480,
  averageProgress: 37.4,
  icon: 'data:image/png;base64,CCCC',
}

describe('OG card markup', () => {
  it('renders at the 2:1 geometry every platform crops to', () => {
    expect(CARD_WIDTH / CARD_HEIGHT).toBeCloseTo(1200 / 630)
    expect(profileCardHtml(profile)).toContain(`width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px`)
  })

  it('groups digits so six-figure trophy counts stay readable', () => {
    expect(num(5678)).toBe('5,678')
    const markup = profileCardHtml(profile)
    expect(markup).toContain('5,678')
    // Platinum + gold + silver + bronze, shown as the headline total.
    expect(markup).toContain('7,234')
  })

  it('paints each trophy tier in the site palette', () => {
    const markup = profileCardHtml(profile)
    for (const color of Object.values(TIER_COLORS)) expect(markup).toContain(color)
  })

  it('shows the player identity and rank', () => {
    const markup = profileCardHtml(profile)
    expect(markup).toContain('ShionAri')
    expect(markup).toContain('Level 512')
    expect(markup).toContain('#1,234')
  })

  it('omits the rank line for an unranked player', () => {
    // `#` alone would match every hex colour, so assert on the rendered rank.
    expect(profileCardHtml({ ...profile, rank: null })).not.toContain('#1,234')
  })

  it('falls back to a placeholder tile rather than a broken image', () => {
    const markup = profileCardHtml({ ...profile, avatar: null, flag: null })
    expect(markup).not.toContain('<img')
    expect(markup).toContain('width:176px;height:176px')
  })

  it('abbreviates the Vita platform badge the way the site does', () => {
    expect(platformLabel('PSVITA')).toBe('PSV')
    const markup = trophyCardHtml(set)
    expect(markup).toContain('>PSV<')
    expect(markup).toContain('>PS5<')
  })

  it('rounds average progress and keeps the owner count grouped', () => {
    const markup = trophyCardHtml(set)
    expect(markup).toContain('37%')
    expect(markup).toContain('12,480')
  })

  it('closes every element it opens', () => {
    // satori-html tolerates unbalanced markup by silently renesting it, which
    // shows up only as a wrong-looking card — so assert the structure here.
    for (const markup of [profileCardHtml(profile), trophyCardHtml(set)]) {
      const opened = (markup.match(/<div\b/g) ?? []).length
      const closed = (markup.match(/<\/div>/g) ?? []).length
      expect(closed).toBe(opened)
    }
  })

  it('never draws a trophy set name, which would need CJK outlines', () => {
    // The card carries no localisable prose at all — only ASCII labels.
    const text = trophyCardHtml(set).replace(/<[^>]*>/g, ' ')
    expect(text).not.toMatch(/[^\x00-\x7F]/)
  })
})
