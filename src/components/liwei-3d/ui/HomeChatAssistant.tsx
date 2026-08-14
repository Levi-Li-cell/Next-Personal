'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Copy, Download, QrCode, Send, Share2, Trash2, X } from 'lucide-react'
import QRCode from 'qrcode'
import { selectProfile, useProfileStore } from '../profile/store'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = ['介绍一下李伟', '他的项目经验？', '为什么适合这个岗位？']

function createSessionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height)
  const renderedWidth = image.width * scale
  const renderedHeight = image.height * scale
  context.drawImage(image, x + (width - renderedWidth) / 2, y + (height - renderedHeight) / 2, renderedWidth, renderedHeight)
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const lines: string[] = []
  let line = ''
  for (const character of text) {
    const next = line + character
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = character
      if (lines.length === maxLines) break
    } else {
      line = next
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  lines.slice(0, maxLines).forEach((item, index) => context.fillText(item, x, y + index * lineHeight))
}

export default function HomeChatAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareImage, setShareImage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [sharing, setSharing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [shareError, setShareError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const profileConfig = useProfileStore((state) => state.config)
  const profile = selectProfile(profileConfig)

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

  const refreshShareCard = async () => {
    setSharing(true)
    setShareError('')
    try {
      const url = window.location.href
      const sceneCanvas = document.querySelector<HTMLCanvasElement>('.scene-bg canvas')
      const modelImage = sceneCanvas?.toDataURL('image/png') || ''
      const qrImage = await QRCode.toDataURL(url, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0a0e16', light: '#f4f1ea' },
      })
      setShareUrl(url)
      setShareImage(modelImage)
      setShareCode(qrImage)
    } catch (error) {
      console.error('Unable to generate share card', error)
      setShareError('卡片生成失败，请稍后重试。')
    } finally {
      setSharing(false)
    }
  }

  const openShareCard = () => {
    setShareOpen(true)
    void refreshShareCard()
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // Clipboard access can be unavailable outside a secure browser context.
      window.prompt('复制链接', shareUrl)
    }
  }

  const downloadShareCard = async () => {
    if (!shareImage || !shareCode || downloading) return
    setDownloading(true)
    try {
      const [modelImage, qrImage] = await Promise.all([loadCanvasImage(shareImage), loadCanvasImage(shareCode)])
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 900
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable')

      context.fillStyle = '#0a0e16'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.save()
      context.beginPath()
      context.rect(0, 0, 860, canvas.height)
      context.clip()
      drawCoverImage(context, modelImage, 0, 0, 860, canvas.height)
      const shade = context.createLinearGradient(0, 360, 0, 900)
      shade.addColorStop(0, 'rgba(10, 14, 22, 0)')
      shade.addColorStop(1, 'rgba(10, 14, 22, 0.7)')
      context.fillStyle = shade
      context.fillRect(0, 0, 860, canvas.height)
      context.restore()

      context.fillStyle = '#c7e56b'
      context.fillRect(920, 94, 52, 4)
      context.font = '500 20px "Microsoft YaHei", sans-serif'
      context.fillText('PERSONAL SPACE / 2026', 920, 70)
      context.fillStyle = '#f4f1ea'
      context.font = '500 66px "Songti SC", "Microsoft YaHei", sans-serif'
      drawWrappedText(context, profile.name, 920, 192, 560, 78, 2)
      context.font = '400 28px "Microsoft YaHei", sans-serif'
      context.fillStyle = '#f4f1ea'
      context.fillText(profile.role, 920, 370)
      context.font = '400 24px "Microsoft YaHei", sans-serif'
      context.fillStyle = 'rgba(244, 241, 234, 0.68)'
      drawWrappedText(context, profile.about.zh.paragraph, 920, 448, 540, 42, 5)

      context.fillStyle = '#f4f1ea'
      context.fillRect(1215, 685, 220, 220)
      context.drawImage(qrImage, 1227, 697, 196, 196)
      context.fillStyle = '#c7e56b'
      context.font = '500 18px "Microsoft YaHei", sans-serif'
      context.fillText('LIVE MODEL', 42, 858)
      context.fillStyle = 'rgba(244, 241, 234, 0.68)'
      context.font = '400 18px "Microsoft YaHei", sans-serif'
      context.fillText('扫码访问此刻的页面', 920, 764)
      context.fillText(new URL(shareUrl).host, 920, 804)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${profile.name.replace(/[\\/:*?"<>|]/g, '-') || 'portfolio'}-share-card.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Unable to download share card', error)
      setShareError('卡片保存失败，请重新生成后再试。')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <aside className={`home-ai${open ? ' is-open' : ''}`} onWheel={(event) => event.stopPropagation()}>
      {open ? (
        <section className="home-ai-panel" aria-label="AI 简历助手">
          <header className="home-ai-header">
            <div><span className="home-ai-index">AI / 01</span><h2>简历助手</h2></div>
            <div className="home-ai-actions">
              <button type="button" onClick={openShareCard} title="生成分享卡片"><Share2 size={16} /></button>
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
      {shareOpen && (
        <div className="home-share-backdrop" role="presentation" onClick={() => setShareOpen(false)}>
          <section className="home-share-dialog" role="dialog" aria-modal="true" aria-label="分享卡片" onClick={(event) => event.stopPropagation()}>
            <header className="home-share-header">
              <div><span>SHARE / LIVE</span><h2>生成分享卡片</h2></div>
              <div>
                <button type="button" onClick={() => void refreshShareCard()} disabled={sharing} title="重新生成"><QrCode size={16} /></button>
                <button type="button" onClick={() => setShareOpen(false)} title="关闭"><X size={18} /></button>
              </div>
            </header>
            <div className="home-share-card" aria-busy={sharing}>
              <div className="home-share-scene">
                {shareImage ? <img src={shareImage} alt="当前 3D 人物模型" /> : <div className="home-share-scene-placeholder">{sharing ? '正在捕捉 3D 模型...' : '3D 预览不可用'}</div>}
                <span className="home-share-live">LIVE MODEL</span>
              </div>
              <div className="home-share-copy">
                <span>PERSONAL SPACE / 2026</span>
                <h3>{profile.name}</h3>
                <p className="home-share-role">{profile.role}</p>
                <p className="home-share-about">{profile.about.zh.paragraph}</p>
              </div>
              <div className="home-share-qr">
                {shareCode ? <img src={shareCode} alt="扫码访问当前页面" /> : <div className="home-share-qr-placeholder" />}
                <p>扫码访问此刻的页面</p>
              </div>
            </div>
            {shareError ? <p className="home-share-error">{shareError}</p> : null}
            <footer className="home-share-footer">
              <p>{shareUrl ? new URL(shareUrl).host : '正在生成当前页面链接...'}</p>
              <div className="home-share-footer-actions">
                <button className="home-share-download" type="button" onClick={() => void downloadShareCard()} disabled={!shareImage || !shareCode || downloading}><Download size={15} />{downloading ? '保存中...' : '保存卡片'}</button>
                <button type="button" onClick={() => void copyShareLink()} disabled={!shareUrl}><Copy size={15} />复制链接</button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </aside>
  )
}
