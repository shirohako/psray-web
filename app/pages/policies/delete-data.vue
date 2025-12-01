<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div class="my-2 shadow-md w-full px-8 py-8 rounded-2xl border bg-white">
      <h1 class="mt-4 mb-2 text-2xl font-extrabold">{{ $t('legal.delete') }}</h1>
      <p class="text-sm text-gray-500 mb-6">Last updated: 2025-01-01</p>

      <div class="prose prose-gray max-w-none">
        <h2>删除我的数据</h2>
        <p>
          你可以请求删除与你账号相关的个人数据。提交请求后，我们将在合理期限内处理并在完成后通知你。
        </p>

        <h3>提交请求</h3>
        <ol>
          <li>准备以下信息：PSN ID</li>
          <li>说明你希望删除的范围（例如：账号与全部数据、仅分析数据等）。</li>
          <li>通过下方方式提交请求。</li>
        </ol>

        <div class="not-prose mt-4 rounded-lg border border-gray-200 p-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm text-gray-700">
              <p class="font-medium">使用邮件提交</p>
              <p>点击下方按钮将打开你的邮件客户端，并发送邮件提交。</p>
            </div>
            <div class="flex gap-2">
              <a
                :href="mailtoHref"
                class="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                打开邮件
              </a>
            </div>
          </div>
        </div>

        <h3>处理与通知</h3>
        <p>
          出于安全考虑，我们可能会进行身份核验。数据删除一旦完成，将不可恢复。与法律或合规要求冲突的数据可能被延迟或拒绝删除。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const supportEmail = 'ame@abyss.moe';
const subject = encodeURIComponent('Data Deletion Request - PSRay');
const bodyText = `Please fill and send the following:\n\n- PSN ID:\n`;

const mailtoHref = computed(
  () => `mailto:${supportEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`,
);

useSeoMeta({ title: '删除我的数据 - PSRay' });
definePageMeta({ breadcrumb: ['Home', 'Delete Data'] });
</script>
