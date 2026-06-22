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

    // Reset daily tasks that were added on a previous day
    const today = format(new Date(), 'yyyy-MM-dd')
    let tasks = tasksRes.data || []
    const stale = tasks.filter(t => t.on_daily && t.daily_date && t.daily_date < today)
    if (stale.length > 0) {
      await supabase.from('tasks').update({ on_daily: false }).in('id', stale.map(t => t.id))
      tasks = tasks.map(t => stale.find(s => s.id === t.id) ? { ...t, on_daily: false } : t)
    }

    dispatch({ type: 'SET_TASKS', payload: tasks })
    dispatch({ type: 'SET_INTAKE', payload: intakeRes.data || [] })
    dispatch({ type: 'SET_WINS', payload: winsRes.data || [] })
    dispatch({ type: 'SET_LEFT_SECTIONS', payload: sectionsRes.data || [] })

    // find any running timer
    const running = tasks.find(t => t.timer_running)
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

      // find the most recent previous week to carry over from
      const prevWeek = (allWeeks || []).find(w => w.start_date < monday)

      if (prevWeek) {
        // close the previous week
        await supabase.from('weeks').update({ status: 'closed' }).eq('id', prevWeek.id)

        // carry over incomplete tasks
        const { data: prevTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('week_id', prevWeek.id)
          .in('status', ['todo', 'in_progress', 'waiting'])
          .order('sort_order')

        if (prevTasks && prevTasks.length > 0) {
          const carried = prevTasks.map(t => ({
            week_id: week.id,
            title: t.title,
            estimated_time: t.estimated_time,
            estimated_minutes: t.estimated_minutes,
            actual_minutes: 0,
            status: t.status === 'in_progress' ? 'todo' : t.status,
            waiting_note: t.waiting_note,
            waiting_since: t.waiting_since,
            on_daily: false,
            daily_date: null,
            carry_from_task_id: t.id,
            timer_running: false,
            timer_started_at: null,
            sort_order: t.sort_order,
          }))
          await supabase.from('tasks').insert(carried)
        }

        // carry over unsorted intake items
        const { data: prevIntake } = await supabase
          .from('intake_items')
          .select('*')
          .eq('week_id', prevWeek.id)
          .eq('status', 'pending')

        if (prevIntake && prevIntake.length > 0) {
          const carriedIntake = prevIntake.map(i => ({
            week_id: week.id,
            title: i.title,
            status: 'pending',
          }))
          await supabase.from('intake_items').insert(carriedIntake)
        }
      }

      // seed default left sections (always fresh each week per spec)
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
