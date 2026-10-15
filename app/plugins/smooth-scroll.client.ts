/**
 * Smooth scrolling (see `main.css`) is switched on only once the app has
 * hydrated. Before that the browser restores a reloaded page's scroll position
 * itself, and with smooth scrolling already on it would glide there from the
 * top instead of simply being there.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
    document.documentElement.dataset.scroll = 'smooth'
  })
})
