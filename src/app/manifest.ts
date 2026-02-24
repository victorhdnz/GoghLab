import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gogh Lab',
    short_name: 'Gogh Lab',
    description: 'Planejamento de conteúdo com IA, roteiros de vídeo, legendas e hashtags para redes sociais.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    // Removido icons temporariamente - adicione ícones em /public quando tiver os arquivos
    // icons: [
    //   {
    //     src: '/icon-192.png',
    //     sizes: '192x192',
    //     type: 'image/png',
    //   },
    //   {
    //     src: '/icon-512.png',
    //     sizes: '512x512',
    //     type: 'image/png',
    //   },
    // ],
  }
}

