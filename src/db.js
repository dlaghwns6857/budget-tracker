import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function load(key, fallback) {
  try {
    const { data, error } = await supabase
      .from('budget_store')
      .select('value')
      .eq('key', key)
      .single()
    if (error || !data) return fallback
    return data.value
  } catch {
    return fallback
  }
}

export async function save(key, val) {
  try {
    await supabase
      .from('budget_store')
      .upsert({ key, value: val, updated_at: new Date().toISOString() })
  } catch (e) {
    console.error('Save error:', e)
  }
}

export default supabase
