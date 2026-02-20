// LlmHelper.ts
import * as webllm from '@mlc-ai/web-llm'

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class WebLlmHelper {
  private engine: webllm.MLCEngineInterface | null = null;
  private selectedModel: string;
  private chatHistory: ChatMessage[] = [];
  private readonly maxContextLength: number = 2048; // 最大上下文长度
  private readonly maxHistoryMessages: number = 6; // 最大保留的历史消息数

  constructor (model: string) {
    this.selectedModel = model
  }

  async initializeLlm (): Promise<void> {
    try {
      this.engine = await webllm.CreateMLCEngine(
        this.selectedModel,
        {
          logLevel: 'INFO'
        },
        {
          context_window_size: this.maxContextLength
        }
      )
      console.log('LLM model loaded successfully!')
    } catch (error) {
      console.error('Failed to initialize LLM model:', error)
      throw error
    }
  }

  /**
   * 处理查询并维护对话历史
   */
  async processQuery (query: string): Promise<string> {
    if (!this.engine) {
      throw new Error('LLM engine is not initialized.')
    }

    // 添加用户消息到历史
    this.addMessageToHistory('user', query)

    try {
      const response = await this.engine.chat.completions.create({
        messages: this.getOptimizedHistory(),
        n: 1,
        temperature: 1.0,
        max_tokens: 1024,
        stream: true
      })

      // 处理流式响应
      let fullResponse = ''
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || ''
        fullResponse += content
      }

      // 添加助手响应到历史
      this.addMessageToHistory('assistant', fullResponse)

      return fullResponse
    } catch (error) {
      console.error(`Error during inference: ${error.message}`)
      throw error
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory (): void {
    this.chatHistory = []
  }

  /**
   * 获取当前对话历史（调试用）
   */
  getHistory (): ChatMessage[] {
    return [...this.chatHistory]
  }

  private addMessageToHistory (role: 'user' | 'assistant', content: string): void {
    this.chatHistory.push({ role, content })
    this.trimHistory()
  }

  /**
   * 优化历史记录，确保不超过上下文限制
   */
  private getOptimizedHistory (): ChatMessage[] {
    // 这里可以添加更复杂的优化逻辑，比如基于token计数
    return this.chatHistory.slice(-this.maxHistoryMessages)
  }

  /**
   * 修剪历史记录
   */
  private trimHistory (): void {
    // 简单保留最后N条消息的策略
    if (this.chatHistory.length > this.maxHistoryMessages) {
      this.chatHistory = this.chatHistory.slice(-this.maxHistoryMessages)
    }
  }
}

export default WebLlmHelper
// // LlmHelper.ts
// import * as webllm from '@mlc-ai/web-llm'
//
// class WebLlmHelper {
//   private engine: webllm.MLCEngineInterface | null = null; // LLM 推理实例
//   private selectedModel: string;
//
//   constructor (model: string) {
//     this.selectedModel = model
//   }
//
//   /**
//    * 初始化 LLM 引擎
//    */
//   async initializeLlm (): Promise<void> {
//     try {
//       // const initProgressCallback = (report: webllm.InitProgressReport) => {
//       //   console.log('Initialization Progress:', report.text)
//       // }
//
//       this.engine = await webllm.CreateMLCEngine(
//         this.selectedModel,
//         {
//           // initProgressCallback,
//           logLevel: 'INFO'
//         },
//         {
//           context_window_size: 2048 // 可选配置，调整上下文窗口大小
//         }
//       )
//
//       console.log('LLM model loaded successfully!')
//     } catch (error) {
//       console.error('Failed to initialize LLM model:', error)
//     }
//   }
//
//   /**
//    * 处理自然语言查询
//    * @param query 查询文本
//    */
//   async processQuery (query: string): Promise<string> {
//     if (!this.engine) {
//       throw new Error('LLM engine is not initialized.')
//     }
//
//     return new Promise((resolve, reject) => {
//       const output: string[] = []
//       const displayPartialResults = (partialResults: string, complete: boolean) => {
//         output.push(partialResults)
//
//         if (complete) {
//           if (output.length === 0) {
//             resolve('Result is empty.')
//           } else {
//             resolve(output.join(' '))
//           }
//         }
//       }
//
//       try {
//         // @ts-ignore
//         this.engine.chat.completions.create({
//           messages: [{ role: 'user', content: query }],
//           n: 1,
//           temperature: 1.0,
//           max_tokens: 256
//         }).then((response) => {
//           displayPartialResults(response.choices[0]?.message?.content || '', true)
//         })
//       } catch (error) {
//         console.error(`Error during inference: ${error.message}`)
//       }
//     })
//   }
// }
//
// export default WebLlmHelper
