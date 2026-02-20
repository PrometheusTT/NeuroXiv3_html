<template>
  <div>
    <input
      v-model="color"
      type="color"
      :style="{ width: width + 'px', height: height + 'px',border: 'none' ,shadow: 'none',background: 'transparent' }"
      @input="updateColor"
    >
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class ColorPicker extends Vue {
  // 默认颜色
  color: string = '#ffffff';

  // 默认宽度和高度
  width: number = 40;
  height: number = 25;

  // 更新颜色的方法
  updateColor () {
    this.$emit('color-selected', this.color)
  }
  setColor (color: string) {
    this.color = color
  }

  // 修改大小的方法
  updateSize (newWidth: number, newHeight: number) {
    this.width = newWidth
    this.height = newHeight
  }
}
</script>
