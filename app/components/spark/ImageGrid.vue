<template>
  <!-- 如果有图片才渲染 -->
  <div v-if="images && images.length > 0">
    <!-- 1 张图：自由宽高比 -->
    <div v-if="images.length === 1" class="w-full">
      <!-- 只需要让图片宽度充满容器，高度随原图比例自适应 -->

      <Image alt="Image" preview @click.stop="" class="w-full">
        <template #previewicon>
          <i class="pi pi-search"></i>
        </template>
        <template #image>
          <img
            :src="getThumbnailImage(images[0].image_url, '900')"
            class="w-full h-auto object-contain"
          />
        </template>
        <template #original="slotProps">
          <img :src="images[0].image_url" alt="preview" :style="slotProps.style" />
        </template>
      </Image>
    </div>

    <!-- 2 张图：一行两列，16:9 -->
    <div v-else-if="images.length === 2" class="grid grid-cols-2 gap-2">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="relative w-full aspect-video overflow-hidden flex items-center"
      >
        <Image alt="Image" preview @click.stop="" class="w-full">
          <template #previewicon>
            <i class="pi pi-search"></i>
          </template>
          <template #image>
            <img
              :src="getThumbnailImage(img.image_url, '220')"
              class="w-full h-full object-cover object-center"
            />
          </template>
          <template #original="slotProps">
            <img :src="img.image_url" alt="preview" :style="slotProps.style" />
          </template>
        </Image>
      </div>
    </div>

    <!-- 3 张图：一行三列，16:9 -->
    <div v-else-if="images.length === 3" class="grid grid-cols-3 gap-2">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="relative w-full aspect-video overflow-hidden flex items-center"
      >
        <Image alt="Image" preview @click.stop="" class="w-full">
          <template #previewicon>
            <i class="pi pi-search"></i>
          </template>
          <template #image>
            <img
              :src="getThumbnailImage(img.image_url, '220')"
              class="w-full h-full object-cover object-center"
            />
          </template>
          <template #original="slotProps">
            <img :src="img.image_url" alt="preview" :style="slotProps.style" />
          </template>
        </Image>
      </div>
    </div>

    <!-- 4 张图：2行×2列，16:9 -->
    <div v-else-if="images.length === 4" class="grid grid-cols-2 gap-2">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="relative w-full aspect-video overflow-hidden flex items-center"
      >
        <Image alt="Image" preview @click.stop="" class="w-full">
          <template #previewicon>
            <i class="pi pi-search"></i>
          </template>
          <template #image>
            <img
              :src="getThumbnailImage(img.image_url, '220')"
              class="w-full h-full object-cover object-center"
            />
          </template>
          <template #original="slotProps">
            <img :src="img.image_url" alt="preview" :style="slotProps.style" />
          </template>
        </Image>
      </div>
    </div>
  </div>
</template>

<script setup>
const { getThumbnailImage } = useImage();

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});
</script>
