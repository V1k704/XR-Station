import { useEffect, useMemo, useRef, useState } from 'react'
import { XRLogo } from './components/Brand/XRLogo'

type AppState = {
  name: string
  nickname: string
  avatar?: string
  lastActivityAt: string
  coins: number
  python: { level: number; xp: number }
  htb: { rank: string; machines: number; points: number; userId: string }
  lab: { milestones: boolean[]; photoNotes: string; recommendation: string }
  ctf: { solves: number; points: number }
  ai: { level: number; xp: number; focus: string; projects: Array<{ title: string; complexity: number; xpAwarded: number; createdAt: string }> }
  phys: { str: number; dex: number; con: number }
  mental: { int: number; wis: number; cha: number }
  certs: { name: string; earned: boolean }[]
  github: { username: string; streak: number; repos: number; heatmap: number[]; topLanguages: string[] }
  sleep: { hours7d: number; quality7d: number; logs: Array<{ date: string; hours: number; quality: number }> }
  roadmap: { completedNodeIds: string[]; annotations: Record<string, string> }
  quests: { active: Quest[]; archive: Quest[]; lastGeneratedAt: string; skillPriority: string[] }
  enema: {
    unlocked: boolean
    monthlySnapshots: Record<string, SnapshotStats>
    reports: EnemaReport[]
  }
}

type CardId =
  | 'python'
  | 'htb'
  | 'lab'
  | 'ctf'
  | 'ai'
  | 'phys'
  | 'mental'
  | 'certs'
  | 'github'
  | 'sleep'
  | 'quests'
  | 'enema'

type QuizData = {
  question: string
  options: string[]
  correct: number
  explanation: string
}

type QuestType = 'daily' | '7-day' | '15-day' | 'monthly'

type Quest = {
  id: string
  title: string
  description: string
  type: QuestType
  skillTag: string
  xpReward: number
  coinReward: number
  createdAt: string
  dueAt: string
  status: 'active' | 'completed' | 'failed'
}

type SnapshotStats = {
  python: number
  htb: number
  lab: number
  ctf: number
  ai: number
  physical: number
  mental: number
  github: number
}

type EnemaReport = {
  monthKey: string
  generatedAt: string
  start: SnapshotStats
  current: SnapshotStats
  failedQuests: number
}

type Stage = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Elite'

type RoadNode = {
  id: string
  label: string
  stage: Stage
  summary: string
  howToProgress: string
  unlocks: string
}

const STORAGE_KEY = 'xr_station_v1'
const AUTH_KEY = 'xr_station_auth_v1'
const OLD_KEYS = ['rpg_sheet_v2', 'rpg_v1_viktor']
const LAB = new Array(8).fill(false)
const DEFAULT_HTB_USER_ID = '019df7fc-9d93-703d-ba0a-41d629e7d8e8'
const APP_USERNAME = 'V1k704'
const APP_PASSWORD = 'NnQqJjUu9240'
const DEF: AppState = {
  name: 'VIKTOR HASHMAT',
  nickname: 'V1k704_#mat',
  lastActivityAt: new Date().toISOString(),
  coins: 0,
  python: { level: 1, xp: 0 },
  htb: { rank: '—', machines: 0, points: 0, userId: DEFAULT_HTB_USER_ID },
  lab: { milestones: LAB, photoNotes: '', recommendation: '' },
  ctf: { solves: 0, points: 0 },
  ai: { level: 1, xp: 0, focus: '', projects: [] },
  phys: { str: 8, dex: 8, con: 8 },
  mental: { int: 8, wis: 8, cha: 8 },
  certs: ['CompTIA A+', 'CompTIA Network+', 'CompTIA Security+', 'CEH', 'OSCP', 'eJPT', 'PNPT', 'AWS SAA'].map((name) => ({ name, earned: false })),
  github: { username: '', streak: 0, repos: 0, heatmap: [], topLanguages: [] },
  sleep: { hours7d: 0, quality7d: 0, logs: [] },
  roadmap: { completedNodeIds: [], annotations: {} },
  quests: {
    active: [],
    archive: [],
    lastGeneratedAt: '',
    skillPriority: ['Python', 'HTB', 'Lab', 'CTF', 'AI', 'Physical', 'Mental', 'GitHub', 'Sleep'],
  },
  enema: { unlocked: true, monthlySnapshots: {}, reports: [] },
}

function load(): AppState {
  const current = localStorage.getItem(STORAGE_KEY)
  if (current) {
    const parsed = JSON.parse(current)
    return {
      ...DEF,
      ...parsed,
      lab: { ...DEF.lab, ...(parsed.lab ?? {}) },
      ai: { ...DEF.ai, ...(parsed.ai ?? {}) },
      github: { ...DEF.github, ...(parsed.github ?? {}) },
      sleep: { ...DEF.sleep, ...(parsed.sleep ?? {}) },
      roadmap: { ...DEF.roadmap, ...(parsed.roadmap ?? {}) },
      quests: { ...DEF.quests, ...(parsed.quests ?? {}) },
      enema: { ...DEF.enema, ...(parsed.enema ?? {}) },
    }
  }
  for (const key of OLD_KEYS) {
    const old = localStorage.getItem(key)
    if (old) {
      const parsed = JSON.parse(old)
      const migrated = {
        ...DEF,
        ...parsed,
        lab: { ...DEF.lab, ...(parsed.lab ?? {}) },
        ai: { ...DEF.ai, ...(parsed.ai ?? {}) },
        github: { ...DEF.github, ...(parsed.github ?? {}) },
        sleep: { ...DEF.sleep, ...(parsed.sleep ?? {}) },
        roadmap: { ...DEF.roadmap, ...(parsed.roadmap ?? {}) },
        quests: { ...DEF.quests, ...(parsed.quests ?? {}) },
        enema: { ...DEF.enema, ...(parsed.enema ?? {}) },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(key)
      return migrated
    }
  }
  return DEF
}

const cls = ['Cyber Operative', 'Shadow Wizard', 'Code Phantom', 'Zero Day Hunter']
const LAB_MILESTONES = [
  'Hypervisor installed',
  'First VM created',
  'Firewall deployed',
  'Active Directory lab running',
  'Kali configured',
  'Vulnerable machine running',
  'Traffic capture setup',
  'SIEM/log aggregation configured',
]
const ROADMAP_CYBER: RoadNode[] = [
  { id: 'cy-1', label: 'Networking basics', stage: 'Beginner', summary: 'Core TCP/IP, subnetting, ports, and routing mental model.', howToProgress: 'Build subnet exercises and packet tracing labs.', unlocks: 'Daily networking reconnaissance quests.' },
  { id: 'cy-2', label: 'Linux', stage: 'Beginner', summary: 'Shell fluency, permissions, process control, and logging.', howToProgress: 'Use Linux as daily driver for security tasks.', unlocks: 'Privilege escalation starter quests.' },
  { id: 'cy-3', label: 'Python scripting', stage: 'Beginner', summary: 'Automation for scanning, parsing, and reporting.', howToProgress: 'Ship small scripts every week.', unlocks: 'Automation and recon combo quests.' },
  { id: 'cy-4', label: 'Web fundamentals', stage: 'Intermediate', summary: 'HTTP internals, auth/session, browser security model.', howToProgress: 'Practice OWASP-style labs and write notes.', unlocks: 'Web exploitation timed quests.' },
  { id: 'cy-5', label: 'Cryptography basics', stage: 'Intermediate', summary: 'Hashing, symmetric/asymmetric crypto, signatures, PKI.', howToProgress: 'Solve crypto CTF tasks and implement primitives.', unlocks: 'Crypto challenge chains.' },
  { id: 'cy-6', label: 'CTF intro', stage: 'Intermediate', summary: 'Multi-category challenge workflow and timeboxing.', howToProgress: 'Compete weekly and maintain solve logs.', unlocks: '7-day CTF streak quests.' },
  { id: 'cy-7', label: 'Enumeration', stage: 'Advanced', summary: 'High-signal host/service/user/path discovery.', howToProgress: 'Develop repeatable playbooks per target type.', unlocks: 'Host triage and recon drills.' },
  { id: 'cy-8', label: 'Exploitation', stage: 'Advanced', summary: 'From vuln discovery to reliable exploit chains.', howToProgress: 'Document exploit assumptions and mitigations.', unlocks: 'Exploit ladder milestones.' },
  { id: 'cy-9', label: 'Privilege escalation', stage: 'Advanced', summary: 'Windows/Linux local escalation and credential abuse.', howToProgress: 'Practice on intentionally vulnerable systems.', unlocks: 'Post-exploitation quest packs.' },
  { id: 'cy-10', label: 'Active Directory', stage: 'Expert', summary: 'Domain trust, Kerberos attacks, ACL abuse, hardening.', howToProgress: 'Build and break your own AD lab repeatedly.', unlocks: 'AD operator quests.' },
  { id: 'cy-11', label: 'Malware analysis', stage: 'Expert', summary: 'Static and dynamic analysis with threat mapping.', howToProgress: 'Analyze samples and produce concise reports.', unlocks: 'Reverse/forensics hybrid quests.' },
  { id: 'cy-12', label: 'Red team ops', stage: 'Expert', summary: 'Objective-based operations and stealth tradecraft.', howToProgress: 'Simulate operation plans with OPSEC constraints.', unlocks: 'Campaign-style monthly quests.' },
  { id: 'cy-13', label: 'OSCP-level', stage: 'Elite', summary: 'End-to-end practical offensive security baseline.', howToProgress: 'Run exam-like boxes with strict timing.', unlocks: 'Elite practical gauntlets.' },
  { id: 'cy-14', label: 'Bug bounty', stage: 'Elite', summary: 'Real-world web/app vulnerabilities in production targets.', howToProgress: 'Develop niche depth in one vuln class.', unlocks: 'Hunter streak multipliers.' },
  { id: 'cy-15', label: 'Elite research', stage: 'Elite', summary: 'Novel techniques, writeups, and original tooling.', howToProgress: 'Publish findings and mentor peers.', unlocks: 'Legend-tier roadmap branches.' },
]

const ROADMAP_AI: RoadNode[] = [
  { id: 'ai-1', label: 'Python for ML', stage: 'Beginner', summary: 'Numpy/Pandas foundations and data manipulation.', howToProgress: 'Implement mini pipelines from raw CSV to model.', unlocks: 'Data wrangling quests.' },
  { id: 'ai-2', label: 'Math foundations', stage: 'Beginner', summary: 'Linear algebra, probability, optimization intuition.', howToProgress: 'Solve practical derivation exercises weekly.', unlocks: 'Model diagnostics challenges.' },
  { id: 'ai-3', label: 'Scikit-learn', stage: 'Beginner', summary: 'Classical ML baselines, metrics, and validation.', howToProgress: 'Benchmark multiple baselines before deep models.', unlocks: 'Baseline battle quests.' },
  { id: 'ai-4', label: 'Neural networks', stage: 'Intermediate', summary: 'Backprop mechanics and architecture fundamentals.', howToProgress: 'Train and compare MLP/CNN variants.', unlocks: 'Neural tuning quests.' },
  { id: 'ai-5', label: 'Deep learning', stage: 'Intermediate', summary: 'Regularization, optimization, and transfer learning.', howToProgress: 'Track experiments with reproducible configs.', unlocks: 'Model robustness quests.' },
  { id: 'ai-6', label: 'NLP basics', stage: 'Intermediate', summary: 'Tokenization, embeddings, text preprocessing pipelines.', howToProgress: 'Build sentiment/classification apps.', unlocks: 'Language mini-product quests.' },
  { id: 'ai-7', label: 'Transformers', stage: 'Advanced', summary: 'Attention mechanics and modern sequence modeling.', howToProgress: 'Fine-tune transformers on domain data.', unlocks: 'Transformer mastery chains.' },
  { id: 'ai-8', label: 'Computer vision', stage: 'Advanced', summary: 'Detection/segmentation/classification workflows.', howToProgress: 'Deploy at least one CV pipeline end-to-end.', unlocks: 'Vision ops quests.' },
  { id: 'ai-9', label: 'RL basics', stage: 'Advanced', summary: 'Policies, rewards, exploration, and stability tradeoffs.', howToProgress: 'Run small RL environments and evaluate behavior.', unlocks: 'Agent behavior experiments.' },
  { id: 'ai-10', label: 'MLOps', stage: 'Expert', summary: 'Versioning, serving, monitoring, and retraining loops.', howToProgress: 'Automate CI/CD for model lifecycle.', unlocks: 'Production reliability quests.' },
  { id: 'ai-11', label: 'LLM fine-tuning', stage: 'Expert', summary: 'Adapt foundation models to niche tasks safely.', howToProgress: 'Evaluate with robust test suites and guardrails.', unlocks: 'Domain adaptation quests.' },
  { id: 'ai-12', label: 'Agent systems', stage: 'Expert', summary: 'Tool use, memory, planning, and multi-step execution.', howToProgress: 'Ship one useful autonomous workflow.', unlocks: 'Autonomy challenge tracks.' },
  { id: 'ai-13', label: 'Research-level', stage: 'Elite', summary: 'Read papers, reproduce results, propose improvements.', howToProgress: 'Publish implementations and ablation studies.', unlocks: 'Elite AI research tier.' },
]
const titles = (s: AppState, lvl: number) => {
  const out = [{ label: 'The Corrupted Cyborg', tier: 'gold' }]
  const days = (Date.now() - new Date(s.lastActivityAt).getTime()) / 86400000
  if (days >= 14) out.push({ label: 'The Junk Yard Cyborg', tier: 'red' })
  if (s.python.level >= 10) out.push({ label: 'Serpent Tongue', tier: 'gold' })
  if (s.htb.rank.toLowerCase().includes('pro')) out.push({ label: 'Ghost in the Shell', tier: 'cyan' })
  if (s.lab.milestones.every(Boolean)) out.push({ label: 'The Architect', tier: 'gold' })
  if (s.ctf.solves >= 50) out.push({ label: 'Flag Harvester', tier: 'gold' })
  if (s.certs.filter((c) => c.earned).length >= 10) out.push({ label: 'The Certified Menace', tier: 'cyan' })
  if (s.ai.level >= 15) out.push({ label: 'Neural Phantom', tier: 'purple' })
  if ((s.phys.str + s.phys.dex + s.phys.con) / 3 >= 16) out.push({ label: 'Iron Frame', tier: 'gold' })
  if ((s.mental.int + s.mental.wis + s.mental.cha) / 3 >= 16) out.push({ label: 'Mind Breaker', tier: 'purple' })
  if (s.github.streak >= 100) out.push({ label: 'Commit or Die', tier: 'red' })
  if (lvl >= 50) out.push({ label: 'V1k704 Unchained', tier: 'purple' })
  return out
}

function App() {
  const [s, setS] = useState<AppState>(load)
  const [detailCard, setDetailCard] = useState<CardId | ''>('')
  const [pendingCard, setPendingCard] = useState<CardId | ''>('')
  const [updateCard, setUpdateCard] = useState<CardId | ''>('')
  const [toast, setToast] = useState('')
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [roadmapTab, setRoadmapTab] = useState<'cyber' | 'ai'>('cyber')
  const [selectedRoadNodeId, setSelectedRoadNodeId] = useState<string>('')
  const [roadScale, setRoadScale] = useState(1)
  const [roadPan, setRoadPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [quizResult, setQuizResult] = useState<{ correct: boolean; explanation: string } | null>(null)
  const [aiQuiz, setAiQuiz] = useState<QuizData | null>(null)
  const [aiQuizResult, setAiQuizResult] = useState<{ correct: boolean; explanation: string } | null>(null)
  const [recentQuizQuestions, setRecentQuizQuestions] = useState<string[]>([])
  const [quizBusy, setQuizBusy] = useState(false)
  const [githubBusy, setGithubBusy] = useState(false)
  const [questBusy, setQuestBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [authOk, setAuthOk] = useState(() => localStorage.getItem(AUTH_KEY) === 'ok')
  const [authUser, setAuthUser] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authErr, setAuthErr] = useState('')
  const [physPreview, setPhysPreview] = useState<{ str: number; dex: number; con: number } | null>(null)
  const [mentalPreview, setMentalPreview] = useState<{ int: number; wis: number; cha: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const save = (n: AppState) => {
    n.lastActivityAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(n))
    setS(n)
  }
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }
  const xp = useMemo(() => Math.round(s.python.xp + s.htb.machines * 15 + s.htb.points * 0.1 + s.lab.milestones.filter(Boolean).length * 30 + s.ctf.points * 0.5 + s.ai.xp + s.certs.filter((c) => c.earned).length * 100 + s.github.repos * 2), [s])
  const level = Math.max(1, Math.floor(xp / 100) + 1)
  const className = cls[[s.python.level, s.ctf.solves / 10, s.ai.level, s.htb.machines / 10].indexOf(Math.max(s.python.level, s.ctf.solves / 10, s.ai.level, s.htb.machines / 10))]
  const badgeList = titles(s, level)
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const rd = new FileReader()
    rd.onload = () => save({ ...s, avatar: String(rd.result) })
    rd.readAsDataURL(f)
  }
  const cards: Array<[string, string, string, string, CardId]> = [
    ['🐍', 'Python Mastery', `LV ${s.python.level} · ${s.python.xp} XP`, 'LANG', 'python'],
    ['⬡', 'Hack The Box', `${s.htb.rank} · ${s.htb.machines} Machines`, 'PLATFORM', 'htb'],
    ['🖥', 'Home Lab', `${s.lab.milestones.filter(Boolean).length}/8 Milestones`, 'INFRA', 'lab'],
    ['⚑', 'CTF Challenges', `${s.ctf.solves} Solves · ${s.ctf.points} Pts`, 'COMBAT', 'ctf'],
    ['◈', 'AI / ML Skill', `LV ${s.ai.level} · ${s.ai.focus || 'No focus'}`, 'ARCANE', 'ai'],
    ['⚔', 'Physical Stats', `STR ${s.phys.str} · DEX ${s.phys.dex} · CON ${s.phys.con}`, 'BODY', 'phys'],
    ['✦', 'Mental Stats', `INT ${s.mental.int} · WIS ${s.mental.wis} · CHA ${s.mental.cha}`, 'MIND', 'mental'],
    ['◉', 'Certifications', `${s.certs.filter((c) => c.earned).length} Earned`, 'TITLES', 'certs'],
    ['⌬', 'GitHub Activity', `${s.github.streak} Streak · ${s.github.repos} Repos`, 'CODE', 'github'],
    ['☾', 'Sleep Tracker', `${s.sleep.hours7d.toFixed(1)}h avg · Q${s.sleep.quality7d.toFixed(1)}/5`, 'RECOVERY', 'sleep'],
    ['◇', 'Quest Center', `${s.quests.active.length} Active · ${s.quests.archive.filter((q) => q.status === 'failed').length} Failed`, 'QUESTS', 'quests'],
    ['✶', 'Corruption Enema', `${s.enema.reports.length} reports · ${s.enema.unlocked ? 'Unlocked' : 'Locked'}`, 'REPORT', 'enema'],
  ]
  const roadmapNodes = roadmapTab === 'cyber' ? ROADMAP_CYBER : ROADMAP_AI
  const selectedRoadNode = roadmapNodes.find((n) => n.id === selectedRoadNodeId) ?? roadmapNodes[0]
  const selectedAnnotation = s.roadmap.annotations[selectedRoadNode?.id ?? ''] ?? ''
  const selectedCompleted = !!selectedRoadNode && s.roadmap.completedNodeIds.includes(selectedRoadNode.id)

  const openUpdate = (card: CardId) => {
    setPendingCard('')
    setUpdateCard(card)
    if (card === 'python') {
      setQuiz(null)
      setQuizResult(null)
    }
    if (card === 'ai') {
      setAiQuiz(null)
      setAiQuizResult(null)
    }
    if (card === 'phys') setPhysPreview(null)
    if (card === 'mental') setMentalPreview(null)
  }

  const pythonTier = (lvl: number) => (lvl < 4 ? 'Novice' : lvl < 8 ? 'Apprentice' : lvl < 13 ? 'Journeyman' : lvl < 17 ? 'Expert' : 'Master')

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const scaleStat = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    const ratio = (value - inMin) / (inMax - inMin)
    return clamp(Math.round(outMin + ratio * (outMax - outMin)), outMin, outMax)
  }

  const currentSnapshot = (): SnapshotStats => ({
    python: s.python.level,
    htb: Math.max(1, Math.floor(s.htb.machines / 3)),
    lab: s.lab.milestones.filter(Boolean).length,
    ctf: Math.max(1, Math.floor(s.ctf.solves / 5)),
    ai: s.ai.level,
    physical: Math.round((s.phys.str + s.phys.dex + s.phys.con) / 3),
    mental: Math.round((s.mental.int + s.mental.wis + s.mental.cha) / 3),
    github: Math.max(1, Math.floor(s.github.streak / 10)),
  })

  const generatePythonQuiz = async () => {
    setQuizBusy(true)
    setQuiz(null)
    setQuizResult(null)
    try {
      const levelBucket = s.python.level <= 4 ? 'beginner' : s.python.level <= 10 ? 'intermediate' : s.python.level <= 15 ? 'advanced' : 'expert'
      const payload = {
        model: 'tencent/hy3-preview:free',
        max_tokens: 380,
        messages: [
          {
            role: 'user',
            content:
              `Create one ${levelBucket} python MCQ for cybersecurity/AI student. Avoid repeating these: ${recentQuizQuestions.join(' | ') || 'none'}. ` +
              'Return ONLY JSON: {"question":"...","options":["A...","B...","C...","D..."],"correct":0,"explanation":"..."}',
          },
        ],
      }
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await resp.json()
      const text = data?.content?.[0]?.text ?? ''
      const parsed = JSON.parse(String(text).replace(/```json|```/g, '').trim()) as QuizData
      if (!parsed.question || !Array.isArray(parsed.options)) throw new Error('Invalid quiz')
      if (recentQuizQuestions.includes(parsed.question)) throw new Error('Repeated question')
      setQuiz(parsed)
      setRecentQuizQuestions((prev) => [parsed.question, ...prev].slice(0, 12))
    } catch {
      const fallback: QuizData = {
        question: 'What is the main security reason to use parameterized SQL queries in Python?',
        options: [
          'A. They make queries faster in all cases',
          'B. They prevent SQL injection attacks',
          'C. They automatically encrypt the database',
          'D. They replace ORM libraries entirely',
        ],
        correct: 1,
        explanation: 'Parameterized queries separate code from data, blocking injection payload execution.',
      }
      setQuiz(fallback)
      showToast('Using fallback quiz')
    } finally {
      setQuizBusy(false)
    }
  }

  const answerQuiz = (idx: number) => {
    if (!quiz) return
    const correct = idx === quiz.correct
    if (correct) {
      const newXp = s.python.xp + 20
      const newLevel = Math.min(20, Math.floor(newXp / 80) + 1)
      save({ ...s, python: { level: newLevel, xp: newXp } })
      showToast('Correct! +20 XP')
    } else {
      showToast('Wrong answer, no XP')
    }
    setQuizResult({ correct, explanation: quiz.explanation })
  }

  const toggleRoadNodeComplete = (nodeId: string) => {
    const done = s.roadmap.completedNodeIds.includes(nodeId)
    const completedNodeIds = done
      ? s.roadmap.completedNodeIds.filter((id) => id !== nodeId)
      : [...s.roadmap.completedNodeIds, nodeId]
    save({ ...s, roadmap: { ...s.roadmap, completedNodeIds } })
    showToast(done ? 'Node marked incomplete' : 'Node completed')
  }

  const saveRoadAnnotation = () => {
    if (!selectedRoadNode) return
    const value = (document.getElementById('road-annotation') as HTMLTextAreaElement)?.value ?? ''
    save({
      ...s,
      roadmap: {
        ...s.roadmap,
        annotations: { ...s.roadmap.annotations, [selectedRoadNode.id]: value.trim() },
      },
    })
    showToast('Roadmap note saved')
  }

  const syncGithub = async () => {
    const username = (document.getElementById('gh-username') as HTMLInputElement)?.value?.trim()
    if (!username) {
      showToast('Enter GitHub username')
      return
    }
    setGithubBusy(true)
    try {
      // Try GraphQL proxy first (best quality data)
      let repos = 0
      let streak = 0
      let heatmap: number[] = []
      let topLanguages: string[] = []
      try {
        const now = new Date()
        const from = new Date(now.getFullYear(), 0, 1).toISOString()
        const query = `
          query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
              repositories(ownerAffiliations: OWNER, isFork: false) { totalCount }
              repositoriesContributedTo(contributionTypes:[COMMIT], first: 100) {
                nodes { primaryLanguage { name } }
              }
              contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                  weeks {
                    contributionDays { contributionCount date }
                  }
                }
              }
            }
          }
        `
        const resp = await fetch('/api/github', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query, variables: { login: username, from, to: now.toISOString() } }),
        })
        const data = await resp.json()
        const user = data?.data?.user
        if (!resp.ok || !user) throw new Error('proxy-failed')
        const days = user.contributionsCollection.contributionCalendar.weeks.flatMap(
          (w: { contributionDays: Array<{ contributionCount: number }> }) => w.contributionDays,
        )
        heatmap = days.map((d: { contributionCount: number }) => d.contributionCount).slice(-84)
        for (let i = days.length - 1; i >= 0; i -= 1) {
          if ((days[i]?.contributionCount ?? 0) > 0) streak += 1
          else break
        }
        const langCount = new Map<string, number>()
        user.repositoriesContributedTo.nodes.forEach((n: { primaryLanguage: { name?: string } | null }) => {
          const name = n?.primaryLanguage?.name
          if (!name) return
          langCount.set(name, (langCount.get(name) ?? 0) + 1)
        })
        topLanguages = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0])
        repos = user.repositories.totalCount ?? 0
      } catch {
        // Fallback: public GitHub REST (works without token in local dev)
        const [userResp, reposResp, eventsResp] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
          fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100`),
          fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`),
        ])
        if (!userResp.ok) throw new Error('user-not-found')
        const userData = await userResp.json()
        const reposData = reposResp.ok ? await reposResp.json() : []
        const eventsData = eventsResp.ok ? await eventsResp.json() : []
        repos = Number(userData?.public_repos ?? 0)
        const langCount = new Map<string, number>()
        ;(Array.isArray(reposData) ? reposData : []).forEach((r: { language?: string | null }) => {
          const language = r?.language
          if (!language) return
          langCount.set(language, (langCount.get(language) ?? 0) + 1)
        })
        topLanguages = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0])

        const dayMap = new Map<string, number>()
        const since = Date.now() - 84 * 86400000
        ;(Array.isArray(eventsData) ? eventsData : []).forEach((ev: { created_at?: string }) => {
          const ts = new Date(ev?.created_at ?? '').getTime()
          if (!Number.isFinite(ts) || ts < since) return
          const d = new Date(ts).toISOString().slice(0, 10)
          dayMap.set(d, (dayMap.get(d) ?? 0) + 1)
        })
        heatmap = []
        for (let i = 83; i >= 0; i -= 1) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
          heatmap.push(dayMap.get(d) ?? 0)
        }
        streak = 0
        for (let i = heatmap.length - 1; i >= 0; i -= 1) {
          if ((heatmap[i] ?? 0) > 0) streak += 1
          else break
        }
      }

      save({ ...s, github: { username, repos, streak, heatmap, topLanguages } })
      showToast('GitHub synced')
      setUpdateCard('')
    } catch {
      showToast('GitHub sync failed. Check username or rate limit.')
    } finally {
      setGithubBusy(false)
    }
  }

  const addSleepLog = () => {
    const hours = Number((document.getElementById('sleep-hours') as HTMLInputElement)?.value || 0)
    const quality = Number((document.getElementById('sleep-quality') as HTMLInputElement)?.value || 0)
    if (hours <= 0 || quality < 1 || quality > 5) {
      showToast('Use valid hours and quality 1-5')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    const logs = s.sleep.logs.filter((l) => l.date !== today).concat({ date: today, hours, quality }).slice(-30)
    const recent = logs.slice(-7)
    const hours7d = recent.length ? recent.reduce((a, b) => a + b.hours, 0) / recent.length : 0
    const quality7d = recent.length ? recent.reduce((a, b) => a + b.quality, 0) / recent.length : 0
    save({ ...s, sleep: { logs, hours7d, quality7d } })
    showToast('Sleep logged')
    setUpdateCard('')
  }

  const analyzeLab = async () => {
    setAiBusy(true)
    try {
      const notes = (document.getElementById('lab-notes') as HTMLTextAreaElement)?.value?.trim() || ''
      if (!notes) {
        showToast('Add lab notes/photo description first')
        return
      }
      const payload = {
        model: 'tencent/hy3-preview:free',
        max_tokens: 420,
        messages: [
          {
            role: 'user',
            content:
              `Analyze this homelab setup text and output JSON only: {"recommendation":"...","milestoneIndex":0-7}. ` +
              `Lab notes: ${notes}`,
          },
        ],
      }
      const resp = await fetch('/api/claude', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await resp.json()
      const text = data?.content?.[0]?.text ?? ''
      const out = JSON.parse(String(text).replace(/```json|```/g, '').trim()) as { recommendation?: string; milestoneIndex?: number }
      const idx = clamp(Number(out.milestoneIndex ?? -1), 0, 7)
      const milestones = [...s.lab.milestones]
      milestones[idx] = true
      save({ ...s, lab: { ...s.lab, milestones, photoNotes: notes, recommendation: out.recommendation || 'Keep building segmented lab + logging pipeline.' } })
      showToast('Lab analysis applied')
    } catch {
      showToast('Lab analysis failed')
    } finally {
      setAiBusy(false)
    }
  }

  const generateAiChallenge = async () => {
    setAiBusy(true)
    try {
      const levelBucket = s.ai.level <= 4 ? 'beginner' : s.ai.level <= 10 ? 'intermediate' : 'advanced'
      const payload = {
        model: 'tencent/hy3-preview:free',
        max_tokens: 420,
        messages: [
          {
            role: 'user',
            content:
              `Create one ${levelBucket} AI/ML MCQ with prompt engineering context. Return ONLY JSON: {"question":"...","options":["A...","B...","C...","D..."],"correct":0,"explanation":"..."}`,
          },
        ],
      }
      const resp = await fetch('/api/claude', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await resp.json()
      const text = data?.content?.[0]?.text ?? ''
      const q = JSON.parse(String(text).replace(/```json|```/g, '').trim()) as QuizData
      setAiQuiz(q)
      setAiQuizResult(null)
      setUpdateCard('ai')
      showToast('AI challenge generated')
    } catch {
      showToast('AI challenge failed')
    } finally {
      setAiBusy(false)
    }
  }

  const rateAiProject = async () => {
    const title = (document.getElementById('ai-project-title') as HTMLInputElement)?.value?.trim()
    const desc = (document.getElementById('ai-project-desc') as HTMLTextAreaElement)?.value?.trim()
    if (!title || !desc) {
      showToast('Enter project title and description')
      return
    }
    setAiBusy(true)
    try {
      const payload = {
        model: 'tencent/hy3-preview:free',
        max_tokens: 220,
        messages: [{ role: 'user', content: `Rate complexity 1-5 for this AI project. Return JSON only {"complexity":1}. Title:${title}. Desc:${desc}` }],
      }
      const resp = await fetch('/api/claude', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await resp.json()
      const text = data?.content?.[0]?.text ?? ''
      const parsed = JSON.parse(String(text).replace(/```json|```/g, '').trim()) as { complexity?: number }
      const complexity = clamp(Number(parsed.complexity ?? 2), 1, 5)
      const xpAwarded = complexity * 30
      const newXp = s.ai.xp + xpAwarded
      const newLevel = Math.min(20, Math.floor(newXp / 80) + 1)
      save({
        ...s,
        ai: {
          ...s.ai,
          xp: newXp,
          level: Math.max(s.ai.level, newLevel),
          projects: [{ title, complexity, xpAwarded, createdAt: new Date().toISOString() }, ...s.ai.projects].slice(0, 20),
        },
      })
      showToast(`Project rated complexity ${complexity} (+${xpAwarded} XP)`)
    } catch {
      showToast('Project rating failed')
    } finally {
      setAiBusy(false)
    }
  }

  const computePhysicalPreview = () => {
    const bw = Number((document.getElementById('ph-bw') as HTMLInputElement)?.value || 0)
    const bench = Number((document.getElementById('ph-bench') as HTMLInputElement)?.value || 0)
    const squat = Number((document.getElementById('ph-squat') as HTMLInputElement)?.value || 0)
    const dead = Number((document.getElementById('ph-dead') as HTMLInputElement)?.value || 0)
    const sprint = Number((document.getElementById('ph-sprint') as HTMLInputElement)?.value || 0)
    const react = Number((document.getElementById('ph-react') as HTMLInputElement)?.value || 0)
    const rhr = Number((document.getElementById('ph-rhr') as HTMLInputElement)?.value || 0)
    const push = Number((document.getElementById('ph-push') as HTMLInputElement)?.value || 0)
    const run = Number((document.getElementById('ph-run') as HTMLInputElement)?.value || 0)
    if (!bw) {
      showToast('Body weight required')
      return
    }
    const ratios = [bench / bw, squat / bw, dead / bw].filter((v) => Number.isFinite(v) && v > 0)
    const str = ratios.length ? scaleStat(ratios.reduce((a, b) => a + b, 0) / ratios.length, 0.3, 2.5, 4, 20) : 8
    const dexParts: number[] = []
    if (sprint > 0) dexParts.push(scaleStat(sprint, 20, 9.5, 4, 20))
    if (react > 0) dexParts.push(scaleStat(react, 400, 120, 4, 20))
    const dex = dexParts.length ? Math.round(dexParts.reduce((a, b) => a + b, 0) / dexParts.length) : 8
    const conParts: number[] = []
    if (rhr > 0) conParts.push(scaleStat(rhr, 100, 40, 4, 20))
    if (push > 0) conParts.push(scaleStat(push, 0, 100, 4, 20))
    if (run > 0) conParts.push(scaleStat(run, 20, 6, 4, 20))
    const con = conParts.length ? Math.round(conParts.reduce((a, b) => a + b, 0) / conParts.length) : 8
    setPhysPreview({ str, dex, con })
  }

  const computeMentalPreview = () => {
    const books = Number((document.getElementById('mn-books') as HTMLInputElement)?.value || 0)
    const focus = Number((document.getElementById('mn-focus') as HTMLInputElement)?.value || 0)
    const edu = Number((document.getElementById('mn-edu') as HTMLInputElement)?.value || 0)
    const social = Number((document.getElementById('mn-social') as HTMLInputElement)?.value || 0)
    const langs = Number((document.getElementById('mn-langs') as HTMLInputElement)?.value || 1)
    const int = Math.round((scaleStat(books, 0, 30, 4, 20) + scaleStat(focus, 0, 10, 4, 20) + scaleStat(edu, 8, 22, 4, 20)) / 3)
    const wis = clamp(Math.round(int * 0.5 + s.phys.con * 0.3 + 3), 4, 20)
    const cha = Math.round((scaleStat(social, 0, 20, 4, 20) + scaleStat(langs, 1, 5, 4, 20)) / 2)
    setMentalPreview({ int, wis, cha })
  }

  const generateEnemaReport = () => {
    const monthKey = new Date().toISOString().slice(0, 7)
    const start = s.enema.monthlySnapshots[monthKey] ?? currentSnapshot()
    const current = currentSnapshot()
    const report: EnemaReport = {
      monthKey,
      generatedAt: new Date().toISOString(),
      start,
      current,
      failedQuests: s.quests.archive.filter((q) => q.status === 'failed' && q.createdAt.startsWith(monthKey)).length,
    }
    save({
      ...s,
      enema: {
        ...s.enema,
        monthlySnapshots: { ...s.enema.monthlySnapshots, [monthKey]: s.enema.monthlySnapshots[monthKey] ?? start },
        reports: [report, ...s.enema.reports.filter((r) => r.monthKey !== monthKey)],
      },
    })
    showToast(`Corruption Enema generated for ${monthKey}`)
    setUpdateCard('')
    setDetailCard('enema')
  }

  const submitAuth = () => {
    const ok = authUser === APP_USERNAME && authPass === APP_PASSWORD
    if (!ok) {
      setAuthErr('Invalid username/password')
      return
    }
    localStorage.setItem(AUTH_KEY, 'ok')
    setAuthOk(true)
    setAuthErr('')
  }

  const logoutAuth = () => {
    localStorage.removeItem(AUTH_KEY)
    setAuthOk(false)
    setAuthPass('')
  }

  const extractHtbId = (value: string) => {
    const input = value.trim()
    if (!input) return ''
    const m = input.match(/profile\/([0-9a-fA-F-]{36})/)
    if (m?.[1]) return m[1]
    if (/^[0-9a-fA-F-]{36}$/.test(input)) return input
    return ''
  }

  const syncHtbById = async (userId: string, closeOnSuccess = true) => {
    try {
      const resp = await fetch(`/api/htb?userId=${encodeURIComponent(userId)}`)
      const data = await resp.json()
      if (!resp.ok) throw new Error('htb-fetch-failed')
      const root = data?.profile ?? data?.info ?? data?.data ?? data ?? {}
      const rankVal =
        root?.rank?.name ??
        root?.rank ??
        root?.current_rank ??
        root?.user_rank_name ??
        '—'
      const machinesVal = Number(
        root?.user_owns_count ??
          root?.system_owns ??
          root?.machine_owns ??
          root?.machines_pwned ??
          root?.total_owns ??
          0,
      )
      const pointsVal = Number(
        root?.points ??
          root?.ranking_points ??
          root?.current_points ??
          root?.respects ??
          0,
      )
      save({
        ...s,
        htb: {
          ...s.htb,
          userId,
          rank: String(rankVal || '—'),
          machines: Number.isFinite(machinesVal) ? machinesVal : 0,
          points: Number.isFinite(pointsVal) ? pointsVal : 0,
        },
      })
      showToast('HTB profile synced')
      if (closeOnSuccess) setUpdateCard('')
    } catch {
      showToast('HTB sync failed, use manual fields')
    }
  }

  const syncHtbProfile = async () => {
    const raw = (document.getElementById('htb-id-or-url') as HTMLInputElement)?.value ?? ''
    const userId = extractHtbId(raw)
    if (!userId) {
      showToast('Paste a valid HTB profile URL or UUID')
      return
    }
    await syncHtbById(userId, true)
  }

  const questHours: Record<QuestType, number> = { daily: 24, '7-day': 168, '15-day': 360, monthly: 720 }
  const questCoins: Record<QuestType, number> = { daily: 5, '7-day': 25, '15-day': 50, monthly: 150 }
  const skillScores = () =>
    ({
      Python: s.python.level,
      HTB: Math.max(1, Math.floor(s.htb.machines / 3)),
      Lab: s.lab.milestones.filter(Boolean).length,
      CTF: Math.max(1, Math.floor(s.ctf.solves / 5)),
      AI: s.ai.level,
      Physical: Math.round((s.phys.str + s.phys.dex + s.phys.con) / 3),
      Mental: Math.round((s.mental.int + s.mental.wis + s.mental.cha) / 3),
      GitHub: Math.max(1, Math.floor(s.github.streak / 10)),
      Sleep: Math.max(1, Math.round((s.sleep.hours7d + s.sleep.quality7d) / 2)),
    }) as Record<string, number>

  const skillQuestCatalog: Record<string, Array<{ title: string; description: string }>> = {
    Python: [
      { title: 'Python Recon Script', description: 'Build or improve one security automation script and commit notes.' },
      { title: 'Bugfix + Refactor', description: 'Refactor one script for readability and add edge-case handling.' },
    ],
    HTB: [
      { title: 'HTB Target Run', description: 'Complete one focused HTB target workflow with proper enumeration.' },
      { title: 'Post-Exploitation Notes', description: 'Document one privilege escalation or persistence path.' },
    ],
    Lab: [
      { title: 'Lab Hardening', description: 'Implement one tangible lab security improvement and verify it.' },
      { title: 'Infra Milestone Push', description: 'Complete one pending lab milestone with screenshots/evidence.' },
    ],
    CTF: [
      { title: 'CTF Solve Session', description: 'Solve at least one challenge and write a clean solve log.' },
      { title: 'Category Depth Drill', description: 'Do a 60-minute deep drill in one CTF category.' },
    ],
    AI: [
      { title: 'AI Mini Project', description: 'Ship a small AI/ML experiment and summarize model behavior.' },
      { title: 'Prompt Engineering Drill', description: 'Create and test prompt variants with measured output quality.' },
    ],
    Physical: [
      { title: 'Strength Session', description: 'Complete planned strength training and record all key lifts.' },
      { title: 'Conditioning Drill', description: 'Run sprint/reaction workout and compare with previous baseline.' },
    ],
    Mental: [
      { title: 'Deep Study Block', description: 'Do one distraction-free study block and capture core takeaways.' },
      { title: 'Knowledge Output', description: 'Convert learned material into a concise explanation or cheat-sheet.' },
    ],
    GitHub: [
      { title: 'Commit Streak Guard', description: 'Make one meaningful commit and maintain your activity streak.' },
      { title: 'Repo Quality Pass', description: 'Improve one repo issue/readme/test and publish the change.' },
    ],
    Sleep: [
      { title: 'Sleep Consistency', description: 'Hit target sleep window and log quality for 3 nights straight.' },
      { title: 'Recovery Reset', description: 'Optimize sleep hygiene and measure next-day focus quality.' },
    ],
  }

  const questTypeByIndex: QuestType[] = ['daily', '7-day', '15-day', 'monthly']

  const buildLocalQuests = (count = 4): Quest[] => {
    const now = new Date()
    const scores = skillScores()
    const rankedWeakToStrong = [...s.quests.skillPriority].sort((a, b) => (scores[a] ?? 999) - (scores[b] ?? 999))
    const targets = rankedWeakToStrong.slice(0, Math.max(1, count))
    return Array.from({ length: count }).map((_, i) => {
      const skill = targets[i % targets.length] ?? rankedWeakToStrong[0] ?? 'Python'
      const options = skillQuestCatalog[skill] ?? skillQuestCatalog.Python
      const pick = options[(now.getDate() + i) % options.length]
      const type = questTypeByIndex[i % questTypeByIndex.length]
      return {
        id: `q_${Date.now()}_${i}`,
        title: `${skill}: ${pick.title}`,
        description: pick.description,
        type,
        skillTag: skill,
        xpReward: type === 'daily' ? 15 : type === '7-day' ? 40 : type === '15-day' ? 70 : 140,
        coinReward: questCoins[type],
        createdAt: now.toISOString(),
        dueAt: new Date(now.getTime() + questHours[type] * 3600000).toISOString(),
        status: 'active',
      }
    })
  }

  const moveSkillPriority = (skill: string, dir: -1 | 1) => {
    const idx = s.quests.skillPriority.indexOf(skill)
    const next = idx + dir
    if (idx < 0 || next < 0 || next >= s.quests.skillPriority.length) return
    const arr = [...s.quests.skillPriority]
    const [item] = arr.splice(idx, 1)
    arr.splice(next, 0, item)
    save({ ...s, quests: { ...s.quests, skillPriority: arr } })
  }

  const updateQuestStatuses = () => {
    const now = Date.now()
    const stillActive: Quest[] = []
    const newlyFailed: Quest[] = []
    s.quests.active.forEach((q) => {
      if (new Date(q.dueAt).getTime() < now) newlyFailed.push({ ...q, status: 'failed' })
      else stillActive.push(q)
    })
    if (newlyFailed.length) {
      save({ ...s, quests: { ...s.quests, active: stillActive, archive: [...newlyFailed, ...s.quests.archive] } })
      showToast(`${newlyFailed.length} quest(s) expired`)
    } else {
      showToast('No expired quests')
    }
  }

  const generateQuests = async () => {
    if (s.quests.active.length >= 10) {
      showToast('Max 10 active quests')
      return
    }
    setQuestBusy(true)
    try {
      const newQuests = buildLocalQuests(4)
      save({
        ...s,
        quests: {
          ...s.quests,
          active: [...s.quests.active, ...newQuests].slice(0, 10),
          lastGeneratedAt: new Date().toISOString(),
        },
      })
      showToast(`${newQuests.length} quests generated`)
    } catch {
      showToast('Quest generation failed')
    } finally {
      setQuestBusy(false)
    }
  }

  const completeQuest = (id: string) => {
    const q = s.quests.active.find((x) => x.id === id)
    if (!q) return
    const active = s.quests.active.filter((x) => x.id !== id)
    const archive = [{ ...q, status: 'completed' as const }, ...s.quests.archive]
    save({
      ...s,
      coins: s.coins + q.coinReward,
      quests: { ...s.quests, active, archive },
      python: { ...s.python, xp: q.skillTag.toLowerCase().includes('python') ? s.python.xp + q.xpReward : s.python.xp },
      ai: { ...s.ai, xp: q.skillTag.toLowerCase().includes('ai') ? s.ai.xp + q.xpReward : s.ai.xp },
    })
    showToast(`Quest completed +${q.coinReward}$%@`)
  }

  const failQuest = (id: string) => {
    const q = s.quests.active.find((x) => x.id === id)
    if (!q) return
    save({
      ...s,
      quests: {
        ...s.quests,
        active: s.quests.active.filter((x) => x.id !== id),
        archive: [{ ...q, status: 'failed' as const }, ...s.quests.archive],
      },
    })
    showToast('Quest marked failed')
  }

  const moveQuest = (id: string, dir: -1 | 1) => {
    const idx = s.quests.active.findIndex((q) => q.id === id)
    const next = idx + dir
    if (idx < 0 || next < 0 || next >= s.quests.active.length) return
    const arr = [...s.quests.active]
    const [item] = arr.splice(idx, 1)
    arr.splice(next, 0, item)
    save({ ...s, quests: { ...s.quests, active: arr } })
  }

  const timeLeft = (dueAt: string) => {
    const ms = new Date(dueAt).getTime() - Date.now()
    if (ms <= 0) return 'Expired'
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
    return `${h}h ${m}m`
  }

  const runQuestCycle = () => {
    const nowMs = Date.now()
    const lastGenMs = s.quests.lastGeneratedAt ? new Date(s.quests.lastGeneratedAt).getTime() : 0
    const dueForRefresh = !lastGenMs || nowMs - lastGenMs >= 24 * 3600000
    const expired = s.quests.active.filter((q) => new Date(q.dueAt).getTime() < nowMs)
    const stillActive = s.quests.active.filter((q) => new Date(q.dueAt).getTime() >= nowMs)
    if (!dueForRefresh && !expired.length) return
    const fresh = dueForRefresh ? buildLocalQuests(Math.min(4, Math.max(0, 10 - stillActive.length))) : []
    save({
      ...s,
      quests: {
        ...s.quests,
        active: [...stillActive, ...fresh].slice(0, 10),
        archive: [...expired.map((q) => ({ ...q, status: 'failed' as const })), ...s.quests.archive],
        lastGeneratedAt: dueForRefresh ? new Date().toISOString() : s.quests.lastGeneratedAt,
      },
    })
    if (fresh.length) showToast(`Auto-generated ${fresh.length} new quest(s)`)
  }

  useEffect(() => {
    runQuestCycle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const hasLegacyFallback = s.quests.active.some((q) => q.title.toLowerCase().includes('fallback quest'))
    if (!hasLegacyFallback) return
    save({
      ...s,
      quests: {
        ...s.quests,
        active: s.quests.active.filter((q) => !q.title.toLowerCase().includes('fallback quest')),
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => {
      const now = new Date()
      const last = s.quests.lastGeneratedAt ? new Date(s.quests.lastGeneratedAt) : null
      const crossedMidnight =
        !last ||
        now.getFullYear() !== last.getFullYear() ||
        now.getMonth() !== last.getMonth() ||
        now.getDate() !== last.getDate()
      if (crossedMidnight) runQuestCycle()
    }, 60000)
    return () => window.clearInterval(t)
  }, [s.quests.lastGeneratedAt, s.quests.active.length])

  useEffect(() => {
    const monthKey = new Date().toISOString().slice(0, 7)
    if (s.enema.monthlySnapshots[monthKey]) return
    save({
      ...s,
      enema: {
        ...s.enema,
        monthlySnapshots: { ...s.enema.monthlySnapshots, [monthKey]: currentSnapshot() },
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!authOk) return
    const shouldBootstrap =
      !!s.htb.userId &&
      (s.htb.rank === '—' || s.htb.machines === 0)
    if (!shouldBootstrap) return
    void syncHtbById(s.htb.userId, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authOk])

  return (
    <div className="app">
      {!authOk && (
        <div className="overlay auth-overlay">
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <h2>XR Station Access</h2>
            <p className="identity">Login required</p>
            <input
              placeholder="Username"
              value={authUser}
              onChange={(e) => setAuthUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAuth()}
            />
            <input
              placeholder="Password"
              type="password"
              value={authPass}
              onChange={(e) => setAuthPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAuth()}
            />
            {authErr && <p className="identity auth-error">{authErr}</p>}
            <button onClick={submitAuth}>Unlock</button>
          </div>
        </div>
      )}
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={upload} />
      <header className="banner">
        <button className="avatar" onClick={() => fileRef.current?.click()}>{s.avatar ? <img src={s.avatar} alt="avatar" /> : <XRLogo size={74} />}</button>
        <div className="banner-info">
          <h1>XR STATION</h1>
          <p className="identity">{s.name} · {s.nickname}</p>
          <p className="identity">[ {className} · CS STUDENT ]</p>
          <div className="title-row">{badgeList.map((b) => <span className={`title-badge ${b.tier}`} key={b.label}>{b.label}</span>)}</div>
          <button className="xp-wrap" onClick={() => setRoadmapOpen(true)} title={`Python ${s.python.xp} | HTB ${Math.round(s.htb.machines * 15 + s.htb.points * 0.1)} | Lab ${s.lab.milestones.filter(Boolean).length * 30} | CTF ${Math.round(s.ctf.points * 0.5)} | AI ${s.ai.xp}`}>
            <div><span>XP PROGRESS</span><span>{xp} / {level * 100} XP</span></div>
            <div className="bar"><div style={{ width: `${xp % 100}%` }} /></div>
          </button>
        </div>
        <div className="lv">
          <strong>{level}</strong>
          <small>LEVEL</small>
          <small>$%@ {s.coins}</small>
          <button onClick={logoutAuth}>LOCK</button>
        </div>
      </header>

      <main className="grid">
        {cards.map((c) => (
          <article
            key={String(c[4])}
            className="card"
            onClick={() => setDetailCard(c[4])}
            onContextMenu={(e) => {
              e.preventDefault()
              setPendingCard(c[4])
            }}
          >
            <span>{c[3]}</span><b>{c[0]}</b><h3>{c[1]}</h3><p>{c[2]}</p><i>RIGHT-CLICK TO UPDATE</i>
          </article>
        ))}
      </main>

      {pendingCard && (
        <div className="overlay" onClick={() => setPendingCard('')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Open update panel?</h2>
            <p>{cards.find((c) => c[4] === pendingCard)?.[1]}</p>
            <button onClick={() => openUpdate(pendingCard)}>Proceed</button>
            <button onClick={() => setPendingCard('')}>Cancel</button>
          </div>
        </div>
      )}

      {detailCard && (
        <div className="overlay" onClick={() => setDetailCard('')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{cards.find((c) => c[4] === detailCard)?.[1]} Detail</h2>
            <p className="identity">Read-only view. Right-click card to update.</p>
            <p>
              {detailCard === 'python' && `Tier: ${s.python.level < 4 ? 'Novice' : s.python.level < 8 ? 'Apprentice' : s.python.level < 13 ? 'Journeyman' : s.python.level < 17 ? 'Expert' : 'Master'}`}
              {detailCard === 'lab' && `Completed milestones: ${s.lab.milestones.filter(Boolean).length}/8`}
              {detailCard === 'ctf' && `Solves: ${s.ctf.solves}, Points: ${s.ctf.points}`}
              {detailCard === 'ai' && `Focus: ${s.ai.focus || 'None set'}`}
              {detailCard === 'phys' && `STR ${s.phys.str} · DEX ${s.phys.dex} · CON ${s.phys.con}`}
              {detailCard === 'mental' && `INT ${s.mental.int} · WIS ${s.mental.wis} · CHA ${s.mental.cha}`}
              {detailCard === 'github' && `GitHub: ${s.github.username || 'No username'} | streak ${s.github.streak}`}
              {detailCard === 'sleep' && `7-day avg: ${s.sleep.hours7d.toFixed(1)}h, quality ${s.sleep.quality7d.toFixed(1)}/5`}
              {detailCard === 'quests' && `Active ${s.quests.active.length}, Archive ${s.quests.archive.length}`}
              {detailCard === 'enema' && `Monthly reports: ${s.enema.reports.length}`}
            </p>
            {detailCard === 'github' && (
              <>
                <div className="identity">Top languages: {s.github.topLanguages.join(', ') || 'N/A'}</div>
                <svg className="heatmap" viewBox="0 0 286 64" role="img" aria-label="GitHub activity heatmap">
                  {Array.from({ length: 84 }).map((_, i) => {
                    const v = s.github.heatmap[i] ?? 0
                    const c = v === 0 ? '#1a1a24' : v < 2 ? '#3a2f1c' : v < 5 ? '#7a6030' : '#c9a84c'
                    const x = (i % 28) * 10 + 2
                    const y = Math.floor(i / 28) * 20 + 2
                    return <rect key={i} x={x} y={y} width="8" height="16" fill={c} rx="1" />
                  })}
                </svg>
              </>
            )}
            {detailCard === 'sleep' && (
              <svg className="sleepchart" viewBox="0 0 320 100" role="img" aria-label="14-day sleep chart">
                {s.sleep.logs.slice(-14).map((l, i) => {
                  const h = Math.max(1, Math.min(10, l.hours))
                  const bar = h * 8
                  return <rect key={l.date} x={8 + i * 22} y={90 - bar} width="14" height={bar} fill="#c9a84c" />
                })}
              </svg>
            )}
            {detailCard === 'quests' && (
              <div className="quest-list">
                {s.quests.active.slice(0, 10).map((q, idx) => (
                  <div className="quest-item" key={q.id}>
                    <div>
                      <strong>#{idx + 1} {q.title}</strong>
                      <p>{q.type} · {q.skillTag} · {timeLeft(q.dueAt)}</p>
                    </div>
                  </div>
                ))}
                {!s.quests.active.length && <p>No active quests.</p>}
              </div>
            )}
            {detailCard === 'lab' && s.lab.recommendation && (
              <div className="identity">Recommendation: {s.lab.recommendation}</div>
            )}
            {detailCard === 'ai' && (
              <div className="quest-archive">
                <h3>Project Log</h3>
                {s.ai.projects.slice(0, 6).map((p) => (
                  <p key={p.createdAt}>{p.title} · Complexity {p.complexity} · +{p.xpAwarded} XP</p>
                ))}
                {!s.ai.projects.length && <p>No projects logged yet.</p>}
              </div>
            )}
            {detailCard === 'enema' && (
              <div className="quest-archive">
                <h3>Recent Reports</h3>
                {s.enema.reports[0] && (
                  <svg className="sleepchart" viewBox="0 0 340 170" role="img" aria-label="Corruption enema delta chart">
                    {(['python', 'htb', 'lab', 'ctf', 'ai', 'physical', 'mental', 'github'] as const).map((k, i) => {
                      const x = 10 + i * 40
                      const startVal = s.enema.reports[0].start[k]
                      const currVal = s.enema.reports[0].current[k]
                      return (
                        <g key={k}>
                          <rect x={x} y={150 - startVal * 5} width="10" height={startVal * 5} fill="#7a6030" />
                          <rect x={x + 12} y={150 - currVal * 5} width="10" height={currVal * 5} fill="#c9a84c" />
                          <text x={x} y={165} fontSize="8" fill="#8a7f6a">{k.slice(0, 2).toUpperCase()}</text>
                        </g>
                      )
                    })}
                  </svg>
                )}
                {s.enema.reports.slice(0, 6).map((r) => (
                  <p key={r.generatedAt}>
                    {r.monthKey} · Failed quests {r.failedQuests} · Delta PY {r.current.python - r.start.python}, AI {r.current.ai - r.start.ai}
                  </p>
                ))}
                {!s.enema.reports.length && <p>No report generated yet.</p>}
              </div>
            )}
            {detailCard && (
              <button onClick={() => { setDetailCard(''); setPendingCard(detailCard) }}>
                Open update panel
              </button>
            )}
            <button onClick={() => setDetailCard('')}>Close</button>
          </div>
        </div>
      )}

      {updateCard && (
        <div className="overlay" onClick={() => setUpdateCard('')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update {cards.find((c) => c[4] === updateCard)?.[1]}</h2>

            {updateCard === 'python' && (
              <>
                <p className="identity">Tier: {pythonTier(s.python.level)} · Level {s.python.level} · XP {s.python.xp}</p>
                {!quiz && <button disabled={quizBusy} onClick={generatePythonQuiz}>{quizBusy ? 'Generating...' : 'Generate quiz'}</button>}
                {quiz && (
                  <div>
                    <p>{quiz.question}</p>
                    {quiz.options.map((opt, i) => (
                      <button key={opt} onClick={() => answerQuiz(i)}>{opt}</button>
                    ))}
                  </div>
                )}
                {quizResult && (
                  <div className="identity">
                    {quizResult.correct ? 'Correct +20 XP' : 'Wrong +0 XP'} · {quizResult.explanation}
                  </div>
                )}
              </>
            )}

            {updateCard === 'htb' && (
              <>
                <input
                  placeholder="HTB profile URL or UUID"
                  defaultValue={s.htb.userId ? `https://profile.hackthebox.com/profile/${s.htb.userId}` : ''}
                  id="htb-id-or-url"
                />
                <button onClick={syncHtbProfile}>Sync from HTB profile</button>
                <input placeholder="Rank" defaultValue={s.htb.rank === '—' ? '' : s.htb.rank} id="htb-rank" />
                <input placeholder="Machines" defaultValue={String(s.htb.machines)} id="htb-machines" type="number" />
                <input placeholder="Points" defaultValue={String(s.htb.points)} id="htb-points" type="number" />
                <button
                  onClick={() => {
                    const rank = (document.getElementById('htb-rank') as HTMLInputElement).value.trim() || '—'
                    const machines = Number((document.getElementById('htb-machines') as HTMLInputElement).value || 0)
                    const points = Number((document.getElementById('htb-points') as HTMLInputElement).value || 0)
                    const userId = extractHtbId((document.getElementById('htb-id-or-url') as HTMLInputElement).value || '') || s.htb.userId
                    save({ ...s, htb: { ...s.htb, userId, rank, machines, points } })
                    showToast('HTB updated')
                    setUpdateCard('')
                  }}
                >
                  Save HTB
                </button>
              </>
            )}

            {updateCard === 'lab' && (
              <>
                <textarea id="lab-notes" placeholder="Describe visible devices/cables/screens from your lab photo..." defaultValue={s.lab.photoNotes} />
                <button disabled={aiBusy} onClick={analyzeLab}>{aiBusy ? 'Analyzing...' : 'Analyze setup + auto update'}</button>
                {s.lab.recommendation && <p className="identity">{s.lab.recommendation}</p>}
                {LAB_MILESTONES.map((m, i) => (
                  <label key={m} style={{ display: 'block', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={s.lab.milestones[i]}
                      onChange={() => {
                        const milestones = [...s.lab.milestones]
                        milestones[i] = !milestones[i]
                        save({ ...s, lab: { ...s.lab, milestones } })
                      }}
                    />{' '}
                    {m}
                  </label>
                ))}
              </>
            )}

            {updateCard === 'ctf' && (
              <>
                <input placeholder="Solves" defaultValue={String(s.ctf.solves)} id="ctf-solves" type="number" />
                <input placeholder="Points" defaultValue={String(s.ctf.points)} id="ctf-points" type="number" />
                <button
                  onClick={() => {
                    const solves = Number((document.getElementById('ctf-solves') as HTMLInputElement).value || 0)
                    const points = Number((document.getElementById('ctf-points') as HTMLInputElement).value || 0)
                    save({ ...s, ctf: { solves, points } })
                    showToast('CTF updated')
                    setUpdateCard('')
                  }}
                >
                  Save CTF
                </button>
              </>
            )}

            {updateCard === 'ai' && (
              <>
                <input placeholder="Focus (NLP, CV...)" defaultValue={s.ai.focus} id="ai-focus" />
                <input placeholder="Level 1-20" type="number" min={1} max={20} defaultValue={String(s.ai.level)} id="ai-level" />
                <button disabled={aiBusy} onClick={generateAiChallenge}>{aiBusy ? 'Generating...' : 'Generate AI challenge'}</button>
                {aiQuiz && (
                  <div>
                    <p>{aiQuiz.question}</p>
                    {aiQuiz.options.map((opt, i) => (
                      <button
                        key={`${opt}-${i}`}
                        onClick={() => {
                          const correct = i === aiQuiz.correct
                          if (correct) {
                            const gained = 15
                            const newXp = s.ai.xp + gained
                            const newLvl = Math.min(20, Math.floor(newXp / 80) + 1)
                            save({ ...s, ai: { ...s.ai, xp: newXp, level: Math.max(s.ai.level, newLvl) } })
                            showToast('AI quiz correct +15 XP')
                          } else showToast('AI quiz wrong')
                          setAiQuizResult({ correct, explanation: aiQuiz.explanation })
                          setAiQuiz(null)
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {aiQuizResult && <div className="identity">{aiQuizResult.correct ? 'Correct +15 XP' : 'Wrong +0 XP'} · {aiQuizResult.explanation}</div>}
                <input id="ai-project-title" placeholder="Project title" />
                <textarea id="ai-project-desc" placeholder="Describe your AI project for complexity rating..." />
                <button disabled={aiBusy} onClick={rateAiProject}>{aiBusy ? 'Rating...' : 'Rate project (1-5) + XP'}</button>
                <button
                  onClick={() => {
                    const focus = (document.getElementById('ai-focus') as HTMLInputElement).value.trim()
                    const levelRaw = Number((document.getElementById('ai-level') as HTMLInputElement).value || 1)
                    const levelValue = Math.max(1, Math.min(20, levelRaw))
                    save({ ...s, ai: { ...s.ai, focus, level: levelValue, xp: Math.max(s.ai.xp, levelValue * 80 - 80) } })
                    showToast('AI updated')
                    setUpdateCard('')
                  }}
                >
                  Save AI
                </button>
              </>
            )}

            {updateCard === 'phys' && (
              <>
                <p className="identity">Current: STR {s.phys.str} · DEX {s.phys.dex} · CON {s.phys.con}</p>
                <div className="two-col-form">
                  <input id="ph-bw" placeholder="Body weight (kg)" type="number" defaultValue="75" />
                  <input id="ph-bench" placeholder="Bench 1RM (kg)" type="number" defaultValue="80" />
                  <input id="ph-squat" placeholder="Squat 1RM (kg)" type="number" defaultValue="100" />
                  <input id="ph-dead" placeholder="Deadlift 1RM (kg)" type="number" defaultValue="120" />
                  <input id="ph-sprint" placeholder="100m sprint (sec)" type="number" step={0.1} defaultValue="14" />
                  <input id="ph-react" placeholder="Reaction (ms)" type="number" defaultValue="240" />
                  <input id="ph-rhr" placeholder="Resting HR" type="number" defaultValue="65" />
                  <input id="ph-push" placeholder="Max push-ups" type="number" defaultValue="30" />
                  <input id="ph-run" placeholder="2.4km run (min)" type="number" step={0.1} defaultValue="12" />
                </div>
                <button onClick={computePhysicalPreview}>Calculate preview</button>
                {physPreview && (
                  <p className="identity">Preview STR {physPreview.str} · DEX {physPreview.dex} · CON {physPreview.con}</p>
                )}
                <button
                  disabled={!physPreview}
                  onClick={() => {
                    if (!physPreview) return
                    save({ ...s, phys: physPreview })
                    showToast(`Physical saved STR ${physPreview.str} DEX ${physPreview.dex} CON ${physPreview.con}`)
                    setUpdateCard('')
                  }}
                >
                  Save Physical Stats
                </button>
              </>
            )}

            {updateCard === 'mental' && (
              <>
                <p className="identity">Current: INT {s.mental.int} · WIS {s.mental.wis} · CHA {s.mental.cha}</p>
                <div className="two-col-form">
                  <input id="mn-books" placeholder="Books/year" type="number" defaultValue="8" />
                  <input id="mn-focus" placeholder="Focus hrs/day" type="number" step={0.5} defaultValue="3" />
                  <input id="mn-edu" placeholder="Years education" type="number" defaultValue="14" />
                  <input id="mn-social" placeholder="Social events/month" type="number" defaultValue="4" />
                  <input id="mn-langs" placeholder="Languages spoken" type="number" defaultValue="2" />
                </div>
                <button onClick={computeMentalPreview}>Calculate preview</button>
                {mentalPreview && (
                  <p className="identity">Preview INT {mentalPreview.int} · WIS {mentalPreview.wis} · CHA {mentalPreview.cha}</p>
                )}
                <button
                  disabled={!mentalPreview}
                  onClick={() => {
                    if (!mentalPreview) return
                    save({ ...s, mental: mentalPreview })
                    showToast(`Mental saved INT ${mentalPreview.int} WIS ${mentalPreview.wis} CHA ${mentalPreview.cha}`)
                    setUpdateCard('')
                  }}
                >
                  Save Mental Stats
                </button>
              </>
            )}

            {updateCard === 'certs' && (
              <>
                {s.certs.map((cert, i) => (
                  <button
                    key={cert.name}
                    onClick={() => {
                      const next = [...s.certs]
                      next[i] = { ...next[i], earned: !next[i].earned }
                      save({ ...s, certs: next })
                    }}
                  >
                    {cert.earned ? '✓' : '○'} {cert.name}
                  </button>
                ))}
              </>
            )}

            {updateCard === 'github' && (
              <>
                <input placeholder="GitHub username" id="gh-username" defaultValue={s.github.username} />
                <button disabled={githubBusy} onClick={syncGithub}>
                  {githubBusy ? 'Syncing...' : 'Sync GitHub'}
                </button>
              </>
            )}

            {updateCard === 'sleep' && (
              <>
                <input placeholder="Hours slept" id="sleep-hours" type="number" min={0} step={0.1} />
                <input placeholder="Quality (1-5)" id="sleep-quality" type="number" min={1} max={5} />
                <button onClick={addSleepLog}>Save sleep log</button>
              </>
            )}

            {updateCard === 'quests' && (
              <>
                <p className="identity">
                  Quests auto-refresh every 24h (midnight-aware) and expired quests auto-fail.
                  Last generation: {s.quests.lastGeneratedAt ? new Date(s.quests.lastGeneratedAt).toLocaleString() : 'never'}
                </p>
                <button disabled={questBusy} onClick={generateQuests}>
                  {questBusy ? 'Generating...' : 'Generate now (manual add)'}
                </button>
                <button onClick={updateQuestStatuses}>Check expired</button>
                <div className="quest-archive">
                  <h3>Skill Priority (quest focus)</h3>
                  {s.quests.skillPriority.map((skill, idx) => (
                    <div key={skill} className="quest-priority-row">
                      <span>#{idx + 1} {skill}</span>
                      <div className="quest-actions">
                        <button onClick={() => moveSkillPriority(skill, -1)}>↑</button>
                        <button onClick={() => moveSkillPriority(skill, 1)}>↓</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="quest-list">
                  {s.quests.active.slice(0, 10).map((q, idx) => (
                    <div key={q.id} className="quest-item">
                      <div>
                        <strong>#{idx + 1} {q.title}</strong>
                        <p>{q.description}</p>
                        <p>{q.type} · {q.skillTag} · {q.xpReward} XP · {q.coinReward}$%@ · {timeLeft(q.dueAt)}</p>
                      </div>
                      <div className="quest-actions">
                        <button onClick={() => moveQuest(q.id, -1)}>↑</button>
                        <button onClick={() => moveQuest(q.id, 1)}>↓</button>
                        <button onClick={() => completeQuest(q.id)}>Done</button>
                        <button onClick={() => failQuest(q.id)}>Fail</button>
                      </div>
                    </div>
                  ))}
                  {!s.quests.active.length && <p>No active quests.</p>}
                </div>
                <div className="quest-archive">
                  <h3>Archive</h3>
                  {s.quests.archive.slice(0, 8).map((q) => (
                    <p key={`${q.id}-${q.status}`}>{q.status.toUpperCase()} · {q.title}</p>
                  ))}
                </div>
              </>
            )}

            {updateCard === 'enema' && (
              <>
                <p className="identity">Generate monthly progress report snapshot + deltas + failed quest panel.</p>
                <button onClick={generateEnemaReport}>Generate Corruption Enema</button>
                <div className="quest-archive">
                  <h3>Reports</h3>
                  {s.enema.reports.slice(0, 8).map((r) => (
                    <p key={r.generatedAt}>
                      {r.monthKey} · PY {r.start.python}{'->'}{r.current.python} · AI {r.start.ai}{'->'}{r.current.ai} · Failed {r.failedQuests}
                    </p>
                  ))}
                  {!s.enema.reports.length && <p>No reports yet.</p>}
                </div>
              </>
            )}

            {!['python', 'htb', 'lab', 'ctf', 'ai', 'phys', 'mental', 'certs', 'github', 'sleep', 'quests', 'enema'].includes(updateCard) && <p>No editor for this card yet.</p>}
            <button onClick={() => setUpdateCard('')}>Close</button>
          </div>
        </div>
      )}
      {roadmapOpen && (
        <div className="overlay" onClick={() => setRoadmapOpen(false)}>
          <div className="modal roadmap-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Roadmap</h2>
            <div className="tabrow">
              <button
                className={roadmapTab === 'cyber' ? 'active' : ''}
                onClick={() => {
                  setRoadmapTab('cyber')
                  setSelectedRoadNodeId(ROADMAP_CYBER[0]?.id ?? '')
                }}
              >
                CYBER
              </button>
              <button
                className={roadmapTab === 'ai' ? 'active' : ''}
                onClick={() => {
                  setRoadmapTab('ai')
                  setSelectedRoadNodeId(ROADMAP_AI[0]?.id ?? '')
                }}
              >
                AI
              </button>
            </div>
            <div className="identity roadmap-toolbar">
              <span>Zoom</span>
              <button onClick={() => setRoadScale((v) => Math.min(2.2, Number((v + 0.1).toFixed(2))))}>+</button>
              <button onClick={() => setRoadScale((v) => Math.max(0.6, Number((v - 0.1).toFixed(2))))}>-</button>
              <button onClick={() => { setRoadScale(1); setRoadPan({ x: 0, y: 0 }) }}>Reset View</button>
              <span className="roadmap-legend">
                <em className="lg-py">PY Path</em>
                <em className="lg-ai">AI Path</em>
                <em className="lg-htb">HTB Path</em>
              </span>
            </div>
            <div className="roadmap-layout">
              <div className="roadmap-graph">
                <div
                  className={`pan-area ${panning ? 'panning' : ''}`}
                  onMouseDown={(e) => {
                    setPanning(true)
                    setPanStart({ x: e.clientX - roadPan.x, y: e.clientY - roadPan.y })
                  }}
                  onMouseMove={(e) => {
                    if (!panning) return
                    setRoadPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
                  }}
                  onMouseUp={() => setPanning(false)}
                  onMouseLeave={() => setPanning(false)}
                  onWheel={(e) => {
                    e.preventDefault()
                    setRoadScale((v) =>
                      Math.max(0.6, Math.min(2.2, Number((v + (e.deltaY < 0 ? 0.08 : -0.08)).toFixed(2)))),
                    )
                  }}
                >
                  <svg
                    viewBox="0 0 1000 720"
                    role="img"
                    aria-label="Roadmap graph"
                    style={{ transform: `translate(${roadPan.x}px, ${roadPan.y}px) scale(${roadScale})` }}
                  >
                  {roadmapNodes.map((node, i) => {
                    if (i === roadmapNodes.length - 1) return null
                    const next = roadmapNodes[i + 1]
                    const stageX = { Beginner: 100, Intermediate: 300, Advanced: 500, Expert: 700, Elite: 900 } as const
                    const x1 = stageX[node.stage]
                    const x2 = stageX[next.stage]
                    const y1 = 80 + i * 45
                    const y2 = 80 + (i + 1) * 45
                    const edgeColor = roadmapTab === 'cyber' ? 'rgba(201,168,76,0.35)' : 'rgba(169,135,255,0.35)'
                    return (
                      <line
                        key={`${node.id}-${next.id}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={edgeColor}
                        strokeWidth="2"
                      />
                    )
                  })}
                  {roadmapNodes.map((node, i) => {
                    const stageX = { Beginner: 100, Intermediate: 300, Advanced: 500, Expert: 700, Elite: 900 } as const
                    const x = stageX[node.stage]
                    const y = 80 + i * 45
                    const isSelected = selectedRoadNode.id === node.id
                    const isDone = s.roadmap.completedNodeIds.includes(node.id)
                    const pyPos = Math.round((s.python.level / 20) * (roadmapNodes.length - 1))
                    const aiPos = Math.round((s.ai.level / 20) * (roadmapNodes.length - 1))
                    const htbPos = Math.min(roadmapNodes.length - 1, Math.floor(s.htb.machines / 3))
                    return (
                      <g key={node.id} onClick={() => setSelectedRoadNodeId(node.id)} style={{ cursor: 'pointer' }}>
                        <circle cx={x} cy={y} r={isSelected ? 13 : 10} fill={isDone ? '#2f6f4d' : isSelected ? '#c9a84c' : '#1a1a24'} stroke={isDone ? '#4bc47e' : '#c9a84c'} />
                        <text x={x + 18} y={y + 4} fill={isSelected ? '#f3dfac' : '#c8b690'} fontSize="14">
                          {node.label}
                        </text>
                        {isDone && <text x={x - 4} y={y + 4} fill="#c9ffd9" fontSize="10">✓</text>}
                        {i === pyPos && <text x={x - 34} y={y - 12} fill="#6dc1ff" fontSize="10">PY</text>}
                        {i === aiPos && <text x={x - 14} y={y - 12} fill="#a987ff" fontSize="10">AI</text>}
                        {roadmapTab === 'cyber' && i === htbPos && <text x={x + 6} y={y - 12} fill="#c9a84c" fontSize="10">HTB</text>}
                      </g>
                    )
                  })}
                  </svg>
                </div>
              </div>
              <aside className="roadmap-details">
                <h3>{selectedRoadNode.label}</h3>
                <p><strong>Stage:</strong> {selectedRoadNode.stage}</p>
                <p><strong>Meaning:</strong> {selectedRoadNode.summary}</p>
                <p><strong>How to progress:</strong> {selectedRoadNode.howToProgress}</p>
                <p><strong>Unlocks:</strong> {selectedRoadNode.unlocks}</p>
                <button onClick={() => toggleRoadNodeComplete(selectedRoadNode.id)}>
                  {selectedCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                </button>
                <div className="road-annotation-box">
                  <label>Node annotation</label>
                  <textarea id="road-annotation" defaultValue={selectedAnnotation} placeholder="Add your own note for this node..." />
                  <button onClick={saveRoadAnnotation}>Save note</button>
                </div>
                <div className="road-quests">
                  <h4>Quest suggestions</h4>
                  <p>- Daily: 25-min focused drill for "{selectedRoadNode.label}"</p>
                  <p>- 7-day: Build one practical mini-project tied to this node.</p>
                  <p>- 15-day: Demonstrate measurable improvement + write summary.</p>
                  <p>- Monthly: Integrate this node with your weakest adjacent node.</p>
                </div>
              </aside>
            </div>
            <button onClick={() => setRoadmapOpen(false)}>Close</button>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
