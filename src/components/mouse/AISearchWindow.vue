<template>
  <div class="chat-window">
    <!-- Welcome state when no messages -->
    <div
      v-if="messages.length === 0"
      class="welcome-state"
    >
      <div class="welcome-icon">
        <img
          src="../../../public/img/AIPOM.png"
          alt="AIPOM"
          class="welcome-avatar"
        >
      </div>
      <h3 class="welcome-title">AIPOM Analysis</h3>
      <p class="welcome-subtitle">
        Ask me about brain regions, neurons, connectivity, morphology, and more.
      </p>
      <div class="welcome-suggestions">
        <div
          class="suggestion-chip"
          @click="useSuggestion('What neurons are in the SFG region?')"
        >
          What neurons are in the SFG region?
        </div>
        <div
          class="suggestion-chip"
          @click="useSuggestion('Compare connectivity between MFG and STG')"
        >
          Compare connectivity between MFG and STG
        </div>
        <div
          class="suggestion-chip"
          @click="useSuggestion('Show me the morphology of pyramidal neurons')"
        >
          Show me the morphology of pyramidal neurons
        </div>
      </div>
    </div>

    <!-- Chat messages area -->
    <div
      v-else
      class="chat-messages"
    >
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-row"
        :class="{
          'message-row--user': message.isUser,
          'message-row--system': !message.isUser,
          'message-enter': message._animating
        }"
      >
        <!-- System avatar -->
        <div
          v-if="!message.isUser"
          class="avatar-wrapper"
        >
          <img
            src="../../../public/img/AIPOM.png"
            alt="AIPOM"
            class="avatar"
          >
        </div>

        <!-- Message content -->
        <div
          class="message-body"
          :class="{
            'message-body--user': message.isUser,
            'message-body--system': !message.isUser
          }"
        >
          <!-- ===== Structured AIPOM response ===== -->
          <template v-if="!message.isUser && message.structured">
            <!-- Summary always on top, prominent -->
            <div class="response-summary">
              <div
                class="summary-text"
                v-html="message.summaryHtml"
              />
            </div>

            <!-- Detail cards -->
            <div class="detail-cards">
              <!-- Reasoning Process -->
              <div class="detail-card">
                <div
                  class="card-header"
                  @click="toggleSection(index, 'reasoning')"
                >
                  <div class="card-header-left">
                    <span class="card-icon card-icon--reasoning">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>
                    </span>
                    <span class="card-title">Reasoning Process</span>
                  </div>
                  <svg
                    class="card-chevron"
                    :class="{ 'card-chevron--open': isSectionOpen(index, 'reasoning') }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <transition name="slide">
                  <div
                    v-show="isSectionOpen(index, 'reasoning')"
                    class="card-body"
                  >
                    <div
                      class="card-content"
                      v-html="message.reasoningHtml"
                    />
                  </div>
                </transition>
              </div>

              <!-- Evidence Data -->
              <div class="detail-card">
                <div
                  class="card-header"
                  @click="toggleSection(index, 'evidence')"
                >
                  <div class="card-header-left">
                    <span class="card-icon card-icon--evidence">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
                    </span>
                    <span class="card-title">Evidence Data</span>
                  </div>
                  <svg
                    class="card-chevron"
                    :class="{ 'card-chevron--open': isSectionOpen(index, 'evidence') }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <transition name="slide">
                  <div
                    v-show="isSectionOpen(index, 'evidence')"
                    class="card-body"
                  >
                    <div
                      class="card-content"
                      v-html="message.evidenceHtml"
                    />
                  </div>
                </transition>
              </div>

              <!-- Firing Models -->
              <div
                v-if="message.svgs && message.svgs.length > 0"
                class="detail-card"
              >
                <div
                  class="card-header"
                  @click="toggleSection(index, 'svgs')"
                >
                  <div class="card-header-left">
                    <span class="card-icon card-icon--model">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                    </span>
                    <span class="card-title">Firing Models</span>
                  </div>
                  <svg
                    class="card-chevron"
                    :class="{ 'card-chevron--open': isSectionOpen(index, 'svgs') }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <transition name="slide">
                  <div
                    v-show="isSectionOpen(index, 'svgs')"
                    class="card-body"
                  >
                    <div class="card-content">
                      <div
                        v-for="svg in message.svgs"
                        :key="svg.model_id"
                        class="svg-item"
                      >
                        <div class="svg-label">{{ svg.human_region }} / Neuron {{ svg.neuron_id }}</div>
                        <div
                          class="svg-container"
                          v-html="svg.svg_content"
                        />
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- Tool Calls -->
              <div
                v-if="message.toolCalls && message.toolCalls.length > 0"
                class="detail-card"
              >
                <div
                  class="card-header"
                  @click="toggleSection(index, 'tools')"
                >
                  <div class="card-header-left">
                    <span class="card-icon card-icon--tools">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
                    </span>
                    <span class="card-title">Tool Calls</span>
                    <span class="card-badge">{{ message.toolCalls.length }}</span>
                  </div>
                  <svg
                    class="card-chevron"
                    :class="{ 'card-chevron--open': isSectionOpen(index, 'tools') }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <transition name="slide">
                  <div
                    v-show="isSectionOpen(index, 'tools')"
                    class="card-body"
                  >
                    <div class="card-content tool-calls-grid">
                      <div
                        v-for="(tc, tcIdx) in message.toolCalls"
                        :key="tcIdx"
                        class="tool-pill"
                        :class="{ 'tool-pill--success': tc.success, 'tool-pill--fail': !tc.success }"
                      >
                        <span class="tool-pill-dot" />
                        <span class="tool-pill-name">{{ tc.tool }}</span>
                        <span
                          v-if="tc.row_count"
                          class="tool-pill-meta"
                        >{{ tc.row_count }} rows</span>
                        <span
                          v-if="tc.is_frontend_action"
                          class="tool-pill-badge"
                        >UI</span>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- Publication Figures -->
              <div
                v-if="message.figures && message.figures.length > 0"
                class="detail-card"
              >
                <div
                  class="card-header"
                  @click="toggleSection(index, 'figures')"
                >
                  <div class="card-header-left">
                    <span class="card-icon card-icon--figures">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>
                    </span>
                    <span class="card-title">Publication Figures</span>
                    <span class="card-badge">{{ message.figures.length }}</span>
                  </div>
                  <svg
                    class="card-chevron"
                    :class="{ 'card-chevron--open': isSectionOpen(index, 'figures') }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <transition name="slide">
                  <div
                    v-show="isSectionOpen(index, 'figures')"
                    class="card-body"
                  >
                    <div class="card-content figures-gallery">
                      <div
                        v-for="(fig, figIdx) in message.figures"
                        :key="figIdx"
                        class="figure-card"
                      >
                        <img
                          :src="'data:image/png;base64,' + fig.base64"
                          :alt="fig.caption || 'Publication figure'"
                          class="figure-image"
                          @click="openFigureFullscreen(fig)"
                        >
                        <div class="figure-footer">
                          <div class="figure-caption">
                            <span class="figure-label">Fig {{ figIdx + 1 }}.</span>
                            {{ fig.caption }}
                          </div>
                          <a
                            :href="getAipomBaseUrl() + '/figure/' + fig.figure_id"
                            target="_blank"
                            class="figure-download"
                            download
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" class="download-icon"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                            300 DPI
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </template>

          <!-- ===== Regular messages ===== -->
          <template v-else>
            <div
              class="plain-text"
              v-html="message.text"
            />
          </template>

          <div class="message-time">
            {{ message.timestamp }}
          </div>
        </div>

        <!-- User avatar -->
        <div
          v-if="message.isUser"
          class="avatar-wrapper"
        >
          <img
            src="../../../public/img/User.png"
            alt="User"
            class="avatar"
          >
        </div>
      </div>

      <!-- Typing indicator -->
      <div
        v-if="isLoading"
        class="message-row message-row--system"
      >
        <div class="avatar-wrapper">
          <img
            src="../../../public/img/AIPOM.png"
            alt="AIPOM"
            class="avatar"
          >
        </div>
        <div class="message-body message-body--system">
          <div class="typing-indicator">
            <span class="typing-dot" />
            <span class="typing-dot" />
            <span class="typing-dot" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <div class="input-controls">
        <div class="mode-switch">
          <el-switch
            :value="searchMode"
            active-value="agentic"
            inactive-value="search"
            @change="$emit('update:searchMode', $event)"
          />
          <span class="mode-label">{{ searchMode === 'agentic' ? 'AIPOM-CoT' : 'Search' }}</span>
        </div>
      </div>
      <div class="input-wrapper">
        <textarea
          ref="inputBox"
          v-model="userInput"
          :placeholder="searchMode === 'agentic' ? 'Ask AIPOM anything about brain data...' : 'Search neurons...'"
          class="input-box"
          rows="1"
          @keydown.enter.exact="handleEnter"
          @input="autoResize"
        />
        <button
          class="send-btn"
          :class="{ 'send-btn--active': userInput.trim().length > 0 }"
          :disabled="!userInput.trim()"
          @click="$emit('AISearch')"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import MarkdownIt from 'markdown-it'
import searchConditions from './search_conditions.json'

interface Criteria {
  [key: string]: any
}

interface SearchNode {
  // eslint-disable-next-line camelcase
  querry_name: string
  type: string
  // eslint-disable-next-line camelcase
  display_name: string
  // eslint-disable-next-line camelcase
  help_info: string
  // eslint-disable-next-line camelcase
  structure_tree: string
  candidates: any[]
  // eslint-disable-next-line camelcase
  min_value: number | null
  // eslint-disable-next-line camelcase
  max_value: number | null
  // eslint-disable-next-line camelcase
  default_min: number | null
  // eslint-disable-next-line camelcase
  default_max: number | null
  name: string
  children?: SearchNode[]
}

interface FiringModelSvg {
  human_region: string
  neuron_id: string
  model_id: string
  svg_content: string | null
}

interface ToolCallInfo {
  tool: string
  success: boolean
  row_count?: number
  is_frontend_action?: boolean
  exec_time?: number
}

interface FigureInfo {
  figure_id: string
  url: string
  base64: string
  caption: string
  figure_type: string
}

interface StructuredMessage {
  text: string
  isUser: Boolean
  timestamp: string
  structured?: boolean
  reasoningHtml?: string
  evidenceHtml?: string
  summaryHtml?: string
  svgs?: FiringModelSvg[]
  toolCalls?: ToolCallInfo[]
  figures?: FigureInfo[]
  _animating?: boolean
}

@Component
export default class AISearchWindow extends Vue {
  @Prop({ type: String, default: 'agentic' }) searchMode!: string

  public messages: StructuredMessage[] = []
  private userInput: string = ''
  public lastInput: string = ''
  private Conditions: any = searchConditions.children
  private expandedSections: { [key: string]: boolean } = {}
  public isLoading: boolean = false

  public toggleSection (messageIndex: number, section: string) {
    const key = `${messageIndex}_${section}`
    this.$set(this.expandedSections, key, !this.expandedSections[key])
  }

  public isSectionOpen (messageIndex: number, section: string): boolean {
    const key = `${messageIndex}_${section}`
    return !!this.expandedSections[key]
  }

  public getAipomBaseUrl (): string {
    return process.env.VUE_APP_AIPOM_URL || 'http://localhost:8100'
  }

  public openFigureFullscreen (fig: FigureInfo) {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>${fig.caption || 'Figure'}</title>
        <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f0f}
        img{max-width:95vw;max-height:95vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.4)}</style></head>
        <body><img src="data:image/png;base64,${fig.base64}" alt="${fig.caption}"></body></html>`)
      w.document.close()
    }
  }

  public scrollToBottom () {
    this.$nextTick(() => {
      const container = this.$el.querySelector('.chat-messages')
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }
    })
  }

  public useSuggestion (text: string) {
    this.userInput = text
    this.$nextTick(() => {
      this.autoResize()
    })
  }

  private handleEnter (e: KeyboardEvent) {
    if (!e.shiftKey) {
      e.preventDefault()
      if (this.userInput.trim()) {
        this.$emit('AISearch')
      }
    }
  }

  private autoResize () {
    const el = this.$refs.inputBox as HTMLTextAreaElement
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  public sendMessage () {
    const userMessage = this.userInput
    if (userMessage) {
      const currentTime = new Date()
      const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')

      this.messages.push({
        text: userMessage,
        isUser: true,
        timestamp: timestamp
      })
      this.lastInput = userMessage
      this.userInput = ''
      this.isLoading = true
      // Reset textarea height
      this.$nextTick(() => {
        const el = this.$refs.inputBox as HTMLTextAreaElement
        if (el) el.style.height = 'auto'
      })
      this.scrollToBottom()
    }
  }

  formatTimestamp (date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  public async addResponseFromAPI (data: any) {
    this.isLoading = false
    const currentTime = new Date()
    const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')
    const md = new MarkdownIt()

    if (typeof data === 'string') {
      const htmlContent = md.render(data)
      this.messages.push({
        text: htmlContent, isUser: false, timestamp
      })
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      if (data.reasoning_process || data.evidence_data || data.summary) {
        const reasoningHtml = data.reasoning_process ? md.render(data.reasoning_process) : ''
        const evidenceHtml = data.evidence_data ? md.render(data.evidence_data) : ''
        const summaryHtml = data.summary ? md.render(data.summary) : ''
        const svgs: FiringModelSvg[] = (data.firing_model_svgs || []).filter((s: FiringModelSvg) => s.svg_content)
        const toolCalls: ToolCallInfo[] = data.tool_calls || []
        const figures: FigureInfo[] = data.figures || []

        this.messages.push({
          text: '',
          isUser: false,
          timestamp,
          structured: true,
          reasoningHtml,
          evidenceHtml,
          summaryHtml,
          svgs,
          toolCalls,
          figures
        })

        if (data.frontend_actions && data.frontend_actions.length > 0) {
          this.$emit('frontendActions', data.frontend_actions)
        }
      } else {
        const htmlContent = md.render(JSON.stringify(data, null, 2))
        this.messages.push({
          text: htmlContent, isUser: false, timestamp
        })
      }
    } else if (Array.isArray(data) && data.length > 0) {
      // eslint-disable-next-line camelcase
      data.forEach((article: { title: string; authors: string; relevance_score: number; related_content: string; summary: string; link: string }, index: number) => {
        let responseMessage = `<div class="article-result">
          <div class="article-index">${index + 1}</div>
          <div class="article-body">
            <div class="article-title">${article.title}</div>
            <div class="article-meta">${article.authors}</div>
            <div class="article-score">Relevance: ${article.relevance_score}</div>
            <div class="article-summary">${article.summary}</div>
            <a href="${article.link}" target="_blank" class="article-link">${article.link}</a>
          </div>
        </div>`
        this.messages.push({ text: responseMessage, isUser: false, timestamp })
      })
    } else if (Array.isArray(data) && data.length === 0) {
      this.messages.push({ text: '<div class="empty-result">No results found.</div>', isUser: false, timestamp })
    }
    this.scrollToBottom()
  }

  public confirmSearch () {
    this.$emit('AISearch')
  }

  public GetIntent (question: string) {
    if (!this.Conditions) return

    let criteria: Criteria = {}
    const words = question.trim().split(/\s+/)

    if (words.includes('axon')) {
      criteria['has_recon_axon'] = true
    }
    if (words.includes('apical')) {
      criteria['has_apical'] = true
    } else if (words.includes('dendrite')) {
      criteria['has_recon_den'] = true
    }
    this.matchConditions(this.Conditions, words, criteria, question.toLowerCase())

    return criteria
  }

  public matchConditions (node: any, words: string[], criteria: any, question: string) {
    if (!node) return

    const excludedConditions = ['has_recon_axon', 'has_recon_den', 'has_apical']
    const containsProjKeyword = words.some(word => word.toLowerCase().includes('projection'))

    if (Array.isArray(node)) {
      node.forEach((child) => this.matchConditions(child, words, criteria, question))
    } else {
      if (node.querry_name && !excludedConditions.includes(node.querry_name)) {
        if (node.querry_name.includes('proj') && !containsProjKeyword) {
          return
        }

        const querryNameKeyword = node.querry_name.toLowerCase()
        if (words.some(word => querryNameKeyword.includes(word.toLowerCase()))) {
          const numberRangeRegex = /\[(\d+(\.\d+)?),\s*(\d+(\.\d+)?)\]/
          const match = question.match(numberRangeRegex)
          if (match) {
            const value = [parseFloat(match[1]), parseFloat(match[3])]
            criteria[node.querry_name] = value
          } else if (node.default_min !== undefined && node.default_max !== undefined) {
            criteria[node.querry_name] = [node.default_min, node.default_max]
          } else {
            criteria[node.querry_name] = true
          }
        }

        if (Array.isArray(node.candidates)) {
          words.forEach((word) => {
            node.candidates.forEach((candidate: any) => {
              if (typeof candidate === 'string' && word.toLowerCase() === candidate.toLowerCase()) {
                if (!criteria[node.querry_name]) {
                  criteria[node.querry_name] = []
                }
                if (!criteria[node.querry_name].includes(candidate)) {
                  criteria[node.querry_name].push(candidate)
                }
              } else if (typeof candidate === 'boolean' && words.includes(node.querry_name.toLowerCase())) {
                criteria[node.querry_name] = true
              }
            })
          })
        }

        if (Array.isArray(criteria[node.querry_name])) {
          criteria[node.querry_name] = criteria[node.querry_name].filter((value: any) => value !== null)
          if (criteria[node.querry_name].length === 0) {
            delete criteria[node.querry_name]
          }
        }
      }

      const ignoreKeywords = ['axon', 'dendrite', 'apical']
      if (!ignoreKeywords.some(keyword => node.name && node.name.toLowerCase().includes(keyword))) {
        if (node.children) {
          this.matchConditions(node.children, words, criteria, question)
        }
      }
    }
  }
}
</script>

<style scoped>
/* ============================================
   AIPOM Chat Window — Modern UI
   ============================================ */

/* --- Layout --- */
.chat-window {
  width: 100%;
  max-width: 820px;
  border-radius: 16px;
  overflow: hidden;
  background: #fafbfc;
  margin: auto;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  min-height: 320px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* --- Welcome State --- */
.welcome-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  text-align: center;
}

.welcome-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
}

.welcome-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
}

.welcome-title {
  font-size: 1.35em;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 0.92em;
  color: #6b7280;
  margin: 0 0 28px 0;
  max-width: 400px;
  line-height: 1.5;
}

.welcome-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 420px;
}

.suggestion-chip {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.85em;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  text-align: left;
}

.suggestion-chip:hover {
  border-color: #667eea;
  background: #f0f1ff;
  color: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);
}

/* --- Chat Messages Area --- */
.chat-messages {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* --- Message Row --- */
.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-row--user {
  flex-direction: row-reverse;
}

.message-row--system {
  flex-direction: row;
}

/* --- Avatar --- */
.avatar-wrapper {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* --- Message Body --- */
.message-body {
  max-width: 78%;
  min-width: 60px;
  position: relative;
}

.message-body--user {
  background: linear-gradient(135deg, #667eea 0%, #5a67d8 100%);
  color: #fff;
  border-radius: 18px 18px 4px 18px;
  padding: 12px 18px;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.2);
}

.message-body--system {
  background: #ffffff;
  color: #1f2937;
  border-radius: 18px 18px 18px 4px;
  padding: 16px 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* --- Timestamp --- */
.message-time {
  font-size: 0.7em;
  color: #9ca3af;
  margin-top: 6px;
  text-align: right;
}

.message-body--user .message-time {
  color: rgba(255, 255, 255, 0.6);
}

/* --- Plain text messages --- */
.plain-text {
  font-size: 0.92em;
  line-height: 1.65;
  word-break: break-word;
}

.plain-text >>> p {
  margin: 0 0 8px 0;
}

.plain-text >>> p:last-child {
  margin-bottom: 0;
}

.plain-text >>> pre,
.plain-text >>> code {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.88em;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.plain-text >>> code {
  padding: 2px 6px;
  border-radius: 4px;
}

/* --- Structured Response: Summary --- */
.response-summary {
  margin-bottom: 12px;
}

.summary-text {
  font-size: 0.93em;
  line-height: 1.7;
  color: #1f2937;
}

.summary-text >>> p {
  margin: 0 0 8px 0;
}

.summary-text >>> p:last-child {
  margin-bottom: 0;
}

.summary-text >>> table {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 0.88em;
  border-radius: 8px;
  overflow: hidden;
}

.summary-text >>> th {
  background: #f0f1ff;
  color: #4338ca;
  font-weight: 600;
  padding: 8px 12px;
  text-align: left;
  border-bottom: 2px solid #e0e2ff;
}

.summary-text >>> td {
  padding: 7px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.summary-text >>> tr:last-child td {
  border-bottom: none;
}

/* --- Detail Cards --- */
.detail-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-card {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #fafbfc;
  transition: border-color 0.2s;
}

.detail-card:hover {
  border-color: #d1d5db;
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.card-header:hover {
  background: #f3f4f6;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 14px;
  height: 14px;
}

.card-icon--reasoning {
  background: #ede9fe;
  color: #7c3aed;
}

.card-icon--evidence {
  background: #dbeafe;
  color: #2563eb;
}

.card-icon--model {
  background: #fce7f3;
  color: #db2777;
}

.card-icon--tools {
  background: #d1fae5;
  color: #059669;
}

.card-icon--figures {
  background: #ffedd5;
  color: #ea580c;
}

.card-title {
  font-weight: 600;
  font-size: 0.85em;
  color: #374151;
}

.card-badge {
  font-size: 0.7em;
  font-weight: 700;
  background: #e5e7eb;
  color: #6b7280;
  padding: 1px 7px;
  border-radius: 10px;
  margin-left: 2px;
}

.card-chevron {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.card-chevron--open {
  transform: rotate(90deg);
}

/* Card body */
.card-body {
  overflow: hidden;
}

.card-content {
  padding: 0 14px 14px 14px;
  font-size: 0.86em;
  line-height: 1.6;
  color: #4b5563;
}

.card-content >>> table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 0.9em;
  border-radius: 6px;
  overflow: hidden;
}

.card-content >>> th {
  background: #f9fafb;
  font-weight: 600;
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.card-content >>> td {
  padding: 5px 10px;
  border-bottom: 1px solid #f3f4f6;
}

/* Slide transition */
.slide-enter-active {
  transition: all 0.3s ease;
  max-height: 2000px;
}

.slide-leave-active {
  transition: all 0.25s ease;
  max-height: 2000px;
}

.slide-enter,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* --- Tool Calls --- */
.tool-calls-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tool-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.82em;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.15s;
}

.tool-pill:hover {
  background: #f3f4f6;
}

.tool-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tool-pill--success .tool-pill-dot {
  background: #10b981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
}

.tool-pill--fail .tool-pill-dot {
  background: #ef4444;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
}

.tool-pill-name {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-weight: 500;
  color: #374151;
}

.tool-pill-meta {
  color: #9ca3af;
  font-size: 0.9em;
}

.tool-pill-badge {
  background: linear-gradient(135deg, #667eea, #5a67d8);
  color: white;
  font-size: 0.7em;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

/* --- SVG Models --- */
.svg-item {
  margin: 10px 0;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.svg-label {
  font-size: 0.8em;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 500;
}

.svg-container >>> svg {
  max-width: 100%;
  height: auto;
}

/* --- Publication Figures --- */
.figures-gallery {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.figure-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.figure-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.figure-image {
  width: 100%;
  display: block;
  cursor: pointer;
  transition: opacity 0.2s;
}

.figure-image:hover {
  opacity: 0.92;
}

.figure-footer {
  padding: 12px 14px;
}

.figure-caption {
  font-size: 0.85em;
  color: #4b5563;
  line-height: 1.5;
}

.figure-label {
  font-weight: 700;
  color: #1f2937;
}

.figure-download {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 0.78em;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}

.figure-download:hover {
  color: #4338ca;
}

.download-icon {
  width: 14px;
  height: 14px;
}

/* --- Typing Indicator --- */
.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 4px 0;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #d1d5db;
  border-radius: 50%;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    background: #d1d5db;
  }
  30% {
    transform: translateY(-6px);
    background: #667eea;
  }
}

/* --- Input Area --- */
.input-area {
  padding: 12px 20px 16px 20px;
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.input-controls {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-label {
  font-size: 0.78em;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.02em;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #f3f4f6;
  border-radius: 14px;
  padding: 6px 6px 6px 16px;
  border: 2px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-box {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.92em;
  color: #1f2937;
  resize: none;
  line-height: 1.5;
  padding: 6px 0;
  max-height: 120px;
  font-family: inherit;
}

.input-box::placeholder {
  color: #9ca3af;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.send-btn--active {
  background: linear-gradient(135deg, #667eea 0%, #5a67d8 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.send-btn--active:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  cursor: default;
}

/* --- Article Results --- */
.message-body >>> .article-result {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.message-body >>> .article-index {
  width: 28px;
  height: 28px;
  background: #f0f1ff;
  color: #4338ca;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85em;
  flex-shrink: 0;
}

.message-body >>> .article-body {
  flex: 1;
}

.message-body >>> .article-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 0.95em;
}

.message-body >>> .article-meta {
  font-size: 0.82em;
  color: #6b7280;
  margin-bottom: 4px;
}

.message-body >>> .article-score {
  font-size: 0.78em;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 6px;
}

.message-body >>> .article-summary {
  font-size: 0.85em;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 6px;
}

.message-body >>> .article-link {
  font-size: 0.8em;
  color: #667eea;
  text-decoration: none;
  word-break: break-all;
}

.message-body >>> .article-link:hover {
  text-decoration: underline;
}

.message-body >>> .empty-result {
  text-align: center;
  color: #9ca3af;
  font-size: 0.9em;
  padding: 8px 0;
}
</style>
