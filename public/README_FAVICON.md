# 📌 Como Adicionar o Favicon (Logo na Aba do Navegador)

## 📋 O Que Você Precisa

1. **Imagem da logo** em formato PNG ou ICO
2. **Dimensões recomendadas:**
   - `favicon.ico` - 32x32px ou 16x16px (formato ICO)
   - `icon-16x16.png` - 16x16px
   - `icon-32x32.png` - 32x32px
   - `apple-icon.png` - 180x180px (para iOS)
   - `og-image.jpg` - 1200x630px (para compartilhamento no WhatsApp/Redes Sociais)

## 🎯 Passo a Passo

### 1. Preparar as Imagens

Use a logo da Smart Time Prime (o "P" estilizado que aparece no header) e crie as versões:

- **favicon.ico**: Use um conversor online (ex: https://favicon.io/favicon-converter/)
- **icon-16x16.png**: Versão 16x16px da logo
- **icon-32x32.png**: Versão 32x32px da logo
- **apple-icon.png**: Versão 180x180px da logo
- **og-image.jpg**: Imagem de compartilhamento 1200x630px (pode ser um banner com logo + texto)

### 2. Colocar os Arquivos na Pasta `public`

Coloque todos os arquivos na pasta `public` na raiz do projeto:

```
public/
├── favicon.ico
├── icon-16x16.png
├── icon-32x32.png
├── apple-icon.png
└── og-image.jpg
```

### 3. Verificar se Funcionou

1. Reinicie o servidor (`npm run dev`)
2. Abra o site no navegador
3. Verifique a aba do navegador - deve aparecer a logo
4. Compartilhe o link no WhatsApp - deve aparecer a imagem e texto personalizados

## 🔧 Alternativa: Usar Next.js App Directory

No Next.js 14, você também pode colocar o favicon diretamente na pasta `app`:

- `app/icon.png` ou `app/icon.ico` - será usado automaticamente como favicon

## 📝 Nota

As meta tags Open Graph já estão configuradas no `src/app/layout.tsx`. 
Você só precisa adicionar os arquivos de imagem na pasta `public`.

