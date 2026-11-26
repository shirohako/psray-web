/**
 * The `lang` attribute for a piece of content: its language label, corrected
 * when the text itself plainly says otherwise.
 *
 * The label decides how a shared Han character is drawn (see the Fonts
 * section of main.css), and screen readers use it to pick a voice. PSN labels
 * are not reliable for Japanese titles: about 180 trophy sets labelled `en-US`
 * have titles like 「Wizardry 囚われし魂の迷宮」 (mostly PS3/Vita releases),
 * and a few dozen labelled zh-* are really Japanese. Trusting those would draw
 * their kanji in Chinese forms.
 *
 * Kana means Japanese and Hangul means Korean. It takes two such characters,
 * so a lone stylistic の in a Chinese title doesn't flip it; ・ and ー are not
 * counted because Chinese text uses them too. Kanji-only text can't be
 * attributed and keeps its label.
 *
 * @param label  `display_language` / `language_code` from the API, or a tip's language.
 * @param texts  the strings shown under that label; pass the ones a reader sees.
 */
export function contentLang(label: string | null | undefined, ...texts: (string | null | undefined)[]): string | undefined {
  const text = texts.filter(Boolean).join(' ')
  if (countMatches(text, KANA) >= 2) return label?.startsWith('ja') ? label : 'ja-JP'
  if (countMatches(text, HANGUL) >= 2) return label?.startsWith('ko') ? label : 'ko-KR'
  return label || undefined
}

// Hiragana, katakana (minus ・ U+30FB and ー U+30FC), phonetic extensions, half-width katakana.
const KANA = /[ぁ-ゖゝ-ゟァ-ヺヽ-ヿㇰ-ㇿｦ-ﾝ]/g
// Jamo, compatibility jamo, syllables.
const HANGUL = /[ᄀ-ᇿㄱ-ㆎ가-힣]/g

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}
