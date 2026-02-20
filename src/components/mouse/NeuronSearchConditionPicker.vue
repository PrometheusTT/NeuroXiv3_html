<template>
  <el-dialog
    :title="`Select ${conditionName}`"
    :visible.sync="show"
    width="fit-content"
    :append-to-body="true"
    @close="$emit('close')"
    :close-on-click-modal="false"
  >
    <div class="virtual-transfer">
      <!-- 左侧 Candidates 列表 -->
      <div class="transfer-panel">
        <div class="transfer-panel__header">
          <el-checkbox
            :indeterminate="leftIndeterminate"
            :value="leftAllChecked"
            @change="handleLeftAllChange"
          >
            Candidates
          </el-checkbox>
          <span class="transfer-panel__count">{{ leftChecked.length }}/{{ filteredLeftData.length }}</span>
        </div>
        <div class="transfer-panel__filter">
          <el-input
            v-model="leftFilter"
            size="small"
            placeholder="Enter search content"
            clearable
            @input="handleLeftFilterDebounce"
          />
        </div>
        <div
          ref="leftList"
          class="transfer-panel__list"
          @scroll="handleLeftScroll"
        >
          <div :style="{ height: leftTotalHeight + 'px', position: 'relative' }">
            <div
              v-for="item in leftVisibleItems"
              :key="item.key"
              :style="{ position: 'absolute', top: item._top + 'px', width: '100%' }"
              class="transfer-item"
              :title="item.label"
            >
              <el-checkbox
                :value="leftChecked.includes(item.key)"
                @change="(val) => handleLeftCheck(item.key, val)"
              >
                {{ item.label }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间操作按钮 -->
      <div class="transfer-buttons">
        <el-button
          type="primary"
          icon="el-icon-arrow-right"
          :disabled="leftChecked.length === 0"
          @click="moveToRight"
        />
        <el-button
          type="primary"
          icon="el-icon-arrow-left"
          :disabled="rightChecked.length === 0"
          @click="moveToLeft"
        />
      </div>

      <!-- 右侧 Selected 列表 -->
      <div class="transfer-panel">
        <div class="transfer-panel__header">
          <el-checkbox
            :indeterminate="rightIndeterminate"
            :value="rightAllChecked"
            @change="handleRightAllChange"
          >
            Selected
          </el-checkbox>
          <span class="transfer-panel__count">{{ rightChecked.length }}/{{ filteredRightData.length }}</span>
        </div>
        <div class="transfer-panel__filter">
          <el-input
            v-model="rightFilter"
            size="small"
            placeholder="Enter search content"
            clearable
            @input="handleRightFilterDebounce"
          />
        </div>
        <div
          ref="rightList"
          class="transfer-panel__list"
          @scroll="handleRightScroll"
        >
          <div :style="{ height: rightTotalHeight + 'px', position: 'relative' }">
            <div
              v-for="item in rightVisibleItems"
              :key="item.key"
              :style="{ position: 'absolute', top: item._top + 'px', width: '100%' }"
              class="transfer-item"
              :title="item.label"
            >
              <el-checkbox
                :value="rightChecked.includes(item.key)"
                @change="(val) => handleRightCheck(item.key, val)"
              >
                {{ item.label }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="show = false">Cancel</el-button>
      <el-button
        type="primary"
        :disabled="value.length === 0"
        @click="confirmHandler"
      >Confirm</el-button>
    </span>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

interface TransferItem {
  key: string
  label: string
  _top?: number
}

@Component
export default class NeuronSearchConditionPicker extends Vue {
  public show: boolean = false
  public conditionName: string = '' // 当前的搜索条件, 显示在 dialog title 上面

  private data: TransferItem[] = []
  private value: string[] = [] // value 只包含 data 里面的 key

  // 虚拟滚动相关
  private readonly itemHeight: number = 30
  private readonly bufferSize: number = 5
  private leftScrollTop: number = 0
  private rightScrollTop: number = 0

  // 过滤相关
  private leftFilter: string = ''
  private rightFilter: string = ''
  private leftFilterDebounced: string = ''
  private rightFilterDebounced: string = ''
  private leftFilterTimer: number | null = null
  private rightFilterTimer: number | null = null

  // 选中状态
  private leftChecked: string[] = []
  private rightChecked: string[] = []

  // 计算属性：左侧数据（未选中的）
  get leftData (): TransferItem[] {
    return this.data.filter(item => !this.value.includes(item.key))
  }

  // 计算属性：右侧数据（已选中的）
  get rightData (): TransferItem[] {
    return this.data.filter(item => this.value.includes(item.key))
  }

  // 过滤后的左侧数据
  get filteredLeftData (): TransferItem[] {
    if (!this.leftFilterDebounced) return this.leftData
    const filter = this.leftFilterDebounced.toLowerCase()
    return this.leftData.filter(item => item.label.toLowerCase().includes(filter))
  }

  // 过滤后的右侧数据
  get filteredRightData (): TransferItem[] {
    if (!this.rightFilterDebounced) return this.rightData
    const filter = this.rightFilterDebounced.toLowerCase()
    return this.rightData.filter(item => item.label.toLowerCase().includes(filter))
  }

  // 左侧虚拟列表总高度
  get leftTotalHeight (): number {
    return this.filteredLeftData.length * this.itemHeight
  }

  // 右侧虚拟列表总高度
  get rightTotalHeight (): number {
    return this.filteredRightData.length * this.itemHeight
  }

  // 左侧可见项
  get leftVisibleItems (): TransferItem[] {
    return this.getVisibleItems(this.filteredLeftData, this.leftScrollTop)
  }

  // 右侧可见项
  get rightVisibleItems (): TransferItem[] {
    return this.getVisibleItems(this.filteredRightData, this.rightScrollTop)
  }

  // 左侧全选状态
  get leftAllChecked (): boolean {
    return this.filteredLeftData.length > 0 && this.leftChecked.length === this.filteredLeftData.length
  }

  get leftIndeterminate (): boolean {
    return this.leftChecked.length > 0 && this.leftChecked.length < this.filteredLeftData.length
  }

  // 右侧全选状态
  get rightAllChecked (): boolean {
    return this.filteredRightData.length > 0 && this.rightChecked.length === this.filteredRightData.length
  }

  get rightIndeterminate (): boolean {
    return this.rightChecked.length > 0 && this.rightChecked.length < this.filteredRightData.length
  }

  /**
   * 获取可见项（虚拟滚动核心逻辑）
   */
  private getVisibleItems (data: TransferItem[], scrollTop: number): TransferItem[] {
    const listHeight = 200 // 列表容器高度
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize)
    const endIndex = Math.min(
      data.length,
      Math.ceil((scrollTop + listHeight) / this.itemHeight) + this.bufferSize
    )

    return data.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      _top: (startIndex + index) * this.itemHeight
    }))
  }

  /**
   * 左侧滚动处理
   */
  private handleLeftScroll (e: Event) {
    this.leftScrollTop = (e.target as HTMLElement).scrollTop
  }

  /**
   * 右侧滚动处理
   */
  private handleRightScroll (e: Event) {
    this.rightScrollTop = (e.target as HTMLElement).scrollTop
  }

  /**
   * 左侧过滤防抖
   */
  private handleLeftFilterDebounce () {
    if (this.leftFilterTimer) {
      clearTimeout(this.leftFilterTimer)
    }
    this.leftFilterTimer = window.setTimeout(() => {
      this.leftFilterDebounced = this.leftFilter
      this.leftScrollTop = 0
      this.leftChecked = []
      const leftList = this.$refs.leftList as HTMLElement
      if (leftList) leftList.scrollTop = 0
    }, 300)
  }

  /**
   * 右侧过滤防抖
   */
  private handleRightFilterDebounce () {
    if (this.rightFilterTimer) {
      clearTimeout(this.rightFilterTimer)
    }
    this.rightFilterTimer = window.setTimeout(() => {
      this.rightFilterDebounced = this.rightFilter
      this.rightScrollTop = 0
      this.rightChecked = []
      const rightList = this.$refs.rightList as HTMLElement
      if (rightList) rightList.scrollTop = 0
    }, 300)
  }

  /**
   * 左侧单项选中
   */
  private handleLeftCheck (key: string, checked: boolean) {
    if (checked) {
      this.leftChecked.push(key)
    } else {
      this.leftChecked = this.leftChecked.filter(k => k !== key)
    }
  }

  /**
   * 右侧单项选中
   */
  private handleRightCheck (key: string, checked: boolean) {
    if (checked) {
      this.rightChecked.push(key)
    } else {
      this.rightChecked = this.rightChecked.filter(k => k !== key)
    }
  }

  /**
   * 左侧全选
   */
  private handleLeftAllChange (checked: boolean) {
    if (checked) {
      this.leftChecked = this.filteredLeftData.map(item => item.key)
    } else {
      this.leftChecked = []
    }
  }

  /**
   * 右侧全选
   */
  private handleRightAllChange (checked: boolean) {
    if (checked) {
      this.rightChecked = this.filteredRightData.map(item => item.key)
    } else {
      this.rightChecked = []
    }
  }

  /**
   * 移动到右侧
   */
  private moveToRight () {
    this.value = [...this.value, ...this.leftChecked]
    this.leftChecked = []
  }

  /**
   * 移动到左侧
   */
  private moveToLeft () {
    this.value = this.value.filter(key => !this.rightChecked.includes(key))
    this.rightChecked = []
  }

  /**
   * 点击确认按钮
   */
  private confirmHandler () {
    this.$emit('confirm', this.value) // 这个要写在前面, 先接收 confirm 事件
    this.show = false
  }

  /**
   * 设置穿梭框数据
   * @param data 所有可选择的数据
   * @param value 已选中的数据
   */
  public setData (data: any[], value: any[]) {
    this.data = data.map((item: string) => ({ key: item, label: item }))
    this.value = [...value]
    // 重置状态
    this.leftFilter = ''
    this.rightFilter = ''
    this.leftFilterDebounced = ''
    this.rightFilterDebounced = ''
    this.leftChecked = []
    this.rightChecked = []
    this.leftScrollTop = 0
    this.rightScrollTop = 0
  }

  beforeDestroy () {
    if (this.leftFilterTimer) clearTimeout(this.leftFilterTimer)
    if (this.rightFilterTimer) clearTimeout(this.rightFilterTimer)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.virtual-transfer {
  display: flex;
  align-items: center;
}

.transfer-panel {
  width: 320px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
  }

  &__count {
    color: #909399;
    font-size: 12px;
  }

  &__filter {
    padding: 10px;
  }

  &__list {
    height: 280px;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.transfer-item {
  padding: 0 15px;
  height: 30px;
  line-height: 30px;
  box-sizing: border-box;

  &:hover {
    background-color: #f5f7fa;
  }

  /deep/ .el-checkbox {
    display: flex;
    align-items: center;
    width: 100%;

    .el-checkbox__label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  padding: 0 20px;

  .el-button {
    margin: 5px 0;

    &:first-child {
      margin-left: 0;
    }
  }
}
</style>
