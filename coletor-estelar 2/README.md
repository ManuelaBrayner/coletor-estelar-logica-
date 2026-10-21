# Coletor Estelar

Jogo web de ação feito com **HTML, CSS e JavaScript puro**, desenvolvido com apoio de IA na atividade *Desenvolvimento de Software com IA*.

Você pilota uma nave espacial, coleta estrelas para ganhar pontos e desvia dos asteroides. Quanto mais pontos, maior o nível e mais difícil o jogo.

**Autor(es):** [preencher]

## Como jogar

| Ação | Controle |
|---|---|
| Iniciar / reiniciar a partida | tecla **F1** ou botão "Jogar" |
| Mover a nave | **←** **→** ou **A** **D** (no celular, arraste o dedo sobre a tela) |
| Pausar / continuar | tecla **P** |

### Regras

- Cada **estrela** coletada vale **10 pontos**.
- Cada **asteroide** que acerta a nave tira **1 vida** (são 3 vidas). Depois de ser atingido, a nave fica 1 segundo invencível, piscando.
- O jogo termina quando as vidas acabam. A tela final mostra a pontuação, o nível alcançado e o recorde.
- A pontuação, o nível e as vidas ficam visíveis durante toda a partida.
- O recorde fica salvo no navegador.

### Dificuldade crescente

- **Nível:** sobe a cada 50 pontos.
- **Velocidade e quantidade:** a cada nível os objetos caem mais rápido e surgem em intervalos menores.
- **Níveis 1 a 20:** os asteroides caem sempre na vertical.
- **Nível 21:** o jogo pausa e exibe um alerta ("Entendi!") avisando que os asteroides passam a vir também na **diagonal**. Do nível 21 ao 30, metade deles vem na diagonal.
- **Acima do nível 30:** a cada novo nível, o jogo sorteia se **todos** os asteroides vêm na diagonal ou de frente. O modo do nível aparece no topo da tela.

### Sons

Gerados pelo próprio código (Web Audio API), sem arquivos de áudio: coletar estrela, perder vida, subir de nível e fim de jogo. O som só começa depois da primeira ação do jogador (F1 ou clique), exigência dos navegadores.

## Como executar

1. Extraia o `coletor-estelar.zip`.
2. **Versão de desenvolvimento:** abra `projeto/index.html` no navegador.
3. **Versão de distribuição:** abra `distribuicao/coletor-estelar.html` (arquivo único, pode ser enviado a qualquer pessoa).

Não precisa instalar nada nem ter internet.

## Estrutura do projeto

```
coletor-estelar/
├── README.md
├── DOCUMENTACAO.md
├── projeto/
│   ├── index.html        estrutura da página
│   ├── css/style.css     estilos
│   └── js/script.js      lógica do jogo (comentada em português)
└── distribuicao/
    └── coletor-estelar.html   versão em um único arquivo
```

## Tecnologias

HTML5 (canvas), CSS3 e JavaScript puro, sem bibliotecas nem frameworks.
