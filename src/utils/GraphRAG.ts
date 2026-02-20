// testNeo4j.js
import NlpHelper from '@/utils/nlpHelper'

const { GraphCypherQAChain } = require('langchain/chains/graph_qa/cypher')
const { OpenAI } = require('@langchain/openai')
const { Neo4jGraph } = require('@langchain/community/graphs/neo4j_graph')

const url = 'bolt://localhost:7687'
const username = 'neo4j'
const password = 'neuroxiv'

export async function queryNeo4j (question: any) {
  try {
    // 初始化 Neo4j 连接
    const graph = await Neo4jGraph.initialize({ url, username, password })
    console.log('Neo4j graph initialized.')

    // 初始化 OpenAI 模型
    const model = new OpenAI({ temperature: 0 })

    // 刷新数据库 schema
    await graph.refreshSchema()
    console.log('Neo4j schema refreshed.')

    // 创建 Cypher QA Chain
    const chain = GraphCypherQAChain.fromLLM({
      llm: model,
      graph
    })

    // 执行查询
    const res = await chain.invoke(question)
    return res
  } catch (error) {
    console.error('Error:', error)
    throw error // 抛出错误以供调用者处理
  }
}
export default { queryNeo4j }
// module.exports = { queryNeo4j }
