# Variável de ambiente: xAI (Grok)

Para usar os modelos **Grok** (texto/roteiro), **Grok Imagine (imagem)** e **Grok Imagine (vídeo)** na criação, configure a chave da API xAI.

---

## No `.env` ou `.env.local` (local)

Adicione uma linha com o nome da variável e o valor da chave (sem aspas):

```
XAI_API_KEY=sua_chave_aqui
```

Exemplo (substitua pela sua chave real, que começa com `xai-`):

```
XAI_API_KEY=xai-sua-chave-aqui
```

- **Nome da variável:** `XAI_API_KEY`
- **Valor:** a chave que você copiou no [console xAI](https://console.x.ai/team/default/api-keys) (começa com `xai-`).
- Não commite o arquivo com a chave; `.env.local` já deve estar no `.gitignore`.

---

## Na Vercel (produção)

1. Abra o projeto no [dashboard da Vercel](https://vercel.com/dashboard).
2. Vá em **Settings** → **Environment Variables**.
3. Clique em **Add New**.
4. Preencha:
   - **Name:** `XAI_API_KEY`
   - **Value:** a mesma chave da API xAI (a que começa com `xai-`).
   - **Environment:** marque **Production** (e **Preview** se quiser usar em deploys de preview).
5. Salve e faça um novo deploy para a variável passar a valer.

---

## O que essa variável faz

- **Texto (Roteiro de vídeos e Criação de Prompts):** chama a API de Chat Completions da xAI (`grok-4-latest`) para gerar roteiros e prompts.
- **Imagem:** chama a API de geração de imagens da xAI (`grok-imagine-image`).
- **Vídeo:** inicia a geração na xAI (`grok-imagine-video`) e o endpoint de status faz o polling e o download quando o vídeo estiver pronto.

Se `XAI_API_KEY` não estiver definida, os modelos Grok continuam aparecendo na lista, mas ao escolhê-los a API retornará um erro genérico de configuração (sem expor detalhes).
