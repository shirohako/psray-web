<template>
  <div class="max-w-screen-xl mx-auto py-4 px-6">
    <div
      class="mx-auto w-full max-w-[1190px] px-6 sm:px-8 md:px-16 py-10 md:py-20 rounded-xl bg-[#ffffff]/60 min-h-[300px] m-2 shadow-[0px_14px_28px_-5px_rgba(0,0,0,0.21)]"
    >
      <h1
        class="font-semibold text-2xl mb-2 tracking-wider drop-shadow-[3px_3px_5px_rgba(91,91,91,0.58)]"
      >
        PSRay 高级订阅
      </h1>
      <small class="font-[500]">为核心玩家</small>
      <!-- 价格列表 -->
      <ul class="flex items-start justify-between gap-8 mt-10 md:flex-row flex-col">
        <li
          class="border w-full lg:w-[32%] px-10 pt-16 pb-8 bg-white rounded-lg self-stretch hover:scale-105 hover:shadow-[0px_14px_28px_-5px_rgba(0,0,0,0.1)] transition-all duration-150 ease-in"
        >
          <h2
            class="text-center font-semibold text-lg tracking-wider mb-3 drop-shadow-[3px_3px_5px_rgba(91,91,91,0.58)]"
          >
            Basic
          </h2>
          <p class="text-center tracking-tighter block mb-14">
            <span class="text-4xl font-bold">$0</span>
            <span class="text-black/40 text-center">/mo</span>
          </p>
          <button
            disabled
            class="w-full p-2 bg-gray-500 text-white rounded-md font-semibold disabled:cursor-not-allowed"
          >
            当前计划
          </button>
        </li>
        <li
          class="border w-full lg:w-[32%] px-10 pt-16 pb-8 bg-white rounded-lg self-stretch hover:scale-105 hover:shadow-[0px_14px_28px_-5px_rgba(0,0,0,0.1)] transition-all duration-150 ease-in relative group"
        >
          <div
            class="absolute top-0 left-1/2 -translate-x-1/2 rounded-br-xl rounded-bl-xl text-white px-8 py-2 bg-[#ff2865] transition-all duration-150 ease-in group-hover:shadow-[0px_14px_28px_-5px_rgba(0,0,0,0.1)]"
          >
            终身有效!
          </div>
          <h2
            class="text-center font-semibold text-lg tracking-wider mb-3 drop-shadow-[3px_3px_5px_rgba(91,91,91,0.58)]"
          >
            Pro
          </h2>
          <p class="text-center tracking-tighter block mb-14">
            <span class="text-4xl font-bold">$29</span>
            <span class="text-black/40 text-center">/one time</span>
          </p>
          <button
            class="w-full p-2 bg-[#13181f] text-white rounded-md font-semibold hover:bg-[#ff2865] transition-all duration-150 ease-in mb-8 border-[#13181f]"
          >
            捐赠
          </button>
        </li>
        <li
          class="border w-full lg:w-[32%] px-10 pt-16 pb-8 bg-white rounded-lg self-stretch hover:scale-105 hover:shadow-[0px_14px_28px_-5px_rgba(0,0,0,0.1)] transition-all duration-150 ease-in relative group"
        >
          <div
            class="absolute top-0 left-1/2 -translate-x-1/2 rounded-br-xl rounded-bl-xl bg-[#e2e2e2] text-black px-8 py-2 group-hover:bg-red-800 group-hover:text-white transition-all duration-150 ease-in group-hover:shadow-[0px_14px_28px_-5px_rgba(0,0,0,0.1)]"
          >
            每月订阅
          </div>
          <h2
            class="text-center font-semibold text-lg tracking-wider mb-3 drop-shadow-[3px_3px_5px_rgba(91,91,91,0.58)]"
          >
            Premium
          </h2>
          <p class="text-center tracking-tighter block mb-14">
            <span class="text-4xl font-bold">$2</span>
            <span class="text-black/40 text-center">/mo</span>
          </p>
          <button
            class="w-full p-2 bg-transparent text-[#13181f] rounded-md font-semibold hover:bg-[#13181f] hover:text-white transition-all duration-150 ease-in mb-8 border border-[#13181f]"
          >
            升级
          </button>
        </li>
      </ul>

      <div class="overflow-x-scroll pt-3 my-5">
        <table
          class="price-table table table-fixed min-w-[1000px] w-full border-collapse border border-slate-400"
        >
          <tbody>
            <tr>
              <td></td>
              <td>
                <span
                  class="absolute badge badge-sm badge-outline badge-success absolutes top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  Current Plan
                </span>
                <h3 class="text-lg text-gray-900 font-medium pb-2">Basic</h3>
                <div class="text-gray-700 text-sm">无需任何费用</div>
                <div class="text-gray-500 text-xs">部分高级功能会被限制</div>
                <div class="py-4">
                  <h4 class="text-2xl text-gray-900 font-semibold leading-none">Free</h4>
                </div>
                <div class="">
                  <button class="btn btn-light btn-sm flex justify-center w-full">目前使用</button>
                </div>
              </td>
              <td>
                <h3 class="text-lg text-gray-900 font-medium pb-2">Pro</h3>
                <div class="text-gray-700 text-sm">一次性捐助。永久股东</div>
                <div class="text-gray-500 text-xs">您的支持是我们发展的动力</div>
                <div class="py-4">
                  <div class="flex items-end gap-1.5" data-plan-type="pro">
                    <div class="text-2xl text-gray-900 font-semibold leading-none">$29</div>
                    <div class="text-gray-700 text-xs align-bottom">/ one time</div>
                  </div>
                </div>
                <div class="">
                  <button class="btn btn-primary btn-sm text-center flex justify-center w-full">
                    升级
                  </button>
                </div>
              </td>
              <td>
                <h3 class="text-lg text-gray-900 font-medium pb-2">Premium</h3>
                <div class="text-gray-700 text-sm">为核心玩家定制</div>
                <div class="text-gray-500 text-xs">解锁全部功能，全方位展示您的成就</div>
                <div class="py-4">
                  <div class="flex items-end gap-1.5" data-plan-type="premium">
                    <div class="text-2xl text-gray-900 font-semibold leading-none">$2</div>
                    <div class="text-gray-700 text-xs">/ per month</div>
                  </div>
                </div>
                <div class="">
                  <button class="btn btn-primary btn-sm text-center flex justify-center w-full">
                    升级
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">无站内广告</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800">支持</div>
              </td>
              <td>
                <div class="text-gray-800">支持</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">PSN账户自动同步间隔</div>
              </td>
              <td>
                <div class="text-gray-800">72 小时</div>
              </td>
              <td>
                <div class="text-gray-800">24 小时</div>
              </td>
              <td>
                <div class="text-gray-800">8 小时</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">游戏相册容量</div>
              </td>
              <td>
                <div class="text-gray-800">1GB</div>
              </td>
              <td>
                <div class="text-gray-800">100GB</div>
              </td>
              <td>
                <div class="text-gray-800">无限制</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">游戏相册图片压缩</div>
              </td>
              <td>
                <div class="text-gray-800">大于5M会被压缩</div>
              </td>
              <td>
                <div class="text-gray-800">无损</div>
              </td>
              <td>
                <div class="text-gray-800">无损</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">游戏相册服务器</div>
              </td>
              <td>
                <div class="text-gray-800">仅欧洲</div>
              </td>
              <td>
                <div class="text-gray-800">欧洲/美洲/日本/香港/新加坡</div>
              </td>
              <td>
                <div class="text-gray-800">全球CDN加速</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">在首页动态优先推送</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800">优先</div>
              </td>
              <td>
                <div class="text-gray-800">高优先推送</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">自定义用户头像</div>
              </td>
              <td>
                <div class="text-gray-800">跟随PSN设定</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">自定义个人资料排版</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">个人奖杯卡片</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">个人年度报告</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">问答区的提问置顶</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">
                  二手游戏交易区<br />认证标志
                </div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="text-gray-900 leading-none font-medium">专业的数据分析工具/AI建议</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800">-</div>
              </td>
              <td>
                <div class="text-gray-800 flex items-center gap-1">
                  <Icon name="mdi:check-decagram" class="text-green-500" />
                  <span>支持</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-4 dark:bg-gray-800">
        <div
          class="max-w-lg mx-auto rounded-lg overflow-hidden lg:max-w-none lg:flex shadow-teal border-4 border-teal-400"
        >
          <div class="bg-white px-6 py-8 lg:flex-shrink-1 lg:p-12 dark:bg-gray-900">
            <h3
              class="text-2xl text-left leading-8 font-extrabold text-gray-900 sm:text-3xl sm:leading-9 dark:text-gray-100"
            >
              PSRay Pro
            </h3>
            <p
              class="mt-6 text-left font-ttnorms leading-8 text-gray-500 text-lg dark:text-gray-400"
            >
              通过一次行捐助，成为永久会员
            </p>
            <div class="mt-8">
              <div class="flex items-center">
                <h4
                  class="flex-shrink-0 pr-4 bg-white text-sm leading-5 tracking-wider font-semibold uppercase text-teal-600 dark:text-teal-300 dark:bg-transparent"
                >
                  What's included
                </h4>
                <div class="flex-1 border-t-2 border-gray-200 dark:border-gray-700"></div>
              </div>
              <ul
                class="pl-0 mt-8 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 space-y-5 lg:space-y-0"
              >
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    PSN账户快速同步
                  </p>
                </li>
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    定制名字颜色和头像
                  </p>
                </li>
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    捐助会员专属标志
                  </p>
                </li>
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    站内功能优先权
                  </p>
                </li>
              </ul>
            </div>
          </div>
          <div
            class="grow py-8 px-6 text-center bg-gray-50 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-12 dark:bg-gray-900"
          >
            <p
              class="text-xl leading-6 font-medium text-gray-900 lg:max-w-xs lg:mx-auto mb-0 lg:mb-6 dark:text-gray-100"
            >
              终身会员
            </p>
            <div
              class="my-10 lg:my-6 flex items-baseline justify-center text-5xl leading-none font-extrabold text-gray-900 dark:text-gray-100"
            >
              <span class="font-brown">$29</span
              ><span class="text-xl leading-7 font-medium text-gray-500 font-ttnorms"
                >/one time</span
              >
            </div>
            <div class="lg:mt-6">
              <div class="rounded-md shadow">
                <a
                  href="#"
                  class="flex items-center justify-center px-5 py-3 leading-6 font-medium rounded-md focus:outline-none focus:ring transition duration-200 ease-in-out shadow-teal border-2 border-teal-400 bg-white hover:bg-teal-400 hover:shadow-teal-hover text-teal-400 hover:text-white text-lg relative z-20 dark:bg-teal-400 dark:text-white dark:hover:bg-teal-500 dark:hover:text-white"
                >
                  立即升级
                </a>
              </div>
            </div>
            <span class="text-gray-500 mt-2 text-xs">7天内提供无条件退款。包含消费税和手续费</span>
          </div>
        </div>
      </div>

      <div class="p-4 dark:bg-gray-800">
        <div
          class="max-w-lg mx-auto rounded-lg overflow-hidden lg:max-w-none lg:flex shadow-teal border-4 border-teal-400"
        >
          <div class="bg-white px-6 py-8 lg:flex-shrink-1 lg:p-12 dark:bg-gray-900">
            <h3
              class="text-2xl text-left leading-8 font-extrabold text-gray-900 sm:text-3xl sm:leading-9 dark:text-gray-100"
            >
              PSRay Premium
            </h3>
            <p
              class="mt-6 text-left font-ttnorms leading-8 text-gray-500 text-lg dark:text-gray-400"
            >
              订阅期间享受终生会员全部功能
            </p>
            <div class="mt-8">
              <div class="flex items-center">
                <h4
                  class="flex-shrink-0 pr-4 bg-white text-sm leading-5 tracking-wider font-semibold uppercase text-teal-600 dark:text-teal-300 dark:bg-transparent"
                >
                  What's included
                </h4>
                <div class="flex-1 border-t-2 border-gray-200 dark:border-gray-700"></div>
              </div>
              <ul
                class="pl-0 mt-8 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 space-y-5 lg:space-y-0"
              >
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    PSN账户快速同步
                  </p>
                </li>
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    定制名字颜色和头像
                  </p>
                </li>
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    捐助会员专属标志
                  </p>
                </li>
                <li class="flex items-start lg:col-span-1">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-teal-400 dark:text-teal-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <p
                    class="ml-3 text-lg leading-5 text-gray-700 font-ttnorms text-left dark:text-gray-300"
                  >
                    站内功能优先权
                  </p>
                </li>
              </ul>
            </div>
          </div>
          <div
            class="grow py-8 px-6 text-center bg-gray-50 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-12 dark:bg-gray-900"
          >
            <p
              class="text-xl leading-6 font-medium text-gray-900 lg:max-w-xs lg:mx-auto mb-0 lg:mb-6 dark:text-gray-100"
            >
              白金会员
            </p>
            <div
              class="my-10 lg:my-6 flex items-baseline justify-center text-5xl leading-none font-extrabold text-gray-900 dark:text-gray-100"
            >
              <span class="font-brown">$2</span
              ><span class="text-xl leading-7 font-medium text-gray-500 font-ttnorms">/month</span>
            </div>
            <div class="lg:mt-6">
              <div class="rounded-md shadow">
                <a
                  href="#"
                  class="flex items-center justify-center px-5 py-3 leading-6 font-medium rounded-md focus:outline-none focus:ring transition duration-200 ease-in-out shadow-teal border-2 border-teal-400 bg-white hover:bg-teal-400 hover:shadow-teal-hover text-teal-400 hover:text-white text-lg relative z-20 dark:bg-teal-400 dark:text-white dark:hover:bg-teal-500 dark:hover:text-white"
                >
                  立即升级
                </a>
              </div>
            </div>
            <span class="text-gray-500 mt-2 text-xs">7天内提供无条件退款。包含消费税和手续费</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style lang="postcss" scoped>
.price-table td {
  @apply border-collapse border border-slate-200 px-3.5 py-3;
}

.btn-light {
  @apply border text-gray-700 border-gray-300 bg-white;
}

.btn-primary {
  @apply border text-white border-blue-300 bg-blue-500;
}

.btn-sm {
  height: 2rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  gap: 0.275rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  line-height: 1;
  border-radius: 0.375rem;
  height: 2.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  gap: 0.375rem;
  font-weight: 500;
  font-size: 0.8125rem;
  outline: none;
}
</style>
