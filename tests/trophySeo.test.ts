import { describe, expect, it } from 'vitest'
import { medianPlatinumTime, platinumEarnRate, seoPlatforms, trophySetSeoName } from '../app/utils/trophySeo'
import { breadcrumbJsonLd, jsonLdScript } from '../app/utils/structuredData'

describe('trophy set titles', () => {
  it('drops the "Trophies" PS3 and Vita set names carry', () => {
    expect(trophySetSeoName('THE EYE OF JUDGMENT™ Trophies', ['PS3'])).toBe('THE EYE OF JUDGMENT™')
    expect(trophySetSeoName('THE EYE OF JUDGMENT™　トロフィー', ['PS3'])).toBe('THE EYE OF JUDGMENT™')
    expect(trophySetSeoName('Uncharted 2 Trophy Set', ['PS3'])).toBe('Uncharted 2')
    expect(trophySetSeoName('Gravity Rush 트로피', ['PSVITA'])).toBe('Gravity Rush')
  })

  it('leaves newer platforms and bare words alone', () => {
    expect(trophySetSeoName('Trophies', ['PS3'])).toBe('Trophies')
    expect(trophySetSeoName('Black Myth: Wukong', ['PS5'])).toBe('Black Myth: Wukong')
    expect(trophySetSeoName('The Trophies Game', ['PS4'])).toBe('The Trophies Game')
  })

  it('spells platforms the way searches do', () => {
    expect(seoPlatforms(['PS5', 'PS4'])).toBe('PS5 / PS4')
    expect(seoPlatforms(['PSVITA'])).toBe('PS Vita')
  })
})

describe('trophy set descriptions', () => {
  it('reads the platinum earn rate', () => {
    expect(platinumEarnRate([{ trophies: [{ type: 'gold', psn_earned_rate: 9 }] }, { trophies: [{ type: 'platinum', psn_earned_rate: '6.0' }] }])).toBe(6)
    expect(platinumEarnRate([{ trophies: [{ type: 'bronze', psn_earned_rate: 50 }] }])).toBeNull()
  })

  it('takes the median time to platinum the statistics card shows', () => {
    const set = { defined_trophies: { platinum: 1, gold: 1, silver: 1, bronze: 1 }, median_platinum_time: 200, median_completion_time: 100 }
    expect(medianPlatinumTime({ ...set, has_trophy_groups: true })).toBe(200)
    expect(medianPlatinumTime({ ...set, has_trophy_groups: false })).toBe(100)
    expect(medianPlatinumTime({ ...set, has_trophy_groups: false, median_completion_time: null })).toBe(200)
    expect(medianPlatinumTime({ ...set, defined_trophies: { ...set.defined_trophies, platinum: 0 }, has_trophy_groups: false })).toBeNull()
  })
})

describe('structured data', () => {
  it('numbers breadcrumbs from 1', () => {
    expect(breadcrumbJsonLd([{ name: 'A', url: 'https://x/a' }, { name: 'B', url: 'https://x/b' }]).itemListElement)
      .toEqual([
        { '@type': 'ListItem', 'position': 1, 'name': 'A', 'item': 'https://x/a' },
        { '@type': 'ListItem', 'position': 2, 'name': 'B', 'item': 'https://x/b' },
      ])
  })

  it('cannot close its script tag', () => {
    expect(jsonLdScript('k', { name: '</script><b>' }).innerHTML).not.toContain('</script>')
  })
})
