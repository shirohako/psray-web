<template>
  <div class="card flex flex-col items-center gap-6">
    <!-- 文件上传 -->
    <FileUpload
      mode="basic"
      @select="onFileSelect"
      customUpload
      auto
      severity="secondary"
      class="p-button-outlined"
    />
    <!-- 裁剪后的预览 -->
    <img
      v-if="croppedSrc"
      :src="croppedSrc"
      alt="预览图片"
      class="shadow-md rounded-xl w-full sm:w-64"
    />
    <!-- 确认上传按钮 -->
    <Button
      v-if="croppedSrc && !uploaded"
      label="确认上传"
      @click="uploadImage"
      class="p-button-success"
    />
    <!-- 裁剪对话框 -->
    <Dialog header="裁剪头像" v-model:visible="displayDialog" modal :closable="false">
      <div class="flex flex-col items-center">
        <div class="w-full h-96 overflow-hidden">
          <img ref="cropperImg" :src="src" alt="待裁剪图片" class="block w-full" />
        </div>
        <div class="mt-4 flex space-x-4">
          <Button label="取消" class="p-button-secondary" @click="cancelCrop" />
          <Button label="裁剪" class="p-button-primary" @click="cropImage" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const api = useApi();
const toast = useToast();
const user = useUserStore();

const src = ref(null); // 原始图片数据 URL
const croppedSrc = ref(null); // 裁剪后的图片预览
const displayDialog = ref(false); // 裁剪对话框显示状态
const cropperImg = ref(null); // 裁剪对话框中图片 DOM 引用
const uploaded = ref(false); // 是否已经上传成功
let cropperInstance = null;

/**
 * 当用户选择文件后，读取文件并打开裁剪对话框
 */
function onFileSelect(event) {
  const file = event.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      src.value = e.target.result;
      displayDialog.value = true;
      nextTick(() => {
        if (cropperInstance) {
          cropperInstance.destroy();
        }
        cropperInstance = new Cropper(cropperImg.value, {
          aspectRatio: 1, // 固定正方形
          viewMode: 1,
          autoCropArea: 1,
        });
      });
    };
    reader.readAsDataURL(file);
  }
}

/**
 * 取消裁剪，关闭对话框并销毁 cropper 实例
 */
function cancelCrop() {
  displayDialog.value = false;
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
}

/**
 * 裁剪图片，生成 webp 格式预览，并关闭对话框
 */
function cropImage() {
  if (cropperInstance) {
    const canvas = cropperInstance.getCroppedCanvas({
      width: 300,
      height: 300,
      imageSmoothingQuality: 'high',
    });
    // 转为 webp 格式的 DataURL 作为预览图
    croppedSrc.value = canvas.toDataURL('image/webp');
    displayDialog.value = false;
    cropperInstance.destroy();
    cropperInstance = null;
  }
}

/**
 * 确认上传，将裁剪后的图片上传到后端
 */
async function uploadImage() {
  try {
    // 将 dataURL 转换为 Blob
    const res = await fetch(croppedSrc.value);
    const blob = await res.blob();

    // 构造 FormData，文件 key 为 file，文件名为 avatar.webp
    const formData = new FormData();
    formData.append('file', blob, 'avatar.webp');

    // 替换为实际的后端 API 地址
    const response = await api.post('user/setting/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: '头像上传成功',
      life: 3000,
    });
    uploaded.value = true;
    user.refreshUserInfo();
  } catch (error) {
    let message = '修改失败，请向管理员反馈';
    if (Object.prototype.hasOwnProperty.call(error?.response?.data, 'error')) {
      message = error.response.data.error.message;
    }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000,
    });
  }
}
</script>

<style scoped>
/* 如有需要，可在此处添加额外样式 */
</style>
