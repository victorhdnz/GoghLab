import { redirect } from 'next/navigation'

// Página principal redireciona para o comparador
// O Layout Padrão das campanhas está em /lp/padrao e não será afetado
export default function Home() {
  redirect('/comparar')
}
