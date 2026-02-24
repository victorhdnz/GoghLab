import { redirect } from 'next/navigation'

/**
 * Meus Serviços: página única é /servicos (standalone, fora da área de membros).
 * Redireciona quem acessar /membro/servicos para lá.
 */
export default function MembroServicosRedirect() {
  redirect('/precos')
}
