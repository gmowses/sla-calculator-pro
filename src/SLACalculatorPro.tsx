import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, Clock, Plus, Trash2 } from 'lucide-react'

const translations = {
  en: {
    title: 'SLA Calculator Pro',
    subtitle: 'Calculate downtime budgets, MTTR/MTBF, composite SLA for serial/parallel components, and penalty estimates.',
    slaInput: 'SLA Percentage',
    slaInputDesc: 'Enter SLA % to calculate downtime allowance',
    downtimeInput: 'Downtime to SLA',
    downtimeInputDesc: 'Enter downtime to calculate equivalent SLA',
    slaPercent: 'SLA %',
    downtimeHours: 'Downtime (hours/year)',
    year: 'Year', month: 'Month', week: 'Week', day: 'Day',
    mttr: 'MTTR / MTBF',
    mttrDesc: 'Mean time to repair and between failures',
    mttrVal: 'MTTR (hours)',
    incidents: 'Incidents per year',
    mtbf: 'MTBF',
    availability: 'Availability',
    composite: 'Composite SLA',
    compositeDesc: 'Combine multiple components',
    serial: 'Serial (all must be up)',
    parallel: 'Parallel (any one up)',
    addComponent: 'Add Component',
    componentSla: 'Component SLA %',
    compositeResult: 'Composite SLA',
    penalty: 'Penalty Calculator',
    penaltyDesc: 'Estimate SLA breach penalty',
    contractValue: 'Monthly contract value ($)',
    penaltyPct: 'Penalty per hour downtime (%)',
    exceededHours: 'Hours exceeded',
    estimatedPenalty: 'Estimated penalty',
    maintenance: 'Maintenance Window Impact',
    maintHours: 'Planned maintenance (hours/year)',
    maintAdj: 'Adjusted SLA (excl. maintenance)',
    builtBy: 'Built by',
    nines: 'nines',
    hours: 'h', minutes: 'm', seconds: 's',
  },
  pt: {
    title: 'Calculadora SLA Pro',
    subtitle: 'Calcule budgets de downtime, MTTR/MTBF, SLA composto serial/paralelo e estimativas de penalidade.',
    slaInput: 'Porcentagem SLA',
    slaInputDesc: 'Informe o SLA % para calcular o downtime permitido',
    downtimeInput: 'Downtime para SLA',
    downtimeInputDesc: 'Informe o downtime para calcular o SLA equivalente',
    slaPercent: 'SLA %',
    downtimeHours: 'Downtime (horas/ano)',
    year: 'Ano', month: 'Mes', week: 'Semana', day: 'Dia',
    mttr: 'MTTR / MTBF',
    mttrDesc: 'Tempo medio de reparo e entre falhas',
    mttrVal: 'MTTR (horas)',
    incidents: 'Incidentes por ano',
    mtbf: 'MTBF',
    availability: 'Disponibilidade',
    composite: 'SLA Composto',
    compositeDesc: 'Combine multiplos componentes',
    serial: 'Serial (todos precisam estar ativos)',
    parallel: 'Paralelo (qualquer um ativo)',
    addComponent: 'Adicionar Componente',
    componentSla: 'SLA do Componente %',
    compositeResult: 'SLA Composto',
    penalty: 'Calculadora de Penalidade',
    penaltyDesc: 'Estime a penalidade por violacao de SLA',
    contractValue: 'Valor mensal do contrato (R$)',
    penaltyPct: 'Penalidade por hora de downtime (%)',
    exceededHours: 'Horas excedidas',
    estimatedPenalty: 'Penalidade estimada',
    maintenance: 'Impacto de Janela de Manutencao',
    maintHours: 'Manutencao planejada (horas/ano)',
    maintAdj: 'SLA ajustado (excl. manutencao)',
    builtBy: 'Criado por',
    nines: 'noves',
    hours: 'h', minutes: 'm', seconds: 's',
  },
} as const

type Lang = keyof typeof translations

interface Component {
  id: string
  sla: number
}

type Translations = typeof translations[keyof typeof translations]

function fmtDowntime(hours: number, t: Translations): string {
  if (hours < 1 / 60) return `${(hours * 3600).toFixed(1)}${t.seconds}`
  if (hours < 1) return `${(hours * 60).toFixed(1)}${t.minutes}`
  return `${hours.toFixed(2)}${t.hours}`
}

const YEAR_HRS = 8760
const MONTH_HRS = 730
const WEEK_HRS = 168
const DAY_HRS = 24

export default function SLACalculatorPro() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [sla, setSla] = useState(99.9)
  const [downtimeHours, setDowntimeHours] = useState(8.76)
  const [mttr, setMttr] = useState(1)
  const [incidents, setIncidents] = useState(12)
  const [components, setComponents] = useState<Component[]>([
    { id: '1', sla: 99.9 },
    { id: '2', sla: 99.95 },
  ])
  const [compositeMode, setCompositeMode] = useState<'serial' | 'parallel'>('serial')
  const [contractValue, setContractValue] = useState(1000)
  const [penaltyPct, setPenaltyPct] = useState(5)
  const [exceededHours, setExceededHours] = useState(2)
  const [maintHours, setMaintHours] = useState(24)

  const t = translations[lang]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  // SLA -> downtime
  const downtime = { year: YEAR_HRS * (1 - sla / 100), month: MONTH_HRS * (1 - sla / 100), week: WEEK_HRS * (1 - sla / 100), day: DAY_HRS * (1 - sla / 100) }
  // Downtime -> SLA
  const derivedSla = (1 - downtimeHours / YEAR_HRS) * 100
  // MTBF
  const mtbf = incidents > 0 ? YEAR_HRS / incidents : YEAR_HRS
  const avail = (mtbf / (mtbf + mttr)) * 100
  // Composite
  const serialSla = components.reduce((p, c) => p * (c.sla / 100), 1) * 100
  const parallelSla = (1 - components.reduce((p, c) => p * (1 - c.sla / 100), 1)) * 100
  const compositeSla = compositeMode === 'serial' ? serialSla : parallelSla
  // Penalty
  const penalty = contractValue * (penaltyPct / 100) * exceededHours
  // Maintenance adjusted
  const adjustedSla = (1 - ((YEAR_HRS * (1 - sla / 100)) / (YEAR_HRS - maintHours))) * 100

  const nines = sla >= 99 ? sla.toString().split('9').length - 1 : 0

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            <span className="font-semibold">SLA Calculator Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/sla-calculator-pro" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* SLA -> Downtime */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div>
                <h2 className="font-semibold">{t.slaInput}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.slaInputDesc}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.slaPercent}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-500 tabular-nums">{sla.toFixed(4)}%</span>
                    {nines > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{nines} {t.nines}</span>}
                  </div>
                </div>
                <input type="range" min={90} max={99.9999} step={0.0001} value={sla} onChange={e => setSla(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-amber-500" />
                <div className="flex justify-between text-[10px] text-zinc-400"><span>90%</span><span>99.9999%</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  [t.year, downtime.year],
                  [t.month, downtime.month],
                  [t.week, downtime.week],
                  [t.day, downtime.day],
                ] as [string, number][]).map(([period, hrs]) => (
                  <div key={period} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{period}</p>
                    <p className="text-sm font-bold tabular-nums text-amber-500">{fmtDowntime(hrs, t)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Downtime -> SLA */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div>
                <h2 className="font-semibold">{t.downtimeInput}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.downtimeInputDesc}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.downtimeHours}</label>
                  <span className="text-lg font-bold text-amber-500 tabular-nums">{downtimeHours}h</span>
                </div>
                <input type="range" min={0.1} max={876} step={0.1} value={downtimeHours} onChange={e => setDowntimeHours(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-amber-500" />
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">{t.slaPercent}</p>
                <p className="text-3xl font-bold text-amber-500 tabular-nums">{derivedSla.toFixed(4)}%</p>
              </div>

              {/* MTTR/MTBF */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">{t.mttr}</h3>
                {[
                  { label: t.mttrVal, value: mttr, set: setMttr, min: 0.5, max: 48, step: 0.5 },
                  { label: t.incidents, value: incidents, set: setIncidents, min: 1, max: 365, step: 1 },
                ].map(({ label, value, set, min, max, step }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-xs font-medium">{label}</label>
                      <span className="text-xs font-bold text-amber-500 tabular-nums">{value}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-amber-500" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">{t.mtbf}</p>
                    <p className="text-sm font-bold text-amber-500">{mtbf.toFixed(1)}h</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">{t.availability}</p>
                    <p className="text-sm font-bold text-amber-500">{avail.toFixed(4)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Composite SLA */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div>
                <h2 className="font-semibold">{t.composite}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.compositeDesc}</p>
              </div>
              <div className="flex gap-2">
                {(['serial', 'parallel'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setCompositeMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${compositeMode === m ? 'bg-amber-500 text-white border-amber-500' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  >
                    {m === 'serial' ? t.serial : t.parallel}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {components.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-20 shrink-0">{t.componentSla}</span>
                    <input
                      type="number"
                      min={50}
                      max={99.9999}
                      step={0.001}
                      value={c.sla}
                      onChange={e => setComponents(cs => cs.map(cc => cc.id === c.id ? { ...cc, sla: Number(e.target.value) } : cc))}
                      className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {i > 0 && (
                      <button onClick={() => setComponents(cs => cs.filter(cc => cc.id !== c.id))} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setComponents(cs => [...cs, { id: Date.now().toString(), sla: 99.9 }])} className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors">
                  <Plus size={12} />{t.addComponent}
                </button>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-center">
                <p className="text-xs text-zinc-500 mb-1">{t.compositeResult}</p>
                <p className="text-2xl font-bold text-amber-500 tabular-nums">{compositeSla.toFixed(4)}%</p>
              </div>
            </div>

            {/* Penalty + Maintenance */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
              <div>
                <h2 className="font-semibold">{t.penalty}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.penaltyDesc}</p>
              </div>
              {[
                { label: t.contractValue, value: contractValue, set: setContractValue, min: 100, max: 100000, step: 100 },
                { label: t.penaltyPct, value: penaltyPct, set: setPenaltyPct, min: 1, max: 50, step: 1 },
                { label: t.exceededHours, value: exceededHours, set: setExceededHours, min: 1, max: 720, step: 1 },
              ].map(({ label, value, set, min, max, step }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">{label}</label>
                    <span className="text-sm font-bold text-amber-500 tabular-nums">{value.toLocaleString()}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-amber-500" />
                </div>
              ))}
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">{t.estimatedPenalty}</p>
                <p className="text-2xl font-bold text-amber-500 tabular-nums">${penalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-semibold">{t.maintenance}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-sm">{t.maintHours}</label>
                    <span className="text-sm font-bold text-amber-500 tabular-nums">{maintHours}h</span>
                  </div>
                  <input type="range" min={0} max={200} step={1} value={maintHours} onChange={e => setMaintHours(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-amber-500" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">{t.maintAdj}</span>
                  <span className="font-bold text-amber-500">{adjustedSla.toFixed(4)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
