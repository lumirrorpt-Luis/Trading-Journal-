import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, table, key, data } = body

    if (action === 'get') {
      const { data: rows, error } = await supabase
        .from(table)
        .select('*')
        .eq('key', key)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return Response.json({ data: rows?.data || null })
    }

    if (action === 'set') {
      const { error } = await supabase
        .from(table)
        .upsert({ key, data }, { onConflict: 'key' })
      if (error) throw error
      return Response.json({ success: true })
    }

    if (action === 'getAll') {
      const { data: rows, error } = await supabase
        .from(table)
        .select('*')
      if (error) throw error
      return Response.json({ data: rows || [] })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('DB error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
