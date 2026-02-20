<template>
  <div class="search-panel">
    <section class="all-conditions condition-section">
      <h3
        class="section-label"
        style="display: flex; align-items: center; gap: 8px;"
      >
        Menu
        <!-- 问号图标 -->
        <el-tooltip
          class="item"
          effect="dark"
          content="Allen Mouse Brain Common Coordinate Framework version 3 (CCFv3) regional ontology"
          placement="top"
        >
          <div
            class="icon-container"
            style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background-color: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;"
            @click="showPDFDialog"
          >
            <i
              class="el-icon-question"
              style="font-size: 14px; color: #666;"
            />
          </div>
        </el-tooltip>
      </h3>
      <div class="conditions-container">
        <el-input
          v-model="allConditionFilterText"
          class="condition-filter-input"
          placeholder="Filter keyword"
          size="mini"
        />
        <el-tree
          ref="searchConditionsTree"
          class="search-conditions-tree"
          :data="searchConditions"
          node-key="querry_name"
          :props="{ label: 'name' }"
          :filter-node-method="filterAllConditions"
        >
          <span
            slot-scope="{ node, data }"
            class="custom-tree-node"
          >
            <span :title="data.help_info">{{ node.label }}</span>
            <span>
              <el-button
                v-if="node.isLeaf"
                :disabled="selectedConditionsMap[data.querry_name]"
                type="text"
                size="mini"
                @click="addCondition(data)"
              >
                Add
              </el-button>
            </span>
          </span>
        </el-tree>
      </div>
    </section>
    <section class="selected-conditions condition-section">
      <h3 class="section-label">
        Current Query
      </h3>
      <div class="upload-config">
        <el-upload
          action=""
          accept=".csv,.json"
          :show-file-list="false"
          :before-upload="beforeUploadFile"
          :on-change="loadNeuronList"
        >
          <el-button type="text">
            Load Neuron List
          </el-button>
        </el-upload>
      </div>
      <div class="button-config">
        <el-button
          type="text"
          @click="loadSearchConfig"
        >
          Load Search Config
        </el-button>
        <el-button
          type="text"
          :disabled="selectedConditions.length === 0"
          @click="saveSearchConfig"
        >
          Save Search Config
        </el-button>
      </div>
      <div class="conditions-container">
        <el-input
          v-model="selectedConditionFilterText"
          class="condition-filter-input"
          placeholder="Filter keyword"
          size="mini"
        />
        <ul class="conditions-list">
          <template v-for="(item, i) in selectedConditions">
            <li
              v-if="item.visible"
              :key="i"
              class="condition-item"
            >
              <span
                class="condition-name text-ellipsis"
                :title="item.display_name"
              >
                {{ item.display_name }}
              </span>
              <span
                v-if="item.type === 'category'"
                class="condition-value category-value"
              >
                <span
                  class="selected-category text-ellipsis"
                  :title="item.selectedCategory"
                >
                  {{ item.selectedCategory }}
                </span>
                <el-button
                  type="text"
                  size="mini"
                  class="category-edit-button"
                  @click="editCategory(item)"
                >
                  Edit
                </el-button>
              </span>
              <span
                v-if="item.type === 'binary'"
                class="condition-value binary-value"
              >
                <el-radio
                  v-model="item.selectedBinary"
                  :label="true"
                >True</el-radio>
                <el-radio
                  v-model="item.selectedBinary"
                  :label="false"
                >False</el-radio>
              </span>
              <span
                v-if="item.type === 'range'"
                class="condition-value range-value"
              >
                min:
                <el-input-number
                  v-model="item.default_min"
                  :step="0.1"
                  :min="item.min_value"
                  :max="item.max_value === null ? Infinity : item.max_value"
                  size="mini"
                  class="range-item"
                />
                max:
                <el-input-number
                  v-model="item.default_max"
                  :step="0.1"
                  :min="item.min_value"
                  :max="item.max_value === null ? Infinity : item.max_value"
                  size="mini"
                  class="range-item"
                />
              </span>
              <el-button
                type="text"
                size="mini"
                @click="removeCondition(i)"
              >
                Delete
              </el-button>
            </li>
          </template>
        </ul>
      </div>
    </section>
    <!-- category 类型的搜索条件类别选择穿梭框 -->
    <NeuronSearchConditionPicker ref="conditionPicker" />
    <!-- Search Config对话框  -->
    <el-dialog
      :visible.sync="searchConfigDialogVisible"
      center
      width="800px"
      :close-on-click-modal="false"
      :append-to-body="true"
    >
      <!-- 自定义对话框标题 -->
      <template #title>
        <div style="position: relative; width: 100%; display: flex; align-items: center;">
          <!-- Reload Examples 按钮放置在标题的左侧 -->
          <el-button
            size="mini"
            type="primary"
            style="position: absolute; left: 20px;"
            @click="handleReloadExamples"
          >
            <span style="font-size: 14px; width: 100%; text-align: center;">RELOAD</span>
          </el-button>

          <!-- 标题居中，保持加粗和字号 -->
          <span style="font-size: 24px; font-weight: bold; width: 100%; text-align: center;">
            Load Search Config
          </span>
        </div>
      </template>

      <!-- 对话框内容 -->
      <el-table
        :data="searchConfigs"
        style="width: 100%"
      >
        <el-table-column
          label="Time"
          width="240px"
        >
          <template slot-scope="scope">
            <i class="el-icon-time" />
            <span style="margin-left: 10px">{{ scope.row.configTime }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="Search config name"
          width="320px"
        >
          <template slot-scope="scope">
            <span style="margin-left: 10px">{{ scope.row.configName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Action">
          <template slot-scope="scope">
            <div class="action">
              <el-button
                size="mini"
                @click="handleSelect(scope.$index)"
              >
                Select
              </el-button>
              <el-button
                size="mini"
                type="danger"
                @click="handleDelete(scope.$index)"
              >
                Delete
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

   <el-dialog
      title="Allen Mouse Brain Common Coordinate Framework version 3 (CCFv3) regional ontology"
      :visible.sync="dialogVisible"
      width="30%"
      :append-to-body="true"
    >
      <!-- 表格容器，添加滚动条 -->
      <div style="max-height: 60vh; overflow-y: auto;">
        <el-table
          :data="pdfData"
          style="width: 100%; font-size: 12px;"
          :border="true"
          header-cell-style="{ padding: '4px 8px', background: '#f9f9f9', fontSize: '14px' }"
          cell-style="{ padding: '4px 8px' }"
        >
          <el-table-column
            prop="name"
            label="Region Name"
            align="left"
          />
          <el-table-column
            prop="acronym"
            label="Acronym"
            align="center"
            width="120"
          />
        </el-table>
      </div>
      <span
        slot="footer"
        class="dialog-footer"
        style="margin: 0;"
      >
        <el-button
          size="mini"
          @click="dialogVisible = false"
        >Close</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Ref, Watch } from 'vue-property-decorator'
import { ElTree } from 'element-ui/types/tree'
import NeuronSearchConditionPicker from '@/components/mouse_t/NeuronSearchConditionPicker.vue'
import moment from 'moment'
import { debounce } from 'lodash'
import Papa from 'papaparse'

import searchConditions from './search_conditions.json'
import neuronViewerBaseData from './surf_tree.json'
import pdfData from '@/components/mouse_t/Allen_Mouse_Brain_CCFv3.json'
const requireConfig = require.context('@/assets/search_config', false, /\.json$/)
const configs = requireConfig.keys().map((key) => requireConfig(key))

@Component({
  components: { NeuronSearchConditionPicker }
})
export default class NeuronSearch extends Vue {
  @Ref('searchConditionsTree') readonly searchConditionsTree!: ElTree<any, any>
  @Ref('conditionPicker') readonly conditionPicker!: NeuronSearchConditionPicker

  private searchConditions: any[] = searchConditions.children
  public selectedConditions: any[] = []
  private allConditionFilterText: string = ''
  private selectedConditionFilterText: string = ''
  // search config
  private searchConfigs: any[] = []
  private searchConfigDialogVisible: boolean = false
  // 防抖的filter，只在第一次搜索时赋值
  private debounceAllConditionFilter: any = null
  public uploadNeuronList: any[] = []
  public hasNeuronList: boolean = false
  private fullNameMap: { [key: string]: string } = {}
  private nodeMatchMap: { [key: string]: boolean } = {}

  // 新增的属性，用于缓存计算结果
  private fullNameToAcronymMap: Record<string, string> = {}
  private possibleAcronyms: Set<string> = new Set()
  private cachedFilterValue: string = ''
  private dialogVisible:boolean = false // 控制 PDF 对话框显示
  private pdfData :any = pdfData // PDF 文件路径

  created () {
    this.initializeFullNameMap(neuronViewerBaseData)
    // 初始化 fullNameToAcronymMap
    for (const [acronym, fullName] of Object.entries(this.fullNameMap)) {
      this.fullNameToAcronymMap[fullName.toLowerCase()] = acronym.toLowerCase()
    }
  }

  initializeFullNameMap (data: any[]) {
    if (!this.fullNameMap) {
      this.fullNameMap = {} // 确保 fullNameMap 已初始化
    }
    data.forEach(item => {
      if (item.acronym && item.name) {
        // 存储为小写键值，但保留原始大小写的全称
        this.fullNameMap[item.acronym.toLowerCase()] = item.name
      }
      if (item.children && item.children.length) {
        this.initializeFullNameMap(item.children) // 递归处理子节点
      }
    })
  }

  // 选中的搜索条件 map, key 为 query_name
  get selectedConditionsMap () {
    return this.selectedConditions.reduce((prev: any, current: any) => {
      prev[current.querry_name] = true
      return prev
    }, {})
  }

  public getSearchCriteria () {
    const criteria = this.selectedConditions.reduce((prev: any, current: any) => {
      let type = current.type
      let query = current.querry_name

      if (type === 'category') {
        prev[query] = current.selectedCategory
      } else if (type === 'binary') {
        prev[query] = current.selectedBinary
      } else if (type === 'range') {
        prev[query] = [current.default_min, current.default_max]
      }
      return prev
    }, {})

    // 检查 criteria 是否为空
    if (Object.keys(criteria).length === 0) {
      console.log(' criteria empty')
      // 向父组件发送 emit 事件
      this.$emit('criteriaEmpty')
    }

    return criteria
  }

  // category 类型的搜索条件选择类型
  private searchCategorySelect (candidates: string[], selectedCandidates: string[], searchConditionLabel: string) {
    this.conditionPicker.show = true
    this.conditionPicker.conditionName = searchConditionLabel
    this.conditionPicker.setData(candidates, selectedCandidates)
    return new Promise((resolve, reject) => {
      this.conditionPicker.$once('confirm', resolve)
      this.conditionPicker.$once('close', reject)
    })
  }

  // 添加搜索条件
  private async addCondition (data: any) {
    if (data.type === 'category') {
      try {
        const selectedCategory = await this.searchCategorySelect(data.candidates, [], data.name)
        this.selectedConditions.push({
          ...data,
          visible: true,
          selectedCategory
        })
      } catch (e) {
        console.warn('cancel category select')
      }
    } else if (data.type === 'binary') {
      this.selectedConditions.push({
        ...data,
        visible: true,
        selectedBinary: true
      })
    } else if (data.type === 'range') {
      this.selectedConditions.push({
        ...data,
        visible: true
      })
    }
  }

  // 编辑搜索条件 category
  private async editCategory (data: any) {
    try {
      data.selectedCategory = await this.searchCategorySelect(data.candidates, data.selectedCategory, data.name)
    } catch (e) {
      console.warn('cancel category select')
    }
  }

  // 删除搜索条件
  private removeCondition (index: number) {
    this.selectedConditions.splice(index, 1)
  }

  // 修改后的 filterAllConditions 方法
  filterAllConditions (value: string, data: any, node: any): boolean {
    if (!value) return true // 没有输入值时，显示所有节点

    const lowerValue = this.cachedFilterValue // 使用缓存的 lowerValue

    let currentNode = node
    while (currentNode) {
      const label = currentNode.label?.toLowerCase()

      // 检查当前节点的 label 是否匹配输入值
      if (label && label.includes(lowerValue)) {
        return true
      }

      // 检查当前节点的 label 是否在可能的简称列表中
      if (label && this.possibleAcronyms.has(label)) {
        return true
      }

      // 剪枝：如果当前节点的 label 和输入值都不匹配，且没有父节点，则直接返回 false
      if (!currentNode.parent) {
        return false
      }

      // 移动到父节点继续检查
      currentNode = currentNode.parent
    }

    return false // 未找到匹配
  }

  // 筛选选中的搜索条件
  private filterSelectedConditions () {
    this.selectedConditions.forEach((item: any) => {
      item.visible = item.name.toLowerCase().includes(this.selectedConditionFilterText.toLowerCase())
    })
  }

  private async saveSearchConfig () {
    try {
      // @ts-ignore
      const name = (await this.$prompt('Please input your search configure name:')).value
      if (!name) {
        this.$message.error('Config name should not be null!')
        return
      }

      // 获取当前时间
      const curTimeStr = moment().format()

      // 获取已保存的配置
      let s = []
      if (localStorage.getItem('searchConfig')) {
        s = JSON.parse(localStorage.getItem('searchConfig') || '[]')
      }

      // 添加新的配置
      s.push({
        configName: name,
        configTime: curTimeStr,
        searchConfig: this.selectedConditions
      })

      // 更新 localStorage 中的配置
      localStorage.setItem('searchConfig', JSON.stringify(s))

      // 提示保存成功
      this.$message({
        message: 'Saved successfully!',
        type: 'success'
      })
    } catch (e) {
      console.error(e)
    }
  }
  private async loadSearchConfig () {
    // 从 localStorage 获取已删除的配置标记
    const deletedConfigs = JSON.parse(localStorage.getItem('deletedConfigs') || '[]')
    let allConfigs = [...configs.flat().map(config => ({
      ...config,
      fromJson: true // 标记该配置来自 JSON 文件
    }))]
    allConfigs = allConfigs.filter(config => !deletedConfigs.includes(config.configName))
    const storedConfig = localStorage.getItem('searchConfig')
    const localStorageConfig = storedConfig ? JSON.parse(storedConfig) : []
    this.searchConfigs = [...allConfigs, ...localStorageConfig]
    this.searchConfigs.sort((a, b) => new Date(b.configTime).getTime() - new Date(a.configTime).getTime())
    this.searchConfigDialogVisible = true
  }

  // 选择某一搜索条件
  private handleSelect (index: any) {
    this.selectedConditions = this.searchConfigs[index]['searchConfig']
    this.searchConfigDialogVisible = false
  }

  private handleDelete (index: number) {
    const configToDelete = this.searchConfigs[index]
    // 判断是否是从 JSON 加载的配置
    if (configToDelete.fromJson) {
      // 如果是从 JSON 加载的配置，记录删除状态
      const deletedConfigs = JSON.parse(localStorage.getItem('deletedConfigs') || '[]')
      deletedConfigs.push(configToDelete.configName) // 保存已删除配置
      localStorage.setItem('deletedConfigs', JSON.stringify(deletedConfigs))
      this.searchConfigs.splice(index, 1)
    } else {
      let localStorageConfig = JSON.parse(localStorage.getItem('searchConfig') || '[]')
      localStorageConfig = localStorageConfig.filter((config: any) => config.configName !== configToDelete.configName)
      localStorage.setItem('searchConfig', JSON.stringify(localStorageConfig))
      this.searchConfigs.splice(index, 1)
    }
  }

  // 重新加载示例配置
  private handleReloadExamples () {
    // 清空已删除的配置记录
    localStorage.removeItem('deletedConfigs')

    // 重新加载配置（本质上就是再次调用 loadSearchConfig 方法）
    this.loadSearchConfig()

    this.$message({
      message: 'Examples reloaded successfully!',
      type: 'success'
    })
  }

  @Watch('allConditionFilterText')
  allConditionFilterChanged (newVal: string) {
    if (!this.debounceAllConditionFilter) {
      this.debounceAllConditionFilter = debounce((value: string) => {
        const lowerValue = value.toLowerCase()
        if (lowerValue !== this.cachedFilterValue) {
          this.cachedFilterValue = lowerValue
          this.possibleAcronyms.clear()
          for (const [fullName, acronym] of Object.entries(this.fullNameToAcronymMap)) {
            if (fullName.includes(lowerValue)) {
              this.possibleAcronyms.add(acronym)
            }
          }
        }
        this.searchConditionsTree.filter(value)
      }, 500)
    }
    this.debounceAllConditionFilter(newVal)
  }

  @Watch('selectedConditionFilterText')
  selectedConditionFilterChanged () {
    this.filterSelectedConditions()
  }

  private beforeUploadFile (file: any) {
    const fileSuffix = file.name.substring(file.name.lastIndexOf('.') + 1)
    if (fileSuffix !== 'csv' && fileSuffix !== 'json') {
      this.$message('The upload file must be a csv or json file!')
      return false
    }
    return true
  }

  private async loadNeuronList (param: any) {
    const file = param.raw
    const reader = new FileReader()
    reader.onload = async (e: any) => {
      const fileContent = e.target.result
      if (file.name.endsWith('.csv')) {
        await this.processCsv(fileContent)
      } else if (file.name.endsWith('.json')) {
        await this.processJson(fileContent)
      }
      this.hasNeuronList = true
      this.$emit('neuronAnalysis', this.uploadNeuronList, true)
    }
    reader.readAsText(file)
  }

  private async processCsv (csvContent: string) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        complete: (results: any) => {
          this.uploadNeuronList = results.data.slice(1).map((row: any) => row[0]).filter((item: any) => item !== null && item !== '')
          console.log('this.uploadNeuronList')
          console.log(this.uploadNeuronList)
          resolve(true)
        },
        error: (error: any) => {
          console.error(error)
          reject(error)
        }
      })
    })
  }

  private async processJson (jsonContent: string) {
    return new Promise((resolve, reject) => {
      try {
        const data = JSON.parse(jsonContent)
        if (Array.isArray(data.neuronsList)) {
          this.uploadNeuronList = data.neuronsList.map((item: any) => item.id).filter((item: any) => item !== null && item !== '')
          console.log(this.uploadNeuronList)
          resolve(true)
        } else {
          this.$message('Invalid JSON format: neuronsList is not an array')
          reject(new Error('Invalid JSON format'))
        }
      } catch (error) {
        console.error(error)
        reject(error)
      }
    })
  }
  public showPDFDialog () {
    this.dialogVisible = true // 打开 PDF 对话框
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.search-panel {
  display: flex;
  flex-flow: row nowrap;
  .condition-section {
    width: 50%;
    flex: 1 1 auto;
    position: relative;
    .section-label {
      margin-top: 0;
    }
    .button-config {
      position: absolute;
      top: 0;
      right: 0;
      .el-button {
        padding: 0;
        margin-right: 20px;
      }
    }
    .upload-config{
      position: absolute;
      top: 0;
      right: 320px;
      .el-button {
        padding: 0;
        margin-right: 20px;
      }
    }
    .conditions-container {
      border: 1px solid grey;
      max-height: 800px;
      height: calc(70vh - 250px);
      overflow: auto;
      border-radius: 3px;
      padding: 10px;
      .condition-filter-input {
        margin-bottom: 10px;
      }
    }
  }
  .all-conditions {
    margin-right: 20px;
    .conditions-container {
      .search-conditions-tree {
        .custom-tree-node {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-right: 8px;
        }
      }
    }
  }
  .selected-conditions {
    .conditions-list {
      .condition-item {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
        .condition-name {
          cursor: pointer;
          width: 250px;
        }
        .condition-value {
          // width: 300px;
          &.category-value {
            .selected-category, .category-edit-button {
              vertical-align: middle;
            }
            .selected-category {
              cursor: pointer;
              max-width: 260px;
            }
          }
          &.range-value {
            .range-item {
              width: 130px;
            }
          }
        }
      }
    }
  }
  .action {
    white-space: nowrap;
    .el-button {
      display: inline;
    }
  }
  .icon-container {
    transition: background-color 0.3s;
  }

  .icon-container:hover {
    background-color: #e0e0e0;
  }
  .dialog-footer {
    text-align: right;
  }
}
</style>
