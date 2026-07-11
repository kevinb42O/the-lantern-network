import { supabase } from './supabase'

export async function uploadChatMedia(file: File, onProgress?: (progress: number) => void): Promise<{ mediaUrl: string; mediaType: string }> {
  if (!file) throw new Error('Geen bestand geselecteerd')

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${fileName}`

  // Ensure user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet ingelogd')

  // We don't have direct onProgress support in standard supabase storage upload via js client,
  // but we can just show a loading state.
  if (onProgress) onProgress(10)

  const { error: uploadError } = await supabase.storage
    .from('chat-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw uploadError
  }

  if (onProgress) onProgress(100)

  const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath)

  return {
    mediaUrl: data.publicUrl,
    mediaType: file.type.startsWith('image/gif') ? 'gif' : 'image'
  }
}

export async function uploadProfileBanner(file: File): Promise<string> {
  if (!file) throw new Error('Geen bestand geselecteerd')

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('profile-banners')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from('profile-banners').getPublicUrl(filePath)
  return data.publicUrl
}
