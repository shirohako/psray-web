/**
 * A deliberately small syntax highlighter for the code samples on /docs/api:
 * JSON responses, curl commands and `fetch` snippets. It splits text into
 * typed tokens and leaves the colours to the template, so nothing is rendered
 * through `v-html`. Anything it does not recognise comes out as `plain`, which
 * keeps the text intact even when the colouring is imperfect.
 */

export type CodeLanguage = 'json' | 'bash' | 'js'

export type CodeTokenKind =
  | 'plain'
  | 'punct'
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'keyword'
  | 'command'
  | 'flag'
  | 'comment'

export interface CodeToken {
  text: string
  kind: CodeTokenKind
}

type Rule = [RegExp, CodeTokenKind]

const RULES: Record<CodeLanguage, Rule[]> = {
  json: [
    // A string directly followed by a colon is an object key.
    [/"(?:[^"\\]|\\.)*"(?=\s*:)/y, 'key'],
    [/"(?:[^"\\]|\\.)*"/y, 'string'],
    [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, 'number'],
    [/\b(?:true|false|null)\b/y, 'literal'],
    [/[{}[\],:]/y, 'punct'],
    [/…/y, 'comment'],
  ],
  bash: [
    [/#.*/y, 'comment'],
    [/'[^']*'/y, 'string'],
    [/"(?:[^"\\]|\\.)*"/y, 'string'],
    [/(?<=^|\s)curl\b/y, 'command'],
    [/(?<=^|\s)--?[A-Za-z][\w-]*/y, 'flag'],
    [/\\$/y, 'punct'],
  ],
  js: [
    [/\/\/.*/y, 'comment'],
    [/'(?:[^'\\]|\\.)*'/y, 'string'],
    [/`(?:[^`\\]|\\.)*`/y, 'string'],
    [/\b(?:const|let|await|async|new|return|if|throw|function)\b/y, 'keyword'],
    [/\b(?:true|false|null|undefined)\b/y, 'literal'],
    [/\b\d+(?:\.\d+)?\b/y, 'number'],
    [/[{}[\]();,.=]/y, 'punct'],
  ],
}

/** Split one line into tokens, merging runs of adjacent plain characters. */
export function tokenizeLine(line: string, language: CodeLanguage): CodeToken[] {
  const rules = RULES[language]
  const tokens: CodeToken[] = []
  const push = (text: string, kind: CodeTokenKind) => {
    const last = tokens.at(-1)
    if (last && last.kind === kind && kind === 'plain') last.text += text
    else tokens.push({ text, kind })
  }

  let i = 0
  outer: while (i < line.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = i
      const match = pattern.exec(line)
      if (!match || match[0] === '') continue
      push(match[0], kind)
      i += match[0].length
      continue outer
    }
    // Consume a whole word at once so a keyword rule never fires mid-identifier.
    const word = /[\w$]+|\s+|./y
    word.lastIndex = i
    const text = word.exec(line)![0]
    push(text, 'plain')
    i += text.length
  }
  return tokens
}

/** Tokens for every line of `code`; an empty line becomes an empty array. */
export function tokenize(code: string, language: CodeLanguage): CodeToken[][] {
  return code.split('\n').map(line => tokenizeLine(line, language))
}
