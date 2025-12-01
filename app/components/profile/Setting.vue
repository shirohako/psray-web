<template>
  <Drawer v-model:visible="drawer" header="Drawer">
    <template #container="{ closeCallback }">
      <div class="p-4 flex flex-col gap-2">
        <div class="flex flex-col gap-2">
          <label>自义定语言显示顺序</label>
          <Select
            :options="options"
            optionLabel="name"
            optionValue="value"
            v-model="customLocalization"
            fluid
          >
          </Select>
          <p class="text-gray-600 text-xs">关闭: 根据UI语言判断，智能回退</p>
          <p class="text-gray-600 text-xs">（智能回退举例：简体->繁体->默认语言）</p>
          <p class="text-gray-600 text-xs">
            【还没完成】开启: 您可以自定义5个语言，并决定它们谁优先
          </p>
        </div>

        <div class="flex flex-col gap-2 mt-5" v-if="false">
          <p>自定义顺序：</p>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <label>1:</label>
              <Select
                :options="options"
                optionLabel="name"
                optionValue="value"
                v-model="customLocalization"
                fluid
              >
              </Select>
            </div>
            <div class="flex items-center gap-2">
              <label>2:</label>
              <Select
                :options="options"
                optionLabel="name"
                optionValue="value"
                v-model="customLocalization"
                fluid
              >
              </Select>
            </div>
            <div class="flex items-center gap-2">
              <label>3:</label>
              <Select
                :options="options"
                optionLabel="name"
                optionValue="value"
                v-model="customLocalization"
                fluid
              >
              </Select>
            </div>
            <div class="flex items-center gap-2">
              <label>4:</label>
              <Select
                :options="options"
                optionLabel="name"
                optionValue="value"
                v-model="customLocalization"
                fluid
              >
              </Select>
            </div>
            <div class="flex items-center gap-2">
              <label>5:</label>
              <Select
                :options="options"
                optionLabel="name"
                optionValue="value"
                v-model="customLocalization"
                fluid
              >
              </Select>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
const options = [
  { name: '关闭', value: false },
  { name: '开启', value: true },
];

const setting = useSettingStore();
const { customLocalization } = storeToRefs(setting);

const drawer = useState('profile-prawer', () => ref(false));
</script>
