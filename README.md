# Code Hack

Aplicacao web multiplayer em tempo real inspirada em Decrypto, com React, Vite, Node.js e Socket.io.

## Rodar localmente

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

> O backend exige credenciais do Firebase Admin para persistir dados no Firestore.
> Defina `FIREBASE_SERVICE_ACCOUNT_JSON` ou `GOOGLE_APPLICATION_CREDENTIALS` e `FIREBASE_PROJECT_ID` no arquivo `.env` antes de iniciar.

## Imagens

O backend tenta usar Google Custom Search para imagens quando as variaveis abaixo existem:

```bash
GOOGLE_API_KEY=...
GOOGLE_CSE_ID=...
```

Sem essas credenciais, ele usa Wikimedia Commons como fallback e, se nada for encontrado, mostra o placeholder pixelado local. As URLs ficam em cache no servidor para que todos os jogadores vejam a mesma imagem por palavra.

## Recursos

- Salas com codigo unico.
- Host com controle de times, remocao e inicio de partida.
- Times Vermelho e Azul com interface dinamica por cor do jogador.
- Categorias predefinidas e categorias locais via `localStorage`.
- Dificuldade com 4, 5 ou 6 palavras secretas.
- Fluxo simultaneo com codificador automatico, dicas, palpite do time e interceptacao.
- Confirmacao unanime por equipe e confirmacao global para avancar resultados.
- Pontuacao, vidas regressivas, limite de 8 rodadas, desempate por palavras e fim de jogo.
- Tratamento de desconexao com transferencia automatica de host.
- Visual retrofuturista responsivo com fundo estilo Matrix.
