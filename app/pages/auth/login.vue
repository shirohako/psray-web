<template>
  <div class="max-w-screen-xl flex items-center justify-center p-5 md:p-20 mx-auto">
    <div
      class="max-w-lg w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-6"
    >
      <img :src="artwork" class="w-full max-w-64 mx-auto" />

      <div class="login-form flex flex-col justify-center" v-if="!loginSuccess">
        <div>{{ $t('login.account') }}</div>
        <InputText
          type="text"
          v-model="psnid"
          class="q-mb-lg"
          placeholder="PSN ID"
          @keydown.enter="$refs.passwdInput.$el.focus()"
        />

        <div class="mt-5">{{ $t('login.password') }}</div>
        <InputText
          v-model="password"
          class="q-mb-lg"
          :type="isPwd ? 'password' : 'text'"
          placeholder="Enter your password"
          ref="passwdInput"
          @keydown.enter="login"
        />
        <Button class="mt-5 mx-auto" @click="login" :disabled="loading">
          <Icon name="mdi:login" v-if="!loading" class="mr-2" />
          <Icon name="line-md:loading-loop" v-else="loading" class="mr-2" />
          <span>{{ $t('login.button') }}</span>
        </Button>

        <p class="text-center text-sm mt-3">
          {{ $t('login.no_account_held') }}
          <router-link class="text-blue-600" to="/auth/signup">
            {{ $t('common.sign_up_now') }}
          </router-link>
        </p>
      </div>

      <transition-group name="p-message" tag="div">
        <Message class="my-3" v-for="msg of messages" :key="msg.id" :severity="msg.severity">{{
          msg.content
        }}</Message>
      </transition-group>
    </div>
  </div>
</template>
<script setup>
const { t } = useI18n();

definePageMeta({
  middleware: ['require-guest'],
});

useSeoMeta({
  title: 'Link Start',
  description: '新的季节和谁留下的讯息，为了不错过他们，我们不断奔跑着',
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const psnid = ref('');
const password = ref('');
const isPwd = ref(true);
const loading = ref(false);
const loginSuccess = ref(false);

const messages = ref([]);

const artworks = [
  'https://i.psray.net/i/2023/08/20/64e1c5f216682.jpg',
  'https://i.psray.net/i/2023/08/20/64e1c5f271ff7.jpg',
  'https://i.psray.net/i/2023/08/20/64e1c5f2e3d83.jpg',
  'https://i.psray.net/i/2023/08/20/64e1c5f425664.jpg',
];
const artwork = artworks[Math.floor(Math.random() * 4)];

async function login() {
  loading.value = true;
  const result = await userStore.signIn(psnid.value, password.value);
  if (result === true) {
    loginSuccess.value = true;
    messages.value = [
      {
        severity: 'info',
        content: t('login.success.syncing_message'),
        id: Math.floor(Math.random() * 10000),
      },
    ];
    await userStore.refreshUserInfo();
    messages.value.push({
      severity: 'success',
      content: t('login.success.welcome_message', { psnid: user.value.psnid }),
      id: Math.floor(Math.random() * 10000),
    });
    setTimeout(() => {
      router.push({ name: 'player-profile', params: { psnid: psnid.value } });
    }, 5000);
  } else {
    messages.value = [
      {
        severity: 'error',
        content: result.errorMessage,
        id: Math.floor(Math.random() * 10000),
      },
    ];
  }
  loading.value = false;
}
</script>
