<template>
  <div class="max-w-screen-xl mx-auto py-4 px-6 relative select-text mb-5">
    <div
      class="community-top-block bg-white w-full px-10 py-8 rounded-2xl shadow-md flex flex-col relative"
    >
      <!-- 导航面包屑 -->
      <div class="mb-2 flex flex-row items-center text-sm gap-0.5">
        <NuxtLink to="/" class="text-gray-600 hover:text-gray-950">
          <div class="flex items-center gap-0.5">
            <Icon name="material-symbols:home-outline" class="text-base text-cyan-600" />
            <span class="leading-relaxed">主页</span>
          </div>
        </NuxtLink>
        <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
        <NuxtLink to="/laboratory" class="text-gray-600 hover:text-gray-950">
          <div class="flex items-center gap-0.5">
            <Icon name="ph:flask" class="text-base text-blue-500" />
            <span class="leading-relaxed">社区实验室</span>
          </div>
        </NuxtLink>
      </div>
      <h2 class="text-2xl font-bold">
        欢迎来到
        <br class="sm:hidden" />
        PSRray 社区实验室
      </h2>
      <p class="my-1">PSRay 是开放性 UGC社区 (User-Generated Content Community)</p>
      <p class="my-1">我们相信，每一位用户都是社区无可替代的重要成员</p>
      <p class="my-1">这里会向您介绍 PSRay 社区功能，以及奖励回报</p>

      <div class="my-2 p-4 flex items-center">
        <Icon
          name="prime:chevron-circle-down"
          class="text-5xl ml-1 mr-3 text-center text-purple-600"
        />
        <div class="ml-3">
          <h3 class="text-xl font-medium mb-2 text-purple-600">数据开源</h3>
          <p>公开。任何人都可以免费使用 PSRay 的数据</p>
        </div>
      </div>
      <div class="my-2 p-4 flex items-center">
        <Icon
          name="prime:chevron-circle-down"
          class="text-5xl ml-1 mr-3 text-center text-pink-600"
        />
        <div class="ml-3">
          <h3 class="text-xl font-medium mb-2 text-pink-700">每位玩家都可以参与编辑</h3>
          <p>开放。所有人都能参与贡献</p>
        </div>
      </div>
      <div class="my-2 p-4 flex items-center">
        <Icon
          name="prime:chevron-circle-down"
          class="text-5xl ml-1 mr-3 text-center text-green-500"
        />
        <div class="ml-3">
          <h3 class="text-xl font-medium mb-2 text-green-600">为玩家服务</h3>
          <p>公平。透明的反作弊规则，维护社区排行平衡</p>
        </div>
      </div>

      <div class="community-top-bg opacity-20 md:opacity-95 mx-10 flex"></div>
    </div>

    <!-- 奖励展示 -->
    <div
      class="mt-8 bg-white w-full px-6 md:px-10 py-8 rounded-2xl flex flex-col relative border border-slate/10 shadow-lg shadow-b-2.5 -shadow-spread-2 shadow-slate-900/15"
    >
      <h2 class="text-xl font-bold my-1.5">设置的丰富奖励</h2>
      <p class="my-1">无门槛参与，我们相信每个人都是有价值的</p>
      <p class="text-xs">任何贡献都有回馈制度，积累各种奖励提升社区用户等级，获取社区奖励和荣誉</p>
      <p class="text-xs">点击下面条目，可以查看详细介绍和确认排行榜</p>
      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-2">
        <NuxtLink to="/laboratory/rewards/star-piece">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2024/07/17/6696acf994b94.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">星星碎片</h3>
              <p class="my-1">社区贡献度奖励</p>
              <p class="text-xs">从流星划过的天空散落的神秘碎片，据说收集它可以实现愿望</p>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/laboratory/rewards/rare-candy">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">神奇糖果</h3>
              <p class="my-1">社区用户的赞扬</p>
              <p class="text-xs">散发着温暖而甜美的香气糖果，吃下后整个人会充满元气</p>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/laboratory/rewards/philosophers-stone">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2024/08/02/66ac21691a054.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">贤者之石</h3>
              <p class="my-1">PSRay资料库编辑奖励</p>
              <p class="text-xs">此乃全然坚毅之大坚毅，渗透所有坚固之物，胜过任何精妙之物</p>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/laboratory/rewards/mira">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">米拉</h3>
              <p class="my-1">PSRay的基本交易道具</p>
              <p class="text-xs">塞姆里亚大陆的通用货币。不知为何，也可以在这里流通使用</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- 社区攻略 -->
    <div
      class="mt-8 bg-white w-full px-6 md:px-10 py-8 rounded-2xl flex flex-col relative border border-slate/10 shadow-lg shadow-b-2.5 -shadow-spread-2 shadow-slate-900/15"
    >
      <h2 class="text-xl font-bold my-1.5">社区游戏攻略</h2>
      <p class="my-1">Ray 译为光束，照亮前方昏暗的道路。现在由你来点亮灯塔</p>
      <p class="text-xs">在社区内发布游戏攻略、游戏奖杯Tip、回答用户问题可以获得奖励</p>
      <p class="text-xs">点击下面条目，可以查看功能介绍和确认排行榜</p>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-2">
        <NuxtLink to="/laboratory/guide/tips">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2024/09/17/66e97c0040593.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">奖杯TIPS</h3>
              <p class="my-1">浏览社区Tips排行榜</p>
              <p class="text-xs">简单分享获取心得，简单无门槛分享自己的经验</p>
            </div>
          </div>
        </NuxtLink>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <img src="https://i.psray.net/i/2024/09/17/66e9813f3b504.png" class="size-12" />
          <div>
            <h3 class="text-xl font-bold leading-5">游戏攻略</h3>
            <p class="my-1">未完成，敬请期待</p>
            <p class="text-xs">规划游戏最佳流程，为每位读者带来省心省事的最佳体验</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 资料库 -->
    <div
      class="mt-8 bg-white w-full px-6 md:px-10 py-8 rounded-2xl flex flex-col relative border border-slate/10 shadow-lg shadow-b-2.5 -shadow-spread-2 shadow-slate-900/15"
    >
      <h2 class="text-xl font-bold">游戏资料库</h2>
      <p class="my-2">PSRay 设计为开放的PSN数据库，你也可以成为贡献者的一员</p>
      <p class="text-xs">前人栽树，后人乘凉。参与数据贡献和订正，可以获得对应回报</p>
      <p class="text-xs">点击下面条目，可以查看功能介绍和确认排行榜</p>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-2">
        <NuxtLink to="/laboratory/wiki/ranking">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2023/09/04/64f5f04181fb0.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">数据贡献排行</h3>
              <p class="mt-1">浏览社区编辑贡献排行榜</p>
              <p class="text-xs">不懈追求真理孜孜不倦追求知识的伟大贤者们</p>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/laboratory/wiki/orphaned-trophies">
          <div class="border rounded-md px-6 py-5 flex items-center gap-6">
            <img src="https://i.psray.net/i/2024/08/14/66bbbc551374e.png" class="size-12" />
            <div>
              <h3 class="text-xl font-bold leading-5">尚未关联的奖杯组列表</h3>
              <p class="my-1">将奖杯组和游戏关联，完成拼图的碎片</p>
              <p class="text-xs">只有当拼图集齐并完整拼凑时，才能揭示其背后隐藏的巨大秘密</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({
  title: '社区实验室',
  description: '这里是PSRay社区实验室, 我们一路奔跑，为了寻找光芒。',
});
</script>

<style scoped>
.community-top-block {
  border: 1px solid #f1f1f4;
  min-height: 460px;
  min-width: 100%;
}
.community-top-bg {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-position: 100% 100%;
  background-size: 35% auto;
  background-repeat: no-repeat;
  pointer-events: none;
  background-image: url('https://i.psray.net/i/2024/05/18/6648ae3da37d1.jpg');
}
</style>
