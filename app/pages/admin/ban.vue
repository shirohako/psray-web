<template>
  <div class="max-w-screen-xl p-5 mx-auto">
    <!-- 选择部分 -->
    <div v-if="confirm">
      <h2 class="font-bold text-2xl">手动BAN用户</h2>
      <label class="text-gray-600 text-sm">BAN人记录对全体用户公开，请慎用</label>
      <div class="mt-5 flex flex-col gap-3">
        <div class="flex flex-col gap-2">
          <!-- 封禁ID -->
          <label>1. 要封禁的用户的 PSN ID</label>
          <label class="text-gray-600 text-sm">之后即使更换了PSNID也同样有效</label>
          <InputText type="text" v-model="psnid" class="w-96" />
        </div>
        <div class="flex flex-col gap-2">
          <!-- 封禁等级 -->
          <label>2. 请选择处罚等级</label>
          <Select
            v-model="level"
            :options="levelList"
            optionLabel="name"
            optionValue="code"
            class="w-full md:w-56"
          ></Select>
          <div class="flex flex-col">
            <div class="-m-1.5 overflow-x-auto">
              <div class="p-1.5 min-w-full inline-block align-middle">
                <div class="overflow-hidden">
                  <table class="divide-y divide-gray-200 table-fixed">
                    <thead>
                      <tr class="font-bold text-base text-gray-800">
                        <th class="px-6 py-3 text-start uppercase">等级</th>
                        <th class="px-6 py-3 text-start uppercase min-w-28">惩罚</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="odd:bg-white even:bg-gray-100">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          怀疑 (Warning)
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                        >
                          <span class="font-bold">仅标记、不会处理。手动BAN无法选择该等级</span>
                        </td>
                      </tr>
                      <tr class="odd:bg-white even:bg-gray-100">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          警告 (Suspension)
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                        >
                          <span class="font-bold"
                            >暂时隐藏排名。隐藏警告的游戏后立即可以恢复排名
                          </span>
                        </td>
                      </tr>
                      <tr class="odd:bg-white even:bg-gray-100">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          封禁 (BAN)
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                        >
                          <span class="font-bold">永久禁止参与排行榜。仍然可以用站内功能</span>
                        </td>
                      </tr>
                      <tr class="odd:bg-white even:bg-gray-100">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          停用 (Termination)
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                        >
                          <span class="font-bold"
                            >禁止该PSNID今后的同步，禁止参与排名，禁止注册</span
                          >
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <!-- 封禁类型 -->
          <label>3. 封禁类型</label>
          <label class="text-gray-600 text-sm">这里只能管理员人工封禁</label>
          <label class="text-gray-600 text-xs">类型包含：自动检测、举报、管理员人工封禁 </label>
          <Select
            v-model="type"
            :options="typeList"
            optionLabel="name"
            optionValue="code"
            class="w-full md:w-56"
          ></Select>
        </div>
        <div class="flex flex-col gap-2">
          <!-- 封禁原因 -->
          <label>4. 封禁原因</label>
          <label class="text-gray-600 text-sm">目前原因可选择：修改/作弊</label>
          <label class="text-gray-600 text-xs"
            >之后会提供更多的选项，比如：语言攻击，违反社区规则等</label
          >
          <Select
            v-model="reason"
            :options="reasonList"
            optionLabel="name"
            optionValue="code"
            class="w-full md:w-56"
          ></Select>
        </div>
        <div class="flex flex-col gap-2">
          <!-- 封禁理由 -->
          <label>5. 理由/说明</label>
          <label class="text-gray-600 text-sm"
            >必填。用户查询账号为何被BAN时候，会显示下面内容</label
          >
          <Textarea v-model="explanation" rows="5" cols="30" class="w-96" />
        </div>
        <div class="flex">
          <button class="bg-blue-500 text-white px-3 py-2 rounded-md" @click="confirmBan">
            确认
          </button>
        </div>
      </div>
    </div>
    <!-- 确认部分 -->
    <div v-else>
      <div class="flex flex-col gap-4">
        <h2 class="font-bold text-xl">请核对信息</h2>
        <div class="flex">
          <table class="table-fixed border-collapse border border-slate-400e">
            <tbody>
              <tr>
                <td class="font-bold">PSN ID</td>
                <td>{{ psnid }}</td>
              </tr>
              <tr>
                <td class="font-bold">封禁等级</td>
                <td>停用</td>
              </tr>
              <tr>
                <td class="font-bold">封禁类型</td>
                <td>人工封禁</td>
              </tr>
              <tr>
                <td class="font-bold">封禁理由</td>
                <td>作弊</td>
              </tr>
              <tr>
                <td class="font-bold">说明</td>
                <td>{{ explanation }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-col gap-2">
          <label>6. 再次输入账户密码</label>
          <label class="text-gray-600 text-sm">此操作有风险，请再次输入密码确认是本人</label>
          <Password v-model="password" :feedback="false" />
        </div>
        <div class="flex">
          <button class="bg-blue-500 text-white px-3 py-2 rounded-md" @click="submit">
            确认提交
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['require-admin'],
});

const api = useApi();
const toast = useToast();
const confirm = ref(true);

const levelList = [{ name: '停用', code: 'termination' }];
const level = ref('termination');

const typeList = [{ name: '管理员人工封禁', code: 'Administrator-Banned' }];
const type = ref('Administrator-Banned');

const reasonList = [{ name: '奖杯修改/作弊', code: 'cheating' }];
const reason = ref('cheating');

const psnid = ref('');
const explanation = ref(
  'This account has been permanently disabled due to multiple trophy tampering/cheating.',
);
const password = ref('');

function confirmBan() {
  if (!psnid.value || !explanation.value) {
    return false;
  }
  confirm.value = false;
}

function submit() {
  api
    .post('admin/ban', {
      psnid: psnid.value,
      level: 'termination',
      explanation: explanation.value,
      password: password.value,
    })
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '成功',
        life: 6000,
      });
    })
    .catch(err => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.error?.message,
        life: 20000,
      });
    });
}
</script>

<style lang="postcss" scoped>
tbody td {
  @apply px-5 py-3 border border-slate-300;
}
</style>
