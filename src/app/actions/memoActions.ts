'use server'

import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { getSupabase } from '@/utils/supabaseServer'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
}

const toMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function getMemosAction(): Promise<Memo[]> {
  const { data, error } = await getSupabase()
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`메모 조회 실패: ${error.message}`)
  return (data as MemoRow[]).map(toMemo)
}

export async function createMemoAction(formData: MemoFormData): Promise<Memo> {
  const now = new Date().toISOString()
  const { data, error } = await getSupabase()
    .from('memos')
    .insert({
      id: uuidv4(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw new Error(`메모 생성 실패: ${error.message}`)
  return toMemo(data as MemoRow)
}

export async function updateMemoAction(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await getSupabase()
    .from('memos')
    .update({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`메모 수정 실패: ${error.message}`)
  return toMemo(data as MemoRow)
}

export async function deleteMemoAction(id: string): Promise<void> {
  const { error } = await getSupabase().from('memos').delete().eq('id', id)
  if (error) throw new Error(`메모 삭제 실패: ${error.message}`)
}
