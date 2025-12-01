<template>
  <Drawer v-model:visible="drawer" header="Drawer">
    <template #container="{ closeCallback }">
      <div class="p-4 flex flex-col gap-2">
        <div class="flex flex-col gap-2">
          <label>奖杯图标大小：</label>
          <Select
            :options="TROPHY_ICON_SIZES"
            optionLabel="name"
            optionValue="value"
            v-model="trophiesIconSize"
            fluid
          >
          </Select>
        </div>

        <div class="flex flex-col gap-2">
          <label>奖杯间距：</label>
          <Select
            :options="TROPHY_ROW_SPACINGS"
            optionLabel="name"
            optionValue="value"
            v-model="trophiesSpacings"
            fluid
          >
          </Select>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { TROPHY_ICON_SIZES, TROPHY_ROW_SPACINGS } from '~/constants/trophy';

const setting = useSettingStore();
const { trophiesIconSize, trophiesSpacings } = storeToRefs(setting);

const drawer = useState('trophies-drawer', () => ref(false));
</script>
