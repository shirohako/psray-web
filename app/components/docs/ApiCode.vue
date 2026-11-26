<script setup lang="ts">
/**
 * A highlighted code sample for the dark code column on /docs/api. Tokens come
 * from `tokenize()`, each rendered as a span, so nothing goes through v-html.
 *
 * It is a real `<pre><code class="language-…">`, which the Markdown view for
 * agents turns into a fenced block. Plain tokens (spaces, indentation) stay
 * bare text nodes: that view drops elements holding only whitespace. Line
 * numbers are drawn by a CSS counter, so they stay out of copied text too.
 */
import { tokenize, type CodeLanguage, type CodeTokenKind } from '~/utils/codeTokens'

const props = defineProps<{
  code: string
  language: CodeLanguage
  lineNumbers?: boolean
}>()

const lines = computed(() => tokenize(props.code, props.language))

const TOKEN_CLASS: Record<Exclude<CodeTokenKind, 'plain'>, string> = {
  punct: 'text-slate-500',
  key: 'text-sky-300',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  literal: 'text-violet-300',
  keyword: 'text-violet-300',
  command: 'font-semibold text-white',
  flag: 'text-violet-300',
  comment: 'text-slate-500',
}
</script>

<!-- Whitespace inside <pre> is significant: keep the code element on one line. -->
<template>
  <pre class="api-code font-mono text-[12.5px] leading-5 text-slate-300" :class="{ 'api-code--numbered': lineNumbers }"><code :class="`language-${language}`"><template v-for="(line, i) in lines" :key="i"><span class="api-code__line"><template v-for="(token, j) in line" :key="j"><template v-if="token.kind === 'plain'">{{ token.text }}</template><span v-else :class="TOKEN_CLASS[token.kind as Exclude<CodeTokenKind, 'plain'>]">{{ token.text }}</span></template></span>{{ i < lines.length - 1 ? '\n' : '' }}</template></code></pre>
</template>

<style scoped>
.api-code {
  counter-reset: line;
}

.api-code--numbered .api-code__line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 1.5rem;
  margin-right: 1rem;
  text-align: right;
  color: var(--color-slate-600, #475569);
  user-select: none;
}
</style>
