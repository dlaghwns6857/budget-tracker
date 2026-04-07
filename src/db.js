import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

function loadLocal(key, fallback) {
  if (typeof window === 'undefined') return fallback

  const raw = window.localStorage.getItem(key)
  if (raw == null) return fallback

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveLocal(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export async function load(key, fallback) {
  if (!hasSupabaseConfig) {
    return loadLocal(key, fallback)
  }

  try {
    const { data, error } = await supabase
      .from('budget_store')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) return fallback
    return data.value
  } catch {
    return loadLocal(key, fallback)
  }
}

export async function save(key, val) {
  if (!hasSupabaseConfig) {
    saveLocal(key, val)
    return
  }

  const { error } = await supabase
    .from('budget_store')
    .upsert({ key, value: val, updated_at: new Date().toISOString() })

  if (error) {
    throw error
  }
}

export default supabase
