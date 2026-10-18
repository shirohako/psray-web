/** One choice in a `<SelectMenu>`. */
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  /** Muted text at the row's right edge (a code, a count…). */
  hint?: string
}
