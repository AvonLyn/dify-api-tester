import React, { useState, useRef } from 'react'
import { Layout, Input, Button, Form, Card, Space, message, Typography, Tag, Alert, Spin } from 'antd'
import axios from 'axios'
import './App.css'

const { Header, Sider, Content } = Layout
const { TextArea } = Input
const { Title, Text } = Typography

// API 配置（与 HTML 版本相同）
const API_GROUPS = {
  chat: {
    name: '对话与智能体 (Chat & Agent)',
    apis: [
      { 
        id: 'chat-messages', 
        name: '发送对话消息', 
        path: '/chat-messages',
        method: 'POST',
        description: '创建对话消息，支持阻塞和流式响应'
      },
      { 
        id: 'stop-chat', 
        name: '停止对话生成', 
        path: '/chat-messages/:task_id/stop',
        method: 'POST',
        description: '停止正在生成的对话响应'
      },
      { 
        id: 'chat-suggestions', 
        name: '获取建议问题', 
        path: '/chat-messages/:message_id/suggested-questions',
        method: 'GET',
        description: '获取下一轮对话的建议问题'
      },
      { 
        id: 'conversations', 
        name: '会话管理', 
        path: '/conversations',
        method: 'GET',
        description: '获取会话列表'
      },
      { 
        id: 'messages', 
        name: '消息历史', 
        path: '/messages',
        method: 'GET',
        description: '获取消息历史记录'
      },
      { 
        id: 'message-feedback', 
        name: '消息反馈', 
        path: '/messages/:message_id/feedbacks',
        method: 'POST',
        description: '对消息进行点赞或点踩'
      }
    ]
  },
  knowledge: {
    name: '知识库 (Knowledge Base)',
    apis: [
      { 
        id: 'create-dataset', 
        name: '创建知识库', 
        path: '/datasets',
        method: 'POST',
        description: '创建一个新的空知识库'
      },
      { 
        id: 'list-datasets', 
        name: '获取知识库列表', 
        path: '/datasets',
        method: 'GET',
        description: '获取所有知识库列表'
      },
      { 
        id: 'delete-dataset', 
        name: '删除知识库', 
        path: '/datasets/:dataset_id',
        method: 'DELETE',
        description: '删除指定的知识库'
      },
      { 
        id: 'create-document-text', 
        name: '通过文本创建文档', 
        path: '/datasets/:dataset_id/document/create_by_text',
        method: 'POST',
        description: '使用文本内容创建新文档'
      },
      { 
        id: 'create-document-file', 
        name: '通过文件创建文档', 
        path: '/datasets/:dataset_id/document/create-by-file',
        method: 'POST',
        description: '上传文件创建新文档'
      },
      { 
        id: 'update-document-text', 
        name: '更新文档(文本)', 
        path: '/datasets/:dataset_id/documents/:document_id/update_by_text',
        method: 'POST',
        description: '使用文本更新已有文档'
      },
      { 
        id: 'update-document-file', 
        name: '更新文档(文件)', 
        path: '/datasets/:dataset_id/documents/:document_id/update-by-file',
        method: 'POST',
        description: '使用文件更新已有文档'
      },
      { 
        id: 'list-documents', 
        name: '获取文档列表', 
        path: '/datasets/:dataset_id/documents',
        method: 'GET',
        description: '获取知识库中的文档列表'
      },
      { 
        id: 'delete-document', 
        name: '删除文档', 
        path: '/datasets/:dataset_id/documents/:document_id',
        method: 'DELETE',
        description: '删除指定文档'
      },
      { 
        id: 'document-status', 
        name: '获取文档嵌入状态', 
        path: '/datasets/:dataset_id/documents/:batch/indexing-status',
        method: 'GET',
        description: '查询文档处理进度'
      },
      { 
        id: 'add-segments', 
        name: '添加文档分段', 
        path: '/datasets/:dataset_id/documents/:document_id/segments',
        method: 'POST',
        description: '向文档添加新的分段内容'
      },
      { 
        id: 'list-segments', 
        name: '获取文档分段', 
        path: '/datasets/:dataset_id/documents/:document_id/segments',
        method: 'GET',
        description: '获取文档的所有分段'
      },
      { 
        id: 'update-segment', 
        name: '更新分段', 
        path: '/datasets/:dataset_id/documents/:document_id/segments/:segment_id',
        method: 'POST',
        description: '更新指定分段内容'
      },
      { 
        id: 'delete-segment', 
        name: '删除分段', 
        path: '/datasets/:dataset_id/documents/:document_id/segments/:segment_id',
        method: 'DELETE',
        description: '删除指定分段'
      },
      { 
        id: 'retrieve-chunks', 
        name: '检索知识库', 
        path: '/datasets/:dataset_id/retrieve',
        method: 'POST',
        description: '从知识库中检索相关内容'
      }
    ]
  },
  workflow: {
    name: '工作流 (Workflow)',
    apis: [
      { 
        id: 'run-workflow', 
        name: '执行工作流', 
        path: '/workflows/run',
        method: 'POST',
        description: '执行工作流，支持阻塞和流式响应'
      },
      { 
        id: 'stop-workflow', 
        name: '停止工作流', 
        path: '/workflows/:task_id/stop',
        method: 'POST',
        description: '停止正在执行的工作流'
      }
    ]
  },
  completion: {
    name: '文本生成 (Text Completion)',
    apis: [
      { 
        id: 'completion-messages', 
        name: '文本生成', 
        path: '/completion-messages',
        method: 'POST',
        description: '生成文本内容，支持阻塞和流式响应'
      },
      { 
        id: 'stop-completion', 
        name: '停止文本生成', 
        path: '/completion-messages/:task_id/stop',
        method: 'POST',
        description: '停止正在生成的文本'
      }
    ]
  }
}

interface ApiItem {
  id: string
  name: string
  path: string
  method: string
  description: string
}

interface HistoryItem {
  id: number
  timestamp: string
  api: string
  method: string
  url: string
  status: 'success' | 'error'
  request: any
  response: any
}

function App() {
  const [config, setConfig] = useState({
    baseUrl: 'https://api.dify.ai/v1',
    apiKey: ''
  })
  
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)
  const [requestData, setRequestData] = useState<any>({})
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [streamingData, setStreamingData] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  // 处理 API 选择
  const handleApiSelect = (api: ApiItem) => {
    setSelectedApi(api)
    setResponse(null)
    setStreamingData('')
    
    // 根据 API 设置默认请求数据
    const defaultData = getDefaultRequestData(api)
    setRequestData(defaultData)
  }

  // 获取默认请求数据
  const getDefaultRequestData = (api: ApiItem) => {
    switch (api.id) {
      case 'chat-messages':
        return {
          inputs: {},
          query: "你好，请介绍一下你自己",
          response_mode: "blocking",
          user: "test-user",
          conversation_id: "",
          files: []
        }
      
      case 'create-dataset':
        return {
          name: "测试知识库",
          description: "这是一个测试知识库",
          permission: "only_me"
        }
      
      case 'create-document-text':
        return {
          name: "测试文档",
          text: "这是测试文档的内容",
          indexing_technique: "high_quality",
          process_rule: {
            mode: "automatic"
          }
        }
      
      case 'retrieve-chunks':
        return {
          query: "测试查询",
          retrieval_model: {
            search_method: "keyword_search",
            reranking_enable: false,
            top_k: 5,
            score_threshold_enabled: false
          }
        }
      
      case 'completion-messages':
        return {
          inputs: {
            query: "请生成一段关于人工智能的介绍"
          },
          response_mode: "blocking",
          user: "test-user"
        }
      
      case 'run-workflow':
        return {
          inputs: {},
          response_mode: "blocking",
          user: "test-user"
        }
      
      default:
        return {}
    }
  }

  // 构建请求 URL
  const buildRequestUrl = (api: ApiItem) => {
    let url = config.baseUrl + api.path
    
    // 替换路径参数
    const pathParams = api.path.match(/:(\w+)/g)
    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.substring(1)
        const value = requestData[paramName] || ''
        url = url.replace(param, value)
      })
    }
    
    return url
  }

  // 发送请求
  const sendRequest = async () => {
    if (!config.apiKey) {
      message.error('请先配置 API Key')
      return
    }
    
    if (!selectedApi) {
      message.error('请先选择一个 API')
      return
    }
    
    setLoading(true)
    setResponse(null)
    setStreamingData('')
    
    const url = buildRequestUrl(selectedApi)
    const headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }
    
    try {
      // 检查是否是流式响应
      const isStreamingRequest = requestData.response_mode === 'streaming'
      
      if (isStreamingRequest) {
        // 处理流式响应
        setIsStreaming(true)
        const response = await fetch(url, {
          method: selectedApi.method,
          headers: headers,
          body: selectedApi.method !== 'GET' ? JSON.stringify(requestData) : undefined
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6)
                if (data === '[DONE]') continue
                
                try {
                  const parsed = JSON.parse(data)
                  setStreamingData(prev => prev + JSON.stringify(parsed, null, 2) + '\n\n')
                } catch (e) {
                  console.error('Parse error:', e)
                }
              }
            }
          }
        }
        
        setIsStreaming(false)
      } else {
        // 处理普通请求
        const axiosConfig: any = {
          method: selectedApi.method,
          url: url,
          headers: headers
        }
        
        if (selectedApi.method !== 'GET') {
          axiosConfig.data = requestData
        }
        
        const result = await axios(axiosConfig)
        setResponse(result.data)
      }
      
      // 添加到历史记录
      const historyItem: HistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        api: selectedApi.name,
        method: selectedApi.method,
        url: url,
        status: 'success',
        request: requestData,
        response: response || { streaming: true }
      }
      
      setHistory(prev => [historyItem, ...prev.slice(0, 19)])
      message.success('请求成功')
      
    } catch (error: any) {
      console.error('Request error:', error)
      setResponse({ error: error.message })
      
      const historyItem: HistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        api: selectedApi.name,
        method: selectedApi.method,
        url: url,
        status: 'error',
        request: requestData,
        response: { error: error.message }
      }
      
      setHistory(prev => [historyItem, ...prev.slice(0, 19)])
      message.error('请求失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 渲染侧边栏
  const renderSidebar = () => (
    <Sider width={280} className="sidebar">
      <div style={{ padding: '16px' }}>
        <Title level={5}>API 列表</Title>
      </div>
      {Object.entries(API_GROUPS).map(([groupKey, group]) => (
        <div key={groupKey} className="api-section">
          <div className="api-group-title">{group.name}</div>
          {group.apis.map(api => (
            <div
              key={api.id}
              className={`api-item ${selectedApi?.id === api.id ? 'active' : ''}`}
              onClick={() => handleApiSelect(api)}
            >
              <Tag color={api.method === 'GET' ? 'green' : api.method === 'POST' ? 'blue' : 'red'}>
                {api.method}
              </Tag>
              <span style={{ marginLeft: 8 }}>{api.name}</span>
            </div>
          ))}
        </div>
      ))}
    </Sider>
  )

  // 渲染请求参数表单
  const renderRequestForm = () => {
    if (!selectedApi) return null
    
    return (
      <Card title="请求参数" className="request-section">
        <Form layout="vertical">
          <Form.Item label="请求 URL">
            <Input value={buildRequestUrl(selectedApi)} disabled />
          </Form.Item>
          
          <Form.Item label="请求方法">
            <Tag color={selectedApi.method === 'GET' ? 'green' : selectedApi.method === 'POST' ? 'blue' : 'red'}>
              {selectedApi.method}
            </Tag>
          </Form.Item>
          
          {selectedApi.path.includes(':') && (
            <Alert
              message="路径参数"
              description="请在下方的请求体中填写路径参数值"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {selectedApi.method !== 'GET' && (
            <Form.Item label="请求体 (JSON)">
              <TextArea
                rows={10}
                value={JSON.stringify(requestData, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setRequestData(data)
                  } catch (error) {
                    // JSON 解析错误，暂时不处理
                  }
                }}
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          )}
          
          <Form.Item>
            <Button
              type="primary"
              onClick={sendRequest}
              loading={loading}
              size="large"
              block
            >
              发送请求
            </Button>
          </Form.Item>
        </Form>
      </Card>
    )
  }

  // 渲染响应结果
  const renderResponse = () => {
    if (!response && !streamingData) return null
    
    return (
      <Card title="响应结果" className="response-section">
        {streamingData ? (
          <div>
            <Title level={5}>流式响应数据</Title>
            <div className="streaming-content">
              <pre>{streamingData}</pre>
            </div>
          </div>
        ) : (
          <div className="json-viewer">
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </Card>
    )
  }

  // 渲染历史记录
  const renderHistory = () => (
    <Card title="请求历史" style={{ marginTop: 24 }}>
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {history.length === 0 ? (
          <Text type="secondary">暂无请求历史</Text>
        ) : (
          history.map(item => (
            <div key={item.id} className="history-item">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Text type="secondary">{item.timestamp}</Text>
                  <Tag color={item.method === 'GET' ? 'green' : item.method === 'POST' ? 'blue' : 'red'}>
                    {item.method}
                  </Tag>
                  <Text strong>{item.api}</Text>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status === 'success' ? '成功' : '失败'}
                  </span>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.url}</Text>
              </Space>
            </div>
          ))
        )}
      </div>
    </Card>
  )

  return (
    <Layout className="api-tester-container">
      <Header className="header">
        <div className="logo">
          <span>🚀</span>
          <span>Dify API 测试工具</span>
        </div>
        <Space>
          <Input
            placeholder="Base URL"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            style={{ width: 300 }}
          />
          <Input.Password
            placeholder="API Key"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            style={{ width: 300 }}
          />
        </Space>
      </Header>
      
      <Layout className="main-content">
        {renderSidebar()}
        
        <Content className="content-area">
          {selectedApi ? (
            <>
              <Title level={3}>{selectedApi.name}</Title>
              <Text type="secondary">{selectedApi.description}</Text>
              <Alert
                message="提示"
                description="路径中的参数（如 :dataset_id）需要在请求体 JSON 中添加对应字段"
                type="info"
                showIcon
                style={{ margin: '16px 0' }}
              />
              
              {renderRequestForm()}
              {renderResponse()}
              {renderHistory()}
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column'
            }}>
              <Title level={2} type="secondary">欢迎使用 Dify API 测试工具</Title>
              <Text type="secondary">请从左侧选择一个 API 开始测试</Text>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 