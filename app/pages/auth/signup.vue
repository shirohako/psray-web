<template>
  <div class="max-w-screen-xl flex items-center justify-center p-5 mx-auto">
    <div
      class="max-w-3xl w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-3 md:p-6"
    >
      <Stepper v-model:value="activeStep" linear>
        <StepItem value="1">
          <Step>{{ $t('sign_up.step_1.name') }}</Step>
          <StepPanel v-slot="{ activateCallback }">
            <div
              class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded bg-surface-50 flex flex-col items-center font-medium px-3 mr-3 py-5"
            >
              <!-- Content I -->
              <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('sign_up.step_1.title') }}
              </h2>
              <div class="flex flex-col gap-2">
                <label for="username" class="text-sm">{{ $t('sign_up.step_1.heading') }}</label>
                <InputText id="username" v-model="psnid" aria-describedby="username-help" />
              </div>

              <ul class="max-w-md space-y-1 text-gray-500 list-inside dark:text-gray-400 mt-5">
                <p class="text-left mb-2">
                  {{ $t('sign_up.step_1.description') }}
                </p>

                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_1.condition_1') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_1.condition_2') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_1.condition_3') }}
                </li>
              </ul>
            </div>
            <div class="py-6">
              <Button @click="checkId" :loading="checkingId" :label="$t('sign_up.step_1.button')" />
            </div>
          </StepPanel>
        </StepItem>
        <StepItem value="2">
          <Step>{{ $t('sign_up.step_2.name') }}</Step>
          <StepPanel v-slot="{ activateCallback }">
            <div
              class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded bg-surface-50 flex flex-col items-center font-medium px-3 mr-3 py-5"
            >
              <!-- Content 2 -->
              <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('sign_up.step_2.title') }}
              </h2>
              <div class="flex flex-col gap-2">
                <InputText id="email" v-model="email" aria-describedby="email-help" />
                <Button
                  :label="$t('sign_up.step_2.send_code')"
                  class="bg-rose-400"
                  @click="sendCode"
                  :loading="sendingCode"
                  :disabled="!isEmail || sendingCode"
                />
                <small id="email-help" class="text-center">
                  {{ $t('sign_up.step_2.description') }}
                </small>
              </div>
              <ul class="max-w-md space-y-1 text-gray-500 list-inside dark:text-gray-400 mt-5">
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_2.text_1') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_2.text_2') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_2.text_3') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_2.text_4') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_2.text_5') }}
                </li>
              </ul>
            </div>
            <div class="flex py-6 gap-2">
              <Button
                :label="$t('sign_up.back_button')"
                severity="secondary"
                @click="activateCallback('1')"
              />
              <Button @click="activateCallback('3')" :disabled="!isEmail">{{
                $t('sign_up.step_2.button')
              }}</Button>
            </div>
          </StepPanel>
        </StepItem>
        <StepItem value="3">
          <Step>{{ $t('sign_up.step_3.name') }}</Step>
          <StepPanel v-slot="{ activateCallback }">
            <div
              class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded bg-surface-50 flex flex-col items-center font-medium px-3 mr-3 py-5"
            >
              <!-- Content 3 -->
              <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('sign_up.step_3.name') }}
              </h2>
              <div class="flex flex-col gap-2 py-3">
                <Password v-model="passwd1" class="" toggleMask>
                  <template #footer>
                    <Divider />
                    <ul class="pl-0.5 ml-0.5 my-0 leading-normal">
                      <li class="flex items-center">
                        <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                        <span>{{ $t('sign_up.step_3.password.requre_1') }}</span>
                      </li>
                      <li class="flex items-center">
                        <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                        <span>{{ $t('sign_up.step_3.password.requre_2') }}</span>
                      </li>
                      <li class="flex items-center">
                        <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                        <span>{{ $t('sign_up.step_3.password.requre_3') }}</span>
                      </li>
                    </ul>
                  </template>
                </Password>
                <Password v-model="passwd2" toggleMask>
                  <template #footer>
                    <Divider />
                    <ul class="pl-0.5 ml-0.5 my-0 leading-normal">
                      <li class="flex items-center">
                        <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                        <span>{{ $t('sign_up.step_3.password.requre_1') }}</span>
                      </li>
                      <li class="flex items-center">
                        <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                        <span>{{ $t('sign_up.step_3.password.requre_2') }}</span>
                      </li>
                      <li class="flex items-center">
                        <Icon name="material-symbols:thumb-up-outline-rounded" class="mr-2"></Icon>
                        <span>{{ $t('sign_up.step_3.password.requre_3') }}</span>
                      </li>
                    </ul>
                  </template>
                </Password>
              </div>
            </div>
            <div class="flex gap-2 py-6">
              <Button
                :label="$t('sign_up.back_button')"
                severity="secondary"
                @click="activateCallback('2')"
              />
              <Button
                :label="$t('sign_up.step_3.button')"
                @click="checkPassword"
                :disabled="!goodPassword"
              />
            </div>
          </StepPanel>
        </StepItem>
        <StepItem value="4">
          <Step>{{ $t('sign_up.step_4.name') }}</Step>
          <StepPanel v-slot="{ activateCallback }">
            <div
              class="px-5 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded bg-surface-50 flex flex-col items-center font-medium py-5"
            >
              <!-- Content 4 -->
              <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('sign_up.step_4.title') }}
              </h2>
              <div class="flex flex-col gap-2">
                <div class="flex items-center">
                  <Icon name="material-symbols:person" class="mr-2 text-lg text-indigo-600"></Icon>
                  <span>{{ $t('sign_up.step_4.id', { psnid }) }}</span>
                </div>
                <div class="flex items-center">
                  <Icon
                    name="material-symbols:mark-email-read"
                    class="mr-2 text-lg text-blue-600"
                  ></Icon>
                  <span>{{ $t('sign_up.step_4.email', { email }) }}</span>
                </div>
              </div>

              <p for="username" class="text-md mt-5">
                {{ $t('sign_up.step_4.heading') }}
              </p>
              <ul class="max-w-md space-y-1 text-gray-500 list-inside dark:text-gray-400 mt-5">
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  <span> {{ $t('sign_up.step_4.text_1') }}</span>
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_4.text_2') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_4.text_3') }}
                </li>
                <li class="flex items-center">
                  <Icon
                    name="lets-icons:done-ring-round-duotone-line"
                    class="text-green-600 mr-2 shrink-0"
                  />
                  {{ $t('sign_up.step_4.text_4') }}
                </li>
              </ul>
              <Button
                :label="$t('sign_up.step_4.button')"
                class="mt-3"
                @click="SignUp"
                :loading="checkingProfile"
                :disabled="checkingProfile"
              />
              <div
                v-if="errorMessage"
                class="mt-3 bg-red-100 text-red-500 px-7 py-3 rounded-lg flex items-center"
              >
                <Icon name="material-symbols:error" class="text-2xl mr-3 text-red-400" />
                <div>
                  <h3 class="font-bold text-lg my-1">
                    {{ $t('sign_up.step_4.verification_error') }}
                  </h3>
                  <span>{{ errorMessage }}</span>
                </div>
              </div>
            </div>
            <div class="py-6">
              <Button
                :label="$t('sign_up.back_button')"
                severity="secondary"
                @click="activateCallback('3')"
              />
            </div>
          </StepPanel>
        </StepItem>
        <StepItem value="5">
          <Step>{{ $t('sign_up.step_5.name') }}</Step>
          <StepPanel v-slot="{ activateCallback }">
            <div
              class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded bg-surface-50 flex flex-col items-center font-medium px-3 mr-3 py-5"
            >
              <div
                class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 p-2 flex items-center justify-center mx-auto mb-3.5"
              >
                <svg
                  aria-hidden="true"
                  class="w-8 h-8 text-green-500 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span class="sr-only">Success</span>
              </div>
              <p class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t('sign_up.step_5.title') }}
              </p>
              <p class="text-gray-500 text-sm">
                {{ $t('sign_up.step_5.text') }}
              </p>
              <Button class="mt-5 text-xs" @click="router.push('/auth/login')"
                >{{ $t('sign_up.step_5.button') }}
              </Button>
            </div>
          </StepPanel>
        </StepItem>
      </Stepper>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['require-guest'],
});

const activeStep = ref('1');
const psnid = ref('');
const email = ref('');
const passwd1 = ref('');
const passwd2 = ref('');
const errorMessage = ref('');

const api = useApi();
const router = useRouter();

const checkingId = ref(false);
const sendingCode = ref(false);
const checkingProfile = ref(false);
const toast = useToast();

const isEmail = computed(() => {
  return String(email.value)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
});

const goodPassword = computed(() => {
  return passwd1.value === passwd2.value && String(passwd1.value).length >= 8;
});

async function checkId() {
  try {
    checkingId.value = true;
    const profile = await api.get(`/profile/get/${psnid.value}`);
    if (profile.data?.psnid) {
      if (profile.data.joined_at > 0) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: '该 PSN ID 已被注册',
          life: 3000,
        });
      } else {
        activeStep.value = '2';
      }
    } else {
      throw '';
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: '该 PSN ID 不满足条件，无法注册',
      life: 3000,
    });
  }
  checkingId.value = false;
}

async function sendCode() {
  sendingCode.value = true;
  api
    .post('/auth/verification-code', {
      psnid: psnid.value,
      email: email.value,
    })
    .then(response => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '验证码发送成功',
        life: 3000,
      });
    })
    .catch(e => {
      let message = '邮件发送失败，请向管理员反馈';
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
      sendingCode.value = false;
    });
}

function checkPassword() {
  activeStep.value = '4';
}

async function SignUp() {
  checkingProfile.value = true;
  errorMessage.value = '';
  api
    .post('/auth/register', {
      psnid: psnid.value,
      email: email.value,
      passwd: passwd1.value,
    })
    .then(response => {
      if (response?.data?.success) {
        activeStep.value = '5';
      } else {
        throw '';
      }
    })
    .catch(e => {
      let message = '验证出错，请向管理员反馈';
      if (Object.prototype.hasOwnProperty.call(e?.response?.data, 'error')) {
        message = e.response.data.error.message;
      }
      errorMessage.value = message;
    })
    .finally(() => {
      checkingProfile.value = false;
    });
}
</script>
