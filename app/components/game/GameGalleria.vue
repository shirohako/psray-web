<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <Galleria
      :value="art"
      :numVisible="5"
      containerStyle="max-width: 100%;border-style:none;"
      :showThumbnails="false"
      :showIndicators="true"
    >
      <template #item="slotProps">
        <div class="relative aspect-video overflow-hidden w-full">
          <img :src="slotProps.item.url" class="inset-0 w-full h-full object-contain" />
        </div>
      </template>
    </Galleria>
  </div>
</template>

<script setup>
const props = defineProps({
  images: {
    type: Array,
    default: [],
  },
});

const art = computed(() => {
  if (props.images?.length > 0) {
    const _images = [];
    props.images.forEach(image => {
      if (image.url) {
        const _image = {
          url: image.url,
          thumbnail: getThumbnailImage(image.url),
        };
        _images.push(_image);
      }
    });
    return _images;
  } else {
    return [
      {
        url: 'https://i.psray.net/i/2025/03/07/67ca4a0abd60a.jpg',
      },
    ];
  }
});

function getThumbnailImage(url) {
  return url.replace(/(\/game\/[^\/]+)\/([^\/]+)$/, '$1/thumb/220/$2');
}
</script>
