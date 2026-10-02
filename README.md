# Ronald Jump — app de saltos pela câmera (PWA)

App para celular (iPhone e Android) que usa a câmera frontal para detectar o corpo, contar os saltos,
estimar calorias, guardar o histórico e mostrar o ranking mundial. Tudo roda no navegador, instalável
na tela inicial como um app. A identidade visual (logo, preto, amarelo e laranja) vem da sua marca.

## O que já funciona
- Contagem de saltos pela câmera (MediaPipe Pose, rodando no próprio celular, o vídeo não sai do aparelho)
- Corda virtual desenhada nas mãos (liga e desliga na tela inicial)
- Metas: livre, 1/3/5/10 minutos, 50/100 kcal
- Calorias estimadas (10 METs × peso × tempo) e equivalência em comida (brigadeiro, coxinha, pizza…)
- Histórico, sequência de dias, gráfico dos últimos 7 dias
- Ranking mundial (semana e sempre), por pessoa e por país, com limites contra trapaça básica
- Som e vibração a cada salto, tela que não apaga durante o treino, funciona offline depois do 1º uso
- Compartilhar resultado

## Rodar no seu computador
```bash
npm start            # abre em http://localhost:3000
npm test             # testa o contador de saltos
```
Atenção: a câmera só funciona em HTTPS ou em `localhost`. Para testar no celular, use a publicação (abaixo).

## Publicar (Railway ou Render), passo a passo
1. Crie um repositório no GitHub e envie esta pasta inteira (o `.gitignore` já está pronto).
2. **Railway:** New Project → Deploy from GitHub → escolha o repositório. Ele detecta o Node e roda `npm start`.
   Depois, em Settings → Networking, clique em **Generate Domain**. Você recebe um endereço `https://…`.
   **Render:** New → Web Service → conecte o repositório. Build command vazio, Start command `npm start`.
3. **Guardar o ranking de verdade:** o disco do servidor é apagado a cada novo deploy. No Railway, crie um
   **Volume** montado em `/data` e adicione a variável `DATA_DIR=/data`. No Render, use um Disk e a mesma variável.
   (Quando o app crescer, troque o arquivo por Supabase ou Postgres.)
4. Abra o endereço no celular. No primeiro treino o servidor baixa o modelo de detecção do Google e passa a
   entregar do seu próprio domínio. Se não conseguir baixar, o app busca direto do Google.

## Instalar no celular
- **Android (Chrome):** abra o endereço → botão "Instalar o app" na aba Perfil (ou menu ⋮ → Instalar app).
- **iPhone (Safari, iOS 16.4 ou mais novo):** Compartilhar → Adicionar à Tela de Início.

## Como usar o treino
Apoie o celular em pé no chão, a uns 2 metros, câmera frontal, boa luz, corpo inteiro na tela e sem
objetos na frente. Toque em Começar treino, espere a contagem 3-2-1 e salte.

## Checklist de teste no celular (faça antes de divulgar)
Eu testei a lógica de contagem com sinais simulados e o servidor, mas **não consegui testar a câmera em um celular real**.
Teste em pelo menos um iPhone e um Android:
1. Pede permissão da câmera e abre a imagem espelhada.
2. A mensagem de enquadramento some quando o corpo todo aparece e a contagem 3-2-1 começa.
3. Faça 30 saltos contando de cabeça e compare. Esperado: diferença pequena (poucos saltos).
4. Fique parado e balance o corpo devagar: não pode contar saltos.
5. Termine o treino e confira histórico, calorias e ranking.

Se contar de menos (saltos muito pequenos) ou de mais, ajuste os limites em `public/jump-counter.js`
(`up` = altura mínima do salto em fração do tronco, padrão 0,05; `minGap` = tempo mínimo entre saltos, padrão 230 ms).

## Publicar nas lojas (Google Play e App Store)
- **Google Play:** dá para empacotar este PWA como app Android com o PWABuilder (pwabuilder.com) ou Bubblewrap
  (Trusted Web Activity). Você precisa da conta de desenvolvedor Google (US$ 25, uma vez).
- **App Store:** a Apple costuma rejeitar apps que são só um site embrulhado. Para entrar, o app precisa de recursos
  nativos de verdade (por exemplo Apple Health, notificações e compra dentro do app). O caminho seguro é refazer a
  câmera e a contagem em Flutter ou React Native, reaproveitando a lógica de `jump-counter.js`, o design e este servidor
  como backend. Conta Apple Developer: US$ 99 por ano.

## Assinatura (plano Pro)
- **Na web/PWA:** você pode cobrar com Mercado Pago, Stripe ou Pix recorrente, e liberar os recursos Pro no servidor.
- **Dentro dos apps das lojas:** compras de conteúdo digital em geral precisam usar o pagamento da própria Apple e do Google.
  O RevenueCat simplifica isso. Confirme as regras e taxas atuais antes de fechar o preço.
- Sugestão de divisão: grátis (contagem, calorias, histórico) e Pro (ranking, desafios semanais, metas avançadas, treinos guiados).

## Limitações conhecidas
- A precisão depende de luz, enquadramento e do celular. Roupas muito largas ou escuras atrapalham.
- Aparelhos muito antigos, sem suporte a WebAssembly SIMD, não rodam o detector.
- O ranking é um MVP: sem login e sem verificação forte contra fraude. Para competição com prêmio, adicione contas e validação.
- As calorias são estimativas.

## Estrutura
```
server.js                   servidor + API do ranking (sem dependências)
public/index.html, style.css, app.js
public/jump-counter.js      lógica de contagem e calorias (testada)
public/sw.js, manifest.webmanifest, icons/   instalação e uso offline
public/vendor/              MediaPipe e fontes (hospedados no seu domínio)
tests/                      teste do contador
```
