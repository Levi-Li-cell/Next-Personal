import { useEffect, useRef, useState, type Ref } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { WORKS } from '../data/works'

const EASE = [0.22, 1, 0.36, 1] as const

interface ProjectItem {
  id: string
  title: string
  description: string
  content?: string | null
  coverImage?: string | null
  techStack?: string[] | null
  demoUrl?: string | null
  githubUrl?: string | null
}

function normalizeTechStack(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(/[、,，]/))
    .map((item) => item.trim())
    .filter(Boolean)
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: ProjectItem
  index: number
  onOpen: (project: ProjectItem) => void
}) {
  const [coverError, setCoverError] = useState(false)
  const techStack = normalizeTechStack(project.techStack)

  return (
    <article className="wk-card wk-project-card">
      <header className="wk-card-head">
        <span className="wk-card-no">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="wk-card-title">{project.title}</h3>
        <span className="wk-card-tagline">{techStack.slice(0, 3).join(' · ') || 'PROJECT'}</span>
      </header>

      <div className="wk-card-cover">
        {project.coverImage && !coverError ? (
          <img src={project.coverImage} alt={project.title} onError={() => setCoverError(true)} />
        ) : (
          <div className="wk-card-cover-ph" aria-hidden="true">
            <span className="wk-card-cover-no">{String(index + 1).padStart(2, '0')}</span>
          </div>
        )}
      </div>

      <div className="wk-card-body wk-project-body">
        <p className="wk-project-summary">{project.description}</p>
        {techStack.length ? (
          <div className="wk-project-tech" aria-label="项目技术栈">
            {techStack.slice(0, 6).map((tech) => <span key={tech}>{tech}</span>)}
          </div>
        ) : null}
        <button className="wk-project-open" type="button" onClick={() => onOpen(project)}>
          查看项目详情 <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  )
}

function ProjectDetail({
  project,
  closeLabel,
  visitLabel,
  onClose,
}: {
  project: ProjectItem
  closeLabel: string
  visitLabel: string
  onClose: () => void
}) {
  const [bannerError, setBannerError] = useState(false)
  const techStack = normalizeTechStack(project.techStack)
  const link = project.demoUrl || project.githubUrl

  return (
    <>
      <motion.div
        className="wk-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        className="wk-detail"
        initial={{ opacity: 0, scale: 0.985, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 6 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <button className="wk-detail-close" type="button" onClick={onClose} aria-label={closeLabel}>✕</button>

        {project.coverImage && !bannerError ? (
          <div className="wk-detail-banner">
            <img src={project.coverImage} alt={project.title} onError={() => setBannerError(true)} />
          </div>
        ) : (
          <div className="wk-detail-banner is-ph" aria-hidden="true">
            <span className="wk-detail-ph-text">{project.title}</span>
          </div>
        )}

        <article className="wk-detail-article">
          <header className="wk-detail-head">
            <h3 className="wk-detail-title">{project.title}</h3>
            {techStack.length ? (
              <div className="wk-detail-tags">
                {techStack.map((tech) => <span className="wk-badge" key={tech}>{tech}</span>)}
              </div>
            ) : null}
          </header>

          <p className="wk-detail-desc">{project.description}</p>
          {project.content ? (
            <div className="wk-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.content}</ReactMarkdown>
            </div>
          ) : null}

          {link ? (
            <a className="wk-detail-link" href={link} target="_blank" rel="noopener noreferrer">
              {visitLabel} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </article>
      </motion.div>
    </>
  )
}

export default function Works({ lang, innerRef }: { lang: 'en' | 'zh'; innerRef: Ref<HTMLElement> }) {
  const labels = WORKS[lang]
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [active, setActive] = useState<ProjectItem | null>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/projects?status=published&limit=20', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.success || payload.degraded || !Array.isArray(payload.data)) {
          throw new Error('projects unavailable')
        }
        setProjects(payload.data as ProjectItem[])
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(true)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ['start start', 'end end'],
  })
  const [scrollRange, setScrollRange] = useState(0)

  useEffect(() => {
    const element = trackRef.current
    if (!element) return
    const measure = () => setScrollRange(Math.max(0, element.scrollWidth - window.innerWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [projects.length, lang])

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange])
  const hintOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0])

  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setActive(null)
    const previousOverflow = document.body.style.overflow
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [active])

  return (
    <section className="works" lang={lang} ref={innerRef}>
      <div className="wk-gallery" ref={galleryRef} style={{ height: `calc(100vh + ${scrollRange}px)` }}>
        <div className="wk-gallery-sticky">
          <span className="wk-gallery-title">Works</span>
          <motion.div className="wk-track" ref={trackRef} style={{ x }}>
            {loading ? <p className="wk-project-state">正在读取项目...</p> : null}
            {error ? <p className="wk-project-state">项目资料暂不可用</p> : null}
            {!loading && !error && !projects.length ? <p className="wk-project-state">暂无已发布项目</p> : null}
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} onOpen={setActive} />
            ))}
          </motion.div>

          <div className="wk-progress" aria-hidden="true">
            <motion.div className="wk-progress-fill" style={{ scaleX: scrollYProgress }} />
          </div>
          <motion.span className="wk-hint" style={{ opacity: hintOpacity }} aria-hidden="true">
            {labels.hint}
          </motion.span>
        </div>
      </div>

      <AnimatePresence>
        {active ? (
          <ProjectDetail
            key={active.id}
            project={active}
            closeLabel={labels.closeLabel}
            visitLabel={labels.visitLabel}
            onClose={() => setActive(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  )
}
