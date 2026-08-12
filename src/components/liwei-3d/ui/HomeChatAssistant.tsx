'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Trash2, X } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = ['介绍一下李伟', '他的项目经验？', '为什么适合这个岗位？']

function createSessionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function HomeChatAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('home_chat_session_id') || createSessionId()
    sessionStorage.setItem('home_chat_session_id', stored)
    setSessionId(stored)
  }, [])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages])

  const send = async (preset?: string) => {
    const question = (preset || input).trim()
    if (!question || loading) return
    const currentSession = sessionId || createSessionId()
    setSessionId(currentSession)
    sessionStorage.setItem('home_chat_session_id', currentSession)
    setInput('')
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', content: question }, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, sessionId: currentSession }),
      })
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'AI 助手暂时无法回答')
      }
      if (contentType.includes('application/json')) {
        const payload = await response.json()
        const answer = payload?.message || payload?.error || 'AI 助手暂时无法回答'
        setMessages((current) => current.map((message, index) =>
          index === current.length - 1 ? { ...message, content: answer } : message
        ))
        return
      }
      if (!response.body) throw new Error('AI 助手暂时无法回答')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((current) => current.map((message, index) =>
          index === current.length - 1 ? { ...message, content: message.content + chunk } : message
        ))
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'AI 助手暂时无法回答'
      setMessages((current) => current.map((item, index) =>
        index === current.length - 1 ? { ...item, content: message } : item
      ))
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    const nextSession = createSessionId()
    sessionStorage.setItem('home_chat_session_id', nextSession)
    setSessionId(nextSession)
    setMessages([])
  }

  return (
    <aside className={`home-ai${open ? ' is-open' : ''}`} onWheel={(event) => event.stopPropagation()}>
      {open ? (
        <section className="home-ai-panel" aria-label="AI 简历助手">
          <header className="home-ai-header">
            <div><span className="home-ai-index">AI / 01</span><h2>简历助手</h2></div>
            <div className="home-ai-actions">
              <button type="button" onClick={clear} title="清空对话"><Trash2 size={16} /></button>
              <button type="button" onClick={() => setOpen(false)} title="关闭"><X size={18} /></button>
            </div>
          </header>
          <div className="home-ai-messages" ref={scrollRef}>
            {!messages.length ? (
              <div className="home-ai-empty">
                <p>从项目、经历和岗位匹配度开始了解李伟。</p>
                <div>{SUGGESTIONS.map((item) => <button type="button" key={item} onClick={() => void send(item)}>{item}</button>)}</div>
              </div>
            ) : messages.map((message, index) => (
              <div className={`home-ai-message is-${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === 'user' ? 'YOU' : 'AI'}</span>
                <p>{message.content || (loading ? '正在整理...' : '')}</p>
              </div>
            ))}
          </div>
          <form className="home-ai-input" onSubmit={(event) => { event.preventDefault(); void send() }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="询问经历、技能或项目" disabled={loading} />
            <button type="submit" disabled={!input.trim() || loading} title="发送"><Send size={18} /></button>
          </form>
        </section>
      ) : (
        <button className="home-ai-trigger" type="button" onClick={() => setOpen(true)} aria-label="打开 AI 简历助手">
          <Bot size={19} /><span>AI ASSISTANT</span><i aria-hidden="true" />
        </button>
      )}
    </aside>
  )
}
