<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div class="my-2 shadow-md w-full px-8 py-8 rounded-2xl border bg-white">
      <h1 class="mt-4 mb-2 text-2xl font-extrabold">{{ $t('legal.terms') }}</h1>
      <p class="text-sm text-gray-500 mb-6">Last updated: 2025-01-01</p>

      <div class="prose prose-gray max-w-none">
        <h2>用户协议</h2>
        <p>
          使用本网站即表示你同意遵守本用户协议。若不同意本协议的任何内容，请停止使用本网站及相关服务。
        </p>

        <h3>用户义务</h3>
        <ul>
          <li>遵守当地法律法规与社区规范。</li>
          <li>不得发布违法、侵权或不当内容。</li>
          <li>妥善保管你的账户信息与密码。</li>
        </ul>

        <h3>内容与版权</h3>
        <p>
          你在本站发布的内容由你或其权利人享有权利；你授予本站为提供服务之目的的必要许可。请勿上传侵犯他人权益的内容。
        </p>

        <h3>服务变更</h3>
        <p>我们可能会基于维护、升级或政策原因调整功能与服务，并尽力提前告知。</p>

        <h3>免责声明</h3>
        <p>
          本站按“现状”提供，不对特定用途或持续可用性作出保证。因使用本站产生的任何损失，本站在法律允许范围内不承担间接或附带责任。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({ title: '用户协议 - PSRay' });
definePageMeta({ breadcrumb: ['Home', 'Terms'] });
</script>
