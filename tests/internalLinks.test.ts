import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every internal link on a public page has to carry the interface language
 * (`docs/seo.md`): `<AppLink>`, or a raw `<a>` whose `href` comes from
 * `useLangLink().href()`. A bare `<NuxtLink>` or a hard-coded `href="/…"`
 * would lead crawlers on an English page back to Japanese.
 */
const root = join(__dirname, '..', 'app')

// Rendering the links themselves, or deliberately language-agnostic.
const ALLOWED = new Set([
  'components/AppLink.vue',
  'components/LanguageSwitcher.vue',
  'components/LanguageLinks.vue',
])

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? vueFiles(path) : path.endsWith('.vue') ? [path] : []
  })
}

describe('internal links keep the interface language', () => {
  const files = vueFiles(root)
    .map(path => relative(root, path))
    .filter(path => !ALLOWED.has(path) && !path.startsWith('pages/admin') && !path.startsWith('components/admin') && path !== 'layouts/admin.vue')

  it('uses <AppLink>, never a bare <NuxtLink>', () => {
    const offenders = files.filter(path => /<NuxtLink\b/.test(readFileSync(join(root, path), 'utf8')))
    expect(offenders).toEqual([])
  })

  it('never hard-codes an internal href', () => {
    const offenders = files.filter(path => /\shref="\/(?!\/)|:href="`\//.test(readFileSync(join(root, path), 'utf8')))
    expect(offenders).toEqual([])
  })
})
