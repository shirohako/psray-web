<template>
  <div v-if="editor" class="isaki-editor">
    <div class="isaki-editor-toolbar editor-control-group">
      <div class="flex flex-wrap gap-3">
        <!-- 加粗 -->
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
        >
          <Icon name="material-symbols:format-bold" class="text-xl" />
        </button>
        <!-- 斜体 -->
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
        >
          <Icon name="material-symbols:format-italic" class="text-xl" />
        </button>
        <!-- 下划线 -->
        <button
          @click="editor.chain().focus().toggleUnderline().run()"
          :disabled="!editor.can().chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor.isActive('underline') }"
        >
          <Icon name="material-symbols:format-underlined" class="text-xl" />
        </button>
        <!-- 删除线 -->
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :disabled="!editor.can().chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
        >
          <Icon name="material-symbols:strikethrough-s" class="text-xl" />
        </button>
        <!-- 代码 -->
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :disabled="!editor.can().chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
        >
          <Icon name="mdi:code-tags" class="text-xl" />
        </button>
        <!-- 链接 -->
        <button
          @click="editLink"
          :disabled="editor.state.selection.empty"
          :class="{ 'is-active': editor.isActive('link') }"
        >
          <Icon name="ph:link-bold" class="text-xl" />
        </button>
        <!-- 文字颜色 -->
        <button @click="textColor">
          <Icon name="material-symbols:format-color-text" class="text-xl" />
        </button>
        <!-- 高亮 -->
        <button @click="highlight">
          <Icon name="material-symbols:format-ink-highlighter" class="text-xl" />
        </button>
        <!-- 清除 -->
        <button @click="editor.chain().focus().unsetAllMarks().run()">
          <Icon name="solar:eraser-broken" class="text-xl" />
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          @click="editor.chain().focus().setParagraph().run()"
          :class="{ 'is-active': editor.isActive('paragraph') }"
        >
          <Icon name="mdi:format-paragraph" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        >
          <Icon name="gravity-ui:heading-2" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        >
          <Icon name="gravity-ui:heading-3" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 4 }) }"
        >
          <Icon name="gravity-ui:heading-4" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 5 }) }"
        >
          <Icon name="gravity-ui:heading-5" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
        >
          <Icon name="ic:round-format-list-bulleted" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
        >
          <Icon name="ic:baseline-format-list-numbered" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
        >
          <Icon name="ci:window-code-block" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
        >
          <Icon name="ic:baseline-format-quote" class="text-xl" />
        </button>
        <!-- 图片 -->
        <button @click="image">
          <Icon name="ic:outline-add-photo-alternate" class="text-xl" />
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().chain().focus().undo().run()"
        >
          <Icon name="material-symbols:undo" class="text-xl" />
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().chain().focus().redo().run()"
        >
          <Icon name="material-symbols:redo" class="text-xl" />
        </button>
      </div>
    </div>
    <editor-content :editor="editor" class="isaki-editor-conent pb-5" />
    <!-- 编辑链接对话框 -->
    <Dialog v-model:visible="linkDialogVisible" header="编辑链接" :style="{ width: '30rem' }">
      <div class="flex items-center gap-4 mb-4">
        <label for="username" class="font-semibold w-24">链接URL:</label>
        <InputText class="flex-auto" autocomplete="off" v-model="newLinkUrl" />
      </div>
      <span class="text-surface-500 dark:text-surface-400 block my-2 text-sm"
        >想要移除链接时，URL留空即可</span
      >
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="linkDialogVisible = false"
        ></Button>
        <Button type="button" label="Save" @click="addLink"></Button>
      </div>
    </Dialog>
    <!-- 编辑图片对话框 -->
    <Dialog v-model:visible="imageDialogVisible" header="插入图片" :style="{ width: '30rem' }">
      <div class="flex items-center gap-4 mb-4">
        <label class="font-semibold w-24">图片URL:</label>
        <InputText class="flex-auto" autocomplete="off" v-model="imageLinkUrl" />
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label class="font-semibold w-24">宽度(px):</label>
        <InputText class="flex-auto" autocomplete="off" v-model="imageWidth" />
      </div>
      <span class="text-surface-500 dark:text-surface-400 block my-2 text-sm">
        如果需要上传图片，可以在
        <a href="https://i.abyss.moe" target="_blank">https://i.abyss.moe</a>上传
      </span>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="imageDialogVisible = false"
        ></Button>
        <Button type="button" label="Save" @click="insertImage"></Button>
      </div>
    </Dialog>
    <Popover ref="textColorPopover">
      <div class="flex flex-wrap gap-4 w-[25rem]">
        <div
          class="w-4 h-4 border flex items-center justify-center rounded-full cursor-pointer"
          @click="unsetTextColor()"
        >
          <Icon name="ic:baseline-clear" class="text-lg" />
        </div>
        <div
          class="w-4 h-4 bg-red-500 rounded-full cursor-pointer"
          @click="setTextColor('#CC3333')"
        ></div>
        <div
          class="w-4 h-4 bg-orange-500 rounded-full cursor-pointer"
          @click="setTextColor('#F97316')"
        ></div>
        <div
          class="w-4 h-4 bg-amber-500 rounded-full cursor-pointer"
          @click="setTextColor('#F59E0B')"
        ></div>
        <div
          class="w-4 h-4 bg-yellow-500 rounded-full cursor-pointer"
          @click="setTextColor('#EAB308')"
        ></div>
        <div
          class="w-4 h-4 bg-lime-500 rounded-full cursor-pointer"
          @click="setTextColor('#84CC16')"
        ></div>
        <div
          class="w-4 h-4 bg-green-500 rounded-full cursor-pointer"
          @click="setTextColor('#22C55E')"
        ></div>
        <div
          class="w-4 h-4 bg-emerald-500 rounded-full cursor-pointer"
          @click="setTextColor('#10B981')"
        ></div>
        <div
          class="w-4 h-4 bg-teal-500 rounded-full cursor-pointer"
          @click="setTextColor('#14B8A6')"
        ></div>
        <div
          class="w-4 h-4 bg-cyan-500 rounded-full cursor-pointer"
          @click="setTextColor('#06B6D4')"
        ></div>
        <div
          class="w-4 h-4 bg-sky-500 rounded-full cursor-pointer"
          @click="setTextColor('#0EA5E9')"
        ></div>
        <div
          class="w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
          @click="setTextColor('#3B82F6')"
        ></div>
        <div
          class="w-4 h-4 bg-indigo-500 rounded-full cursor-pointer"
          @click="setTextColor('#6366F1')"
        ></div>
        <div
          class="w-4 h-4 bg-violet-500 rounded-full cursor-pointer"
          @click="setTextColor('#8B5CF6')"
        ></div>
        <div
          class="w-4 h-4 bg-purple-500 rounded-full cursor-pointer"
          @click="setTextColor('#A855F7')"
        ></div>
        <div
          class="w-4 h-4 bg-fuchsia-500 rounded-full cursor-pointer"
          @click="setTextColor('#D946EF')"
        ></div>
        <div
          class="w-4 h-4 bg-pink-500 rounded-full cursor-pointer"
          @click="setTextColor('#EC4899')"
        ></div>
        <div
          class="w-4 h-4 bg-rose-500 rounded-full cursor-pointer"
          @click="setTextColor('#F43F5E')"
        ></div>
      </div>
    </Popover>
    <Popover ref="highlightPopover">
      <div class="flex flex-wrap gap-4 w-[25rem]">
        <div
          class="w-4 h-4 border flex items-center justify-center rounded-full cursor-pointer"
          @click="unsetHighlight()"
        >
          <Icon name="ic:baseline-clear" class="text-lg" />
        </div>
        <div
          class="w-4 h-4 bg-red-100 rounded-full cursor-pointer"
          @click="setHighlight('#fee2e2')"
        ></div>
        <div
          class="w-4 h-4 bg-orange-100 rounded-full cursor-pointer"
          @click="setHighlight('#ffedd5')"
        ></div>
        <div
          class="w-4 h-4 bg-amber-100 rounded-full cursor-pointer"
          @click="setHighlight('#fef3c7')"
        ></div>
        <div
          class="w-4 h-4 bg-yellow-100 rounded-full cursor-pointer"
          @click="setHighlight('#fef9c3')"
        ></div>
        <div
          class="w-4 h-4 bg-lime-100 rounded-full cursor-pointer"
          @click="setHighlight('#ecfccb')"
        ></div>
        <div
          class="w-4 h-4 bg-green-100 rounded-full cursor-pointer"
          @click="setHighlight('#dcfce7')"
        ></div>
        <div
          class="w-4 h-4 bg-emerald-100 rounded-full cursor-pointer"
          @click="setHighlight('#d1fae5')"
        ></div>
        <div
          class="w-4 h-4 bg-teal-100 rounded-full cursor-pointer"
          @click="setHighlight('#ccfbf1')"
        ></div>
        <div
          class="w-4 h-4 bg-cyan-100 rounded-full cursor-pointer"
          @click="setHighlight('#cffafe')"
        ></div>
        <div
          class="w-4 h-4 bg-sky-100 rounded-full cursor-pointer"
          @click="setHighlight('#e0f2fe')"
        ></div>
        <div
          class="w-4 h-4 bg-blue-100 rounded-full cursor-pointer"
          @click="setHighlight('#dbeafe')"
        ></div>
        <div
          class="w-4 h-4 bg-indigo-100 rounded-full cursor-pointer"
          @click="setHighlight('#e0e7ff')"
        ></div>
        <div
          class="w-4 h-4 bg-violet-100 rounded-full cursor-pointer"
          @click="setHighlight('#ede9fe')"
        ></div>
        <div
          class="w-4 h-4 bg-purple-100 rounded-full cursor-pointer"
          @click="setHighlight('#f3e8ff')"
        ></div>
        <div
          class="w-4 h-4 bg-fuchsia-100 rounded-full cursor-pointer"
          @click="setHighlight('#fae8ff')"
        ></div>
        <div
          class="w-4 h-4 bg-pink-100 rounded-full cursor-pointer"
          @click="setHighlight('#fce7f3')"
        ></div>
        <div
          class="w-4 h-4 bg-rose-100 rounded-full cursor-pointer"
          @click="setHighlight('#ffe4e6')"
        ></div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { ExtendedImage } from '@/config/tiptap-extension/image/index.js';

const linkDialogVisible = ref(false);
const imageDialogVisible = ref(false);
const newLinkUrl = ref('');
const imageLinkUrl = ref('');
const imageWidth = ref('');

const textColorPopover = ref();
const highlightPopover = ref();

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    ExtendedImage,
  ],
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose-base lg:prose-lg p-5 pb-3 focus:outline-none min-h-64 max-w-full',
    },
  },
  content: props.modelValue,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
});

// 弹出编辑链接菜单
function editLink() {
  if (editor.value.isActive('link')) {
    newLinkUrl.value = editor.value.getAttributes('link').href;
  }
  linkDialogVisible.value = true;
}

// 确定编辑链接
function addLink() {
  if (newLinkUrl.value == '') {
    editor.value.commands.unsetLink();
  } else {
    editor.value.commands.setLink({
      href: newLinkUrl.value,
      target: '_blank',
    });
  }
  linkDialogVisible.value = false;
  newLinkUrl.value = '';
}

function textColor(event) {
  textColorPopover.value.toggle(event);
}

function setTextColor(color) {
  editor.value.commands.setColor(color);
}

function highlight(event) {
  highlightPopover.value.toggle(event);
}

function setHighlight(color) {
  editor.value.commands.setHighlight({ color });
}

function unsetHighlight() {
  editor.value.commands.unsetHighlight();
}

function unsetTextColor() {
  editor.value.commands.unsetColor();
}

function image() {
  imageDialogVisible.value = true;
}

function insertImage() {
  if (imageLinkUrl.value) {
    editor.value.commands.setImage({
      src: 'https://i.psray.net/i/2024/04/21/6624dd2e9a5c4.jpg',
      width: `${imageWidth.value}px`,
    });
  }
  imageDialogVisible.value = false;
  imageLinkUrl.value = '';
  imageWidth.value = false;
}
</script>
<style>
@import url('~/assets/css/editor.css');
</style>
