<template>
  <div class="w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-8">
    <div class="flex items-center mb-6 ml-1 font-bold text-2xl">
      <Icon name="ion:md-settings" class="mr-1" />
      <h2>我收藏的奖杯组</h2>
    </div>

    <div
      class="setting-alert flex gap-4 items-center my-5 py-5 px-8 rounded-md border border-yellow-400"
    >
      <img class="w-7" src="https://i.psray.net/i/2024/07/10/668e84ecd8ec9.png" />
      <p>
        <b>页面准备中</b>
      </p>
    </div>
  </div>
</template>

<script setup>
import { format, formatISO9075, fromUnixTime } from 'date-fns';

const api = useApi();
const toast = useToast();

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const interval = [
  { name: '禁用', value: 0 },
  { name: '1天', value: 1 },
  { name: '3天', value: 2 },
  { name: '7天', value: 3 },
  { name: '15天', value: 4 },
  { name: '30天', value: 5 },
];

const newInterval = ref(0);

const nextUpateTime = computed(() => {
  if (user.value.sync_next > 0) {
    return format(fromUnixTime(user.value.sync_next + 60), 'yyyy-MM-dd HH:mm');
  } else {
    return '已禁用';
  }
});

const calendar = computed({
  get() {
    return user.value.setting.calendar_updated_at > 0 ? true : false;
  },
  set(newValue) {
    user.value.setting.calendar_updated_at = newValue ? Date.now() : null;
  },
});

function toggleCalendar() {
  const toggle = calendar.value ? 1 : 0;
  api.post('user/setting/calendar', { calendar: toggle }).then(() => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: '修改成功',
      life: 3000,
    });
  });
}

function updateInterval() {
  api.post('user/setting/interval', { duration: newInterval.value }).then(response => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: '修改成功',
      life: 3000,
    });
    user.value.sync_interval = response.data.duration;
    user.value.sync_next = response.data.next;
  });
}
</script>

<style scoped>
.setting-alert {
  color: #7a4d05;
  background:
    linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.35) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.35) 50%,
        rgba(255, 255, 255, 0.35) 75%,
        transparent 75%
      )
      left / 20px 20px repeat,
    #fff3cd;
}
</style>
