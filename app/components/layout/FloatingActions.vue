<template>
  <SpeedDial
    class="z-50"
    :model="item3"
    direction="up"
    :style="{ position: 'fixed', right: '20px', bottom: '20px' }"
    :buttonProps="{ severity: 'info', rounded: true }"
    :tooltipOptions="{ position: 'right' }"
  >
    <template #item="{ item, toggleCallback }">
      <button
        @click="toggleCallback"
        v-tooltip.left="{ value: item.label, class: 'text-sm' }"
        class="w-10 h-10 rounded-full bg-zinc-200 hover:bg-opacity-80 bg-opacity-40 flex items-center justify-center"
      >
        <Icon :name="item.icon" class="text-2xl text-gray-500 hover:text-gray-800" />
      </button>
    </template>
  </SpeedDial>
</template>

<script setup>
import { computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const api = useApi();
const toast = useToast();
const userStore = useUserStore();
const { user, canCheckIn } = storeToRefs(userStore);

const item3 = computed(() => {
  const menu = [
    {
      label: '返回最上方',
      icon: 'material-symbols:arrow-circle-up-outline-rounded',
      command: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];
  if (canCheckIn.value) {
    menu.push({
      label: '每日签到',
      icon: 'hugeicons:bitcoin-piggy-bank',
      command: () => {
        api
          .post('/user/check-in')
          .then(res => {
            user.value.daily.earned = true;
            user.value.daily.next = res.data.next;

            toast.add({
              severity: 'success',
              summary: '签到成功',
              detail: '获得了1米拉',
              life: 3000,
            });
          })
          .catch(error => {
            let message = '抱歉出错了,清向管理员反馈。';
            if (error?.response?.data?.error?.message) {
              message = error.response.data.error.message;
            }
            if (error?.response?.data?.error?.code == 30016) {
              user.value.daily.earned = true;
              user.value.daily.next = Math.floor(Date.now() / 1000) + 86400;
            }
            toast.add({
              severity: 'error',
              summary: '发生了错误',
              detail: message,
              life: 3000,
            });
          });
      },
    });
  }
  return menu;
});
</script>
