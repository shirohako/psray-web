/**
 * Scroll spy for an in-page table of contents: the id of the last section
 * whose top has scrolled past the activation line just under the fixed top
 * bar. Sections are read in the order given, which must match the page.
 */
export function useActiveSection(ids: MaybeRefOrGetter<string[]>, activationLine = 132) {
  const activeId = ref(toValue(ids)[0] ?? '')
  let frame: number | undefined

  function update() {
    frame = undefined
    const list = toValue(ids)
    let current = list[0] ?? ''

    for (const id of list) {
      const section = document.getElementById(id)
      if (!section) continue
      if (section.getBoundingClientRect().top <= activationLine) current = id
      else break
    }

    // The final section can be shorter than the viewport and never cross the
    // activation line. Treat reaching the document end as viewing that section.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = list.at(-1) ?? current
    }

    activeId.value = current
  }

  function schedule() {
    if (frame !== undefined) return
    frame = window.requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
  })

  return activeId
}
