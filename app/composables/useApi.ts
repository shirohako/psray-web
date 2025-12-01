import axios from 'axios';

export const useApi = () => {
  const { apiBaseUrl } = useRuntimeConfig().public;
  const userStore = useUserStore();
  const { token } = storeToRefs(userStore);

  const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      Authorization: token.value,
      Accept: 'application/application/json',
    },
  });

  return api;
};
