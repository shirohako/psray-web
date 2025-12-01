<template>
  <div class="mr-3">
    <button
      @click="toggle"
      severity="secondary"
      class="w-10 h-10 p-2 bg-gray-100 rounded-full hover:bg-slate-200"
      rounded
    >
      <Icon name="carbon:ibm-watson-language-translator" class="text-2xl" />
    </button>
    <Menu ref="menu" :model="langItems" :popup="true" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const $i18n = useI18n();
const toast = useToast();
const menu = ref();

const langItems = ref([
  {
    label: 'English',
    command: () => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Switched to English.
        The English translations on PSRay are incomplete.`,
        life: 8000,
      });
      $i18n.setLocale('en');
    },
  },
  {
    label: '简体中文',
    command: () => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `已切换到简体中文。
        现阶段翻译尚未全部完成`,
        life: 8000,
      });
      $i18n.setLocale('zh-Hans');
    },
  },
  {
    label: '繁體中文',
    command: () => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `已切換到繁體中文。
        PSRay的繁體中文翻譯可能不全`,
        life: 8000,
      });
      $i18n.setLocale('zh-Hant');
    },
  },
  {
    label: '日本語',
    command: () => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `日本語に切り替えました。
        今すべてのテキストが日本語に翻訳していません。`,
        life: 8000,
      });
      $i18n.setLocale('ja');
    },
  },
  {
    label: '한국어',
    command: () => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `한국어로 변경되었습니다.
        이 웹사이트의 한국어 번역은 완벽하지 않습니다.`,
        life: 8000,
      });
      $i18n.setLocale('ko');
    },
  },
]);

const toggle = event => {
  menu.value.toggle(event);
};
</script>
