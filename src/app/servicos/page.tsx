import { redirect } from 'next/navigation'

/**
 * Serviços personalizados: página única é /membro/servicos (com layout da área do membro).
 * Redireciona quem acessar /servicos para lá.
 */
export default function ServicosRedirect() {
  redirect('/membro/servicos')
}
