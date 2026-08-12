import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FOCUS_POINTS } from '../data/focusPoints'
import { readClientCache, writeClientCache } from '@/lib/client-cache'

type Lang = 'en' | 'zh'

interface Education {
  id: string
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string | null
  description?: string | null
  responsibilities?: string[] | null
  achievements?: string[] | null
}

interface Skill {
  id: string
  name: string
  category?: string | null
  level: string
}

interface AuthorData {
  profile: { hobbies?: string[] | null }
  education: Education[]
  experiences: Experience[]
  skills: Skill[]
}

interface ResumeEntry {
  period: string
  place: string
  role?: string
  points?: string[]
}

const POINT_ORDER = FOCUS_POINTS
const AUTHOR_CACHE_KEY = 'liwei_home_author_v1'
const AUTHOR_CACHE_MAX_AGE = 30 * 60 * 1000
const EASE = [0.22, 1, 0.36, 1] as const
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function period(start?: string, end?: string | null, lang: Lang = 'zh') {
  if (!start) return lang === 'zh' ? '时间未填写' : 'Date not provided'
  return `${start} - ${end || (lang === 'zh' ? '至今' : 'Present')}`
}

function experiencePoints(item?: Experience, lang: Lang = 'zh') {
  if (!item) return []
  const duties = cleanList(item.responsibilities)
  const achievements = cleanList(item.achievements)
  const detail = duties[0] || achievements[0]
  return [
    item.description?.trim() || '',
    detail ? `${lang === 'zh' ? '职责' : 'Role'}：${detail}` : '',
  ].filter(Boolean)
}

function groupHobbies(hobbies: string[], lang: Lang) {
  const sports = new Set(['台球', '乒乓球', '羽毛球', '篮球', '骑行'])
  const creative = new Set(['平面设计', '绘画'])
  const sportItems = hobbies.filter((item) => sports.has(item))
  const creativeItems = hobbies.filter((item) => creative.has(item))
  const otherItems = hobbies.filter((item) => !sports.has(item) && !creative.has(item))
  return [
    sportItems.length ? `${lang === 'zh' ? '运动' : 'Sports'} · ${sportItems.join('、')}` : '',
    creativeItems.length ? `${lang === 'zh' ? '创作' : 'Creative'} · ${creativeItems.join('、')}` : '',
    otherItems.length ? otherItems.join('、') : '',
  ].filter(Boolean)
}

function buildEntries(data: AuthorData, lang: Lang): ResumeEntry[] {
  const education = data.education[0]
  const firstJob = data.experiences.find((item) => item.company.includes('幻云')) || data.experiences[0]
  const secondJob = data.experiences.find((item) => item.company.includes('零度象限')) || data.experiences.find((item) => item.id !== firstJob?.id)
  const hobbies = Array.from(new Set(cleanList(data.profile.hobbies)))
  const skills = data.skills.slice(0, 8).map((item) => `${item.name} · ${item.level}%`)

  return [
    {
      period: period(education?.startDate, education?.endDate, lang),
      place: education?.school || (lang === 'zh' ? '教育经历' : 'Education'),
      role: education ? `${education.major} · ${education.degree}` : undefined,
    },
    {
      period: period(firstJob?.startDate, firstJob?.endDate, lang),
      place: firstJob?.company || (lang === 'zh' ? '第一份工作' : 'First role'),
      role: firstJob?.position,
      points: experiencePoints(firstJob, lang),
    },
    {
      period: period(secondJob?.startDate, secondJob?.endDate, lang),
      place: secondJob?.company || (lang === 'zh' ? '第二份工作' : 'Second role'),
      role: secondJob?.position,
      points: experiencePoints(secondJob, lang),
    },
    {
      period: lang === 'zh' ? '兴趣' : 'Interests',
      place: lang === 'zh' ? '兴趣爱好' : 'Interests',
      points: groupHobbies(hobbies, lang),
    },
    {
      period: lang === 'zh' ? '技能' : 'Skills',
      place: lang === 'zh' ? '专业技能' : 'Professional Skills',
      points: skills,
    },
  ]
}

function Entry({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <motion.div
      className="tl-entry"
      data-point={POINT_ORDER[index]}
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
    >
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      <div className="tl-body">
        <motion.div className="tl-period" variants={itemV}>{entry.period}</motion.div>
        <motion.div className="tl-head" variants={itemV}>
          <h3 className="tl-place">{entry.place}</h3>
        </motion.div>
        {entry.role && <motion.div className="tl-role" variants={itemV}>{entry.role}</motion.div>}
        {entry.points?.length ? (
          <motion.ul className="tl-points" variants={itemV}>
            {entry.points.map((point) => <li key={point}>{point}</li>)}
          </motion.ul>
        ) : null}
      </div>
    </motion.div>
  )
}

export default function Resume({ lang }: { lang: Lang }) {
  const [author, setAuthor] = useState<AuthorData | null>(() =>
    readClientCache<AuthorData>(AUTHOR_CACHE_KEY, AUTHOR_CACHE_MAX_AGE)
  )
  const hadCachedAuthor = useRef(Boolean(author))
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/author', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.success || !payload.data?.profile) throw new Error('author unavailable')
        const nextAuthor = payload.data as AuthorData
        setAuthor(nextAuthor)
        writeClientCache(AUTHOR_CACHE_KEY, nextAuthor)
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        if (!hadCachedAuthor.current) setError(true)
      })
    return () => controller.abort()
  }, [])

  const entries = useMemo(() => author ? buildEntries(author, lang) : [], [author, lang])

  return (
    <section className="resume" lang={lang}>
      <motion.h2
        className="resume-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        Resume
      </motion.h2>
      {error ? <p className="resume-data-state">作者资料暂不可用</p> : null}
      {!author && !error ? <p className="resume-data-state">正在读取作者资料...</p> : null}
      <div className="timeline">
        {entries.map((entry, index) => <Entry key={`${entry.place}-${index}`} entry={entry} index={index} />)}
      </div>
    </section>
  )
}
