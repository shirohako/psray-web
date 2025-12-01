export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore();
  const { isAdmin } = storeToRefs(userStore);

  if (!isAdmin.value) {
    return navigateTo('/');
  }
});
