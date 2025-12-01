export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore();
  const { authenticated } = storeToRefs(userStore);

  if (authenticated.value) {
    return navigateTo('/');
  }
});
