<template>
  <div class="mx-auto">
    <div class="flex flex-col mt-8 px-2">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col md:flex-row items-center gap-2">
          <div class="w-28 flex items-center">
            <Icon name="material-symbols:lock" class="mr-2 text-gray-600" />
            <label>{{ $t('setting.password.old_pass') }}：</label>
          </div>
          <Password v-model="passwd1" :feedback="false" />
        </div>

        <div class="flex flex-col md:flex-row items-center gap-2">
          <div class="w-28 flex items-center">
            <Icon name="material-symbols:key-rounded" class="mr-2 text-gray-600" />
            <label>{{ $t('setting.password.new_pass') }}：</label>
          </div>
          <Password v-model="passwd2">
            <template #footer>
              <Divider />
              <ul class="pl-0.5 ml-0.5 my-0 leading-normal">
                <li class="flex items-center">
                  <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                  <span>{{ $t('setting.password.condition.requre_1') }}</span>
                </li>
                <li class="flex items-center">
                  <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                  <span>{{ $t('setting.password.condition.requre_2') }}</span>
                </li>
                <li class="flex items-center">
                  <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                  <span>{{ $t('setting.password.condition.requre_3') }}</span>
                </li>
              </ul>
            </template>
          </Password>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-2">
          <div class="w-28 flex items-center">
            <Icon name="material-symbols:key-rounded" class="mr-2 text-gray-600" />
            <label>{{ $t('setting.password.confirm') }}：</label>
          </div>
          <Password v-model="passwd3">
            <template #footer>
              <Divider />
              <ul class="pl-0.5 ml-0.5 my-0 leading-normal">
                <li class="flex items-center">
                  <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                  <span>{{ $t('setting.password.condition.requre_1') }}</span>
                </li>
                <li class="flex items-center">
                  <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                  <span>{{ $t('setting.password.condition.requre_2') }}</span>
                </li>
                <li class="flex items-center">
                  <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                  <span>{{ $t('setting.password.condition.requre_3') }}</span>
                </li>
              </ul>
            </template>
          </Password>
        </div>

        <div class="mx-auto mt-3">
          <Button class="w-40" @click="updatePassword" :loading="loading" :disabled="disable">
            {{ $t('setting.password.button') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const api = useApi();
const toast = useToast();

const loading = ref(false);

const passwd1 = ref('');
const passwd2 = ref('');
const passwd3 = ref('');

const disable = computed(() => {
  return (
    loading.value || !passwd1.value || !passwd2.value || !passwd3.value || passwd2.value.length <= 8
  );
});

function updatePassword() {
  if (passwd2.value != passwd3.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: '请确认两次输入的新密码一致',
      life: 6000,
    });
    return false;
  }

  loading.value = true;
  api
    .post('user/setting/password', {
      oldpasswd: passwd1.value,
      newpasswd: passwd2.value,
    })
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '修改成功',
        life: 3000,
      });
    })
    .catch(e => {
      let message = '修改失败，请向管理员反馈';
      if (Object.prototype.hasOwnProperty.call(e?.response?.data, 'error')) {
        message = e.response.data.error.message;
      }
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 3000,
      });
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<style></style>
