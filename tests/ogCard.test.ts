import { describe, expect, it } from 'vitest'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  TIER_COLORS,
  cardRegionName,
  cardUpdatedDate,
  clampTitle,
  num,
  platformLabel,
  profileCardHtml,
  trophyCardHtml,
  trophyTitleSize,
  trophyTitle,
} from '../server/utils/ogCard'

const trophies = { platinum: 42, gold: 310, silver: 1204, bronze: 5678 }

const profile = {
  psnid: 'ShionAri',
  trophyLevel: 512,
  rank: 1234,
  regionalRank: 56,
  trophies,
  playedGames: 987,
  avatar: { uri: 'data:image/png;base64,AAAA', natural: { width: 240, height: 240 } },
  flag: 'data:image/svg+xml;base64,BBBB',
  country: 'US',
  logo: 'data:image/png;base64,LLLL',
  url: 'https://psray.net/p/ShionAri',
  qr: 'data:image/png;base64,QQQQ',
  lastUpdatedAt: '2026-09-03T16:51:14.000000Z',
}

const set = {
  name: 'Life is Strange: Double Exposure',
  platforms: ['PS5', 'PSVITA'],
  trophies,
  owners: 12480,
  completedPlayers: 4321,
  platinumAchievers: 987,
  recentPlayers: 64,
  averageProgress: 37.4,
  icon: { uri: 'data:image/png;base64,CCCC', natural: { width: 512, height: 512 } },
  logo: 'data:image/png;base64,LLLL',
  url: 'https://psray.net/trophies/42',
  qr: 'data:image/png;base64,QQQQ',
  lastUpdatedAt: '2026-08-14T09:12:00.000000Z',
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

  it('shows the player identity and both ranks', () => {
    const markup = profileCardHtml(profile)
    expect(markup).toContain('ShionAri')
    expect(markup).toContain('Level 512')
    expect(markup).toContain('#1,234')
    expect(markup).toContain('#56')
    expect(markup).toContain('Global rank')
    expect(markup).toContain('Regional rank')
    expect(markup).toContain('USA')
    expect(markup).toContain('background-color:#edf1ff')
  })

  it('omits the rank line for an unranked player', () => {
    // `#` alone would match every hex colour, so assert on the rendered rank.
    const markup = profileCardHtml({ ...profile, rank: null, regionalRank: null })
    expect(markup).not.toContain('#1,234')
    expect(markup).toContain('>—<')
  })

  it('falls back to a placeholder tile rather than a broken image', () => {
    const markup = profileCardHtml({ ...profile, avatar: null, flag: null, logo: null, qr: null })
    expect(markup).not.toContain('<img')
    expect(markup).toContain('width:174px;height:174px')
  })

  it('gives the flag a 4:3 content box, the shape the art is drawn at', () => {
    // Satori sizes borders inside the box, so the 1px frame comes out of the
    // 26x20 declared here; anything else letterboxes the flag inside it.
    const markup = profileCardHtml(profile)
    expect(markup).toContain('width:26px;height:20px')
  })

  it('renders compact English country names beside the flag', () => {
    expect(cardRegionName('US')).toBe('USA')
    expect(cardRegionName('JP')).toBe('Japan')
    expect(cardRegionName(null)).toBe('')
  })

  it('prefers the short region form, and gives up on the unwieldy ones', () => {
    // The default style spells these "Hong Kong SAR China" and "United Kingdom",
    // both of which crowd the level badge sitting next to them.
    expect(cardRegionName('HK')).toBe('Hong Kong')
    expect(cardRegionName('GB')).toBe('UK')
    expect(cardRegionName('AE')).toBe('UAE')
    expect(cardRegionName('DO')).toBe('Dominican Republic')
    expect(cardRegionName('GS')).toBe('GS')
  })

  it('formats the profile sync date in UTC and omits invalid values', () => {
    expect(cardUpdatedDate('2026-09-03T16:51:14.000000Z')).toBe('Sep 3, 2026')
    expect(cardUpdatedDate(1_788_451_200)).toBe('Sep 3, 2026')
    expect(cardUpdatedDate(null)).toBeNull()
    expect(cardUpdatedDate('not-a-date')).toBeNull()

    expect(profileCardHtml(profile)).toContain('Last updated Sep 3, 2026')
    expect(profileCardHtml({ ...profile, lastUpdatedAt: null })).not.toContain('Last updated')
    // A trophy set carries its own refresh date, from the set's `updated_at`.
    expect(trophyCardHtml(set)).toContain('Last updated Aug 14, 2026')
    expect(trophyCardHtml({ ...set, lastUpdatedAt: null })).not.toContain('Last updated')
  })

  it('shrinks the art frame to the cover, leaving no white margin around it', () => {
    // 320x176 fits to 258x142, so the frame is that plus the 5px a side the
    // avatar tile uses — a hairline margin, not a white mount.
    const wide = trophyCardHtml({ ...set, icon: { uri: 'data:image/png;base64,WWWW', natural: { width: 320, height: 176 } } })
    expect(wide).toContain('width:268px;height:152px')
    // A square PS5 cover keeps a square frame rather than inheriting that one.
    const square = trophyCardHtml({ ...set, icon: { uri: 'data:image/png;base64,SSSS', natural: { width: 512, height: 512 } } })
    expect(square).toContain('width:190px;height:190px')
  })

  it('draws a landscape cover at its own shape instead of squashing it square', () => {
    // PS3, PS4 and Vita sets ship 320x176 art; only PS5 sets are square.
    const wide = trophyCardHtml({ ...set, icon: { uri: 'data:image/png;base64,WWWW', natural: { width: 320, height: 176 } } })
    expect(wide).toContain('width:258px;height:142px')

    // A PS5 square fills the box's height, not its width.
    expect(trophyCardHtml(set)).toContain('width:180px;height:180px')
  })

  it('signs both cards with the gamepad mark beside the wordmark', () => {
    for (const markup of [profileCardHtml(profile), trophyCardHtml(set)]) {
      expect(markup).toContain('data:image/png;base64,LLLL')
      expect(markup).toContain('PSRay')
      expect(markup).toContain('Your PSN assistant')
    }
  })

  it('shows each concrete public URL with its QR code', () => {
    const profileMarkup = profileCardHtml(profile)
    const trophyMarkup = trophyCardHtml(set)
    expect(profileMarkup).toContain('https://psray.net/p/ShionAri')
    expect(trophyMarkup).toContain('https://psray.net/trophies/42')
    expect(profileMarkup).toContain('data:image/png;base64,QQQQ')
    expect(trophyMarkup).toContain('data:image/png;base64,QQQQ')
  })

  it('keeps the wordmark when the logo could not be read', () => {
    const markup = trophyCardHtml({ ...set, logo: null })
    expect(markup).toContain('PSRay')
    expect(markup).not.toContain('LLLL')
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
    expect(markup).toContain('4,321')
    expect(markup).toContain('987')
    expect(markup).toContain('64')
  })

  it('draws an icon for every overview metric', () => {
    // Four overview metrics plus the level icon beside the identity subtitle.
    expect((profileCardHtml(profile).match(/<svg\b/g) ?? [])).toHaveLength(5)
    expect((trophyCardHtml(set).match(/<svg\b/g) ?? [])).toHaveLength(6)
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

  it('titles the trophy card with the set name', () => {
    expect(trophyCardHtml(set)).toContain('Life is Strange: Double Exposure')
  })

  it('drops a redundant trophy suffix from old PSN set names', () => {
    expect(trophyTitle('THE EYE OF JUDGMENT™ Trophies')).toBe('THE EYE OF JUDGMENT™')
    expect(trophyCardHtml({ ...set, name: 'THE EYE OF JUDGMENT™ Trophies' }))
      .not.toContain('JUDGMENT™ Trophies')
  })

  it('keeps a Japanese title to two lines, budgeting CJK glyphs as full width', () => {
    const long = 'ライフ イズ ストレンジ ダブルエクスポージャー コンプリートエディション'
    const clamped = clampTitle(long)
    expect(clamped.endsWith('…')).toBe(true)
    expect(clamped.length).toBeLessThan(long.length)
    // A Latin title of the same character count still fits: half the width each.
    expect(clampTitle('Life is Strange: Double Exposure')).toBe('Life is Strange: Double Exposure')
  })

  it('ellipsizes a long English title at a word boundary', () => {
    const clamped = clampTitle('High Stakes on the Vegas Strip: Poker Edition')
    expect(clamped.endsWith('Poker…')).toBe(true)
    expect(clamped).not.toContain('Edit')
  })

  it('uses a smaller headline for every trophy set and steps down for long names', () => {
    expect(trophyTitleSize('Astro Bot')).toBe(31)
    expect(trophyTitleSize('High Stakes on the Vegas Strip: Poker Edition')).toBe(27)

    const regular = trophyCardHtml({ ...set, name: 'Astro Bot' })
    const long = trophyCardHtml({ ...set, name: 'High Stakes on the Vegas Strip: Poker Edition' })
    expect(regular).toContain('font-size:31px')
    expect(long).toContain('font-size:27px')
    expect(long).toContain('High Stakes on the Vegas Strip: Poker Edition')
  })

  it('escapes a title that contains markup characters', () => {
    expect(trophyCardHtml({ ...set, name: 'Trine 2 <Director\'s Cut>' }))
      .toContain('Trine 2 &lt;Director\'s Cut&gt;')
  })

  it('rounds the avatar tile without clipping it to a circle', () => {
    const markup = profileCardHtml(profile)
    expect(markup).toContain('width:184px;height:184px;border:1px solid #e6eaf5;border-radius:22px')
    // 22 outside, set back by the 5px margin, leaves 17 on the art itself.
    expect(markup).toContain('width:174px;height:174px;border-radius:17px')
  })
})
