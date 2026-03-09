<template>
  <section class="feature-desc">
    <el-collapse
      v-model="activeSection"
    >
      <el-collapse-item
        title="AIPOM data report"
        name="dataSummary"
      >
        <template #title>
          AIPOM data report
          <!-- 加载指示器 -->
          <el-tooltip
            content="Generating summary..."
            placement="top"
          >
            <i
              v-if="isLoading"
              class="el-icon-loading"
              style="margin-left: 10px; font-size: 16px;"
            />
          </el-tooltip>
        </template>
        <div class="summary-container">
          <p><strong>Overview:</strong></p>
          <ul class="no-bullets">
            <li class="no-bullets">
              {{ basicInfoSummary }}
            </li>
          </ul>
          <p><strong>Morphology Features:</strong></p>
          <ul class="no-bullets">
            <li class="no-bullets">
              {{ morphologySummaries }}
              <!--              v-for="(summary, index) in morphologySummaries"-->
              <!--              :key="index"-->
            </li>
          </ul>
          <p><strong>Projection Patterns:</strong></p>
          <ul class="no-bullets">
            <li class="no-bullets">
              {{ projectionInfoSummary }}
            </li>
          </ul>
        </div>
      </el-collapse-item>
      <el-collapse-item
        title="basic information"
        name="basicInfo"
      >
        <el-table
          :data="basicInfo"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="name"
            label=""
          />
          <el-table-column
            prop="num"
            label="number of neurons"
          />
        </el-table>
      </el-collapse-item>
      <el-collapse-item
        title="morphology features"
        name="morphologyFeatures"
      >
        <MorphologyFeaturesTable :morpho-info="morphoInfo" />
      </el-collapse-item>
      <el-collapse-item
        v-if="projInfo && projInfo.length > 0"
        title="anatomy/projection info"
        name="projectionInfo"
      >
        <ProjectionInfoTable :proj-info="projInfo" />
      </el-collapse-item>
    </el-collapse>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'
import MorphologyFeaturesTable from '@/components/human/MorphologyFeaturesTable.vue'
import ProjectionInfoTable from '@/components/human/ProjectionInfoTable.vue'

@Component({
  components: {
    MorphologyFeaturesTable,
    ProjectionInfoTable
  }
})
export default class NeuronStatesDesc extends Vue {
  @Prop({ required: true }) basicInfo!: any
  @Prop({ required: true }) morphoInfo!: any
  @Prop({ required: true }) projInfo!: any
  @Prop({ required: true }) readonly neuronsList!: any[]
  @Prop({ required: true }) readonly isInitialState!: boolean
  private activeSection: string[] = ['basicInfo']

  private messageQueue: any[] = []; // 队列来保存消息
  private isProcessing: boolean = false; // 标志是否正在处理消息
  public hasStartedSSE: boolean = false;
  private eventSource: EventSource | null = null;
  private currentConnectionId: string | null = null;
  private bs : string = 'The human neuron morphological dataset consists of 8,397 neurons reconstructed from patient brain tissue. These neurons are distributed across 13 brain regions, including Superior Frontal Gyrus (SFG), Middle Frontal Gyrus (MFG), Inferior Frontal Gyrus (IFG), Superior Temporal Gyrus (STG), Middle Temporal Gyrus (MTG), Inferior Temporal Gyrus (ITG), Temporal Pole (TP), Superior Parietal Lobule (SPL), and others. The dataset includes both male and female patients across various age groups. All neurons have dendritic reconstructions with 32 morphological features measured.'
  private ms : string = 'The human neuron morphology data reveals diverse dendritic structures across different cortical regions. Key metrics include total dendritic length, number of bifurcations, max path distance, center shift, and spatial dimensions (height, width, depth). Contraction ratios, bifurcation angles, and density measures provide additional characterization of dendritic complexity. These features enable quantitative comparison of neuronal morphology across human brain regions.'
  private ps : string = 'Human neuron projection data is not available in this dataset. The reconstructions focus on dendritic morphology without axonal tracing.'
  private basicInfoSummary: string = this.bs
  private morphologySummaries: string = this.ms
  private projectionInfoSummary: string = this.ps
  // eslint-disable-next-line camelcase
  private id_list : any[] = this.neuronsList
    .filter(neuron => !neuron.id.includes('local'))
    .map(neuron => neuron.id)
  private hasInitialized : boolean = false
  private isLoading: boolean = false;
  private completedSegments: number = 0;
  private initialNeuronIds: string[] = [];

  @Watch('basicInfo', { deep: true })
  onDataChange () {
    if (!this.hasInitialized) {
      // 初次加载时跳过执行
      this.hasInitialized = true
      return
    }
    const currentNeuronIds = this.neuronsList.filter(neuron => !neuron.id.includes('local')).map(neuron => neuron.id)
    console.log(currentNeuronIds)
    // 简单比较两个ID列表是否一致
    if (JSON.stringify(this.initialNeuronIds) === JSON.stringify(currentNeuronIds)) {
      this.basicInfoSummary = this.bs
      this.morphologySummaries = this.ms
      this.projectionInfoSummary = this.ps
      console.log('Neuron IDs have not changed.')
      return // 如果ID没有变化，直接返回
    }
    if (this.neuronsList.length === 175149 || this.neuronsList.length === 8397) {
      console.log('NeuronStatesDesc: isInitialState')
      console.log(this.isInitialState)
      this.stopSSE()
      this.basicInfoSummary = this.bs
      this.morphologySummaries = this.ms
      this.projectionInfoSummary = this.ps
      this.isLoading = false
      console.log('Initial state.')
      return // 如果ID没有变化，直接返回
    }
    this.id_list = this.neuronsList
      .filter(neuron => !neuron.id.includes('local'))
      .map(neuron => neuron.id)
    this.stopSSE()
    this.generateDataSummary()
    this.$nextTick(() => {
      this.restartSSE() // 启动新的 SSE 流
    })
  }

  private generateDataSummary () {
    this.isLoading = true
    this.basicInfoSummary = ''
    this.morphologySummaries = ''
    this.projectionInfoSummary = ''
    this.completedSegments = 0 // 重置计数器
    this.messageQueue = [] // 重置消息队列
    this.isProcessing = false // 重置处理状态
    this.$nextTick(() => {
    })
  }

  private appendTextGradually (target: 'basicInfoSummary' | 'projectionInfoSummary' | 'morphologySummaries' |string, text: string) {
    this.messageQueue.push({ target, text })
    this.processQueue()
  }

  private processQueue () {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return
    }

    this.isProcessing = true
    const { target, text } = this.messageQueue.shift()!
    let targetArray: string[] | null = null

    let targetCopy = target // 复制target变量

    // if (targetCopy.startsWith('morphologySummaries')) {
    //   const index = parseInt(targetCopy.split('[')[1].split(']')[0], 10)
    //   targetArray = this.morphologySummaries
    //   targetCopy = index.toString()
    // }

    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        if (targetArray) {
          Vue.set(targetArray, parseInt(targetCopy), (targetArray[parseInt(targetCopy)] || '') + text[currentIndex++])
        } else {
          Vue.set(this, targetCopy, (this as any)[targetCopy] + text[currentIndex++])
        }
      } else {
        clearInterval(intervalId)
        this.isProcessing = false
        if (['basicInfoSummary', 'projectionInfoSummary', 'morphologySummaries'].includes(target)) {
          this.completedSegments += 1 // 增加计数器
          if (this.completedSegments === 3) {
            this.isLoading = false // 只有所有段完成后，才取消加载状态
          }
        }
        this.processQueue() // 处理下一个消息
      }
    }, 5) // 控制字符显示速度，可以调整时间间隔
  }

  // 生成唯一的 connectionId
  private generateConnectionId (): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      // eslint-disable-next-line eqeqeq
      const r = Math.random() * 16 | 0; const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // 启动 SSE
  public startSSE (): void {
    this.currentConnectionId = this.generateConnectionId() // 生成唯一的 connectionId
    const neuronlists = { id_list: this.id_list }

    fetch(`https://neuroxiv.org/api/start_stream?connectionId=${this.currentConnectionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      },
      body: JSON.stringify(neuronlists),
      credentials: 'include'
    })
      .then(response => {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let stopReading = false

        const readStream = (): Promise<void> => {
          if (stopReading) {
            console.log('Stream stopped')
            return Promise.resolve()
          }

          return reader?.read().then(({ done, value }) => {
            if (done) {
              console.log('Stream complete')
              return
            }

            const text = decoder.decode(value, { stream: true })
            text.split('\n\n').forEach(eventString => {
              if (eventString.trim() !== '') {
                const event = eventString.replace(/^data: /, '')
                const data = JSON.parse(event)

                // 只处理当前 connectionId 的消息
                if (data.connectionId === this.currentConnectionId) {
                  if (data.type === 'basicInfo') {
                    this.appendTextGradually('basicInfoSummary', data.content)
                  } else if (data.type === 'morphologyFeatures') {
                    this.appendTextGradually('morphologySummaries', data.content)
                  } else if (data.type === 'projectionInfo') {
                    this.appendTextGradually('projectionInfoSummary', data.content)
                  } else if (data.type === 'end') {
                    stopReading = true // 结束流读取
                  }
                }
              }
            })

            return readStream() // 继续读取流
          }) as Promise<void>
        }

        return readStream()
      })
      .catch(error => {
        console.error('Error in SSE fetch:', error)
        this.isLoading = false
      })
  }

  public stopSSE (): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    // 通知后端停止 SSE 连接
    fetch(`https://neuroxiv.org/api/stop_stream?connectionId=${this.currentConnectionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to stop the stream on the server')
        }
        return response.json()
      })
      .then(data => {
        console.log('Server response:', data)
      })
      .catch(error => {
        console.error('Error stopping SSE:', error)
      })
    this.currentConnectionId = null
  }

  public restartSSE () {
    if (this.eventSource) {
      this.eventSource.close()
    }
    this.startSSE()
  }

  mounted () {
    this.$nextTick(() => {
      if (!this.hasStartedSSE) {
        this.hasStartedSSE = false
      }
    })
  }

  beforeDestroy () {
    if (this.eventSource) {
      this.eventSource.close()
    }
    this.hasInitialized = true
  }

  // private handleCollapseChange (val: string[]) {
  //   this.activeSection = val
  //   if (val.includes('dataSummary') && !this.hasStartedSSE) {
  //     this.startSSE()
  //     this.hasStartedSSE = true
  //     this.messageQueue = []
  //   }
  //   // if (!val.includes('dataSummary') && this.hasStartedSSE) {
  //   //   this.stopSSE()
  //   //   this.hasStartedSSE = false
  //   //   this.messageQueue = []
  //   // }
  // }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.summary-container {
  padding: 15px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-container p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

.summary-container ul {
  padding-left: 20px;
  list-style-type: disc;
}

.summary-container ul li {
  margin: 5px 0;
  font-size: 14px;
  color: #555;
}
.no-bullets {
  list-style-type: none;
  padding-left: 0;
}

</style>

