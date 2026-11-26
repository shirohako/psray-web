import { describe, expect, it } from 'vitest'
import { contentLang } from '~/utils/contentLang'

describe('contentLang', () => {
  it('keeps the label when the text agrees or cannot tell', () => {
    expect(contentLang('ja-JP', '直感の勝利')).toBe('ja-JP')
    expect(contentLang('zh-Hans', '直面天命')).toBe('zh-Hans')
    expect(contentLang('zh-Hant', '真・三國無雙')).toBe('zh-Hant')
    expect(contentLang('en-US', 'Platinum Hunter')).toBe('en-US')
    expect(contentLang('ko-KR', '모든 트로피 획득')).toBe('ko-KR')
  })

  it('retags Japanese text that PSN labelled as another language', () => {
    expect(contentLang('en-US', 'Wizardry 囚われし魂の迷宮')).toBe('ja-JP')
    expect(contentLang('en-US', 'Power Smash ライブマッチ！')).toBe('ja-JP')
    expect(contentLang('zh-Hans', '熱血硬派くにおくん外伝 River City Girls')).toBe('ja-JP')
    expect(contentLang('zh-Hans', 'eFootball ウイニングイレブン 2020')).toBe('ja-JP')
  })

  it('retags Korean text', () => {
    expect(contentLang('en-US', '모든 트로피 획득')).toBe('ko-KR')
  })

  it('needs two kana, and ignores ・ and ー', () => {
    expect(contentLang('zh-Hans', '我の世界')).toBe('zh-Hans')
    expect(contentLang('zh-Hant', '真・鋼彈無雙')).toBe('zh-Hant')
    expect(contentLang('zh-Hans', '梦・现Re:Master')).toBe('zh-Hans')
    expect(contentLang('zh-Hans', 'ー・ー')).toBe('zh-Hans')
  })

  it('reads every text it is given', () => {
    expect(contentLang('en-US', 'Stage 1', 'すべてのボスを倒した')).toBe('ja-JP')
    expect(contentLang('en-US', null, undefined, 'Stage 1')).toBe('en-US')
  })

  it('returns undefined rather than an empty attribute when nothing is known', () => {
    expect(contentLang(null, 'Platinum Hunter')).toBeUndefined()
    expect(contentLang(undefined)).toBeUndefined()
    expect(contentLang('', '直面天命')).toBeUndefined()
    expect(contentLang(null, 'すべてのボス')).toBe('ja-JP')
  })
})
