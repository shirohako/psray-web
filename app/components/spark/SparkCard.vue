<template>
  <div @click="router.push(`/spark/${finalSpark(spark).id}`)">
    <!-- 如果是转发 -->
    <div v-if="spark.originalSpark" class="mb-2 flex items-center space-x-2 text-xs text-gray-500">
      <span class="font-medium">{{ spark.user.psnid }} </span>
      <span>转发了动态</span>
    </div>

    <!-- 主体区 -->
    <div class="flex space-y-4 p-2 rounded-md flex-col">
      <!-- 头像和ID -->
      <div class="flex justify-between">
        <!-- 左侧 -->
        <div class="flex items-center space-x-2">
          <div @click.stop="router.push(`/p/${finalSpark(spark).user.psnid}`)">
            <img
              :src="finalSpark(spark).user.avatarUrl"
              class="size-9 rounded-full"
              @mouseenter="toggleUserCard"
              @mouseleave="toggleUserCard"
            />
          </div>

          <div @click.stop="router.push(`/p/${finalSpark(spark).user.psnid}`)">
            <span
              class="font-semibold text-gray-800 text-lg hover:underline"
              @mouseenter="toggleUserCard"
              @mouseleave="toggleUserCard"
            >
              {{ finalSpark(spark).user.psnid }}
            </span>
          </div>

          <ClientOnly>
            <span class="font-semibold text-gray-400 text-sm">
              {{ timeAgoShort(spark.created_at) }}
            </span>
          </ClientOnly>
        </div>
        <!-- 右侧 -->
        <button class="hover:bg-gray-100" @click.stop="toggleDeletePopover" v-if="isMyPost">
          <Icon name="material-symbols-light:more-vert" class="size-5" />
        </button>
      </div>

      <!-- 内容 -->
      <p class="text-gray-700 mt-1 whitespace-pre-wrap py-1">
        {{ finalSpark(spark).content }}
      </p>

      <!-- 图片区域 -->
      <ImageGrid :images="finalSpark(spark).images" />

      <!-- 发布时间 -->
      <div class="flex space-x-6 text-xs text-gray-500">
        <span class="font-semibold text-gray-400 text-sm">
          {{ formatTimestamp(spark.created_at) }}
        </span>
      </div>

      <!-- 操作区：回复、转发、点赞 -->
      <div class="flex space-x-6 text-xs text-gray-500">
        <!-- 评论按钮 -->
        <button class="inline-flex items-center space-x-1 hover:text-blue-500">
          <div
            class="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-blue-100"
          >
            <Icon name="mdi:message-reply-text-outline" class="size-5" />
          </div>
          <span>{{ finalSpark(spark).comment_count }}</span>
        </button>
        <!-- 转发按钮 -->
        <button
          v-if="spark.spark_type != 'reply'"
          @click.stop="toggleResharePopover"
          class="inline-flex items-center space-x-1 hover:text-green-500"
          :class="
            finalSpark(spark).has_reshared ? 'text-green-500' : 'hover:text-green-500 text-gray-500'
          "
        >
          <div
            class="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-green-100"
          >
            <Icon name="mdi:repeat" class="size-5" />
          </div>
          <span>{{ finalSpark(spark).reshare_count }}</span>
        </button>
        <!-- 喜欢按钮 -->
        <button
          class="inline-flex items-center space-x-1 hover:text-pink-500"
          @click.stop="toggleLike"
        >
          <div
            class="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-pink-100"
            :class="
              finalSpark(spark).has_liked ? 'text-pink-500' : 'text-gray-500  hover:text-pink-500'
            "
          >
            <Icon
              :name="
                finalSpark(spark).has_liked
                  ? 'material-symbols:favorite'
                  : 'material-symbols:favorite-outline'
              "
              class="size-5"
            />
          </div>
          <span>{{ finalSpark(spark).like_count }}</span>
        </button>
      </div>
    </div>

    <Popover ref="userCardPopover">
      <UserProfileCard :user="finalSpark(spark).user" />
    </Popover>
    <Popover ref="resharePopover">
      <div class="flex w-32">
        <button
          @click="onReShare"
          class="w-full text-center hover:bg-gray-100 p-2 rounded-md text-sm"
          v-if="!finalSpark(spark).has_reshared"
        >
          转发这条动态
        </button>
        <button
          @click="onUnReShare"
          class="w-full text-center hover:bg-gray-100 p-1 rounded-md text-sm"
          v-else
        >
          取消转发
        </button>
      </div>
    </Popover>
    <Popover ref="deletePopover">
      <div class="flex w-16">
        <button
          @click="onDelete"
          class="w-full text-center hover:bg-gray-100 p-1 rounded-md text-sm"
        >
          删除
        </button>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import ImageGrid from './ImageGrid.vue';

const { timeAgoShort, formatTimestamp } = useTime();

const api = useApi();
const router = useRouter();

const userStore = useUserStore();
const { authenticated, user } = storeToRefs(userStore);

const userCardPopover = ref();
const resharePopover = ref();
const deletePopover = ref();
const toast = useToast();

const props = defineProps({
  spark: {
    type: Object,
  },
});
const emit = defineEmits(['new-activity']);

// 简单的网格布局
function gridClass(count) {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  return 'grid-cols-2';
}

// 如果是转发，就显示 spark.originalSpark 的信息，否则就是 spark 自身
function finalSpark(spark) {
  return spark.originalSpark ? spark.originalSpark : spark;
}

const toggleUserCard = event => {
  event.preventDefault();
  event.stopPropagation();
  if (event.type == 'mouseleave') {
    userCardPopover.value.hide();
  } else {
    userCardPopover.value.show(event);
  }
};

const toggleResharePopover = event => {
  event.preventDefault();
  event.stopPropagation();
  resharePopover.value.toggle(event);
};

const isMyPost = computed(() => {
  if (authenticated.value && user.value.id == props.spark.user_id) {
    return true;
  }
  return false;
});

const toggleDeletePopover = event => {
  event.preventDefault();
  event.stopPropagation();
  deletePopover.value.toggle(event);
};

// 点赞按钮点击处理函数：如果已点赞则取消点赞，否则执行点赞
async function toggleLike(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!authenticated.value) {
    return router.push(`/auth/login`);
  }

  const _spark = finalSpark(props.spark);
  const action = _spark.has_liked ? 'unlike' : 'like';

  // 乐观更新：直接修改 spark 对象
  _spark.has_liked = !_spark.has_liked;
  _spark.like_count = _spark.has_liked ? _spark.like_count + 1 : _spark.like_count - 1;

  try {
    await api.post('/spark/like', {
      id: _spark.id,
      action: action,
    });
  } catch (error) {
    // 出错时回滚更新
    _spark.has_liked = !_spark.has_liked;
    _spark.like_count = _spark.has_liked ? _spark.like_count + 1 : _spark.like_count - 1;
    console.error('Toggle like failed:', error);
  }
}

async function onReShare(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!authenticated.value) {
    return router.push(`/auth/login`);
  }

  const _spark = finalSpark(props.spark);

  // 乐观更新：直接修改 spark 对象
  _spark.has_reshared = true;
  _spark.reshare_count++;

  try {
    await api.post('/spark/reshare', {
      id: _spark.id,
    });
  } catch (error) {
    // 出错时回滚更新
    _spark.has_reshared = false;
    _spark.reshare_count--;
    console.error(error);
  }
  resharePopover.value.hide();
}

async function onUnReShare(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!authenticated.value) {
    return router.push(`/auth/login`);
  }

  const _spark = finalSpark(props.spark);

  // 乐观更新：直接修改 spark 对象
  _spark.has_reshared = false;
  _spark.reshare_count--;

  try {
    await api.post('/spark/unreshare', {
      id: _spark.id,
    });
  } catch (error) {
    // 出错时回滚更新
    _spark.has_reshared = true;
    _spark.reshare_count++;
    console.error(error);
  }
  resharePopover.value.hide();
}

async function onDelete(e) {
  e.preventDefault();
  e.stopPropagation();

  const _spark = finalSpark(props.spark);

  try {
    await api.post('/spark/delete', {
      id: _spark.id,
    });
    toast.add({
      severity: 'success',
      summary: '删除成功',
      detail: '您的动态/回复已经移除',
      life: 3000,
    });
    emit('new-activity');
  } catch (error) {
    // 出错时回滚更新
    toast.add({
      severity: 'error',
      summary: '发布失败',
      detail: '如果问题无法解决请联系管理员',
      life: 8000,
    });
    console.error(error);
  }
  deletePopover.value.hide();
}
</script>
