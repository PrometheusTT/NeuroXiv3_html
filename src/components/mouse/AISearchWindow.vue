<template>
  <div class="chat-window">
    <div class="chat-messages">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-container"
        :class="{'user-message-container': message.isUser, 'system-message-container': !message.isUser}"
      >
        <img
          v-if="!message.isUser"
          src="../../../public/img/AIPOM.png"
          alt="System Avatar"
          class="avatar system-avatar"
        >
        <div
          class="message-bubble"
          :class="{'user-message': message.isUser, 'system-message': !message.isUser}"
        >
          <!-- Structured AIPOM response -->
          <template v-if="!message.isUser && message.structured">
            <div class="aipom-label">AIPOM Analysis:</div>

            <!-- Reasoning Process - collapsible with fade preview -->
            <div class="collapsible-section">
              <div
                class="section-header"
                @click="toggleSection(index, 'reasoning')"
              >
                <svg
                  class="chevron-icon"
                  :class="{ 'chevron-open': isSectionOpen(index, 'reasoning') }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span class="section-title">Reasoning Process</span>
              </div>
              <div
                class="section-body"
                :class="{
                  'section-collapsed': !isSectionOpen(index, 'reasoning'),
                  'section-expanded': isSectionOpen(index, 'reasoning')
                }"
              >
                <div
                  class="section-content"
                  v-html="message.reasoningHtml"
                />
                <div
                  v-if="!isSectionOpen(index, 'reasoning')"
                  class="fade-overlay"
                  @click="toggleSection(index, 'reasoning')"
                />
              </div>
            </div>

            <!-- Evidence Data - collapsible with fade preview -->
            <div class="collapsible-section">
              <div
                class="section-header"
                @click="toggleSection(index, 'evidence')"
              >
                <svg
                  class="chevron-icon"
                  :class="{ 'chevron-open': isSectionOpen(index, 'evidence') }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span class="section-title">Evidence Data</span>
              </div>
              <div
                class="section-body"
                :class="{
                  'section-collapsed': !isSectionOpen(index, 'evidence'),
                  'section-expanded': isSectionOpen(index, 'evidence')
                }"
              >
                <div
                  class="section-content"
                  v-html="message.evidenceHtml"
                />
                <div
                  v-if="!isSectionOpen(index, 'evidence')"
                  class="fade-overlay"
                  @click="toggleSection(index, 'evidence')"
                />
              </div>
            </div>

            <!-- Summary - always visible -->
            <div class="summary-section">
              <div class="section-title-static">Summary</div>
              <div
                class="summary-content"
                v-html="message.summaryHtml"
              />
            </div>
          </template>

          <!-- Regular messages (plain text / articles / etc.) -->
          <template v-else>
            <span v-html="message.text" />
            <button
              v-if="isPythonCode(message.text)"
              class="execute-code-btn"
              @click="executePythonCode(message.text)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon-play"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          </template>

          <div class="message-timestamp">
            {{ message.timestamp }}
          </div>
        </div>
        <img
          v-if="message.isUser"
          src="../../../public/img/User.png"
          alt="User Avatar"
          class="avatar user-avatar"
        >
      </div>
    </div>
    <!-- Agentic Mode toggle above input -->
    <div class="input-area">
      <div class="mode-toggle-bar">
        <el-switch
          :value="searchMode"
          active-value="agentic"
          inactive-value="search"
          active-text="AIPOM-CoT Mode"
          @change="$emit('update:searchMode', $event)"
        />
      </div>
      <input
        v-model="userInput"
        placeholder="[search]:<your query>"
        class="input-box"
        @keyup.enter="$emit('AISearch')"
      >
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

interface StructuredMessage {
  text: string
  isUser: Boolean
  timestamp: string
  structured?: boolean
  reasoningHtml?: string
  evidenceHtml?: string
  summaryHtml?: string
}

@Component
export default class AISearchWindow extends Vue {
  @Prop({ type: String, default: 'agentic' }) searchMode!: string

  public messages: StructuredMessage[] = []
  private userInput: string = ''
  public lastInput: string = ''
  private Conditions: any = searchConditions.children
  public code: string = ''
  private expandedSections: { [key: string]: boolean } = {}

  public toggleSection (messageIndex: number, section: string) {
    const key = `${messageIndex}_${section}`
    this.$set(this.expandedSections, key, !this.expandedSections[key])
  }

  public isSectionOpen (messageIndex: number, section: string): boolean {
    const key = `${messageIndex}_${section}`
    return !!this.expandedSections[key]
  }

  public scrollToBottom () {
    this.$nextTick(() => {
      const container = this.$el.querySelector('.chat-messages')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
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
      this.scrollToBottom()
    }
  }

  public setCode (code: string) {
    this.code = code
  }

  public isPythonCode (text: string): boolean {
    return text.trim().includes('import')
  }

  public async executePythonCode (code: string) {
    this.$emit('executeCode')
  }

  formatTimestamp (date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  public async addResponseFromAPI (data: any) {
    const currentTime = new Date()
    const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')
    const md = new MarkdownIt()

    if (typeof data === 'string') {
      // Check if this is an "AIPOM Analysis:" prefixed string that came from agentic mode
      // Try to parse if it looks like it might contain structured data
      const htmlContent = md.render(data)
      this.messages.push({
        text: htmlContent, isUser: false, timestamp
      })
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Structured response with reasoning_process, evidence_data, summary
      if (data.reasoning_process || data.evidence_data || data.summary) {
        const reasoningHtml = data.reasoning_process ? md.render(data.reasoning_process) : ''
        const evidenceHtml = data.evidence_data ? md.render(data.evidence_data) : ''
        const summaryHtml = data.summary ? md.render(data.summary) : ''

        this.messages.push({
          text: '',
          isUser: false,
          timestamp,
          structured: true,
          reasoningHtml,
          evidenceHtml,
          summaryHtml
        })
      } else {
        // Generic object, just stringify and render
        const htmlContent = md.render(JSON.stringify(data, null, 2))
        this.messages.push({
          text: htmlContent, isUser: false, timestamp
        })
      }
    } else if (Array.isArray(data) && data.length > 0) {
      // eslint-disable-next-line camelcase
      data.forEach((article: { title: string; authors: string; relevance_score: number; related_content: string; summary: string; link: string }, index: number) => {
        let responseMessage = `<span style="font-weight: bold; font-size: larger;">${index + 1}. Article Title:</span> ${article.title}<br>
          <span style="font-weight: bold; font-size: larger;">Authors:</span> ${article.authors}<br>
          <span style="font-weight: bold; font-size: larger;">Relevance Score:</span> ${article.relevance_score}<br>
          <span style="font-weight: bold; font-size: larger;">Related Content:</span> ${article.related_content}<br>
          <span style="font-weight: bold; font-size: larger;">Summary:</span> ${article.summary}<br>
          <span style="font-weight: bold; font-size: larger;">Link:</span> <a href="${article.link}" target="_blank" style="text-decoration: underline; color: #007bff">${article.link}</a>`
        this.messages.push({ text: responseMessage, isUser: false, timestamp })
      })
    } else if (Array.isArray(data) && data.length === 0) {
      this.messages.push({ text: 'No results found.', isUser: false, timestamp })
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
.chat-window {
  width: 100%;
  max-width: 768px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  margin: auto;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  min-height: 300px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  background: #f7f7f7;
  overflow-y: auto;
}

.message-bubble {
  background: #e1e1e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  margin: 4px 0;
  padding: 10px 20px;
  display: inline-block;
  max-width: 70%;
  position: relative;
}

.user-message {
  background: #007bff;
  color: white;
  float: right;
  clear: both;
  margin-right: 20px;
}

.system-message {
  background: #e1e1e1;
  color: black;
  float: left;
  clear: both;
  margin-left: 20px;
}

/* Input area with mode toggle */
.input-area {
  display: flex;
  flex-direction: column;
  padding: 0 20px 10px 20px;
}

.mode-toggle-bar {
  display: flex;
  align-items: center;
  padding: 8px 0 4px 0;
}

.input-box {
  padding: 12px 20px;
  border-radius: 30px;
  border: 2px solid #007bff;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  margin-top: 6px;
}

/* Collapsible sections */
.collapsible-section {
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  background: rgba(0, 0, 0, 0.03);
  transition: background 0.2s;
}

.section-header:hover {
  background: rgba(0, 0, 0, 0.06);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  transition: transform 0.25s ease;
  flex-shrink: 0;
  color: #666;
}

.chevron-open {
  transform: rotate(90deg);
}

.section-title {
  font-weight: bold;
  font-size: 0.95em;
  color: #333;
}

.section-body {
  position: relative;
  overflow: hidden;
  transition: max-height 0.35s ease;
}

.section-collapsed {
  max-height: 100px;
}

.section-expanded {
  max-height: none;
}

.section-content {
  padding: 8px 12px 12px 12px;
  font-size: 0.88em;
  line-height: 1.5;
  color: #444;
}

.section-content >>> table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 0.85em;
}

.section-content >>> th,
.section-content >>> td {
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: left;
}

.section-content >>> th {
  background: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

/* Fade overlay for collapsed state - semi-transparent peek */
.fade-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(
    to bottom,
    rgba(225, 225, 225, 0) 0%,
    rgba(225, 225, 225, 0.6) 40%,
    rgba(225, 225, 225, 0.95) 100%
  );
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
}

.fade-overlay::after {
  content: 'Click to expand';
  font-size: 0.75em;
  color: #007bff;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s;
}

.fade-overlay:hover::after {
  opacity: 1;
}

/* Summary section */
.summary-section {
  margin: 8px 0 4px 0;
  padding: 0 4px;
}

.section-title-static {
  font-weight: bold;
  font-size: 0.95em;
  color: #333;
  margin-bottom: 6px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.summary-content {
  font-size: 0.92em;
  line-height: 1.6;
  color: #222;
}

.summary-content >>> table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 0.9em;
}

.summary-content >>> th,
.summary-content >>> td {
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: left;
}

.aipom-label {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 6px;
  font-weight: 500;
}

/* Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 10px;
}

.message-timestamp {
  font-size: 0.75em;
  margin-top: 5px;
  color: #999;
  text-align: right;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin: 4px;
}

.user-avatar {
  float: right;
}

.system-avatar {
  float: left;
}

.message-container {
  display: flex;
  align-items: flex-start;
  clear: both;
}

.user-message-container {
  justify-content: flex-end;
}

.system-message-container {
  justify-content: flex-start;
}

.execute-code-btn {
  background-color: #007bff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  right: 10px;
  bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s, transform 0.2s;
}

.icon-play {
  fill: white;
  width: 20px;
  height: 20px;
}

.execute-code-btn:hover {
  background-color: #0056b3;
}

.execute-code-btn:active {
  transform: scale(0.9);
}

pre, code {
  background-color: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
