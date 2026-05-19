import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { startOfWeek, endOfWeek, format } from 'date-fns'

const AppContext = createContext(null)

const initialState = {
  currentWeek: null,
  weeks: [],
  tasks: [],
  intakeItems: [],
  wins: [],
  leftSections: [],
  activeTimerTaskId: null,
  loading: true,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false }
    case 'SET_WEEK': return { ...state, currentWeek: action.payload, loading: false }
    case 'SET_WEEKS': return { ...state, weeks: action.payload }
    case 'SET_TASKS': return { ...state, tasks: action.payload }
    case 'SET_INTAKE': return { ...state, intakeItems: action.payload }
    case 'SET_WINS': return { ...state, wins: action.payload }
    case 'SET_LEFT_SECTIONS': return { ...state, leftSections: action.payload }
    case 'SET_ACTIVE_TIMER': return { ...state, activeTimerTaskId: action.payload }
    case 'UPSERT_TASK': {
      const exists = state.tasks.find(t => t.id === action.payload.id)
      return {
        ...state,
        tasks: exists
          ? state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
          : [...state.tasks, action.payload],
      }
    }
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    case 'UPSERT_INTAKE': {
      const exists = state.intakeItems.find(i => i.id === action.payload.id)
      return {
        ...state,
        intakeItems: exists
          ? state.intakeItems.map(i => i.id === action.payload.id ? action.payload : i)
          : [...state.intakeItems, action.payload],
      }
    }
    case 'REMOVE_INTAKE':
      return { ...state, intakeItems: state.intakeItems.filter(i => i.id !== action.payload) }
    case 'UPSERT_WIN': {
      const exists = state.wins.find(w => w.id === action.payload.id)
      return {
        ...state,
        wins: exists
          ? state.wins.map(w => w.id === action.payload.id ? action.payload : w)
          : [...state.wins, action.payload],
      }
    }
    case 'REMOVE_WIN':
      return { ...state, wins: state.wins.filter(w => w.id !== action.payload) }
    case 'UPSERT_SECTION': {
      const exists = state.leftSections.find(s => s.id === action.payload.id)
      return {
        ...state,
        leftSections: exists
          ? state.leftSections.map(s => s.id === action.payload.id ? action.payload : s)
          : [...state.leftSections, action.payload],
      }
    }
    case 'REMOVE_SECTION':
      return { ...state, leftSections: state.leftSections.filter(s => s.id !== action.payload) }
    case 'SET_SECTIONS':
      return { ...state, leftSections: action.payload }
    default:
      return state
  }
}

const DEFAULT_SECTIONS = [
  { type: 'wins', title: 'Wins of the Week', sort_order: 0, content: '', prospecting_days: null },
  { type: 'checkins', title: 'Check-Ins', sort_order: 1, content: '', prospecting_days: null },
  { type: 'prospecting', title: 'Prospecting', sort_order: 2, content: '', prospecting_days: { mon: false, tue: false, wed: false, thu: false, fri: false } },
  { type: 'sales_meeting', title: 'Sales Meeting', sort_order: 3, content: '', prospecting_days: null },
]

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const getMonday = (date) => {
    const d = startOfWeek(date, { weekStartsOn: 1 })
    return format(d, 'yyyy-MM-dd')
  }

  const getSunday = (date) => {
    const d = endOfWeek(date, { weekStartsOn: 1 })
    return format(d, 'yyyy-MM-dd')
  }

  const loadWeekData = useCallback(async (weekId) => {
    const [tasksRes, intakeRes, winsRes, sectionsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('week_id', weekId).order('sort_order'),
      supabase.from('intake_items').select('*').eq('week_id', weekId).order('created_at'),
      supabase.from('wins').select('*').eq('week_id', weekId).order('created_at'),
      supabase.from('left_sections').select('*').eq('week_id', weekId).order('sort_order'),
    ])
    dispatch({ type: 'SET_TASKS', payload: tasksRes.data || [] })
    dispatch({ type: 'SET_INTAKE', payload: intakeRes.data || [] })
    dispatch({ type: 'SET_WINS', payload: winsRes.data || [] })
    dispatch({ type: 'SET_LEFT_SECTIONS', payload: sectionsRes.data || [] })

    // find any running timer
    const running = (tasksRes.data || []).find(t => t.timer_running)
    if (running) dispatch({ type: 'SET_ACTIVE_TIMER', payload: running.id })
  }, [])

  const initWeek = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const today = new Date()
    const monday = getMonday(today)
    const sunday = getSunday(today)

    // load all weeks for history nav
    const { data: allWeeks } = await supabase.from('weeks').select('*').order('start_date', { ascending: false })
    dispatch({ type: 'SET_WEEKS', payload: allWeeks || [] })

    // find or create current week
    let week = (allWeeks || []).find(w => w.start_date === monday)

    if (!week) {
      const { data: newWeek, error } = await supabase
        .from('weeks')
        .insert({ start_date: monday, end_date: sunday, status: 'active' })
        .select()
        .single()

      if (error) { dispatch({ type: 'SET_ERROR', payload: error.message }); return }
      week = newWeek

      // seed default left sections
      const sections = DEFAULT_SECTIONS.map(s => ({ ...s, week_id: week.id }))
      const { data: createdSections } = await supabase.from('left_sections').insert(sections).select()
      dispatch({ type: 'SET_LEFT_SECTIONS', payload: createdSections || [] })
      dispatch({ type: 'SET_WEEKS', payload: [week, ...(allWeeks || [])] })
    }

    dispatch({ type: 'SET_WEEK', payload: week })
    await loadWeekData(week.id)
  }, [loadWeekData])

  useEffect(() => { initWeek() }, [initWeek])

  return (
    <AppContext.Provider value={{ state, dispatch, loadWeekData, initWeek, getMonday, getSunday, DEFAULT_SECTIONS }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
