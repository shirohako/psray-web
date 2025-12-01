<template>
  <li class="p-4 border mb-5" v-if="!deleted">
    <div class="flex flex-wrap items-center mb-2">
      <!-- 状态图标 -->
      <span class="relative inline-flex align-middle h-3 w-3 mr-2">
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          :class="statusList[accepted]['color']"
        ></span>
        <span
          class="relative inline-flex rounded-full h-3 w-3"
          :class="statusList[accepted]['color']"
        ></span>
      </span>

      <!-- 状态Text -->
      <span class="mr-2">{{ statusList[accepted]['text'] }}</span>
      <!-- 提交ID -->
      <span> #{{ id }}</span>
      <!-- 审核管理员 -->
      <span v-if="auditUser" class="text-sm pl-2 text-gray-600 flex items-center">
        (管理员
        <img :src="auditUser.avatarUrl" class="inline-block w-7 h-7 rounded-full mx-1" />
        {{ auditUser.psnid }} 通过)
      </span>
    </div>
    <p>
      提交时间：
      {{ format(fromUnixTime(updated_at), 'yyyy-MM-dd HH:mm:ss') }}
    </p>
    <p class="flex items-center mt-1">
      提交用户：<img :src="submitUser.avatarUrl" class="inline-block w-7 h-7 rounded-full mx-1" />{{
        submitUser.psnid
      }}
    </p>
    <p class="flex items-center mt-2" v-if="accepted == 1">
      获得奖励：<img
        src="https://i.psray.net/i/2024/08/02/66ac21691a054.png"
        class="inline-block w-6 h-6 rounded-full mx-1"
      />x {{ reward }}
    </p>
    <hr class="my-2" />
    <p>操作名：{{ actionList[action]['text'] }}</p>
    <p>对象：奖杯组 (#{{ resource_id }})</p>
    <hr class="my-2" />
    <p>修改前：</p>
    <pre class="p-2 bg-slate-200 rounded-sm text-base font-mono text-wrap">{{ old_value }}</pre>
    <p>修改后：</p>
    <pre class="p-2 bg-slate-200 rounded-sm text-base font-mono text-wrap">{{ new_value }}</pre>
    <div v-if="meta">
      <p>元数据:</p>
      <pre class="p-2 bg-slate-200 rounded-sm text-base font-mono text-wrap">{{ meta }}</pre>
    </div>
    <hr class="my-3" />
    <!-- 游戏关联功能按钮列表 -->
    <div class="mt-3 flex gap-2">
      <button
        class="bg-sky-500 text-white hover:bg-sky-600 px-2 py-1.5 rounded-md text-sm"
        v-if="action == 'trophies-relation'"
        @click="openIGDB(meta)"
      >
        打开IGDB页面
      </button>
      <button
        class="bg-indigo-500 text-white hover:bg-indigo-600 px-2 py-1.5 rounded-md text-sm"
        v-if="resource == 'trophies'"
        @click="openTrophSet(resource_id)"
      >
        打开奖杯页
      </button>
      <button
        class="bg-red-500 text-white hover:red-sky-600 px-2 py-1.5 rounded-md text-sm"
        @click="confirmRevoke($event, id)"
        v-if="canBeRevoked"
      >
        撤销提交
      </button>
    </div>
    <!-- 管理按钮 -->
    <transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="transform opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="transform opacity-0"
    >
      <div class="mt-3 flex gap-2 border-t pt-3" v-if="isAdmin && accepted == 0">
        <button
          class="bg-green-500 text-white hover:bg-green-600 px-2 py-1.5 rounded-md text-sm flex gap-1 items-center"
          @click="approve(1)"
        >
          <Icon name="material-symbols:check-circle-outline" />
          通过修改请求
        </button>
        <button
          class="bg-pink-500 text-white hover:bg-pink-600 px-2 py-1.5 rounded-md text-sm flex gap-1 items-center"
          @click="approve(-1)"
        >
          <Icon name="mdi:close-circle-outline" />
          拒绝
        </button>
      </div>
    </transition>
  </li>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';
const { getGameIgdbLink } = useGame();
const deleted = ref(false);
const userStore = useUserStore();
const { user, isAdmin } = storeToRefs(userStore);
const route = useRoute();
const router = useRouter();
const api = useApi();
const toast = useToast();
const confirm = useConfirm();
const emit = defineEmits(['changeStatus']);
const canBeRevoked = computed(() => {
  return props.accepted != 1 && user.value.id == props.submitUser.id;
});

const confirmRevoke = (event, requestId) => {
  confirm.require({
    target: event.currentTarget,
    message: '确认要删除这个提交吗？这个操作不可以复原',
    rejectProps: {
      label: '取消',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '确认删除',
      severity: 'danger',
    },
    accept: () => {
      revokeRequest(requestId);
    },
  });
};

const props = defineProps({
  id: [String, Number],
  action: String,
  resource: String,
  resource_id: [String, Number],
  new_value: String,
  old_value: String,
  accepted: [String, Number],
  reward: [String, Number],
  created_at: [String, Number],
  updated_at: [String, Number],
  meta: String,
  submitUser: Object,
  auditUser: Object,
});

const statusList = {
  0: {
    text: '审核中',
    color: 'bg-gray-500',
  },
  '-1': {
    text: '被拒绝',
    color: 'bg-red-500',
  },
  1: {
    text: '已通过',
    color: 'bg-green-500',
  },
};

const actionList = {
  'trophies-relation': {
    text: '更改奖杯组和游戏的关联',
  },
  'trophies-region': {
    text: '更改奖杯组地区标识',
  },
};

function openIGDB(meta) {
  meta = JSON.parse(meta);
  window.open(getGameIgdbLink(meta.igdb_slug));
}

function openTrophSet(id) {
  const path = router.resolve({ name: 'trophies-detail', params: { id } });
  window.open(path.fullPath);
}

function revokeRequest(requestId) {
  api
    .post('/user/contributions/revoke', {
      requestId,
    })
    .then(res => {
      toast.add({
        severity: 'success',
        summary: '成功',
        detail: '已成销该请求',
        life: 3000,
      });
      deleted.value = true;
    })
    .catch(e => {
      let message = '出错了，请联系管理员';
      if (e?.response?.data?.error?.message) {
        message = e?.response?.data?.error?.message;
      }
      toast.add({
        severity: 'error',
        summary: '发生了错误',
        detail: message,
        life: 3000,
      });
    });
}

function approve(status) {
  api
    .post('/admin/contributions/approve', {
      id: props.id,
      status,
    })
    .then(res => {
      toast.add({
        severity: 'success',
        summary: '成功',
        detail: '该请求已处理',
        life: 3000,
      });
      emit('changeStatus', { status, reward: res.data?.reward || 0 });
    })
    .catch(e => {
      let message = '出错了，请联系管理员';
      if (e?.response?.data?.error?.message) {
        message = e?.response?.data?.error?.message;
      }
      toast.add({
        severity: 'error',
        summary: '发生了错误',
        detail: message,
        life: 3000,
      });
    });
}
</script>
