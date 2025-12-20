/**
 * Helper centralizado para salvar configurações do site_settings
 * Garante que sempre faz merge correto preservando todos os dados existentes
 */

import { createClient } from '@/lib/supabase/client'

interface SaveSettingsOptions {
  /**
   * Campos a serem atualizados (apenas os campos que foram modificados)
   * Campos não incluídos aqui serão preservados do banco
   */
  fieldsToUpdate: Record<string, any>
  
  /**
   * Campos que são arrays/objetos e devem ser preservados do banco se existirem
   * mesmo se o valor local estiver vazio
   */
  arrayObjectFields?: string[]
  
  /**
   * Se true, força atualização mesmo se o valor local estiver vazio
   * (útil para limpar campos intencionalmente)
   */
  forceUpdate?: boolean
}

/**
 * Salva configurações no site_settings fazendo merge seguro
 * Preserva TODOS os dados existentes e atualiza apenas os campos especificados
 */
export async function saveSiteSettings({
  fieldsToUpdate,
  arrayObjectFields = [
    'hero_images', 'hero_banners', 'showcase_images', 'story_images', 
    'about_us_store_images', 'value_package_items', 'media_showcase_features',
    'hero_element_order', 'media_showcase_element_order', 'value_package_element_order',
    'social_proof_element_order', 'story_element_order', 'about_us_element_order',
    'contact_element_order', 'faq_element_order', 'social_proof_reviews'
  ],
  forceUpdate = false
}: SaveSettingsOptions): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    // 1. Buscar dados existentes do banco
    const { data: existing, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'general')
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar dados existentes:', fetchError)
      return { success: false, error: fetchError }
    }

    // 2. Obter valor JSONB existente
    const existingValue: any = existing?.value || {}

    // 3. Separar colunas diretas de campos do value JSONB
    const directColumnKeys = [
      'site_name', 'site_title', 'site_logo', 'site_description', 'footer_text', 'copyright_text',
      'contact_email', 'contact_whatsapp', 'instagram_url', 'facebook_url',
      'address_street', 'address_city', 'address_state', 'address_zip',
      'homepage_content', 'service_detail_layout'
    ]

    // Separar fieldsToUpdate em colunas diretas e campos do value
    const directColumnUpdates: any = {}
    const valueFieldUpdates: any = {}

    Object.keys(fieldsToUpdate).forEach(key => {
      if (directColumnKeys.includes(key)) {
        directColumnUpdates[key] = fieldsToUpdate[key]
      } else {
        valueFieldUpdates[key] = fieldsToUpdate[key]
      }
    })

    // 4. Criar objeto com merge inteligente APENAS para campos do value JSONB
    const mergedValue: any = { ...existingValue } // Começar com TODOS os dados existentes do value

    // 5. Atualizar apenas os campos do value especificados, SEMPRE priorizando valores do formulário
    // IMPORTANTE: Valores preenchidos no formulário SEMPRE são salvos, só preserva do banco se estiver vazio
    Object.keys(valueFieldUpdates).forEach(key => {
      const newValue = valueFieldUpdates[key] // Valor atual do formulário
      const existingValueForKey = existingValue[key] // Valor antigo do banco

      // Se forceUpdate está ativo, sempre usar o valor novo (do formulário)
      if (forceUpdate) {
        mergedValue[key] = newValue
        return
      }

      // PRIORIDADE 1: Se o valor do formulário está preenchido (não vazio), SEMPRE usar ele
      // Para arrays/objetos: considerar preenchido se tem conteúdo
      if (arrayObjectFields.includes(key)) {
        // Se é array/objeto e tem conteúdo, usar o valor do formulário
        if (Array.isArray(newValue) && newValue.length > 0) {
          mergedValue[key] = newValue // ✅ SEMPRE salva array preenchido do formulário
          return
        }
        if (typeof newValue === 'object' && newValue !== null && Object.keys(newValue).length > 0) {
          mergedValue[key] = newValue // ✅ SEMPRE salva objeto preenchido do formulário
          return
        }
        // Se array/objeto está vazio no formulário, preservar do banco (se existir)
        if (existingValueForKey !== undefined && existingValueForKey !== null) {
          mergedValue[key] = existingValueForKey // Preservar do banco apenas se formulário vazio
        } else {
          mergedValue[key] = newValue // Se banco também vazio, usar valor do formulário (vazio)
        }
        return
      }

      // PRIORIDADE 2: Se é string não vazia, SEMPRE usar valor do formulário
      if (typeof newValue === 'string' && newValue !== '') {
        mergedValue[key] = newValue // ✅ SEMPRE salva string preenchida do formulário
        return
      }

      // PRIORIDADE 3: Se é boolean, SEMPRE usar valor do formulário (incluindo false)
      if (typeof newValue === 'boolean') {
        mergedValue[key] = newValue // ✅ SEMPRE salva boolean do formulário
        return
      }

      // PRIORIDADE 4: Se é número, SEMPRE usar valor do formulário
      if (typeof newValue === 'number') {
        mergedValue[key] = newValue // ✅ SEMPRE salva número do formulário
        return
      }

      // PRIORIDADE 5: Se valor do formulário não é undefined/null, usar ele
      if (newValue !== undefined && newValue !== null) {
        mergedValue[key] = newValue // ✅ SEMPRE salva se formulário tem valor
        return
      }

      // ÚLTIMA PRIORIDADE: Se formulário está vazio/null/undefined, preservar do banco (se existir)
      if (existingValueForKey !== undefined && existingValueForKey !== null) {
        mergedValue[key] = existingValueForKey // Preservar do banco apenas se formulário vazio
      }
    })

    // 6. Preparar update payload incluindo colunas diretas e value JSONB
    const updatePayload: any = {
      value: mergedValue,
      updated_at: new Date().toISOString(),
    }

    // Adicionar colunas diretas ao payload (incluindo homepage_content)
    Object.keys(directColumnUpdates).forEach(column => {
      updatePayload[column] = directColumnUpdates[column]
      console.log(`📝 Salvando coluna direta: ${column}`, directColumnUpdates[column])
    })
    
    // Log de debug para homepage_content
    if (directColumnUpdates.homepage_content) {
      console.log('✅ homepage_content será salvo diretamente:', JSON.stringify(directColumnUpdates.homepage_content, null, 2))
    }

    // LOG DE SEGURANÇA: Verificar se arrays importantes foram preservados ANTES DE SALVAR
    console.log('🔒 Verificação de segurança - Arrays preservados ANTES DE SALVAR:', {
      hero_banners_count: Array.isArray(mergedValue.hero_banners) ? mergedValue.hero_banners.length : 0,
      showcase_images_count: Array.isArray(mergedValue.showcase_images) ? mergedValue.showcase_images.length : 0,
      story_images_count: Array.isArray(mergedValue.story_images) ? mergedValue.story_images.length : 0,
      value_package_items_count: Array.isArray(mergedValue.value_package_items) ? mergedValue.value_package_items.length : 0,
      showcase_video_url: mergedValue.showcase_video_url ? 'presente' : 'ausente',
      hero_title: mergedValue.hero_title ? 'presente' : 'ausente',
      media_showcase_features_count: Array.isArray(mergedValue.media_showcase_features) ? mergedValue.media_showcase_features.length : 0,
    })

    // 6. Salvar no banco
    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('site_settings')
        .update(updatePayload)
        .eq('key', 'general')

      if (updateError) {
        console.error('❌ Erro ao atualizar site_settings:', updateError)
        return { success: false, error: updateError }
      }
      
      console.log('✅ site_settings atualizado com sucesso usando helper seguro')
    } else {
      // Criar novo registro
      const insertPayload = {
        ...updatePayload,
        key: 'general',
        description: 'Configurações gerais do site',
      }

      const { error: insertError } = await supabase
        .from('site_settings')
        .insert(insertPayload)

      if (insertError) {
        console.error('❌ Erro ao inserir site_settings:', insertError)
        return { success: false, error: insertError }
      }
      
      console.log('✅ site_settings criado com sucesso usando helper seguro')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao salvar site_settings:', error)
    return { success: false, error }
  }
}

/**
 * Busca todas as configurações do site_settings
 * Retorna tanto o value (JSONB) quanto as colunas diretas (homepage_content, etc)
 */
export async function getSiteSettings(): Promise<{ data: any | null; error: any }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'general')
      .maybeSingle()

    if (error) {
      return { data: null, error }
    }

    if (!data) {
      return { data: null, error: null }
    }

    // Combinar value (JSONB) com colunas diretas
    const result = {
      ...(data.value || {}), // Dados do JSONB value
      // Colunas diretas importantes
      homepage_content: data.homepage_content || null,
      service_detail_layout: data.service_detail_layout || null,
      site_name: data.site_name || null,
      site_logo: data.site_logo || null,
      contact_email: data.contact_email || null,
      contact_whatsapp: data.contact_whatsapp || null,
      instagram_url: data.instagram_url || null,
    }

    return { data: result, error: null }
  } catch (error: any) {
    console.error('Erro ao buscar site_settings:', error)
    return { data: null, error }
  }
}

