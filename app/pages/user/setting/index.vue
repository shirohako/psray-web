<template>
  <div>
    <!-- 设置中心功能不全提示 -->
    <div
      class="setting-alert flex gap-4 items-center my-5 py-5 px-8 rounded-md border border-yellow-400"
    >
      <img class="w-7" src="https://i.psray.net/i/2024/07/10/668e84ecd8ec9.png" />
      <p>
        <b>{{ $t('setting.warning_text') }}</b>
      </p>
    </div>
    <div class="flex flex-col mt-2 px-2 gap-2 divide-y">
      <!-- 日历图开关 -->
      <div class="flex py-3">
        <p class="font-bold mr-5">
          {{ $t('setting.profile.calendar.is_enabled') }}
        </p>
        <ToggleSwitch v-model="calendar" @update:modelValue="toggleCalendar" />
      </div>
      <!-- 自动更新开关 -->
      <div class="flex flex-col py-3 gap-2">
        <p class="font-bold mr-5">{{ $t('setting.profile.sync.interval') }}</p>
        <p>
          {{
            $t('setting.profile.sync.description', {
              interval: user.sync_interval,
            })
          }}
        </p>
        <p>
          {{ $t('setting.profile.sync.next_update') }}：
          {{ nextUpateTime }}
        </p>
        <div class="flex items-center gap-2">
          <span> {{ $t('setting.profile.sync.change') }}：</span>
          <Select
            v-model="newInterval"
            :options="interval"
            optionLabel="name"
            optionValue="value"
            placeholder="请选择时间"
            checkmark
            :highlightOnSelect="false"
            class="w-40 text-sm"
          />
          <button
            class="bg-blue-500 text-white text-sm px-3 py-2 rounded-md"
            @click="updateInterval"
          >
            {{ $t('setting.profile.sync.button') }}
          </button>
        </div>
      </div>
      <!-- 关联社交平台 -->
      <div class="flex flex-col py-3 gap-2">
        <p class="font-bold mr-5">
          {{ $t('setting.profile.linked_account.name') }}
        </p>
        <div class="text-xs text-gray-600">
          <p>{{ $t('setting.profile.linked_account.description_1') }}</p>
          <p>{{ $t('setting.profile.linked_account.description_2') }}</p>
          <p>{{ $t('setting.profile.linked_account.description_3') }}</p>
        </div>
        <div class="flex flex-col gap-2 ml-2 mt-3">
          <div class="flex items-center gap-2">
            <img class="size-6" src="https://i.psray.net/i/2023/09/06/64f756118b73e.png" />
            <span>Steam</span>
            <InputText type="text" class="text-xs" v-model="socialAccount.steam" />
          </div>
          <div class="flex flex-col text-xs text-gray-500 gap-2">
            <span
              >{{
                $t('setting.profile.linked_account.custom_id_example')
              }}：https://steamcommunity.com/id/<b class="text-red-500">utaware</b></span
            >
            <span>
              {{
                $t('setting.profile.linked_account.steam_64bit_example')
              }}：https://steamcommunity.com/profiles/<b class="text-red-500">76561198356624527</b>
            </span>
            <span>{{ $t('setting.profile.linked_account.red_text_only') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <img class="size-6" src="https://i.psray.net/i/2023/09/06/64f757bd6abd5.png" />
            <span>Xbox</span>
            <InputText type="text" class="text-xs" v-model="socialAccount.xbox" />
          </div>
          <div class="flex flex-col text-xs text-gray-500 gap-2">
            <span
              >{{
                $t('setting.profile.linked_account.xbox_id_example')
              }}：https://www.xbox.com/en-US/play/user/<b class="text-red-500">abyssmoe</b>
            </span>
            <span>{{ $t('setting.profile.linked_account.red_text_only') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <img class="size-6" src="https://i.psray.net/i/2023/09/06/64f757fb1f750.png" />
            <span>NS</span>
            <InputText type="text" class="text-xs" v-model="socialAccount.ns" />
          </div>
          <div class="flex flex-col text-xs text-gray-500 gap-2">
            <span
              >{{ $t('setting.profile.linked_account.ns_example') }}：<b class="text-red-500"
                >SW-XXXX-XXXX-XXXX</b
              ></span
            >
          </div>
          <div>
            <button
              class="bg-blue-500 text-white text-sm px-4 py-1.5 rounded-md mt-1"
              @click="updateSocialAccount"
            >
              {{ $t('setting.profile.linked_account.button') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const { t } = useI18n();
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
const socialAccount = ref({});

const nextUpateTime = computed(() => {
  if (user.value.sync_next > 0) {
    return format(fromUnixTime(user.value.sync_next + 60), 'yyyy-MM-dd HH:mm');
  } else {
    return t('setting.profile.sync.disabled');
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

function updateSocialAccount() {
  const { steam, ns, xbox } = socialAccount.value;

  api.post('user/setting/social-account', { steam, ns, xbox }).then(response => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: '修改成功',
      life: 3000,
    });
    user.value.social_account = socialAccount.value;
  });
}

const { data, error, refresh } = await useAsyncData('setting', fetchSetting);
async function fetchSetting() {
  const res = await api.get(`/user/me`);
  return res.data;
}

if (data.value.setting.social_account) {
  socialAccount.value = data.value.setting.social_account;
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
