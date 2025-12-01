<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div class="my-2 shadow-md w-full px-8 py-8 rounded-2xl border bg-white">
      <h1 class="mt-4 mb-2 text-2xl font-extrabold">{{ $t('legal.privacy') }}</h1>
      <p class="text-sm text-gray-500 mb-6">Last updated: 2025-01-01</p>

      <div class="prose prose-gray max-w-none">
        <h2>我们如何使用你的数据</h2>
        <p>
          我们仅收集为提供与改进本站服务所必需的最少数据，例如账号基础信息、必要的日志，以及用于分析的匿名数据。更多细节请参考下列章节。
        </p>

        <h3>收集的类别</h3>
        <ul>
          <li>账户与认证：例如邮箱、昵称、账号 ID（如 PSN ID）。</li>
          <li>站点使用情况：页面浏览统计与错误日志。</li>
          <li>Cookie 与本地存储：用于会话维持与偏好设置。</li>
        </ul>

        <h3>Cookie 与同意</h3>
        <p>
          首次访问时会显示 Cookie 同意提示。你可以选择接受或拒绝非必要 Cookie；必要 Cookie
          仅用于站点基础功能。
        </p>

        <h3>第三方分析</h3>
        <p>我们使用隐私友好的分析工具统计访问量与性能指标，数据仅用于改进产品体验。</p>

        <h3>你的权利</h3>
        <ul>
          <li>访问、更正与导出你的个人数据。</li>
          <li>撤回对非必要 Cookie 的同意。</li>
          <li>请求删除你的账户与相关数据。</li>
        </ul>

        <h3>联系我们</h3>
        <p>
          如果你对隐私有任何疑问，或希望行使你的数据权利，请访问“删除我的数据”页面或联系我们的支持邮箱。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({ title: '隐私政策 - PSRay' });
definePageMeta({ breadcrumb: ['Home', 'Privacy'] });
</script>
