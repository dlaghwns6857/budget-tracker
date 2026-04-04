import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://agswuqrreubaodrawntn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnc3d1cXJyZXViYW9kcmF3bnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDAxMDYsImV4cCI6MjA5MDg3NjEwNn0.WsjQ0K6In65yb_YMglHbcF1QHgsrqrD0EFSplip2CB4'
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
