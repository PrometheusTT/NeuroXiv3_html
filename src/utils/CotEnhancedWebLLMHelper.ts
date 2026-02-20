// // CotGenerator.ts
// // LlmHelper.ts
// import * as webllm from '@mlc-ai/web-llm'
// import neo4j from 'neo4j-driver'
// import { StructureLearning, Inference } from 'pgmpy'
//
// // Neo4j配置
// const neo4jDriver = neo4j.driver(
//   'bolt://localhost:7687',
//   neo4j.auth.basic('neo4j', 'your_password')
// )
//
// // 类型定义
// interface ReasoningStep {
//   step: string;
//   description: string;
//   dataSources?: string[];
// }
//
// interface CoTTemplate {
//   problemType: string;
//   template: string;
//   requiredData: {
//     knowledgeGraph: boolean;
//     bayesianNetwork: boolean;
//   };
// }
//
// interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
// }
//
// // 知识图谱实体定义
// interface BrainRegion {
//   name: string;
//   totalNeurons: number;
//   gene_expression_stats: {
//     expressedGenes: number;
//     top5Genes: string[];
//     markerGenes: string[];
//   };
//   functions: string[];
// }
//
// interface Gene {
//   name: string;
//   expressionLevels: Record<string, number>;
// }
//
// interface Function {
//   name: string;
//   description: string;
// }
//
// interface ProjectionRelation {
//   type: 'PROJECTS_TO';
//   intensity: number;
// }
//
// interface SimilarityRelation {
//   type: 'IS_SIMILAR_WITH';
//   similarityScore: number;
// }
//
// interface ExpressionRelation {
//   type: 'EXPRESSED_IN';
//   intensity: number;
// }
//
// // 知识图谱服务实现
// class KnowledgeGraphService {
//   private driver = neo4jDriver;
//
//   async retrieveSubgraph (userQuery: string): Promise<SubGraphData> {
//     const session = this.driver.session()
//     try {
//       // 提取关键词
//       const keywords = this.extractBrainRegions(userQuery)
//
//       const result = await session.run(
//         `MATCH path=(b:BrainRegion)-[r:PROJECTS_TO|IS_SIMILAR_WITH|IMPLEMENT|EXPRESSED_IN*..3]-(related)
//          WHERE b.name CONTAINS $keyword
//          WITH COLLECT(DISTINCT path) AS paths
//          CALL apoc.convert.toTree(paths) YIELD value
//          RETURN value`,
//         { keyword: keywords[0] || '' }
//       )
//
//       return this.formatSubgraph(result)
//     } finally {
//       await session.close()
//     }
//   }
//
//   private extractBrainRegions (query: string): string[] {
//     return query.match(/[A-Za-z\u4e00-\u9fa5]+脑区/g) || []
//   }
//
//   private formatSubgraph (result: neo4j.QueryResult): SubGraphData {
//     const entities = new Set<string>()
//     const relationships = []
//
//     result.records.forEach(record => {
//       const tree = record.get('value')
//       this.processTree(tree, entities, relationships)
//     })
//
//     return {
//       entities: Array.from(entities),
//       relationships
//     }
//   }
//
//   private processTree (tree: any, entities: Set<string>, relationships: any[]) {
//     if (tree.name) entities.add(tree.name)
//     Object.keys(tree._relationships).forEach(relType => {
//       tree._relationships[relType].forEach((rel: any) => {
//         relationships.push({
//           type: relType,
//           from: tree.name,
//           to: rel.name,
//           properties: rel.properties
//         })
//         this.processTree(rel, entities, relationships)
//       })
//     })
//   }
// }
//
// // 贝叶斯网络服务实现
// class BayesianNetworkService {
//   async analyzeProbabilities (userQuery: string): Promise<BayesianAnalysisResult> {
//     const variables = this.extractVariables(userQuery)
//     const data = await this.fetchTrainingData(variables)
//
//     // 使用pgmpy进行结构学习和推理
//     const model = new StructureLearning(data).estimate()
//     const inference = new Inference(model)
//
//     return {
//       variables,
//       probabilities: inference.query(variables),
//       mostLikelyScenario: inference.mapQuery(variables)
//     }
//   }
//
//   private extractVariables (query: string): string[] {
//     return query.match(/[A-Z][a-zA-Z0-9_]+/g) || []
//   }
//
//   private async fetchTrainingData (variables: string[]): Promise<any[]> {
//     // 从知识图谱获取训练数据
//     const session = neo4jDriver.session()
//     try {
//       const result = await session.run(
//         `MATCH (b:BrainRegion)
//          WHERE b.name IN $variables
//          RETURN b.name as variable, b.totalNeurons as value`,
//         { variables }
//       )
//
//       return result.records.map(record => ({
//         [record.get('variable')]: record.get('value')
//       }))
//     } finally {
//       await session.close()
//     }
//   }
// }
//
// // 增强的LLM助手
// class EnhancedWebLlmHelper extends WebLlmHelper {
//   private cotGenerator: CotGenerator;
//
//   constructor (
//     model: string,
//     kgService: KnowledgeGraphService,
//     bnService: BayesianNetworkService
//   ) {
//     super(model)
//     this.cotGenerator = new CotGenerator(kgService, bnService)
//   }
//
//   async processQuery (query: string): Promise<string> {
//     const problemType = this.detectProblemType(query)
//     const cot = await this.cotGenerator.generateCot(query, problemType)
//
//     this.addMessageToHistory('assistant', `[系统推理框架]\n${cot}`)
//     return super.processQuery(query)
//   }
//
//   private detectProblemType (query: string): string {
//     if (/为什么|原因|机制/.test(query)) return 'diagnostic'
//     if (/预测|将会|可能性/.test(query)) return 'prediction'
//     return 'general'
//   }
//
//   protected getOptimizedHistory (): ChatMessage[] {
//     return this.chatHistory
//       .filter(msg => msg.role === 'user')
//       .slice(-this.maxHistoryMessages)
//   }
// }
//
// // 辅助类型
// interface SubGraphData {
//   entities: string[];
//   relationships: any[];
// }
//
// interface BayesianAnalysisResult {
//   variables: string[];
//   probabilities: Record<string, number>;
//   mostLikelyScenario?: string;
// }
//
// // 初始化服务
// const kgService = new KnowledgeGraphService()
// const bnService = new BayesianNetworkService()
//
// export default new EnhancedWebLlmHelper(
//   'Llama-2-7b-chat-hf-q4f32_1',
//   kgService,
//   bnService
// )
// // // CotGenerator.ts
// // // LlmHelper.ts
// // import * as webllm from '@mlc-ai/web-llm'
// // interface ReasoningStep {
// //   step: string;
// //   description: string;
// //   dataSources?: string[];
// // }
// //
// // interface CoTTemplate {
// //   problemType: string;
// //   template: string;
// //   requiredData: {
// //     knowledgeGraph: boolean;
// //     bayesianNetwork: boolean;
// //   };
// // }
// //
// // interface ChatMessage {
// //   role: 'user' | 'assistant';
// //   content: string;
// // }
// //
// // class WebLlmHelper {
// //   private engine: webllm.MLCEngineInterface | null = null;
// //   private selectedModel: string;
// //   protected chatHistory: ChatMessage[] = [];
// //   private readonly maxContextLength: number = 2048; // 最大上下文长度
// //   protected readonly maxHistoryMessages: number = 6; // 最大保留的历史消息数
// //
// //   constructor (model: string) {
// //     this.selectedModel = model
// //   }
// //
// //   async initializeLlm (): Promise<void> {
// //     try {
// //       this.engine = await webllm.CreateMLCEngine(
// //         this.selectedModel,
// //         {
// //           logLevel: 'INFO'
// //         },
// //         {
// //           context_window_size: this.maxContextLength
// //         }
// //       )
// //       console.log('LLM model loaded successfully!')
// //     } catch (error) {
// //       console.error('Failed to initialize LLM model:', error)
// //       throw error
// //     }
// //   }
// //
// //   /**
// //    * 处理查询并维护对话历史
// //    */
// //   async processQuery (query: string): Promise<string> {
// //     if (!this.engine) {
// //       throw new Error('LLM engine is not initialized.')
// //     }
// //
// //     // 添加用户消息到历史
// //     this.addMessageToHistory('user', query)
// //
// //     try {
// //       const response = await this.engine.chat.completions.create({
// //         messages: this.getOptimizedHistory(),
// //         n: 1,
// //         temperature: 1.0,
// //         max_tokens: 1024,
// //         stream: true
// //       })
// //
// //       // 处理流式响应
// //       let fullResponse = ''
// //       for await (const chunk of response) {
// //         const content = chunk.choices[0]?.delta?.content || ''
// //         fullResponse += content
// //       }
// //
// //       // 添加助手响应到历史
// //       this.addMessageToHistory('assistant', fullResponse)
// //
// //       return fullResponse
// //     } catch (error) {
// //       console.error(`Error during inference: ${error.message}`)
// //       throw error
// //     }
// //   }
// //
// //   /**
// //    * 清空对话历史
// //    */
// //   clearHistory (): void {
// //     this.chatHistory = []
// //   }
// //
// //   /**
// //    * 获取当前对话历史（调试用）
// //    */
// //   getHistory (): ChatMessage[] {
// //     return [...this.chatHistory]
// //   }
// //
// //   protected addMessageToHistory (role: 'user' | 'assistant', content: string): void {
// //     this.chatHistory.push({ role, content })
// //     this.trimHistory()
// //   }
// //
// //   /**
// //    * 优化历史记录，确保不超过上下文限制
// //    */
// //   private getOptimizedHistory (): ChatMessage[] {
// //     // 这里可以添加更复杂的优化逻辑，比如基于token计数
// //     return this.chatHistory.slice(-this.maxHistoryMessages)
// //   }
// //
// //   /**
// //    * 修剪历史记录
// //    */
// //   private trimHistory (): void {
// //     // 简单保留最后N条消息的策略
// //     if (this.chatHistory.length > this.maxHistoryMessages) {
// //       this.chatHistory = this.chatHistory.slice(-this.maxHistoryMessages)
// //     }
// //   }
// // }
// //
// // interface BayesianAnalysisResult {
// //   variables: string[];
// //   probabilities: Record<string, number>;
// //   mostLikelyScenario?: string;
// // }
// //
// // class KnowledgeGraphService {
// //   async retrieveSubgraph (userQuery: string) {
// //     return null
// //   }
// // }
// //
// // class BayesianNetworkService {
// //   async analyzeProbabilities (userQuery: string) {
// //     return null
// //   }
// // }
// //
// // class SubGraphData {
// //   entities: any;
// //   relationships: any;
// // }
// //
// // class CotGenerator {
// //   private readonly templates: Map<string, CoTTemplate>;
// //   private readonly knowledgeGraphService: KnowledgeGraphService;
// //   private readonly bayesianNetworkService: BayesianNetworkService;
// //
// //   constructor (
// //     kgService: KnowledgeGraphService,
// //     bnService: BayesianNetworkService
// //   ) {
// //     this.templates = new Map()
// //     this.knowledgeGraphService = kgService
// //     this.bayesianNetworkService = bnService
// //     this.initializeDefaultTemplates()
// //   }
// //
// //   private initializeDefaultTemplates (): void {
// //     this.addTemplate({
// //       problemType: 'diagnostic',
// //       template: `分析步骤：
// // 1. 根据用户问题识别关键实体：{entities}
// // 2. 知识图谱关联：{knowledgeGraph}
// // 3. 贝叶斯网络分析：{bayesianNetwork}
// // 4. 综合评估可能原因`,
// //       requiredData: {
// //         knowledgeGraph: true,
// //         bayesianNetwork: true
// //       }
// //     })
// //
// //     this.addTemplate({
// //       problemType: 'prediction',
// //       template: `预测流程：
// //       1. 识别时间因素和变量：{variables}
// //       2. 历史模式匹配：{knowledgeGraph}
// //       3. 概率趋势分析：{bayesianNetwork}
// //       4. 生成预测结果`,
// //       requiredData: {
// //         knowledgeGraph: true,
// //         bayesianNetwork: true
// //       }
// //     })
// //   }
// //
// //   addTemplate (template: CoTTemplate): void {
// //     this.templates.set(template.problemType, template)
// //   }
// //
// //   async generateCot (
// //     userQuery: string,
// //     problemType: string
// //   ): Promise<string> {
// //     const template = this.templates.get(problemType)
// //     if (!template) {
// //       throw new Error(`No template found for problem type: ${problemType}`)
// //     }
// //
// //     // 知识图谱检索
// //     const kgSubgraph = template.requiredData.knowledgeGraph
// //       ? await this.knowledgeGraphService.retrieveSubgraph(userQuery)
// //       : null
// //
// //     // 贝叶斯网络分析
// //
// //     const bnAnalysis = template.requiredData.bayesianNetwork
// //       ? await this.bayesianNetworkService.analyzeProbabilities(
// //         userQuery
// //       )
// //       : null
// //
// //     return this.fillTemplate(template.template, {
// //       entities: this.extractEntities(userQuery),
// //       knowledgeGraph: this.formatKgData(kgSubgraph),
// //       bayesianNetwork: this.formatBnData(bnAnalysis),
// //       variables: this.extractVariables(userQuery)
// //     })
// //   }
// //
// //   private fillTemplate (template: string, data: Record<string, any>): string {
// //     return template.replace(/{(\w+)}/g, (match, key) => data[key] || '')
// //   }
// //
// //   private extractEntities (query: string): string {
// //     // 实现实体提取逻辑（可集成NLP库）
// //     return query.match(/([A-Z]\w+)/g)?.join(', ') || '未识别到实体'
// //   }
// //
// //   private formatKgData (kgData: SubGraphData | null): string {
// //     if (!kgData) return '无相关图谱数据'
// //     return `相关实体：${kgData.entities.join(', ')}\n关联关系：${
// //       kgData.relationships.join('; ')
// //     }`
// //   }
// //
// //   private formatBnData (bnData: BayesianAnalysisResult | null): string {
// //     if (!bnData) return '无概率分析数据'
// //     return `关键变量：${bnData.variables.join(', ')}\n最高概率场景：${
// //       bnData.mostLikelyScenario || '未确定'
// //     }`
// //   }
// //
// //   private extractVariables (query: string): string {
// //     // 实现变量提取逻辑
// //     return query.match(/(\b\w+_[A-Z]+\b)/g)?.join(', ') || '未识别到特殊变量'
// //   }
// // }
// //
// // // 与现有WebLlmHelper的整合
// // // @ts-ignore
// // class EnhancedWebLlmHelper extends WebLlmHelper {
// //   private cotGenerator: CotGenerator;
// //
// //   constructor (
// //     model: string,
// //     kgService: KnowledgeGraphService,
// //     bnService: BayesianNetworkService
// //   ) {
// //     super(model)
// //     this.cotGenerator = new CotGenerator(kgService, bnService)
// //   }
// //
// //   async processQuery (query: string): Promise<string> {
// //     // 1. 生成CoT
// //     const problemType = this.detectProblemType(query)
// //     const cot = await this.cotGenerator.generateCot(query, problemType)
// //
// //     // 2. 将CoT作为系统提示加入对话
// //     this.addMessageToHistory('assistant', `[系统推理指引]\n${cot}`)
// //
// //     // 3. 调用父类处理流程
// //     return super.processQuery(query)
// //   }
// //
// //   private detectProblemType (query: string): string {
// //     // 实现简单的分类逻辑（可扩展为ML模型）
// //     if (query.includes('为什么') || query.includes('原因')) return 'diagnostic'
// //     if (query.includes('预测') || query.includes('将会')) return 'prediction'
// //     return 'general'
// //   }
// //
// //   // 重写历史管理方法以处理系统消息
// //   private getOptimizedHistory (): ChatMessage[] {
// //     return this.chatHistory.filter(msg => msg.role !== 'assistant')
// //       .slice(-this.maxHistoryMessages)
// //   }
// // }
// //
// // export default EnhancedWebLlmHelper
