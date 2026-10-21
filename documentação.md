
# Documentação da construção: Coletor Estelar

Registro de como o jogo foi construído seguindo o passo a passo da atividade (Planejar, Gerar, Iterar, Testar, Documentar).

## 1. Planejar

**Jogo escolhido:** *Coletor Estelar*. Uma nave coleta estrelas que caem e desvia de asteroides.

**Requisitos definidos a partir do modelo do slide:**

| # | Requisito | Situação |
|---|---|---|
| RF1 | Tela inicial com nome do jogo e instruções | Implementado |
| RF2 | Tecla F1 ou botão "Jogar" inicia a partida | Implementado |
| RF3 | Controles: setas ou A/D movem a nave | Implementado (mais arrasto de dedo no celular) |
| RF4 | Pontuação visível durante toda a partida | Implementado |
| RF5 | Fim de jogo com tela de resultado e botão ou F1 para reiniciar | Implementado |
| RF6 | Dificuldade crescente | Implementado |
| RF7 | Tecla P pausa o jogo | Implementado |
| RF8 | Versão de distribuição em um único arquivo HTML | Implementado |
| RF9 | Código comentado em português | Implementado |

## 2. Gerar

**Prompt inicial** (modelo do slide com os colchetes preenchidos):

> Você é um desenvolvedor de jogos web experiente. Crie o jogo **Coletor Estelar** (o jogador pilota uma nave, coleta estrelas que caem para ganhar pontos e desvia de asteroides; perde uma das 3 vidas ao ser atingido e o jogo acaba quando as vidas acabam) usando HTML, CSS e JavaScript puro.
>
> Requisitos: tela inicial com nome do jogo e instruções, tecla F1 ou botão "Jogar" para iniciar a partida. Controles: setas ← → ou A/D movem a nave. Pontuação visível durante toda a partida. Fim de jogo com tela de resultado e botão ou tecla F1 para reiniciar. Dificuldade crescente; tecla P pausa o jogo. Ao concluir, gere também uma versão de distribuição em um único arquivo HTML.
>
> Antes de escrever o código, apresente um plano em etapas para que eu valide. Você só pode seguir para a próxima etapa com a minha concordância sobre esse plano. Comente o código em português.

**Primeira versão:** jogo completo em um único arquivo, desenhado em `<canvas>`, com nave em forma de triângulo, estrelas, asteroides, 3 vidas e níveis.

## 3. Iterar

Os requisitos foram evoluídos um a um, testando a cada passo:

| Versão | Mudança | Prompt resumido |
|---|---|---|
| v1 | Jogo base (RF1 a RF9) | Prompt inicial acima |
| v2 | Asteroides na diagonal a partir do nível 21, com alerta que pausa o jogo e botão "Entendi!". Sons de estrela, dano e subida de nível | "Após o nível 20, os asteroides começam a vir na diagonal, avise com um alerta pausando o jogo... adicione sons" |
| v3 | Som de derrota | "Adicione um som para quando perder" |
| v4 | Código separado em pastas (HTML, CSS, JS) e zip | "Me dê agora as pastas com os códigos" |
| v5 | Nave desenhada com asas, cabine e chama. Alternância aleatória após o nível 30 entre asteroides na diagonal e de frente | "Mude a estética da nave... depois do nível 30, alterne de forma aleatória..." |

## 4. Decisões de projeto

- **Canvas em vez de elementos HTML:** facilita o desenho de muitos objetos em movimento e a detecção de colisão.
- **Movimento por tempo (`dt`):** a velocidade não depende da taxa de quadros do computador.
- **Colisão por círculos:** a distância entre o centro do objeto e o da nave é comparada com a soma dos raios. A área é um pouco menor que o desenho das asas, o que deixa o jogo mais justo.
- **Estados do jogo:** `inicio`, `jogando`, `pausa`, `alerta` e `fim`. Cada tecla e botão se comporta conforme o estado atual.
- **Sons sintetizados (Web Audio API):** evita arquivos externos e mantém o jogo em um único HTML.
- **Limite na velocidade de queda:** a velocidade deixa de crescer a partir do nível 12. Sem isso, o nível 21 ficaria impossível de jogar.
- **Aviso do modo após o nível 30:** o texto discreto no topo da tela evita que a mudança pareça injusta.
- **Recorde em `localStorage`:** protegido por `try/catch`, para o jogo funcionar mesmo se o navegador bloquear o armazenamento.

### Parâmetros principais

| Parâmetro | Valor |
|---|---|
| Vidas | 3 |
| Pontos por estrela | 10 |
| Pontos por nível | 50 |
| Proporção de estrelas entre os objetos | 60% |
| Invencibilidade após dano | 1 s |
| Intervalo entre objetos | `max(0,25; 0,9 − nível × 0,07)` segundos |
| Velocidade de queda | `110 + min(nível, 12) × 30 + aleatório(0 a 60)` px/s |
| Velocidade lateral dos asteroides diagonais | 70 a 160 px/s |
| Nível do alerta de diagonais | 21 |
| Nível a partir do qual o modo é sorteado | 31 |

## 4. Testar

Checklist para jogar e marcar. Os itens ficam como pendentes até serem conferidos na prática.

| Teste | Resultado esperado | Passou? |
|---|---|---|
| Abrir o jogo | Tela inicial com nome e instruções | [ ] |
| Pressionar F1 e clicar em "Jogar" | Ambos iniciam a partida | [ ] |
| Mover com ← → e com A D | A nave se move e não sai da tela | [ ] |
| Arrastar o dedo no celular | A nave acompanha o dedo | [ ] |
| Coletar uma estrela | +10 pontos e som agudo | [ ] |
| Ser atingido por um asteroide | -1 vida, som grave e nave piscando | [ ] |
| Acumular 50 pontos | Nível 2 e som de subida | [ ] |
| Pressionar P | O jogo pausa e retoma | [ ] |
| Chegar ao nível 21 | Jogo pausa com alerta; "Entendi!" retoma | [ ] |
| Níveis acima de 30 | Modo sorteado aparece no topo | [ ] |
| Perder as 3 vidas | Tela final, som de derrota e F1 reinicia | [ ] |
| Fechar e reabrir o jogo | O recorde continua salvo | [ ] |

Para testar os níveis altos sem jogar tudo, dá para aumentar temporariamente os pontos iniciais em `iniciar()` (por exemplo, `pontos = 950`).

**Bugs encontrados e corrigidos:** [preencher durante os testes]

## 5. Limitações conhecidas

- Os níveis mais altos são muito difíceis por natureza (muitos objetos em alta velocidade).
- O som só começa após a primeira interação do jogador.
- O recorde é salvo só naquele navegador e naquele computador.
- Não há controle de volume nem botão de silenciar.

## 6. Ideias futuras

- Botão de silenciar e controle de volume.
- Itens especiais (escudo, vida extra).
- Ranking online.
- Telas de dificuldade (fácil, médio e difícil).
