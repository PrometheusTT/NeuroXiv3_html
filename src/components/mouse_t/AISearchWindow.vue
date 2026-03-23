<template>
  <div class="chat-window">
    <!-- Welcome state -->
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
      <h3 class="welcome-title">NeuroXiv Search</h3>
      <p class="welcome-subtitle">
        Search neurons using natural language queries.
      </p>
    </div>

    <!-- Chat messages -->
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
          'message-row--system': !message.isUser
        }"
      >
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

        <div
          class="message-body"
          :class="{
            'message-body--user': message.isUser,
            'message-body--system': !message.isUser
          }"
        >
          <div
            class="plain-text"
            v-html="message.text"
          />
          <button
            v-if="isPythonCode(message.text)"
            class="execute-code-btn"
            @click="executePythonCode(message.text)"
            title="Run code"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="play-icon">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="message-time">{{ message.timestamp }}</div>
        </div>

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
      <div class="input-wrapper">
        <textarea
          ref="inputBox"
          v-model="userInput"
          placeholder="Search neurons..."
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
import { Component, Vue } from 'vue-property-decorator'
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

@Component
export default class AISearchWindow extends Vue {
  public messages: {text: string, isUser: Boolean, timestamp: string}[] = []
  private userInput: string = ''
  public lastInput: string = ''
  private Conditions: any = searchConditions.children
  public code: string = ''
  public isLoading: boolean = false

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

  public scrollToBottom () {
    this.$nextTick(() => {
      const container = this.$el.querySelector('.chat-messages')
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
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
      this.isLoading = true
      this.$nextTick(() => {
        const el = this.$refs.inputBox as HTMLTextAreaElement
        if (el) el.style.height = 'auto'
      })
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

  public addResponseFromAPI (data: any) {
    this.isLoading = false
    const currentTime = new Date()
    const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')

    if (typeof data === 'string') {
      this.messages.push({
        text: data, isUser: false, timestamp
      })
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
   NeuroXiv Search — Modern UI (Simplified)
   ============================================ */

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

/* Welcome */
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
}

.welcome-subtitle {
  font-size: 0.92em;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Chat area */
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

/* Message rows */
.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-row--user {
  flex-direction: row-reverse;
}

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

.message-body {
  max-width: 78%;
  min-width: 60px;
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

.message-time {
  font-size: 0.7em;
  color: #9ca3af;
  margin-top: 6px;
  text-align: right;
}

.message-body--user .message-time {
  color: rgba(255, 255, 255, 0.6);
}

.plain-text {
  font-size: 0.92em;
  line-height: 1.65;
  word-break: break-word;
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

/* Code execution */
.execute-code-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-top: 6px;
  display: inline-flex;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.15s;
}

.execute-code-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.play-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
}

/* Typing indicator */
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

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); background: #d1d5db; }
  30% { transform: translateY(-6px); background: #667eea; }
}

/* Input area */
.input-area {
  padding: 12px 20px 16px 20px;
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
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
}

.send-btn:disabled {
  cursor: default;
}

/* Article results */
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

.message-body >>> .article-body { flex: 1; }
.message-body >>> .article-title { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.message-body >>> .article-meta { font-size: 0.82em; color: #6b7280; margin-bottom: 4px; }
.message-body >>> .article-score { font-size: 0.78em; color: #667eea; font-weight: 600; margin-bottom: 6px; }
.message-body >>> .article-summary { font-size: 0.85em; color: #4b5563; line-height: 1.5; margin-bottom: 6px; }
.message-body >>> .article-link { font-size: 0.8em; color: #667eea; text-decoration: none; }
.message-body >>> .article-link:hover { text-decoration: underline; }
.message-body >>> .empty-result { text-align: center; color: #9ca3af; padding: 8px 0; }
</style>
