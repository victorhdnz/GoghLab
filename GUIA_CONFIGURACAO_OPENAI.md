# 🔑 Guia de Configuração da API OpenAI

Este guia vai te ajudar a configurar a chave da API da OpenAI para que os Agentes de IA funcionem corretamente.

## 📋 Pré-requisitos

1. Conta na OpenAI (se não tiver, crie em: https://platform.openai.com/signup)
2. Acesso ao dashboard da OpenAI
3. Acesso às variáveis de ambiente do seu projeto (Vercel, Netlify, etc.)

## 🚀 Passo a Passo

### 1. Criar uma Chave de API na OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em **"+ Create new secret key"** (Criar nova chave secreta)
4. Dê um nome para a chave (ex: "Gogh Lab - Produção")
5. **IMPORTANTE**: Copie a chave imediatamente! Ela só aparece uma vez.
   - A chave terá o formato: `sk-proj-...` ou `sk-...`
   - Se você perder, precisará criar uma nova

### 2. Configurar a Chave no Projeto

#### Se estiver usando Vercel:

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Configure:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Cole a chave que você copiou
   - **Environment**: Selecione Production, Preview e Development (ou apenas Production se preferir)
6. Clique em **Save**
7. **IMPORTANTE**: Faça um novo deploy para que a variável seja aplicada

#### Se estiver usando outro serviço:

- **Netlify**: Site settings → Environment variables
- **Railway**: Variables tab
- **Render**: Environment → Add Environment Variable
- **Localmente**: Crie um arquivo `.env.local` na raiz do projeto:

```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

### 3. Verificar se Está Funcionando

1. Após configurar a variável e fazer deploy, acesse a área de membros
2. Vá em "Agentes de IA"
3. Tente iniciar uma conversa com qualquer agente
4. Se funcionar, você verá a resposta da IA
5. Se der erro, verifique:
   - Se a chave foi copiada corretamente (sem espaços)
   - Se a variável está no ambiente correto
   - Se fez o deploy após adicionar a variável

## ⚠️ Segurança

- **NUNCA** compartilhe sua chave de API
- **NUNCA** commite a chave no Git (já está no .gitignore)
- **NUNCA** exponha a chave no código do frontend
- Use variáveis de ambiente sempre
- Considere criar chaves separadas para desenvolvimento e produção

## 💰 Custos

A OpenAI cobra por uso da API. O modelo usado (`gpt-4o-mini`) é econômico:
- Aproximadamente $0.15 por 1 milhão de tokens de entrada
- Aproximadamente $0.60 por 1 milhão de tokens de saída

**Dica**: Configure limites de uso no dashboard da OpenAI para evitar surpresas na fatura.

## 🔧 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se a chave foi copiada corretamente
- Verifique se há espaços antes/depois da chave
- Certifique-se de que fez deploy após adicionar a variável

### Erro: "Insufficient quota"
- Verifique se há créditos na sua conta OpenAI
- Adicione um método de pagamento se necessário

### Erro: "Rate limit exceeded"
- Você está fazendo muitas requisições muito rápido
- O sistema já tem rate limiting implementado, mas pode acontecer em picos

## 📞 Suporte

Se tiver problemas, verifique:
1. Os logs do servidor (Vercel → Functions → Logs)
2. O console do navegador (F12)
3. O dashboard da OpenAI (Usage)

---

**Última atualização**: Janeiro 2026

