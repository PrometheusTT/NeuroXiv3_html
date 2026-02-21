<template>
  <div class="home">
    <SmallScreenAlert />
    <el-container class="app-container">
      <el-header height="auto">
        <header-bar
          ref="headBar"
          @clickSearchButton="searchDialogVisible = true"
          @clickSearchByIDButton="searchByIDHandler"
          @clickSearchByLLMButton="openAIDialog"
          @clickUploadNeuron="uploadNeuronHandler"
          @switchAtlas="switchAtlas($event)"
        />
      </el-header>
      <el-container>
        <el-main>
          <div class="main-content">
            <NeuronDetail
              v-if="reFresh"
              ref="neuronDetail"
              :load-first-neuron="loadFirstNeuron"
              :neurons-list="neuronsList"
              :is-initial-state="isInitialState"
              @checkConnectedNeurons="updateNeuronAnalysis($event, true)"
              @searchSimilarNeurons="searchSimilarNeurons($event)"
              @searchROINeurons="searchROINeurons($event)"
              @neuronView="updateCurrentNeuronInfo"
              @viewNeurons="viewNeurons"
              @showNeuronMap="showNeuronMap"
              @setVisualizedAxon="setVisualizedAxon"
              @setVisualizedBasal="setVisualizedBasal"
              @setVisualizedApical="setVisualizedApical"
              @setVisualizedSoma="setVisualizedSoma"
              @changeResolution="changeResolution"
              @generateGeneObj="generateGeneObj"
              @showGeneNodeInfo="showNodeInfo"
              @loadEphysData="loadEphysData"
            />
          </div>
        </el-main>
        <el-aside width="auto">
          <NeuronList
            ref="neuronList"
            @neuronView="updateCurrentNeuronInfo"
            @neuronAnalysis="updateNeuronAnalysis"
            @checkNeuron="checkNeuron"
            @viewNeurons="viewNeurons"
          />
        </el-aside>
      </el-container>
    </el-container>
    <!-- 神经元搜索对话框 -->
    <el-dialog
      title="Neuron Search"
      :visible.sync="searchDialogVisible"
      width="90%"
      top="10vh"
      :close-on-click-modal="false"
    >
      <NeuronSearch
        ref="neuronSearch"
        @neuronAnalysis="updateNeuronAnalysis"
        @criteriaEmpty="handleCriteriaEmpty"
      />      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button @click="searchDialogVisible = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="Reset"
        >Reset</el-button>
        <el-button
          type="primary"
          @click="searchNeurons()"
        >Confirm</el-button>
      </span>
    </el-dialog>
    <!-- AI搜索对话框 -->
    <el-dialog
      ref="AIWindowDialog"
      title="AIPOM"
      custom-class="AIWindow"
      :visible.sync="LLMDialogVisible"
      width="50%"
      top="7vh"
      :close-on-click-modal="false"
      :modal="false"
      :append-to-body="true"
    >
      <template #title>
        <div
          id="draggable-dialog-title"
          class="draggable-dialog-title"
          style="cursor: move; display: flex; align-items: center;"
        >
          <!-- AIPOM 标题部分 -->
          <span style="font-size: 18px; font-weight: bold;">AIPOM-CoT</span>
          <!-- 问号图标 -->
          <el-tooltip
            class="item"
            effect="dark"
            content="Instructions"
            placement="top"
            style="margin-top: 5px"
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
          cursor: pointer;
          margin-left: 5px;"
              @click="showUsageExamples"
            >
              <i
                class="el-icon-question"
                style="font-size: 14px; color: #666;"
              />
            </div>
          </el-tooltip>
          <el-tooltip
            :content="isPreciseSearch ? 'Search neuron based on exactly matching of CCFv3 ontology' : 'Search neuron based on fuzzy matching of CCFv3 ontology'"
            placement="top"
            style="margin-left: 20px"
          >
            <el-switch
              v-model="isPreciseSearch"
              active-text="Precise Search"
              @change="handleSwitchChange"
            />
          </el-tooltip>
        </div>
        <!-- 描述内容 -->
        <div style="font-size: 14px; margin-top: 14px; color: gray;">
          You are viewing a more powerful AIPOM enhanced by Chain of Thought. In this version, we move from Morpho-Analysis(1.0) to Multimodal Data Mining(2.0). You can ask it a natural language question about the morphology, connectivity, molecular info, or all these modalities of neurons (e.g. Tell me something about Car3), and AIPOM-CoT will explore and find all relevant data information for you through autonomous reasoning, providing a detailed and traceable data analysis report. All you need to do is turn on 'AIPOM-CoT Mode'.
        </div>
<!--        <div style="font-size: 14px; margin-top: 14px; color: gray;">-->
<!--          You are viewing an AWS-compromised AIPOM. You can search for neurons using natural language, such as: 'search MOp neurons from SEU-ALLEN.' Due to limitations on AWS servers, many AI features are only accessible through a customized deployment of NeuroXiv on dedicated servers. Click the '?' button for more details. Contact us if you have any questions.-->
<!--        </div>-->
      </template>
      <div
        v-if="isModelLoading"
        class="inline-loading"
      >
        <i class="el-icon-loading" />
        <p>Model is loading, please wait...</p>
      </div>
      <AISearchWindow
        ref="aiSearchWindow"
        :search-mode="searchMode"
        @AISearch="AISearch"
        @update:searchMode="searchMode = $event"
      />
      <span
        slot="footer"
        class="dialog-footer"
      >
<!--        <el-switch-->
<!--          v-model="searchMode"-->
<!--          active-value="agentic"-->
<!--          inactive-value="search"-->
<!--          active-text="Agentic Mode",-->
<!--          style="margin-left: 12px;"-->
<!--        />-->
        <el-button @click="LLMDialogVisible = false">
          Cancel
        </el-button>
        <el-button
          type="primary"
          @click="ClearMessage()"
        >Clear</el-button>
        <el-button
          type="primary"
          @click="AISearch()"
        >Confirm</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="Instructions"
      :visible.sync="usageExamplesVisible"
      width="40%"
    >
      <div style="max-height: 60vh; overflow-y: auto;">
        <p style="font-size: 16px; margin-bottom: 10px;">
          You can search for neurons based on an exact match with the Allen Mouse Brain Common Coordinate Framework Version 3 (CCFv3) ontology when the "Precise Search" option is turned on, and perform a fuzzy search based on the CCFv3 ontology when the option is turned off. Enabling the "Precise Search" option means users need to use the full names as defined in the CCFv3 for each brain region. Of course, we have also included other full names commonly used by researchers.  When the "Precise Search" option is turned off, users don't need to be overly concerned with the completeness of the expression and the order of words. However, please note that some inaccuracies may occur in the latter case.
        </p>

        <!-- 副标题 -->
        <p style="font-size: 16px; margin-bottom: 10px;">
          Below are some usage examples:
        </p>
        <!-- 使用 ul 和 li 正确显示 -->
        <ul>
          <div
            v-for="(example, index) in usageExamples"
            :key="index"
          >
            <li style="font-size: 16px">
              <b>{{ index + 1 }}:</b> {{ example }}
            </li>
          </div>
        </ul>
        <p style="font-size: 16px; margin: 20px 0 10px;">
          Function candidates:
          <span style="font-size: 14px; margin-left: 5px; color: #1f77d3;">
            (<a
              href="https://download.neuroxiv.org/brain_regions_functions.csv"
              target="_blank"
              style="color: #1f77d3; text-decoration: none;"
            >
              see details at https://download.neuroxiv.org/brain_regions_functions.csv
            </a>)
          </span>
        </p>
        <div style="width: 100%; border: 1px solid #dcdfe6;">
          <el-row :gutter="10">
            <el-col
              v-for="(feature, index) in supportedFeatures"
              :key="index"
              :span="8"
              style="text-align: center; padding: 10px; border: 1px solid #dcdfe6; margin-bottom: 10px;"
            >
              {{ feature }}
            </el-col>
          </el-row>
        </div>

        <!-- 底部关闭按钮 -->
      </div>
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button @click="usageExamplesVisible = false">Close</el-button>
      </span>
    </el-dialog>
    <floating-tag
      v-for="(tag, index) in floatingTags"
      :key="index"
      :title="tag.title"
      :message="tag.message"
      :target-position="tag.position"
      :title-color="tag.color"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref, Watch, Prop } from 'vue-property-decorator'
import HeaderBar from '@/components/mouse/HeaderBar.vue'
import NeuronList from '@/components/mouse/NeuronList.vue'
import NeuronDetail from '@/components/mouse/NeuronDetail.vue'
import NeuronSearch from '@/components/mouse/NeuronSearch.vue'
import { getNeuronInfo, searchNeurons, searchSimilarNeuron, uploadNeuron, searchROINeuron, AIChat, kgCoTAnswer, AI_RAG, getSearchIntent, ArticleSearch, CodeGenerator, executeCode, getSearchCondition, getGeneObj, AgenticSearch } from '@/request/apis/mouse/Neuron'
import SmallScreenAlert from '@/components/common/SmallScreenAlert.vue'
import NeuronLLM from '@/components/mouse/NeuronLLM.vue'
import AISearchWindow from '@/components/mouse/AISearchWindow.vue'
import { result } from 'lodash'
import NeuronLists from '@/components/mouse/NeuronLists.vue'
import { getCachedData, setCachedData, deleteCachedData } from '@/utils/indexedDB'
import NlpHelper from '@/utils/nlpHelper'
import FloatingTag from '@/components/mouse/FloatingTag.vue'

@Component({
  components: {
    FloatingTag,
    NeuronLLM,
    SmallScreenAlert,
    NeuronSearch,
    NeuronDetail,
    NeuronList,
    HeaderBar,
    AISearchWindow
  }
})

export default class Container extends Vue {
  @Ref('neuronDetail') readonly neuronDetail!: NeuronDetail
  @Ref('neuronSearch') readonly neuronSearch!: NeuronSearch
  @Ref('neuronList') readonly neuronList!: NeuronList
  // @Ref('neuronLists') readonly neuronLists!: NeuronLists
  @Ref('neuronLLM') readonly neuronLLM!: NeuronLLM
  @Ref('headBar') readonly headBar!: HeaderBar
  @Ref('aiSearchWindow') readonly aiSearchWindow!: AISearchWindow
  @Ref('AIWindowDialog') readonly AIWindowDialog!: any;
  private searchDialogVisible: boolean = false
  private LLMDialogVisible: boolean = false
  private reFresh: boolean = true
  private fullMorphNeurons:any[] = []
  private localMorphNeurons:any[] = []
  public neuronsList:any[] = []
  private nlpHelper: NlpHelper = new NlpHelper();
  private isModelLoading: boolean = true;
  private isModelLoaded: boolean = false;
  public isInitialState: boolean = false;
  private useRawObj: boolean = true;
  private usageExamplesVisible: boolean = false
  private isPreciseSearch:boolean = true
  private searchMode: 'search' | 'agentic' = 'agentic'
  public floatingTags: any[] = []
  // 查询示例数据
  public usageExamples = [
    'Search/Find/Look for/Show neurons with/without apical dendrite.',
    'Search/Find/Look for/Show neurons that have/don’t have apical dendrite.',
    'Search/Find/Look for/Show neurons with/without dendrite.',
    'Search/Find/Look for/Show neurons that have/don’t have dendrite.',
    'Search/Find/Look for/Show neurons with/without axon.',
    'Search/Find/Look for/Show neurons that have/don’t have axon.',
    'Do neurons with/without apical dendrite exist?',
    'Do neurons that have/don’t have apical dendrite exist?',
    'Are there neurons with/without apical dendrite?',
    'Are there neurons that have/don’t have apical dendrite?',
    'Do neurons with/without dendrite exist?',
    'Do neurons that have/don’t have dendrite exist?',
    'Are there neurons with/without dendrite?',
    'Are there neurons that have/don’t have dendrite?',
    'Do neurons with/without axon exist?',
    'Do neurons that have/don’t have axon exist?',
    'Are there neurons with/without axon?',
    'Are there neurons that have/don’t have axon?',
    'Search neurons that project/extend/elongate to [region/area].',
    'Search neurons with projection/extension/elongation to [region/area].',
    'Search neurons that arborize/extend/elongate/traverse in [region/area].',
    'Search neurons with arborization/extensions/elongation/traversal in [region/area].',
    'Search neurons that project/arborize/extend/elongate/traverse into [region/area].',
    'Search neurons with projection/arborization/extension/elongation/traversal into [region/area].',
    'Search neurons that project/arborize/extend/elongate/traverse toward [region/area].',
    'Search neurons with projection/arborization/extensions/elongation/traversal toward [region/area].',
    'Search neurons involved in [functions]'
  ];
  public supportedFeatures = ['Feeling', 'Emotion', 'Motion', 'Attention', 'Memory', 'Cognition', 'Behavior', 'Learning', 'Perception', 'Hearing', 'Metabolism', 'Smell', 'Vision', 'Taste', 'Regulation', 'Sleeping', 'Supporting', 'Eating', 'Pronunciation', 'Visceral activity', 'Coordination', 'Individual survival', 'Racial reproduction', 'Pressure', 'Awareness', 'Regulation of circadian rhythm', 'Secretion activity', 'Water electrolyte balance', 'Drinking', 'Weight', 'Blood sugar balance', 'Temperature', 'Endocrine activity', 'Body balance', 'Eye movements', 'Deliver information', 'Adjusting the core', 'Facial expression', 'Masticatory muscle movement', 'Breathing', 'Cardiovascular activity', 'Digestion', 'Immunity', 'Lingual muscle movement'];

  private showUsageExamples () {
    this.usageExamplesVisible = true // 打开使用案例弹窗
  }
  private handleClose () {
    this.usageExamplesVisible = false
  }

  public handleCriteriaEmpty () {
    this.isInitialState = true
  }

  /**
   * 更新当前显示的 neuron info 信息
   * @param neuronDetail neuron detail
   * @private
   */
  private async updateCurrentNeuronInfo (neuronDetail: any) {
    this.neuronDetail.selectedTab = 'neuronInfo'
    await this.$nextTick()
    this.neuronDetail.neuronInfo.clearReconstruction()
    this.neuronDetail.neuronInfo.hideSoma()
    this.neuronDetail.neuronInfo.isUploadData = false
    await this.$nextTick()
    const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
    const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
    // console.log(neuronInfo)
    this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
    if (this.neuronDetail.neuronInfo.roiShown) {
      this.neuronDetail.neuronInfo.ROI.setROI(Math.round(neuronInfo.soma[0]), Math.round(neuronInfo.soma[1]), Math.round(neuronInfo.soma[2]))
    }
    if (this.neuronDetail.neuronInfo.somaShown) {
      this.neuronDetail.neuronInfo.Soma.setSoma(Math.round(neuronInfo.soma[0]), Math.round(neuronInfo.soma[1]), Math.round(neuronInfo.soma[2]))
    }
    // this.neuronDetail.neuronInfo.showSoma(100)
    // console.log('soma loaded')
    // this.neuronDetail.neuronInfo.neuronScene.updateSomaBall(Math.round(neuronInfo.soma[0]), Math.round(neuronInfo.soma[1]), Math.round(neuronInfo.soma[2]), 100)
    this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
    await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
    await this.$nextTick()
    this.neuronDetail.neuronInfo.showSoma(100)
  }
  /**
     * 更新当前显示的 neuron info 信息
     * @param neuronDetail neuron detail
     * @private
     */

  /**
     * 更新AI模型返回答案
     */
  private async getAIAdvice (neuronDetail: any) {
    this.neuronDetail.selectedTab = 'neuronInfo'
    await this.$nextTick()
    // this.neuronDetail.neuronInfo.clearReconstruction()
    // await this.$nextTick()
    // const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
    const AIAdvice = await AIChat(document.body, neuronDetail.question).start()
    // this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
    // this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
    // await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
  }

  /**
   * 根据神经元 ID 搜索
   */
  private async searchByIDHandler () {
    try {
      const id = (await this.$prompt('Please input a neuron id', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        closeOnClickModal: false
        // @ts-ignore
      })).value
      await this.updateCurrentNeuronInfo({ id })
    } catch (e) {}
  }

  /**
   * 根据选择的 neuron id 更新统计信息
   * @param neuronIds 选择的 neuron id
   * @param updateNeuronList 是否更新右侧神经元列表
   * @private
   */
  private async updateNeuronAnalysis (neuronIds: string[], updateNeuronList: boolean = false) {
    try {
      // eslint-disable-next-line camelcase
      const { basic_info, morpho_info, plot, proj_info, neurons } = await searchNeurons(document.body, { id_list: neuronIds }).start()
      this.neuronsList = neurons
      this.neuronDetail.selectedTab = 'neuronStates'
      this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      await this.$nextTick()
      this.neuronDetail.neuronStates.featurePlot.renderChart()
      this.neuronDetail.neuronStates.histogramBars.renderChart()
      if (updateNeuronList) {
        this.neuronList.setListData(neurons)
        // console.log(neurons)
        // this.neuronLists.neuronList.setListData(this.fullMorphNeurons)
        // this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
      }
      this.searchDialogVisible = false
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * 搜索神经元
   * @param criteria 搜索条件
   * @param ids 神经元 ID 列表
   * @param func 回调函数
   * @private
   */
  // private async searchNeurons (criteria: any = undefined, ids: string[] | undefined = undefined, func: any = () => {}) {
  //   if (!criteria) {
  //     criteria = this.neuronSearch.getSearchCriteria()
  //   }
  //   criteria['brain_atlas'] = [this.$store.state.atlas]
  //   const condition = ids ? { id_list: ids } : { criteria: criteria }
  //   // console.log(condition)
  //   try {
  //     // eslint-disable-next-line camelcase
  //     const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, condition).start()
  //     this.neuronDetail.selectedTab = 'neuronStates'
  //     this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
  //     await this.$nextTick()
  //     this.neuronDetail.neuronStates.featurePlot.renderChart()
  //     this.neuronDetail.neuronStates.histogramBars.renderChart()
  //     this.searchDialogVisible = false
  //     this.neuronList.setListData(neurons)
  //     this.neuronsList = neurons
  //     // this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
  //     func()
  //   } catch (e) {
  //     console.error(e)
  //   }
  //   await this.setVisualizedSoma()
  // }
  private async searchNeurons (criteria: any = undefined, ids: string[] | undefined = undefined, func: any = () => {}) {
    if (!criteria) {
      criteria = this.neuronSearch.getSearchCriteria()
    }
    criteria['brain_atlas'] = [this.$store.state.atlas]
    const condition = ids ? { id_list: ids } : { criteria: criteria }

    const cacheKey = ids ? `neurons_ids_${ids.join('_')}` : `neurons_criteria_${JSON.stringify(criteria)}`

    // 设置缓存有效期为1小时
    const CACHE_DURATION = 2592000000

    // 检查缓存
    const cachedData = await getCachedData(cacheKey)
    if (cachedData) {
      const currentTime = new Date().getTime()
      if (currentTime - cachedData.timestamp < CACHE_DURATION) {
        // eslint-disable-next-line camelcase
        const { neurons, basic_info, morpho_info, plot, proj_info } = cachedData
        this.neuronsList = neurons
        await this.useNeuronData(neurons, basic_info, morpho_info, plot, proj_info)
        func()
        return
      } else {
        await deleteCachedData(cacheKey) // 缓存过期，移除缓存
      }
    }

    try {
      const response = await searchNeurons(document.body, condition).start()
      // eslint-disable-next-line camelcase
      const { neurons, basic_info, morpho_info, plot, proj_info } = response as any
      this.neuronsList = neurons
      await this.useNeuronData(neurons, basic_info, morpho_info, plot, proj_info)

      const dataToCache = {
        timestamp: new Date().getTime(),
        neurons,
        basic_info,
        morpho_info,
        plot,
        proj_info
      }
      await setCachedData(cacheKey, dataToCache)

      func()
    } catch (e) {
      console.error(e)
    }
    await this.setVisualizedSoma()
  }

  // eslint-disable-next-line camelcase
  private async useNeuronData (neurons: any, basic_info: any, morpho_info: any, plot: any, proj_info: any) {
    this.neuronDetail.selectedTab = 'neuronStates'
    this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
    await this.$nextTick()
    this.neuronDetail.neuronStates.featurePlot.renderChart()
    this.neuronDetail.neuronStates.histogramBars.renderChart()
    this.searchDialogVisible = false
    this.neuronList.setListData(neurons)
    this.neuronsList = neurons
  }
  private async executeCode (func: any = () => {}) {
    const code = this.aiSearchWindow.code
    func()
    try {
      // eslint-disable-next-line camelcase
      const response = await executeCode(document.body).start()
      // let res = JSON.parse(response)
      this.aiSearchWindow.addResponseFromAPI(response.response)
      func()
    } catch (e) {
      console.error(e)
    }
  }

  //  private async searchNeurons(criteria: any = undefined, ids: string[] | undefined = undefined, func: any = () => {}) {
  //     if (!criteria) {
  //       criteria = this.neuronSearch.getSearchCriteria();
  //     }
  //     criteria['brain_atlas'] = [this.$store.state.atlas];
  //     const condition = ids ? { id_list: ids } : { criteria: criteria };
  //
  //     try {
  //       // 异步请求数据
  //       const searchPromise = searchNeurons(document.body, condition).start();
  //
  //       // 分步处理返回数据
  //       searchPromise.then(response => {
  //         const { neurons, basic_info, morpho_info, plot, proj_info } = response;
  //
  //         // 更新部分UI
  //         this.neuronList.setListData(neurons);
  //         this.neuronsList = neurons;
  //
  //         // 更新神经元状态
  //         this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info };
  //
  //         // 延迟渲染图表
  //         this.$nextTick().then(() => {
  //           this.neuronDetail.neuronStates.featurePlot.renderChart();
  //           this.neuronDetail.neuronStates.histogramBars.renderChart();
  //         });
  //
  //         // 回调函数
  //         func();
  //       });
  //
  //       // 处理剩余数据
  //       await searchPromise;
  //
  //     } catch (e) {
  //       console.error(e);
  //     }
  //
  //     // 最后设置可视化的Soma
  //     await this.setVisualizedSoma();
  //   }

  private handleSwitchChange () {
    this.nlpHelper.setfuzzyMatchEnabled(!this.isPreciseSearch)
    console.log('isFuzz   ' + this.nlpHelper.fuzzyMatchEnabled)
  }
  private async AISearch (func: any = () => {}) {
    console.time('startSearchTime')
    this.aiSearchWindow.sendMessage()
    const question = this.aiSearchWindow.lastInput
    const searchIntent: 'search' | 'agentic' = this.searchMode
    let searchConditions: Record<string, any> = {}
    if (searchIntent === 'search') {
      const result = await this.nlpHelper.processQuery(question)
      const condition: Record<string, string[]> = {}

      // 遍历结果数组，将值添加到相应的键中
      result.value.forEach((item: { [x: string]: any }) => {
        const key = Object.keys(item)[0] // 获取对象中的键
        const value = item[key] // 获取对象中的值

        if (condition[key]) {
          if (Array.isArray(value)) {
            // If the value is an array (e.g., range [min, max]), spread it into the array
            condition[key].push(...value)
          } else {
            condition[key].push(value)
          }
        } else {
          condition[key] = Array.isArray(value) ? [...value] : [value] // Initialize with value or spread array
        }
      })

      // 添加其他查询条件（例如，brain_atlas）并初始化为空数组
      if (!condition['brain_atlas']) {
        condition['brain_atlas'] = [this.$store.state.atlas.toString()] // 你可以根据需求添加默认值或其他逻辑
      }
      searchConditions = { criteria: condition }
      try {
        // eslint-disable-next-line camelcase
        const { neurons, basic_info, morpho_info, plot, proj_info, overview } = await searchNeurons(document.body, searchConditions).start()
        this.neuronList.setListData(neurons)
        this.neuronsList = neurons
        this.neuronDetail.selectedTab = 'neuronStates'
        this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
        await this.$nextTick()
        this.neuronDetail.neuronStates.featurePlot.renderChart()
        this.neuronDetail.neuronStates.histogramBars.renderChart()
        // this.LLMDialogVisible = false
        this.aiSearchWindow.addResponseFromAPI('I have found ' + neurons.length + ' neurons')
        this.aiSearchWindow.addResponseFromAPI('Data Overview: ' + overview + 'In addition to this report, you can also see graphs of the report in the main window.')
        func()
      } catch (e) {
        this.aiSearchWindow.addResponseFromAPI('There are some issues, please try again later.')
        console.error(e)
      }
    }
    if (searchIntent === 'agentic') {
      try {
        let questionJson = { 'question': question, 'search_mode': searchIntent }
        const agenticSearchAnswer = await AgenticSearch(document.body, questionJson).start()
        console.log('agenticSearchAnswer', agenticSearchAnswer)
        this.aiSearchWindow.addResponseFromAPI(agenticSearchAnswer)
        func()
      } catch (e) {
        this.aiSearchWindow.addResponseFromAPI('There are some issues, please try again later.')
        console.error(e)
      }
    }
  }

  private async ClearMessage (func: any = () => {}) {
    this.aiSearchWindow.messages = []
  }

  private changeResolution () {
    let neuronsDetail = this.neuronList.getSelectedItems()
    const showAllAxon = this.neuronDetail.multiNeuronsViewer.showAllAxon
    const showAllApical = this.neuronDetail.multiNeuronsViewer.showAllApical
    const showAllBasal = this.neuronDetail.multiNeuronsViewer.showAllBasal

    neuronsDetail.forEach((neuronDetail: any) => {
      const baseData = {
        id: neuronDetail.id,
        name: neuronDetail.id,
        src: '',
        info: {
          id: neuronDetail.id,
          cellType: neuronDetail.celltype
        }
      }

      // 生成不同文件路径的后缀名，基于标志位 `useRawObj` 判断
      const fileSuffix = this.useRawObj ? '_raw.obj' : '.obj'
      this.neuronDetail.multiNeuronsViewer.buttonText = this.useRawObj ? 'Switch to downsampled morpho' : 'Switch to raw morpho'

      // 构建 dendrite, apical, 和 axon 对象
      const dendrite = {
        ...baseData,
        id: neuronDetail.id + '_basal',
        name: neuronDetail.id + '_basal',
        rgb_triplet: [0, 0, 255],
        src: `/data/${neuronDetail.id}/${neuronDetail.id}_basal${fileSuffix}`
      }

      const apical = {
        ...baseData,
        id: neuronDetail.id + '_apical',
        name: neuronDetail.id + '_apical',
        rgb_triplet: [255, 0, 255],
        src: `/data/${neuronDetail.id}/${neuronDetail.id}_apical${fileSuffix}`
      }

      const axon = {
        ...baseData,
        id: neuronDetail.id + '_axon',
        name: neuronDetail.id + '_axon',
        rgb_triplet: [255, 0, 0],
        src: `/data/${neuronDetail.id}/${neuronDetail.id}_axon${fileSuffix}`
      }

      // 检查 has_dendrite, has_axon, 和 has_apical 是否为 1，然后有选择地加载
      if (neuronDetail['has_axon']) {
        this.neuronDetail.multiNeuronsViewer.neuronScene.loadObjSetVisible(axon, showAllAxon)
      }

      if (neuronDetail['has_dendrite']) {
        this.neuronDetail.multiNeuronsViewer.neuronScene.loadObjSetVisible(dendrite, showAllBasal)
      }

      if (neuronDetail['has_apical']) {
        this.neuronDetail.multiNeuronsViewer.neuronScene.loadObjSetVisible(apical, showAllApical)
      }
    })

    // 切换标志位，以便下次调用时使用不同的文件类型
    this.useRawObj = !this.useRawObj
  }
  private hexToRgb (hex: string): [number, number, number] {
    const hexCode = hex.replace('#', '')
    const r = parseInt(hexCode.substring(0, 2), 16)
    const g = parseInt(hexCode.substring(2, 4), 16)
    const b = parseInt(hexCode.substring(4, 6), 16)
    return [r, g, b]
  }
  public async generateGeneObj (conditions: any) {
    const neuronScene = this.neuronDetail.multiNeuronsViewer.neuronScene
    neuronScene.unloadAllGeneObj() // 卸载已有的obj文件
    console.log('container', conditions)

    const response = await getGeneObj(document.body, conditions).start()
    let geneObjFiles = response.file_paths
    console.log(geneObjFiles)

    // 遍历文件路径数组
    for (const filePaths of geneObjFiles) {
      // 遍历每个分辨率的文件
      //   for (let filePath of filePaths) {
      //     const fileName = filePath.split('/').pop() // 获取文件名（如：L0_6827_#1F665D.obj）
      //
      //     // 使用正则提取颜色部分（#后面的值）
      //     const hexColor = fileName.split('.')[0].split('_')[2]
      //     if (hexColor) {
      //       const rgb = this.hexToRgb(hexColor) // 将十六进制颜色转换为RGB格式
      //       console.log(`Color for ${fileName}:`, rgb)
      //       console.log(filePath)
      //       // 加载OBJ文件，并指定颜色
      //       await neuronScene.loadPointCloudObj({
      //         src: filePath, // 使用当前文件路径
      //         id: 12,
      //         rgb_triplet: rgb // 设置RGB颜色
      //       })
      //     }
      //   }
      let filePath = filePaths[3]
      const fileName = filePath.split('/').pop() // 获取文件名（如：L0_6827_#1F665D.obj）

      // 使用正则提取颜色部分（#后面的值）
      const hexColor = fileName.split('.')[0].split('_')[2]
      if (hexColor) {
        const rgb = this.hexToRgb(hexColor) // 将十六进制颜色转换为RGB格式
        console.log(`Color for ${fileName}:`, rgb)
        console.log(filePath)
        // 加载OBJ文件，并指定颜色
        await neuronScene.loadPointCloudObj({
          src: filePath, // 使用当前文件路径
          id: fileName,
          rgb_triplet: rgb // 设置RGB颜色
        })
      }
    }
  }
  /**
   * 上传神经元并计算神经元特征
   * @param param 通过该参数获得要上传的文件
   */
  private async uploadNeuronHandler (param: any) {
    try {
      this.neuronDetail.selectedTab = 'neuronInfo'
      await this.$nextTick()
      const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
      const form = new FormData()
      form.append('file', param.file)

      // 调用实际的上传函数
      const loadingTarget = document.body
      const requestInstance = uploadNeuron(loadingTarget, form)

      // 处理请求结果
      requestInstance.start().then((neuronInfo) => {
        this.neuronDetail.neuronInfo.clearReconstruction()
        this.neuronDetail.neuronInfo.hideSoma()
        this.neuronDetail.neuronInfo.isUploadData = false
        this.$nextTick().then(() => {
          this.neuronDetail.neuronInfo.isUploadData = true
          this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
          this.neuronDetail.neuronInfo.showSoma(100)
          this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
          this.neuronDetail.neuronInfo.updateReconstruction(needClear)

          // 调用成功回调
          param.onSuccess?.(neuronInfo)
        })
      }).catch((error) => {
        console.error(error)
        param.onError?.(new ErrorEvent('error', { message: '上传神经元失败' }))
      })
    } catch (e) {
      console.error(e)
      param.onError?.(new ErrorEvent('error', { message: '上传神经元失败' }))
    }
  }

  /**
   * 清空搜索条件
   * @constructor
   * @private
   */
  private Reset () {
    this.neuronSearch.selectedConditions = []
  }

  /**
   * 搜索相似神经元，返回搜索条件
   * @param neuronInfo 神经元的信息
   * @private
   */
  private async searchSimilarNeurons (neuronInfo: any) {
    try {
      this.searchDialogVisible = true
      await this.$nextTick()
      neuronInfo['brain_atlas'] = this.$store.state.atlas
      this.neuronSearch.selectedConditions = await searchSimilarNeuron(document.body, neuronInfo).start()
    } catch (e) {
      console.error(e)
    }
    await this.setVisualizedSoma()
  }

  /**
   * 搜索ROI神经元
   * @param roiParameter ROI的位置与半径，用字符串表示，x_y_z_r
   * @private
   */
  private async searchROINeurons (roiParameter: string) {
    try {
      // eslint-disable-next-line camelcase
      const { neurons, basic_info, morpho_info, plot, proj_info } = await searchROINeuron(document.body, roiParameter, this.$store.state.atlas).start()
      // this.fullMorphNeurons = []
      // this.localMorphNeurons = []
      // neurons.forEach((neuron: { id: string | string[] }) => {
      //   if (neuron.id.includes('full')) {
      //     this.fullMorphNeurons.push(neuron)
      //   } else if (neuron.id.includes('local')) {
      //     this.localMorphNeurons.push(neuron)
      //   }
      // })
      this.neuronList.setListData(neurons)
      // this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
      // this.neuronLists.neuronList.setListData(neurons)
      this.neuronDetail.selectedTab = 'neuronStates'
      this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      await this.$nextTick()
      this.neuronDetail.neuronStates.featurePlot.renderChart()
      this.neuronDetail.neuronStates.histogramBars.renderChart()
    } catch (e) {
      console.log(e)
    }
    await this.setVisualizedSoma()
  }

  /**
   * 选中或取消右方神经元列表中的神经元的神经元的回调函数，用于在3D viewer里展示
   * @param neuronDetail 神经元的具体信息，包括是否有dendrite、axon，id以及是否选中
   * @param switchTab 是否要主动切换到3D viewer栏
   */
  public async checkNeuron (neuronDetail: any, switchTab: boolean = false) {
    if (switchTab && this.neuronDetail.selectedTab !== 'multiNeuronsViewer') {
      this.neuronDetail.selectedTab = 'multiNeuronsViewer'
      await this.$nextTick()
    }

    if (this.neuronDetail.selectedTab !== 'multiNeuronsViewer') {
      return
    }

    const baseData = {
      id: neuronDetail.id,
      name: neuronDetail.id,
      src: '',
      info: {
        id: neuronDetail.id,
        cellType: neuronDetail.celltype
      }
    }

    const dendriteData = { ...baseData, id: neuronDetail.id + '_basal', name: neuronDetail.id + '_basal', rgb_triplet: [0, 0, 255] }
    const apicalData = { ...baseData, id: neuronDetail.id + '_apical', name: neuronDetail.id + '_apical', rgb_triplet: [255, 0, 255] }
    const axonData = { ...baseData, id: neuronDetail.id + '_axon', name: neuronDetail.id + '_axon', rgb_triplet: [255, 0, 0] }
    const localData = { ...baseData, id: neuronDetail.id + '_local', name: neuronDetail.id + '_local', rgb_triplet: [0, 0, 255] }

    const neuronScene = this.neuronDetail.multiNeuronsViewer.neuronScene

    const checkLoadComponent = (data:any) => neuronScene.checkLoadComponent(data)

    if ([dendriteData, apicalData, axonData, localData].some(checkLoadComponent) || !neuronDetail.selected) {
      if (neuronDetail['has_dendrite'] && this.neuronDetail.multiNeuronsViewer.showAllBasal) {
        neuronScene.setComponentVisible(dendriteData, neuronDetail.selected)
      }
      if (neuronDetail['has_axon'] && this.neuronDetail.multiNeuronsViewer.showAllAxon) {
        neuronScene.setComponentVisible(axonData, neuronDetail.selected)
      }
      if (neuronDetail['has_apical'] && this.neuronDetail.multiNeuronsViewer.showAllApical) {
        neuronScene.setComponentVisible(apicalData, neuronDetail.selected)
      }
      if (neuronDetail['has_local'] && this.neuronDetail.multiNeuronsViewer.showAllBasal) {
        neuronScene.setComponentVisible(localData, neuronDetail.selected)
      }
    } else {
      const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()

      this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSomaPos.set(neuronDetail.id, neuronInfo.soma)

      dendriteData.src = neuronInfo.viewer_info[0].children[0].src
      axonData.src = neuronInfo.viewer_info[0].children[1].src
      apicalData.src = neuronInfo.viewer_info[0].children[2].src
      localData.src = neuronInfo.viewer_info[0].children[3].src

      const loadAndSetVisible = async (data:any, condition: any, visibility: boolean) => {
        if (condition) {
          await neuronScene.loadObj(data)
          neuronScene.setComponentVisible(data, visibility)
        }
      }

      await Promise.all([
        loadAndSetVisible(dendriteData, neuronDetail['has_dendrite'], this.neuronDetail.multiNeuronsViewer.showAllBasal),
        loadAndSetVisible(axonData, neuronDetail['has_axon'], this.neuronDetail.multiNeuronsViewer.showAllAxon),
        loadAndSetVisible(apicalData, neuronDetail['has_apical'], this.neuronDetail.multiNeuronsViewer.showAllApical),
        loadAndSetVisible(localData, neuronDetail['has_local'], this.neuronDetail.multiNeuronsViewer.showAllBasal)
      ])
    }

    await this.setVisualizedSoma()
  }

  /**
   * 将神经元列表中勾选的的神经元进行展示
   */
  public async viewNeurons () {
    let neuronsDetail = this.neuronList.getSelectedItems()
    this.neuronDetail.multiNeuronsViewer.neuronScene.setAllNeuronsVisible(false)
    neuronsDetail.forEach((neuronDetail: any) => {
      this.checkNeuron(neuronDetail, true)
    })
  }

  public async setVisualizedSoma () {
    let neuronsDetail = this.neuronList.getSelectedItems()
    let selectedIds = new Set(neuronsDetail.map(neuronDetail => neuronDetail.id))

    // 显示选中的神经元
    neuronsDetail.forEach((neuronDetail: any) => {
      this.neuronDetail.multiNeuronsViewer.neuronScene.showMultiViewerSomaBall(neuronDetail.id, 100, this.neuronDetail.multiNeuronsViewer.showAllSoma)
    })

    // 清除Map中未被选中的神经元
    this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSoma.forEach((value, key) => {
      if (!selectedIds.has(key)) {
        this.neuronDetail.multiNeuronsViewer.neuronScene.unloadMultiViewerSomaBalls(key)
        this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSoma.delete(key)
      }
    })
  }
  public async setVisualizedAxon ($event: any) {
    let neuronsDetail = this.neuronList.getSelectedItems()
    neuronsDetail.forEach((neuronDetail: any) => {
      let axonData = {
        id: neuronDetail.id + '_axon',
        name: neuronDetail.id + '_axon',
        src: '',
        // eslint-disable-next-line camelcase
        rgb_triplet: [255, 0, 0],
        info: {
          id: neuronDetail.id,
          cellType: neuronDetail.celltype
        }
      }
      if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(axonData)) {
        if (neuronDetail['has_axon']) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(axonData, this.neuronDetail.multiNeuronsViewer.showAllAxon)
        }
      }
    })
  }
  public async setVisualizedBasal () {
    let neuronsDetail = this.neuronList.getSelectedItems()
    neuronsDetail.forEach((neuronDetail: any) => {
      let dendriteData = {
        id: neuronDetail.id + '_basal',
        name: neuronDetail.id + '_basal',
        src: '',
        // eslint-disable-next-line camelcase
        rgb_triplet: [0, 0, 255],
        info: {
          id: neuronDetail.id,
          cellType: neuronDetail.celltype
        }
      }
      let localData = {
        id: neuronDetail.id + '_local',
        name: neuronDetail.id + '_local',
        src: '',
        // eslint-disable-next-line camelcase
        rgb_triplet: [0, 0, 255],
        info: {
          id: neuronDetail.id,
          cellType: neuronDetail.celltype
        }
      }
      if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(dendriteData) || this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(localData)) {
        if (neuronDetail['has_dendrite']) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(dendriteData, this.neuronDetail.multiNeuronsViewer.showAllBasal)
        }
        if (neuronDetail['has_local']) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(localData, this.neuronDetail.multiNeuronsViewer.showAllBasal)
        }
      }
    })
  }
  public async setVisualizedApical () {
    let neuronsDetail = this.neuronList.getSelectedItems()
    neuronsDetail.forEach((neuronDetail: any) => {
      let apicalData = {
        id: neuronDetail.id + '_apical',
        name: neuronDetail.id + '_apical',
        src: '',
        // eslint-disable-next-line camelcase
        rgb_triplet: [255, 0, 255],
        info: {
          id: neuronDetail.id,
          cellType: neuronDetail.celltype
        }
      }
      if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(apicalData)) {
        if (neuronDetail['has_dendrite']) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(apicalData, this.neuronDetail.multiNeuronsViewer.showAllApical)
        }
      }
    })
  }

  /**
   * 加载神经元列表第一个神经元
   */
  public async loadFirstNeuron () {
    await this.updateCurrentNeuronInfo(this.neuronList.getFirstItem())
  }

  public async showNeuronMap () {
    this.neuronDetail.multiNeuronsViewer.neuronScene.showMap(10)
  }

  /**
   * 切换当前atlas
   * @param atlas
   */
  public async switchAtlas (atlas: string) {
    // location.reload()
    // this.headBar.setAtlas(atlas)
    this.$store.commit('updateAtlas', atlas)
    this.reFresh = false
    this.$nextTick(() => {
      this.reFresh = true
      let criteria = {
        brain_atlas: [this.$store.state.atlas]
      }
      this.searchNeurons(criteria, undefined, () => {
        this.neuronDetail.selectedTab = 'multiNeuronsViewer'
      })
    })
  }

  openAIDialog () {
    this.LLMDialogVisible = true // 1. 设置对话框可见

    this.$nextTick(() => { // 2. 确保DOM已更新
      if (!this.isModelLoaded) {
        // 3. 显示加载动画
        const loadingInstance = this.$loading({
          lock: true,
          text: 'Model is loading, please wait...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        // 4. 使用 requestAnimationFrame 确保渲染完成后再异步加载模型
        requestAnimationFrame(() => {
          setTimeout(() => { // 确保异步加载模型
            this.loadModelIfNeeded()
              .then(() => {
                loadingInstance.close() // 模型加载完后关闭加载动画
                this.isModelLoaded = true // 更新状态
              })
              .catch((error) => {
                loadingInstance.close() // 错误处理
                console.error('Error loading model:', error)
              })
          }, 10) // 延迟10毫秒，确保加载模型的操作在动画之后
        })
      }
    })
  }

  async loadModelIfNeeded () {
    if (!this.isModelLoaded) {
      this.isModelLoading = true
      await this.loadNlpModelAsync()
      this.isModelLoaded = true // Mark model as loaded
      this.isModelLoading = false // Hide loading spinner
    }
  }

  async loadNlpModelAsync () {
    try {
      await this.nlpHelper.initializeNlp()
    } catch (error) {
      console.error('Error initializing NLP Helper:', error)
    }
  }

  @Watch('LLMDialogVisible') // 监听对话框的可见性变化
  onDialogVisibleChange (visible: boolean) {
    if (visible) {
      this.centerDialog() // 重置对话框位置
    }
  }

  centerDialog () {
    const dialogRef = this.$refs.AIWindowDialog as any
    if (!dialogRef || !dialogRef.$el) return

    const dialogEl = dialogRef.$el.querySelector('.el-dialog')
    if (dialogEl) {
      // 使用 fixed 定位使其相对于视口定位
      dialogEl.style.position = 'fixed'
      dialogEl.style.margin = '0' // 移除默认 margin

      // 获取窗口和对话框的宽度和高度
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dialogWidth = dialogEl.offsetWidth
      const dialogHeight = dialogEl.offsetHeight

      // 计算对话框的中心点位置
      const centerX = (viewportWidth - dialogWidth) / 2
      const centerY = (viewportHeight - dialogHeight) / 2

      // 设置对话框位置并让其中心对齐页面中心
      dialogEl.style.left = `${centerX}px`
      dialogEl.style.top = `${centerY}px`
      dialogEl.style.transform = 'translate(-50%, -50%)' // 确保对话框的中心对齐到页面中心
    }
  }

  initializeDraggableDialog () {
    const dialogRef = this.$refs.AIWindowDialog as any // 获取对话框 ref
    if (!dialogRef || !dialogRef.$el) return

    const dialogEl = dialogRef.$el.querySelector('.el-dialog') // 获取对话框的 DOM 元素
    const headerEl = dialogEl?.querySelector('#draggable-dialog-title') // 获取标题部分

    if (headerEl && dialogEl) {
      // 设置初始位置
      this.centerDialog()

      headerEl.onmousedown = (e: MouseEvent) => {
        e.preventDefault() // 阻止默认事件以避免选中文本

        // 获取对话框的当前矩形位置
        const dialogRect = dialogEl.getBoundingClientRect()
        // 计算鼠标点击点和对话框左上角的偏移
        const offsetX = e.clientX - dialogRect.left
        const offsetY = e.clientY - dialogRect.top

        const onMouseMove = (e: MouseEvent) => {
          // 鼠标移动时，计算新的对话框位置
          const left = e.clientX - offsetX
          const top = e.clientY - offsetY
          dialogEl.style.left = `${left}px`
          dialogEl.style.top = `${top}px`
          dialogEl.style.transform = 'translate(0, 0)' // 清除 transform 使其平滑移动
        }

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }
    }
  }
  showNodeInfo (data:any) {
    console.log('Container show node info', data)
    this.floatingTags.push({
      position: data.position,
      title: data.title,
      message: data.message,
      color: data.color
    })
  }

  private async loadEphysData () {
    // 等 tab 内容渲染完毕
    await this.$nextTick()

    const viewer = this.neuronDetail.electrophysiologyViewer
    if (!viewer) return
    if (viewer.allData.length > 0) return

    try {
      const resp = await fetch(`${process.env.BASE_URL}neuron_waveforms.json`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const ephysRaw = await resp.json()
      // eslint-disable-next-line camelcase
      const data = Object.entries(ephysRaw).map(([neuron_id, fields]: [string, any]) => ({
        neuron_id,
        ...fields
      }))
      viewer.setData(data)
    } catch (e) {
      console.error('[loadEphysData] Failed:', e)
      this.$message.error('Failed to load electrophysiology data')
    }
  }

  @Watch('$route.query.id')
  async handleIDChange (newId: string, oldId: string) {
    if (newId && newId !== oldId) {
      await this.updateCurrentNeuronInfo({ id: newId })
    }
  }
  mounted () {
    setTimeout(async () => {
      console.log('Cache update test: Version 1.1.0')
      console.log('----------route----------', this.$route.query)

      // 检查是否存在 `id` 参数
      if (this.$route.query.hasOwnProperty('id')) {
        // 如果有 `id` 参数，调用 `updateCurrentNeuronInfo`
        await this.updateCurrentNeuronInfo({ id: this.$route.query['id'] })
      } else if (this.$route.query.hasOwnProperty('brainRegion') && this.$route.query.hasOwnProperty('atlasName')) {
        // 如果没有 `id` 参数，但有 `brainRegion` 和 `atlasName` 参数
        // this.headBar.setAtlas(this.$route.query['atlasName'])
        this.$store.commit('updateAtlas', this.$route.query['atlasName'])
        this.$nextTick(() => {
          let criteria = {
            brain_atlas: [this.$store.state.atlas],
            celltype: [this.$route.query['brainRegion']]
          }
          this.searchNeurons(criteria)
        })
      } else {
        // 如果没有 `id`、`brainRegion` 和 `atlasName` 参数，按默认逻辑加载
        let criteria = {
          brain_atlas: [this.$store.state.atlas]
        }
        this.searchNeurons(criteria, undefined, () => {
          this.neuronDetail.selectedTab = 'multiNeuronsViewer'
        })
      }
    }, 2000)

    this.initializeDraggableDialog()
  }
}
</script>

<style lang="less" scoped>
.home {
  overflow: auto;
  height: 100%;
}
.app-container {
  min-width: 1300px;
  height: 100%;
  .el-header {
    padding: 0;
  }
  .el-main {
    height: 100%;
    .main-content {
      height: 100%;
    }
  }
  .el-aside {
    height: 100%;
    overflow: visible;
    box-shadow: 3px 3px 8px 2px var(--shadow-color);
  }
}
.AIWindow {
  width: 50%;
  top: 5vh;
}

.AIWindow .el-dialog__header {
  /* 对话框头部的样式，如果需要的话 */
  text-align: center;
  padding: 15px 20px;
}

.AIWindow .el-dialog {
  /* 设置对话框的背景颜色为现代的灰色，并略微调整阴影 */
  background: #f5f5f5; /* 调整为您喜欢的颜色 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.AIWindow .el-dialog__body {
  padding: 8px 12px 4px 12px;
}

.AIWindow .chat-window {
  max-width: none;
  box-shadow: none;
  height: 75vh;
  width: 100%;
  margin: 0;
}

.AIWindow .chat-messages {
  /* 设置消息区域的样式，允许滚动 */
  overflow-y: auto;
  height: 100%; /* 或根据需要设置一个固定高度 */
}

/* 样式调整，以适应聊天窗口内的消息气泡 */
.AIWindow .user-message, .AIWindow .system-message {
  /* 限制气泡宽度，确保消息在对话框中正确显示 */
  max-width: 70%;
  margin-bottom: 10px;
  border-radius: 18px;
  padding: 10px;
}

/* 用户消息的特定样式 */
.AIWindow .user-message {
  /* 靠右浮动，背景色调整 */
  float: right;
  clear: both;
  background-color: #007bff;
  color: white;
  margin-right: 20px; /* 消息与对话框边缘的距离 */
}

/* 系统消息的特定样式 */
.AIWindow .system-message {
  /* 靠左浮动，背景色调整 */
  float: left;
  clear: both;
  background-color: #e1e1e1;
  color: black;
  margin-left: 20px; /* 消息与对话框边缘的距离 */
}

/* 输入框样式调整，以适应对话框 */
.AIWindow .input-box {
  width: 100%;
  margin: 2px 0 0 0;
  padding: 10px 15px;
  border-radius: 22px;
  border: 2px solid #007bff;
  outline: none;
}

/* 对话框底部按钮的样式 */
.AIWindow .dialog-footer {
  text-align: right;
  padding: 4px 12px;
}

/* 确保按钮具有一致的样式 */
.AIWindow .el-button {
  margin-left: 10px; /* 按钮之间的间距 */
}

/* 按钮样式 */
.AIWindow .dialog-footer .el-button {
  border: none; /* 移除边框 */
  box-shadow: none; /* 移除阴影 */
  border-radius: 4px; /* 轻微的圆角 */
  background: #007bff; /* 蓝色背景，可以根据您的品牌颜色调整 */
  color: white; /* 白色文字 */
  margin-left: 8px; /* 按钮之间的间距 */
}

.AIWindow .dialog-footer .el-button:hover {
  background: #0056b3; /* 悬浮时更深的蓝色 */
}

.AIWindow .dialog-footer .el-button:active {
  background: #003a75; /* 按下时的颜色 */
}

/* 第一个按钮使用透明背景，以区分它与其他操作按钮 */
.AIWindow .dialog-footer .el-button:first-child {
  background: transparent;
  color: #007bff;
}

.AIWindow .dialog-footer .el-button:first-child:hover {
  background: rgba(0, 123, 255, 0.1); /* 悬浮时的背景颜色 */
}
.inline-loading {
  display: flex; /* Flexbox to align spinner and text */
  align-items: center; /* Center items vertically */
  justify-content: center; /* Center items horizontally */
  margin-top: 20px; /* Space from the top */
  color: #333; /* Text color */
  font-size: 14px; /* Font size for text */
}

.inline-loading i {
  margin-right: 10px; /* Space between spinner and text */
  font-size: 20px; /* Size of the spinner icon */
}

.inline-loading p {
  margin: 0; /* No margin around text */
}
</style>
