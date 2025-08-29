import React, { useMemo, useState, useEffect } from "react";

/**
 * Breakfast Duty Calendar – Setembro a Dezembro/2025
 * • Dias úteis (Seg–Sex), pulando feriados nacionais, estaduais (ES) e municipais (Vitória)
 * • Rotação contínua entre os nomes + troca manual por dia (persistência em localStorage)
 * • Se um nome for removido da lista, as trocas manuais associadas a ele são apagadas
 * • Início configurável (default: 2025-08-25, uma segunda)
 * • Botão "Imprimir" com CSS otimizado (A4)
 * • UI refinada (chips por pessoa, legenda, badge de feriado)
 * • Testes rápidos no console (ativar com ?test=1 ou em localhost)
 */

// Util: nomes fornecidos (editáveis pela UI)
const DEFAULT_NAMES = [
  "elielton",
  "elisandro",
  "sthevan",
  "silvo",
  "jacquisley",
  "reginaldo",
  "clebio",
  "everton",
  "luiz",
  "",
];

// Datas alvo
const SEP_2025 = { year: 2025, month: 8 }; // Setembro
const OCT_2025 = { year: 2025, month: 9 }; // Outubro
const NOV_2025 = { year: 2025, month: 10 }; // Novembro
const DEC_2025 = { year: 2025, month: 11 }; // Dezembro

// Segunda padrão: 2025-08-25
const DEFAULT_START_ISO = "2025-08-25";

// ------------------------------
// FERIADOS (Nacionais + ES + Vitória) – 2025
// ------------------------------
const HOLIDAYS_2025: Record<string, { nome: string; tipo: string }> = {
  // Nacionais relevantes Ago–Dez
  "2025-09-07": { nome: "Independência do Brasil", tipo: "nacional" },
  "2025-10-12": { nome: "Nossa Senhora Aparecida", tipo: "nacional" },
  "2025-11-02": { nome: "Finados", tipo: "nacional" },
  "2025-11-15": { nome: "Proclamação da República", tipo: "nacional" },
  "2025-11-20": { nome: "Dia da Consciência Negra", tipo: "nacional" },
  "2025-12-25": { nome: "Natal", tipo: "nacional" },
  // Estaduais ES
  "2025-04-28": { nome: "Nossa Senhora da Penha (Padroeira do ES)", tipo: "estadual-ES" },
  // Municipais Vitória
  "2025-09-08": { nome: "Nossa Senhora da Vitória (Padroeira de Vitória)", tipo: "municipal-Vitória" },
};

// ------------------------------
// Helpers
// ------------------------------
const isWeekday = (d: Date) => {
  const day = d.getDay();
  return day >= 1 && day <= 5; // Seg–Sex
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfMonth = (y: number, m: number) => new Date(y, m, 1);
const endOfMonth = (y: number, m: number) => new Date(y, m + 1, 0);

function formatISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getHolidayInfo(d: Date) {
  return HOLIDAYS_2025[formatISO(d)] || null;
}

function isDutyDay(d: Date) {
  return isWeekday(d) && !getHolidayInfo(d);
}

function monthMatrix(year: number, month: number) {
  const first = startOfMonth(year, month);
  const last = endOfMonth(year, month);
  const firstWeekdayIndex = (first.getDay() + 6) % 7; // 0=Dom → 6; 1=Seg → 0; ... 6=Sáb → 5

  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekdayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Matriz do mês iniciando no DOMINGO (para layout minimalista)
function monthMatrixSundayFirst(year: number, month: number) {
  const first = startOfMonth(year, month);
  const last = endOfMonth(year, month);
  const firstWeekdayIndex = first.getDay(); // 0=Dom, 1=Seg, ... 6=Sab

  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekdayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function dutyDaysCountBetween(a: Date, b: Date) {
  // Conta DIAS DE ESCALA (úteis e sem feriado) entre a (inclusive) e b (inclusive)
  let count = 0;
  let cur = new Date(a);
  const end = new Date(b);
  while (cur <= end) {
    if (isDutyDay(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

// Funções para o sistema aleatório
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
  return new Date(d.setDate(diff));
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getAllDutyDaysInWeek(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    if (isDutyDay(day)) {
      days.push(day);
    }
  }
  return days;
}

function getAllDutyDaysInMonth(monthStart: Date): Date[] {
  const days: Date[] = [];
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const lastDay = endOfMonth(year, month);
  
  let current = new Date(monthStart);
  while (current <= lastDay) {
    if (isDutyDay(current)) {
      days.push(new Date(current));
    }
    current = addDays(current, 1);
  }
  return days;
}

function countPersonInMonth(person: string, monthStart: Date, assignments: Record<string, string>): number {
  const monthDays = getAllDutyDaysInMonth(monthStart);
  return monthDays.filter(day => assignments[formatISO(day)] === person).length;
}

function getAssignmentsInWeek(weekStart: Date, assignments: Record<string, string>): string[] {
  const weekDays = getAllDutyDaysInWeek(weekStart);
  return weekDays.map(day => assignments[formatISO(day)]).filter(Boolean);
}

// Seeded random para resultados consistentes
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const x = Math.sin(Math.abs(hash)) * 10000;
  return x - Math.floor(x);
}

function assignmentIndex(startMonday: Date, targetDate: Date, peopleCount: number) {
  // Índice rotativo baseado nos DIAS DE ESCALA transcorridos desde o start
  if (!isDutyDay(targetDate)) return null;
  const prevDay = addDays(targetDate, -1);
  const dutyUntilPrev = dutyDaysCountBetween(startMonday, prevDay);
  return peopleCount > 0 ? dutyUntilPrev % peopleCount : 0;
}

function randomAssignment(
  targetDate: Date, 
  people: string[], 
  overrides: Record<string, string>,
  months: Array<{ year: number; month: number }>
): string | null {
  if (!isDutyDay(targetDate) || people.length === 0) return null;
  
  // Gera todas as atribuições automáticas para todos os meses
  const allAssignments: Record<string, string> = {};
  
  // Para cada mês, gera atribuições respeitando as restrições
  for (const monthInfo of months) {
    const monthStart = new Date(monthInfo.year, monthInfo.month, 1);
    const monthDays = getAllDutyDaysInMonth(monthStart);
    
    // Agrupar dias por semana
    const weekGroups: Record<string, Date[]> = {};
    monthDays.forEach(day => {
      const weekKey = formatISO(getWeekStart(day));
      if (!weekGroups[weekKey]) weekGroups[weekKey] = [];
      weekGroups[weekKey].push(day);
    });
    
    // Contador de atribuições por pessoa no mês
    const monthCounter: Record<string, number> = {};
    people.forEach(person => monthCounter[person] = 0);
    
    // Para cada semana do mês
    Object.keys(weekGroups).sort().forEach(weekKey => {
      const weekDays = weekGroups[weekKey].sort((a, b) => a.getTime() - b.getTime());
      const usedInWeek = new Set<string>();
      
      weekDays.forEach(day => {
        const dayISO = formatISO(day);
        
        // Se já tem override, usa o override
        if (overrides[dayISO]) {
          allAssignments[dayISO] = overrides[dayISO];
          usedInWeek.add(overrides[dayISO]);
          monthCounter[overrides[dayISO]] = (monthCounter[overrides[dayISO]] || 0) + 1;
          return;
        }
        
        // Filtra pessoas disponíveis
        const available = people.filter(person => {
          // Não pode ter sido usada na semana
          if (usedInWeek.has(person)) return false;
          // Não pode exceder 2 vezes no mês
          if ((monthCounter[person] || 0) >= 2) return false;
          return true;
        });
        
        if (available.length === 0) {
          // Se não há ninguém disponível, relaxa a regra da semana
          const monthAvailable = people.filter(person => (monthCounter[person] || 0) < 2);
          if (monthAvailable.length > 0) {
            const seed = dayISO + people.join(',');
            const randomIndex = Math.floor(seededRandom(seed) * monthAvailable.length);
            const chosen = monthAvailable[randomIndex];
            allAssignments[dayISO] = chosen;
            monthCounter[chosen] = (monthCounter[chosen] || 0) + 1;
          }
        } else {
          // Escolhe aleatoriamente entre os disponíveis
          const seed = dayISO + available.join(',');
          const randomIndex = Math.floor(seededRandom(seed) * available.length);
          const chosen = available[randomIndex];
          allAssignments[dayISO] = chosen;
          usedInWeek.add(chosen);
          monthCounter[chosen] = (monthCounter[chosen] || 0) + 1;
        }
      });
    });
  }
  
  return allAssignments[formatISO(targetDate)] || null;
}

function hashToHsl(str: string) {
  // cor estável por nome
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 60% 85%)`;
}

function filterOverridesByPeople(overrides: Record<string, string>, people: string[]) {
  const cleaned: Record<string, string> = {};
  for (const [iso, name] of Object.entries(overrides || {})) {
    if (people.includes(name)) cleaned[iso] = name;
  }
  return cleaned;
}

function Legend({ people }: { people: string[] }) {
  if (!people.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {people.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-slate-700 font-medium text-sm hover:scale-105 transition-transform"
            style={{ 
              backgroundColor: hashToHsl(p),
              borderColor: `hsl(${(() => {
                let h = 0;
                for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0;
                return h % 360;
              })()} 60% 70%)`
            }}
            title={p}
          >
            <span className="w-2 h-2 rounded-full bg-slate-600/70" />
            {p}
          </span>
        ))}
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border-2 border-amber-200 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-600/70" /> 
        Feriados BR + ES + Vitória são ignorados
      </div>
    </div>
  );
}

function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border-2 bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl border-2 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            ✕ Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MonthCard({
  title, year, month, startMonday, people, getOverride, onEditDay, randomMode, overrides, months, minimal, sundayFirst
}: {
  title: string; year: number; month: number; startMonday: Date; people: string[];
  getOverride: (iso: string) => string; onEditDay: (iso: string, person: string) => void;
  randomMode: boolean; overrides: Record<string, string>; 
  months: Array<{ year: number; month: number }>;
  minimal?: boolean; sundayFirst?: boolean;
}) {
  const weeks = useMemo(() => (sundayFirst ? monthMatrixSundayFirst(year, month) : monthMatrix(year, month)), [year, month, sundayFirst]);

  return (
    <div className={minimal ? "rounded-2xl bg-white border border-slate-300 overflow-hidden" : "break-inside-avoid rounded-3xl shadow-2xl p-6 lg:p-8 xl:p-10 bg-white border border-slate-200/50 h-full"}>
      {minimal ? (
        <div className="relative">
          <div className="h-14 bg-black text-white flex items-center px-5 text-sm font-semibold tracking-wide" style={{clipPath: "polygon(0 0, 85% 0, 80% 100%, 0% 100%)"}}>
            {title.toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-slate-800">{title}</h2>
            <p className="text-base text-slate-500 mt-3">Rotação desde {formatISO(startMonday)}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-100 text-indigo-800 text-base font-medium border border-indigo-200">
              ☕ Café da manhã
            </span>
          </div>
        </div>
      )}

      <div className={minimal ? "grid grid-cols-7 border-t border-slate-300" : "grid grid-cols-7 gap-4 lg:gap-6 text-center text-base font-semibold text-slate-700 mb-6"}>
        {(sundayFirst ? ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"] : ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]).map((w) => (
          <div key={w} className={minimal ? "py-3 text-xs font-semibold uppercase tracking-wide text-slate-700 border-b border-slate-300 text-center" : "py-4 lg:py-5 uppercase tracking-wide bg-slate-50 rounded-xl text-lg"}>{w}</div>
        ))}
      </div>

      <div className={minimal ? "grid grid-cols-7" : "grid grid-cols-7 gap-4 lg:gap-6 text-base mt-6"}>
        {weeks.flat().map((cell, i) => {
          if (!cell)
            return (
              <div key={i} className={minimal ? "aspect-[1/1] border border-slate-300 bg-white" : "aspect-square rounded-2xl border border-dashed border-slate-200 bg-slate-50/40"} />
            );

          const iso = formatISO(cell);
          const holiday = getHolidayInfo(cell);
          const isWeekendDay = !isWeekday(cell);
          const isBlocked = isWeekendDay || !!holiday;

          let autoPerson = "";
          if (!isBlocked) {
            if (randomMode) {
              autoPerson = randomAssignment(cell, people, overrides, months) || "";
            } else {
              const idx = assignmentIndex(startMonday, cell, people.length || 1);
              autoPerson = idx !== null ? people[idx] : "";
            }
          }
          const overridePerson = getOverride(iso);
          const person = overridePerson || autoPerson;

          return (
            <button
              type="button"
              onClick={() => !isBlocked && onEditDay(iso, person)}
              key={i}
              className={minimal
                ? ("aspect-[1/1] border border-slate-300 " + (holiday ? "bg-amber-50" : "bg-white") + " p-2 text-left hover:bg-slate-50")
                : "aspect-square rounded-2xl border p-4 lg:p-5 xl:p-6 flex flex-col items-start justify-between transition-all duration-200 text-left min-h-[100px] lg:min-h-[120px] xl:min-h-[140px] " +
                  (isBlocked
                    ? "bg-slate-50 border-slate-200 opacity-75 cursor-not-allowed"
                    : "bg-white border-slate-300 hover:shadow-xl hover:border-indigo-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-indigo-300/50 cursor-pointer")}
              title={!isBlocked && person ? person : holiday ? holiday.nome : undefined}
            >
              {minimal ? (
                <div className="flex flex-col h-full">
                  <div className="text-sm text-slate-800 font-medium">{cell.getDate()}</div>
                  {!isBlocked && person && (
                    <div className="mt-1 text-[10px] text-slate-700 leading-tight pr-1 line-clamp-2">{person}</div>
                  )}
                  {holiday && (
                    <div className="mt-auto text-[10px] text-amber-700 font-semibold leading-tight pr-1">
                      🎉 {holiday.nome}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between w-full text-base lg:text-lg text-slate-700 font-medium">
                    <span className="text-xl lg:text-2xl xl:text-3xl font-bold">{cell.getDate()}</span>
                    {holiday && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium">
                        🎉
                      </span>
                    )}
                  </div>
                  {!isBlocked && person && (
                    <div
                      className="text-sm lg:text-base xl:text-lg font-bold text-slate-800 w-full px-3 py-2 lg:py-3 rounded-xl mt-3 border break-words text-center leading-tight"
                      title={person}
                      style={{ 
                        backgroundColor: hashToHsl(person),
                        borderColor: `hsl(${(() => {
                          let h = 0;
                          for (let i = 0; i < person.length; i++) h = (h * 31 + person.charCodeAt(i)) >>> 0;
                          return h % 360;
                        })()} 60% 70%)`
                      }}
                    >
                      {person}
                      {overridePerson && <span className="text-sm ml-1 opacity-80">✏️</span>}
                    </div>
                  )}
                  {holiday && (
                    <div className="text-xs lg:text-sm text-slate-600 mt-auto line-clamp-2 font-medium" title={holiday.nome}>
                      {holiday.nome}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BreakfastDutyCalendar() {
  const [namesText, setNamesText] = useState(DEFAULT_NAMES.join("\n"));
  const [startISO, setStartISO] = useState(DEFAULT_START_ISO);
  const [overrides, setOverrides] = useState<Record<string, string>>({}); // { 'YYYY-MM-DD': 'nome' }
  const [editing, setEditing] = useState<{ iso: string; person: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set(['setembro', 'outubro', 'novembro', 'dezembro']));
  const [randomMode, setRandomMode] = useState(true); // Modo aleatório ativado por padrão
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [printingMode, setPrintingMode] = useState(false);

  // Load overrides
  useEffect(() => {
    try {
      const raw = localStorage.getItem("breakfast_overrides_2025");
      if (raw) setOverrides(JSON.parse(raw));
    } catch (_) {}
  }, []);
  // Save overrides
  useEffect(() => {
    try {
      localStorage.setItem("breakfast_overrides_2025", JSON.stringify(overrides));
    } catch (_) {}
  }, [overrides]);

  const people = useMemo(
    () => namesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [namesText]
  );

  // Limpa overrides com nomes removidos
  useEffect(() => {
    setOverrides((prev) => filterOverridesByPeople(prev, people));
  }, [people]);

  const startMonday = useMemo(() => new Date(startISO + "T00:00:00"), [startISO]);
  const months = [
    { title: "Setembro/2025", year: SEP_2025.year, month: SEP_2025.month, key: 'setembro' },
    { title: "Outubro/2025", year: OCT_2025.year, month: OCT_2025.month, key: 'outubro' },
    { title: "Novembro/2025", year: NOV_2025.year, month: NOV_2025.month, key: 'novembro' },
    { title: "Dezembro/2025", year: DEC_2025.year, month: DEC_2025.month, key: 'dezembro' },
  ];

  const monthsForAssignment = months.map(m => ({ year: m.year, month: m.month }));

  const monthNamesLong = [
    'janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'
  ];
  const minimalTitle = `${monthNamesLong[currentMonth].toUpperCase()} ${currentYear}`;
  function goPrevMonth() {
    const m = currentMonth - 1;
    if (m < 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else { setCurrentMonth(m); }
  }
  function goNextMonth() {
    const m = currentMonth + 1;
    if (m > 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else { setCurrentMonth(m); }
  }

  const getOverride = (iso: string) => overrides[iso] || "";
  const applyOverride = (iso: string, person: string) => setOverrides((prev) => ({ ...prev, [iso]: person }));
  const clearOverride = (iso: string) => setOverrides((prev) => { const n = { ...prev }; delete n[iso]; return n; });
  const clearAllOverrides = () => {
    setOverrides({});
    setShowClearConfirm(false);
  };

  // Função de impressão melhorada
  const handlePrint = async () => {
    setPrintLoading(true);
    try {
      setPrintingMode(true);
      // Fecha o modal e aguarda o DOM estabilizar
      setShowPrintModal(false);
      await new Promise(resolve => setTimeout(resolve, 150));
      window.print();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      alert('Erro ao imprimir. Tente novamente.');
    } finally {
      setPrintLoading(false);
      setPrintingMode(false);
    }
  };

  // Conta quantas trocas manuais existem
  const manualOverridesCount = Object.keys(overrides).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 text-slate-900">
      <div className="container mx-auto px-4 py-6 lg:px-6 xl:px-8 max-w-full">
        {/* Header compacto (como a primeira imagem) */}
        <div className="mb-8 flex items-start justify-between gap-6 print:hidden">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Calendário de Lanche JL
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              {randomMode ? (
                <>
                  Distribuição <span className="font-semibold text-emerald-700">aleatória</span> em dias úteis (Seg–Sex), pulando feriados <span className="font-semibold">BR + ES + Vitória</span>.
                </>
              ) : (
                <>
                  Rodízio <span className="font-semibold text-blue-700">sequencial</span> em dias úteis (Seg–Sex), pulando feriados <span className="font-semibold">BR + ES + Vitória</span>.
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                🎯 Sem repetição na mesma semana • Máximo 2x por mês
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                💡 Clique em qualquer dia para trocar manualmente
              </span>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button 
              onClick={() => setShowPrintModal(true)} 
              disabled={printLoading}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {printLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Imprimindo...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </>
              )}
            </button>
            <button 
              onClick={() => setShowClearConfirm(true)} 
              disabled={manualOverridesCount === 0}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
              title={`Remover todas as ${manualOverridesCount} trocas manuais`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar trocas
              {manualOverridesCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {manualOverridesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Config Panel */}
        <div className="grid lg:grid-cols-4 gap-8 print:hidden mb-12">
          <div className="rounded-3xl border bg-white p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-shadow">
            <label className="block text-lg font-semibold mb-4 text-slate-800">📅 Data de início</label>
            <input 
              type="date" 
              value={startISO} 
              onChange={(e) => setStartISO(e.target.value)} 
              className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none transition-colors" 
            />
            <p className="text-sm text-slate-500 mt-3">Padrão: 2025-08-25 (segunda)</p>
          </div>
          
          <div className="rounded-3xl border bg-white p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-shadow">
            <label className="block text-lg font-semibold mb-4 text-slate-800">⚙️ Modo de distribuição</label>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={randomMode}
                  onChange={() => setRandomMode(true)}
                  className="w-5 h-5 text-indigo-600"
                />
                <span className="text-base font-medium">🎲 Aleatório</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={!randomMode}
                  onChange={() => setRandomMode(false)}
                  className="w-5 h-5 text-indigo-600"
                />
                <span className="text-base font-medium">🔄 Sequencial</span>
              </label>
            </div>
            <p className="text-sm text-slate-500 mt-4 p-3 bg-slate-50 rounded-lg">
              {randomMode ? "Distribuição aleatória respeitando restrições" : "Rotação em ordem sequencial"}
            </p>
          </div>
          
          <div className="rounded-3xl border bg-white p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold text-slate-800">👥 Pessoas</label>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Recomendado: até 10</span>
            </div>
            <textarea 
              value={namesText} 
              onChange={(e) => setNamesText(e.target.value)} 
              rows={8} 
              placeholder="Digite um nome por linha..."
              className="w-full border-2 rounded-xl px-4 py-3 font-mono text-base focus:border-indigo-500 focus:outline-none transition-colors resize-none" 
            />
            <div className="mt-4"><Legend people={people} /></div>
          </div>
        </div>

        {/* Calendário — Empilhar meses em sequência (minimalista) */}
        <div className="mt-8 max-w-[1100px] mx-auto space-y-8">
          {months
            .filter((m) => !printingMode || selectedMonths.has(m.key))
            .map((m) => (
            <MonthCard
              key={m.title}
              title={m.title}
              year={m.year}
              month={m.month}
              startMonday={startMonday}
              people={people}
              getOverride={getOverride}
              onEditDay={(iso, current) => setEditing({ iso, person: current })}
              randomMode={randomMode}
              overrides={overrides}
              months={monthsForAssignment}
              minimal={true}
              sundayFirst={true}
            />
          ))}
        </div>

        <footer className="text-center mt-16 print:hidden">
          <div className="bg-white rounded-3xl shadow-xl p-6 mx-auto max-w-2xl border border-slate-200/50">
            <p className="text-lg font-semibold text-slate-700 mb-2">
              ☕ Sistema de Escala JL
            </p>
            <p className="text-sm text-slate-500">
              Desenvolvido com ❤️ • Impresso em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </footer>
      </div>

      {/* Modal de troca manual */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Trocar responsável – ${editing.iso}` : ""}>
        {editing && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-slate-800">👤 Selecionar pessoa</label>
            <select
              value={editing.person || ""}
              onChange={(e) => setEditing((prev) => prev ? { iso: prev.iso, person: e.target.value } : null)}
              className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none transition-colors"
            >
              <option value="">— Sem responsável —</option>
              {people.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-4 pt-6">
              <button 
                onClick={() => { if (editing) { clearOverride(editing.iso); setEditing(null); } }} 
                className="px-6 py-3 rounded-xl border-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all hover:scale-105"
              >
                🗑️ Limpar dia
              </button>
              <button 
                onClick={() => { if (editing?.person) applyOverride(editing.iso, editing.person); setEditing(null); }} 
                className="px-6 py-3 rounded-xl border-2 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-all hover:scale-105"
              >
                ✅ Salvar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmação para limpar trocas */}
      <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Confirmar limpeza">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Limpar todas as trocas manuais?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Esta ação irá remover <strong>{manualOverridesCount} troca{manualOverridesCount !== 1 ? 's' : ''} manual{manualOverridesCount !== 1 ? 'is' : ''}</strong> e restaurar a rotação automática para todos os dias.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <button 
              onClick={() => setShowClearConfirm(false)} 
              className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 text-gray-700"
            >
              Cancelar
            </button>
            <button 
              onClick={clearAllOverrides} 
              className="px-4 py-2 rounded-xl border bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Sim, limpar todas
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de seleção de meses para impressão */}
      <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title="Selecionar meses para impressão">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione quais meses deseja incluir na impressão:
          </p>
          <div className="space-y-2">
            {months.map((month) => (
              <label key={month.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMonths.has(month.key)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedMonths);
                    if (e.target.checked) {
                      newSelected.add(month.key);
                    } else {
                      newSelected.delete(month.key);
                    }
                    setSelectedMonths(newSelected);
                  }}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">{month.title}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <button 
              onClick={() => setShowPrintModal(false)} 
              className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 text-gray-700"
            >
              Cancelar
            </button>
            <button 
              onClick={handlePrint} 
              disabled={selectedMonths.size === 0}
              className="px-4 py-2 rounded-xl border bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir {selectedMonths.size} mês{selectedMonths.size !== 1 ? 'es' : ''}
            </button>
          </div>
        </div>
      </Modal>

      {/* CSS de impressão melhorado */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { 
            background: #fff !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          * { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            color-adjust: exact;
          }
          .break-inside-avoid { break-inside: avoid; }
          @page { 
            /* Força retrato (vertical). Alguns navegadores respeitam melhor tamanho explícito */
            size: 210mm 297mm; /* A4 em retrato */
            margin: 15mm; 
          }
          /* Evita cortar meses entre páginas */
          .xl\\:grid-cols-3 > * { break-inside: avoid; }
          
          /* Melhora a aparência na impressão */
          .bg-gradient-to-br {
            background: #f8fafc !important;
          }
          
          /* Ajusta tamanhos para impressão */
          .text-2xl { font-size: 1.5rem !important; }
          .text-3xl { font-size: 1.875rem !important; }
          .text-4xl { font-size: 2rem !important; }
          .text-5xl { font-size: 2.5rem !important; }
          .text-6xl { font-size: 3rem !important; }
          .text-7xl { font-size: 3.5rem !important; }
          
          /* Melhora contraste dos chips */
          .rounded-full {
            border: 1px solid #e2e8f0 !important;
          }
          
          /* Garante que os feriados sejam visíveis */
          .bg-amber-100 {
            background-color: #fef3c7 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ------------------------------
// TESTES BÁSICOS (rodam no browser). Ative com ?test=1 ou em localhost
// ------------------------------
function runTests() {
  const eq = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
  const assert = (cond: boolean, msg: string) => { if (!cond) throw new Error("Teste falhou: " + msg); };

  // 1) isWeekday
  assert(isWeekday(new Date("2025-08-25")) === true, "25/08/2025 (Seg) deve ser dia útil");
  assert(isWeekday(new Date("2025-08-23")) === false, "23/08/2025 (Sáb) não deve ser dia útil");

  // 2) dutyDaysCountBetween – semana cheia sem feriados
  assert(dutyDaysCountBetween(new Date("2025-08-25"), new Date("2025-08-29")) === 5, "Semana 25–29/08/2025 deve ter 5 dias de escala");

  // 3) assignmentIndex com 3 pessoas (0,1,2,0,1,skip,skip,2)
  const start = new Date("2025-08-25");
  assert(assignmentIndex(start, new Date("2025-08-25"), 3) === 0, "Seg 25 → idx 0");
  assert(assignmentIndex(start, new Date("2025-08-26"), 3) === 1, "Ter 26 → idx 1");
  assert(assignmentIndex(start, new Date("2025-08-27"), 3) === 2, "Qua 27 → idx 2");
  assert(assignmentIndex(start, new Date("2025-08-28"), 3) === 0, "Qui 28 → idx 0");
  assert(assignmentIndex(start, new Date("2025-08-29"), 3) === 1, "Sex 29 → idx 1");
  assert(assignmentIndex(start, new Date("2025-08-30"), 3) === null, "Sáb 30 → null");
  assert(assignmentIndex(start, new Date("2025-08-31"), 3) === null, "Dom 31 → null");
  assert(assignmentIndex(start, new Date("2025-09-01"), 3) === 2, "Seg 01/09 → idx 2");

  // 4) monthMatrix — quantidade de dias do mês (Set/2025 = 30)
  const daysSep = monthMatrix(2025, 8).flat().filter(Boolean).length;
  assert(daysSep === 30, "Setembro/2025 deve ter 30 dias");

  // 5) Feriados — 20/11 (Consciência Negra), 25/12 (Natal) e 08/09 (Vitória) devem bloquear
  assert(isDutyDay(new Date("2025-11-20")) === false, "20/11/2025 é feriado (nacional) e deve bloquear");
  assert(isDutyDay(new Date("2025-12-25")) === false, "25/12/2025 é feriado (nacional) e deve bloquear");
  assert(isDutyDay(new Date("2025-09-08")) === false, "08/09/2025 é feriado (municipal Vitória) e deve bloquear");

  // 6) Rotação na semana do feriado 20/11/2025
  const s2 = new Date("2025-11-17");
  assert(assignmentIndex(s2, new Date("2025-11-17"), 4) === 0, "17/11 idx 0");
  assert(assignmentIndex(s2, new Date("2025-11-18"), 4) === 1, "18/11 idx 1");
  assert(assignmentIndex(s2, new Date("2025-11-19"), 4) === 2, "19/11 idx 2");
  assert(assignmentIndex(s2, new Date("2025-11-20"), 4) === null, "20/11 feriado → null");
  assert(assignmentIndex(s2, new Date("2025-11-21"), 4) === 3, "21/11 idx 3 (pula o feriado)");

  // 7) Parsing misto ("\\r\\n" e "\\n")
  const mixed = "a\\r\\nb\\nc";
  const parsedMixed = mixed.split(/\\r?\\n/).map((s) => s.trim()).filter(Boolean);
  assert(parsedMixed.length === 3 && parsedMixed[2] === "c", "Split deve suportar CRLF e LF");

  // 8) Limpeza de overrides quando nome sai da lista
  const prevOv = { "2025-09-10": "ana", "2025-09-11": "elielton" };
  const cleaned = filterOverridesByPeople(prevOv as any, ["elielton"]);
  assert(eq(cleaned, { "2025-09-11": "elielton" }), "Overrides devem ser filtrados por nomes ativos");

  console.log("✅ Todos os testes do calendário passaram.");
}

(function maybeRunTestsOnce() {
  try {
    if (typeof window === "undefined") return; // só no browser
    const isLocalhost = /^(localhost|127\\.0\\.0\\.1)$/i.test(window.location.hostname);
    const qsTest = new URLSearchParams(window.location.search).get("test") === "1";
    if ((isLocalhost || qsTest) && !(window as any).__BREAKFAST_CAL_TESTED__) {
      runTests();
      (window as any).__BREAKFAST_CAL_TESTED__ = true;
    }
  } catch (e) {
    console.warn("Teste não executado:", e);
  }
})();
