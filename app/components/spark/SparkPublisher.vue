<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <div class="flex items-center space-x-3 mb-3">
      <img :src="user.avatarUrl" class="w-10 h-10 rounded-full border" alt="avatar" />
      <div class="flex-1">
        <h2 class="text-base font-semibold text-gray-700">分享你的想法</h2>
        <p class="text-xs text-gray-400" v-if="!isReply">最近发生了什么？</p>
        <p class="text-xs text-gray-400" v-else>回复这条动态</p>
      </div>
    </div>

    <Textarea
      v-model="sparkContent"
      autoResize
      rows="2"
      placeholder="想说些什么呢？"
      class="focus:ring-blue-500 w-full"
    />

    <!-- 下方工具条 -->
    <div class="mt-2 flex items-center justify-between">
      <div class="flex space-x-2 text-gray-400">
        <!-- 上传图片按钮示例 -->
        <button
          class="flex items-center justify-center hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-200"
          @click="selectFiles"
        >
          <Icon name="mdi:image" class="size-5" />
        </button>
      </div>

      <button
        class="bg-blue-500 text-white text-sm px-4 py-1.5 rounded-md hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
        @click="submitSpark"
        :disabled="submiting"
      >
        <span v-if="isReply">回复</span>
        <span v-else>发布</span>
      </button>
    </div>

    <!-- 隐藏的文件选择 input，最多选择 4 个 -->
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/*"
      multiple
      @change="handleFiles"
    />

    <!-- 图片上传 -->
    <SparkImages :images="images" @remove="removeImage" class="mt-5" />
  </div>
</template>

<script setup>
import SparkImages from './SparkImages';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const toast = useToast();
const api = useApi();
const route = useRoute();

const submiting = ref(false);
const sparkContent = ref('');

const isReply = ref(route.params.id > 0);

// 已选择的图片数组，每项包含 { file, previewUrl, status }
const images = ref([]);
const fileInput = ref(null);

function selectFiles() {
  if (images.value.length >= 4) {
    alert('最多只能上传4张图片');
    return;
  }
  fileInput.value.click();
}

/**
 * 处理选中的文件：
 *  1. 先过滤出不重复的文件（通过 name + size + lastModified 简单判断）。
 *  2. 再判断数量是否会超过4张。
 *  3. 对剩余文件生成预览URL并添加到 images。
 */
function handleFiles(e) {
  const selectedFiles = Array.from(e.target.files);

  // 1. 过滤出不重复的文件
  const filteredFiles = selectedFiles.filter(file => {
    const duplicate = images.value.some(item => {
      return (
        item.file.name === file.name &&
        item.file.size === file.size &&
        item.file.lastModified === file.lastModified
      );
    });
    if (duplicate) {
      return false;
    }
    return true;
  });

  // 2. 判断是否会超过 4 张
  if (images.value.length + filteredFiles.length > 4) {
    alert('最多只能上传4张图片');
    fileInput.value.value = '';
    return;
  }

  // 3. 添加到 images
  filteredFiles.forEach(file => {
    const previewUrl = URL.createObjectURL(file);
    images.value.push({ file, previewUrl, status: 'Pending' });
  });

  // 清空 <input>，以便后续可重复选择同一文件
  fileInput.value.value = '';
}

/**
 * 删除某个图片
 */
function removeImage(index) {
  images.value.splice(index, 1);
}

const props = defineProps({
  replyId: {
    type: [String, Number],
  },
});
const emit = defineEmits(['new-activity']);

async function submitSpark() {
  if (!sparkContent.value.trim() && images.value.length <= 0) {
    return;
  }

  try {
    submiting.value = true;
    const formData = new FormData();
    formData.append('content', sparkContent.value);
    images.value.forEach(item => {
      formData.append('images[]', item.file);
    });

    if (isReply.value) {
      // 回复动态
      formData.append('id', route.params.id);
      const response = await api.post('/spark/reply', formData);
    } else {
      // 新发布
      const response = await api.post('/spark/save', formData);
    }

    sparkContent.value = '';
    images.value = [];
    toast.add({
      severity: 'success',
      summary: '发布成功',
      detail: '您的动态/回复已经发布',
      life: 3000,
    });

    emit('new-activity');
    submiting.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '发布失败',
      detail: '如果问题无法解决请联系管理员',
      life: 8000,
    });
    console.log(error);
    submiting.value = false;
  }
}
</script>
