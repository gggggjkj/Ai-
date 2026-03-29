import { useState, useRef, useEffect } from 'react'
import './App.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AVAILABLE_MODELS = [
  { id: 'MiniMax-M2', name: 'MiniMax-M2', desc: '基礎版' },
  { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5', desc: '強化中文' },
  { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', desc: '旗艦版 最強' },
]

// 預設 API 金鑰
const DEFAULT_API_KEY = 'sk-cp-oCOz4LV1uNHVG-rleKOUhCBexzO5Q-T6KigFc-9RkFQyH6mcRBTquZlgDOYmvWzvWaSXDpDCNbkeH1mSlQDNsEKTeAeKw7ScAnyjg-YZi4kvpV7y8-z3y4E'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [selectedModel, setSelectedModel] = useState('MiniMax-M2.7')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 从本地存储加载模型设置
  useEffect(() => {
    const savedModel = localStorage.getItem('minimax_model')
    if (savedModel) {
      setSelectedModel(savedModel)
    }
  }, [])

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('minimax_api_key', apiKey.trim())
    }
    localStorage.setItem('minimax_model', selectedModel)
    setShowSettings(false)
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem('minimax_model', modelId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !apiKey.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('https://api.minimax.io/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: input.trim() }
          ],
          max_tokens: 4096,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || '抱歉，我没有收到有效的回复。',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ 发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="chat-container">
      {/* 头部 */}
      <header className="chat-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">💬</div>
            <h1>MiniMax 聊天機器人</h1>
          </div>
          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={() => setShowSettings(!showSettings)}
              title="設置"
            >
              ⚙️
            </button>
            <button
              className="btn-icon"
              onClick={clearChat}
              title="清除對話"
            >
              🗑️
            </button>
          </div>
        </div>
      </header>

      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <h3>⚙️ 設置</h3>

            {/* 模型选择 */}
            <div className="model-section">
              <p className="settings-hint">選擇 AI 模型</p>
              <div className="model-buttons">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    className={`model-btn ${selectedModel === model.id ? 'active' : ''}`}
                    onClick={() => handleModelChange(model.id)}
                  >
                    <span className="model-name">{model.name}</span>
                    <span className="model-desc">{model.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key 输入 */}
            <div className="api-section">
              <p className="settings-hint">API 金鑰</p>
              <input
                type="password"
                className="api-input"
                placeholder="sk-cp-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <button className="btn-save" onClick={handleApiKeySave}>
              保存並關閉
            </button>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <main className="chat-main">
        {messages.length === 0 && (
          <div className="empty-chat">
            <div className="empty-icon">👋</div>
            <h3>開始新對話</h3>
            <p>輸入消息開始與 AI 聊天</p>
          </div>
        )}

        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message message-assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="thinking-indicator">
                  <div className="thinking-header">
                    <span className="thinking-icon">🧠</span>
                    <span className="thinking-text">思考中...</span>
                  </div>
                  <div className="thinking-model">{selectedModel} 推理中</div>
                  <div className="thinking-dots">
                    <span className="dot">●</span>
                    <span className="dot">●</span>
                    <span className="dot">●</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 输入区域 */}
      <footer className="chat-footer">
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="message-input"
            placeholder="輸入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </form>
      </footer>
    </div>
  )
}

export default App
