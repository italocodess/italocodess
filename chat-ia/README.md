# Chat com IA (LLM)

Aplicação web de chat que conversa com um modelo de linguagem diretamente pelo navegador, usando apenas HTML, CSS e JavaScript.

## Integrantes

- Italo Alves Silva (0083054)

## API utilizada

- **Provedor:** [Groq](https://console.groq.com) (API compatível com o formato Chat Completions)
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Modelo:** `openai/gpt-oss-120b`

## Funcionalidades

- Interface de chat com balões distintos (usuário e IA)
- Lista de conversas na lateral, cada uma com seu próprio histórico, e botão **Nova conversa**
- Histórico enviado a cada requisição, mantendo o contexto da conversa
- Indicador de carregamento enquanto a IA responde
- Tratamento de erros (rede, chave inválida, limite de requisições, etc.)
- Respostas da IA com negrito, listas e código formatados
- `fetch()` com `async/await`, 100% client-side (sem backend)

## Como executar

1. Crie uma conta gratuita em https://console.groq.com e gere uma **chave de API de teste** em *API Keys*.
2. Baixe/clone o projeto e abra o arquivo `index.html` no navegador (duplo clique ou extensão *Live Server* do VS Code).
3. Digite a chave no campo **Key**, na lateral esquerda. Ela fica salva apenas no `localStorage` do seu navegador.
   - Alternativa: preencher a constante `API_KEY_FIXA` no `script.js` (não publique isso em repositório público).
4. Digite uma mensagem e pressione **Enter** para enviar (**Shift+Enter** quebra a linha).

## Estrutura

```
index.html   → estrutura da página
style.css    → identidade visual
script.js    → lógica do chat e integração com a API
README.md    → este arquivo
```

## Aviso de segurança

Chaves de API usadas no navegador ficam expostas ao usuário. Use somente chaves de teste e nunca envie credenciais reais para repositórios públicos.
