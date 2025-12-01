<template>
  <HomeAppBlock :image="image">
    <h3 class="text-xl font-semibold">
      {{ title.line1 }}<br />
      {{ title.line2 }}
    </h3>
    <div class="mt-12 flex gap-3">
      <button class="home-auth-card__button home-auth-card__button--primary" @click="handleLogin">
        {{ loginText }}
      </button>
      <button
        class="home-auth-card__button home-auth-card__button--secondary"
        @click="handleSignup"
      >
        {{ signupText }}
      </button>
    </div>
  </HomeAppBlock>
</template>

<script setup lang="ts">
interface Props {
  image?: string;
  title: {
    line1: string;
    line2: string;
  };
  loginText: string;
  signupText: string;
}

const props = withDefaults(defineProps<Props>(), {
  image: 'https://i.psray.net/i/2024/05/18/6647b87bae991.jpg',
});

const router = useRouter();

const handleLogin = () => {
  router.push('/auth/login');
};

const handleSignup = () => {
  router.push('/auth/signup');
};
</script>

<style scoped>
.home-auth-card__button {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.5rem;
  color: white;
  transition: opacity 0.2s;
}

.home-auth-card__button:hover {
  opacity: 0.9;
}

.home-auth-card__button--primary {
  background-color: rgb(37 99 235);
}

.home-auth-card__button--secondary {
  background-color: rgb(219 39 119);
}
</style>
