<template>
  <Dialog v-model:visible="visible" modal class="w-[720px]">
    <template #header>
      <div class="inline-flex items-center justify-center gap-2">
        <span class="font-bold whitespace-nowrap">发布我的游戏评价</span>
      </div>
    </template>
    <div>
      <span class="text-surface-500 dark:text-surface-400 block mb-3">
        1.你会把这个游戏推荐给别人吗？ (必选)
      </span>
      <div class="flex gap-3 items-center">
        <div class="toggle checkcross">
          <input id="checkcross" type="checkbox" v-model="is_recommended" />
          <label class="toggle-item" for="checkcross">
            <div class="check"></div>
          </label>
        </div>
        <span class="font-bold text-lg">{{ !is_recommended ? '推荐' : '不推荐' }}</span>
      </div>
    </div>
    <div class="mt-3">
      <span class="text-surface-500 dark:text-surface-400 block mb-3">
        2.你会给这个游戏几分？ (非必选)
      </span>
      <div class="flex gap-3">
        <Rating v-model="score" :stars="10" />
        <span class="font-bold text-lg">{{ score }}</span>
      </div>
    </div>

    <div class="mt-5">
      <span class="text-surface-500 dark:text-surface-400 block mb-3"> 3.评价 (必填) </span>
      <Textarea class="w-full min-h-12" v-model="comment" />
    </div>

    <div class="mt-3">
      <span class="text-surface-500 dark:text-surface-400 block mb-3">
        4.选择您写评价使用的语言 (必选)
      </span>
      <div class="flex gap-3">
        <Select
          v-model="language"
          :options="LANGUAGES"
          optionLabel="label"
          optionValue="code"
          class="w-full md:w-56"
        ></Select>
      </div>
    </div>

    <div class="mt-3">
      <span class="text-surface-500 dark:text-surface-400 block mb-3">
        5.选择您游玩平台 *(非必选)
      </span>
      <div class="flex gap-3">
        <Select
          v-model="platforms"
          :options="GAME_PLATFORMS"
          optionLabel="label"
          optionValue="code"
          class="w-full md:w-56"
        ></Select>
      </div>
    </div>

    <div class="mt-5">
      <p class="text-gray-500 text-sm">
        系统会自动记录评价时候您的【游戏进度，游戏时间】等数据，以供更多人参考
      </p>
    </div>

    <template #footer>
      <Button text @click="visible = false"> 取消 </Button>
      <Button
        severity="contrast"
        @click="postMyReview"
        :disabled="loading"
        class="flex items-center space-x-2"
      >
        <Icon name="line-md:loading-loop" v-if="loading" />
        发布
      </Button>
    </template>
  </Dialog>
</template>

<script setup>
import { LANGUAGES, GAME_PLATFORMS } from '~/constants/site';
const route = useRoute();

const visible = useState('review-dialog');
const comment = ref('');
const game_id = route.params.id;
const language = ref(false);
const is_recommended = ref(false);
const platforms = ref(null);
const score = ref(null);
const api = useApi();

const loading = ref(false);
const toast = useToast();

function isFormValid() {
  if (!comment.value) {
    return false;
  }

  if (!language.value) {
    return false;
  }
  return true;
}

function postMyReview() {
  if (!isFormValid()) {
    return false;
  }

  api
    .post('/review/save', {
      game_id,
      comment: comment.value,
      language: language.value,
      is_recommended: is_recommended.value ? 0 : 1,
      score: score.value,
    })
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '发布成功',
        life: 3000,
      });
      visible.value = false;
    })
    .catch(error => {
      toast.add({
        severity: 'error',
        summary: 'error',
        detail: '发布失败',
        life: 3000,
      });
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<style scoped>
*:before,
*:after {
  content: '';
  position: absolute;
}

input {
  height: 40px;
  left: 0;
  opacity: 0;
  position: absolute;
  top: 0;
  width: 40px;
}

.toggle-wrapper {
  flex: 1 1 calc(100% / 3);
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

label.toggle-item {
  width: 7em;
  background: #efebeb;
  height: 3em;
  display: inline-block;
  border-radius: 50px;
  position: relative;
  transition: all 0.3s ease;
  transform-origin: 20% center;
  cursor: pointer;
}
label.toggle-item:before {
  display: block;
  transition: all 0.2s ease;
  width: 2.3em;
  height: 2.3em;
  top: 0.25em;
  left: 0.25em;
  border-radius: 2em;
  border: 2px solid #88cf8f;
  transition: 0.3s ease;
}

.checkcross label:before {
  content: none;
}
.checkcross .check {
  border-radius: 50%;
  width: 2.5em;
  height: 2.5em;
  position: absolute;
  background: #8bc34a;
  transition: 0.4s ease;
  top: 4.5px;
  left: 4.5px;
}
.checkcross .check:before,
.checkcross .check:after {
  height: 4px;
  border-radius: 10px;
  background: #fff;
  transition: 0.4s ease;
}
.checkcross .check:before {
  width: 25px;
  transform: rotate(-45deg) translate(-6px, 20px);
}
.checkcross .check:after {
  width: 10px;
  transform: rotate(45deg) translate(20px, 11px);
}

#checkcross:checked + label .check {
  left: 68px;
  transform: rotate(360deg);
  background: #c34a4a;
}
#checkcross:checked + label .check:before {
  width: 27px;
  transform: rotate(-45deg) translate(-8px, 18px);
}
#checkcross:checked + label .check:after {
  width: 27px;
  transform: rotate(45deg) translate(18px, 8px);
}
</style>
