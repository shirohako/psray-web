import { defineStore } from 'pinia';

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref(null);
    const user = ref({});
    const authenticated = computed(() => Boolean(token.value));
    const isAdmin = computed(() => authenticated.value && user.value?.administrator > 0);
    const canCheckIn = computed(() => {
      if (authenticated.value) {
        const next = user.value?.daily?.next;
        const isNextDay = next && Math.floor(Date.now() / 1000) > next;
        const earned = user.value?.daily?.earned;
        if (isNextDay || !earned) {
          return true;
        }
      }
      return false;
    });
    // 登录
    async function signIn(psnid, password) {
      const api = useApi();
      try {
        const { data: result } = await api.post('auth/login', {
          loginId: psnid,
          passwd: password,
        });
        if (Object.prototype.hasOwnProperty.call(result, 'success') && result.success) {
          // 登录成功
          token.value = result.token;
          return true;
        }
      } catch (error) {
        let errorMessage = '出现未知错误，请向管理员反馈';
        if (
          Object.prototype.hasOwnProperty.call(error, 'response') &&
          error.response.status === 400
        ) {
          // 用户提交的内容错误
          errorMessage = error.response.data.error.message;
        }
        return { success: false, errorMessage };
      }
    }
    // 注销登录
    async function signOut() {
      if (authenticated.value) {
        const api = useApi();
        api.get('user/logout');
      }

      token.value = null;
      user.value = {};
    }
    // 获取用户信息
    async function refreshUserInfo() {
      const api = useApi();
      try {
        const reuslt = await api.get('user/me');
        user.value = reuslt.data;
      } catch (error) {
        signOut();
      }
    }
    return {
      token,
      user,
      authenticated,
      isAdmin,
      canCheckIn,
      signIn,
      signOut,
      refreshUserInfo,
    };
  },
  {
    persist: true,
  },
);
