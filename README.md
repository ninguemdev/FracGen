# Fractal Playground

Laboratório interativo de fractais e estruturas matemáticas dinâmicas, renderizado em tempo real na GPU (WebGL 2 + GLSL).

## Conceito

A inspiração é a filosofia do [Reaction-Diffusion Tool](https://karlsims.com/rdtool.html) de Karl Sims: transformar um sistema matemático complexo em um **espaço visual que pode ser explorado interativamente**. O usuário não precisa conhecer as equações — move controles e vê a estrutura mudar em tempo real. O projeto não copia o RD Tool; troca a reação-difusão por fractais, simetrias, distorções e memória temporal.

Em vez de uma única fórmula, cada imagem é uma **composição de transformações** aplicadas a cada pixel:

```text
C(x, y, t) = P( F( W( K( T(x, y, t) ) ) ), t )
```

| Etapa | O que faz |
| --- | --- |
| **T** — transformação | zoom, rotação e posição: escolhe qual região do plano complexo é vista |
| **K** — caleidoscópio | divide o plano em setores angulares espelhados, criando simetria radial |
| **W** — domain warp | distorce as coordenadas *antes* do fractal, fazendo a geometria derreter e fluir |
| **F** — fractal | itera uma fórmula (inicialmente Julia, `z → z² + c`) e mede como cada ponto escapa |
| **feedback** | mistura o frame atual com o anterior transformado: rastros, túneis, espirais, movimento orgânico |
| **P** — paleta | converte o valor matemático em cor com uma paleta procedural animada |

Pequenas mudanças em poucos parâmetros (a constante `c` do Julia, o número de setores, a força do warp, o feedback) produzem estruturas muito diferentes. A exploração é pensada como navegação nesse espaço:

- **presets** são pontos de partida, não resultados fixos;
- **mutate** aplica pequenas variações gaussianas à configuração atual, em vez de sortear tudo de novo;
- **seed + parâmetros** reproduzem exatamente uma imagem e poderão ser compartilhados pela URL.

Todo o cálculo visual roda em fragment shaders na GPU. A CPU cuida apenas de interface, parâmetros, estado e interação.

A especificação completa está em:

- [SITE_STRUCTURE_FRACTAL_PLAYGROUND.md](SITE_STRUCTURE_FRACTAL_PLAYGROUND.md) — produto, arquitetura, interface e fases
- [FRACTAL_MATH_ENGINE.md](FRACTAL_MATH_ENGINE.md) — matemática do motor

## Roadmap

O desenvolvimento acontece em tasks pequenas, uma fase por vez.

- [x] 1. Fundação — WebGL 2, fullscreen pass, animation loop, resize
- [x] 2. Julia Set com parâmetros interativos
- [x] 3. Coloração — paleta, frequência, fase, contraste, color cycle
- [x] 4. Caleidoscópio — coordenadas polares, repetição angular, espelhamento
- [x] 4.1 Navegação — arrastar para mover, roda do mouse para zoom no cursor
- [x] 5. Domain warp — oitavas compostas, warp rotacional, animação
- [x] 6. Feedback temporal — ping-pong framebuffers, amount, zoom e rotation
- [x] 7. Interação com o mouse — brush com attract, repel e twist
- [x] 8. Presets — 10 pontos de partida no topo do painel
- [ ] 8.1 Buraco negro — preset em que as estruturas convergem para o centro numa animação de buraco negro, com horizonte de eventos
- [ ] 9. Estado na URL — seed + parâmetros
- [ ] 10. Exportação PNG
- [ ] 11. Zoom infinito — zoom profundo além do limite de precisão atual (~2000×), otimizado e eficiente
- [ ] 12. Animação de zoom contínuo
- [ ] 13. Exportação GIF — incluindo um zoom em loop que avança até o fractal ficar idêntico ao início, gerando um GIF "infinito"

## Executar

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run build      # checagem de tipos + build estático em dist/
npm run preview    # serve o build de dist/
npm test           # testes (Vitest) do código determinístico
```

O conteúdo de `dist/` pode ser hospedado em qualquer servidor estático (os caminhos são relativos).

Navegadores alvo: Chrome, Edge e Firefox de desktop com WebGL 2.

## Uso

- **Arrastar** o canvas move a imagem (botão esquerdo com o Brush em Off; botão direito sempre); a **roda do mouse** dá zoom mantendo fixo o ponto sob o cursor (também com o caleidoscópio ativo).
- **Brush** (grupo Interaction): escolha um modo e segure o botão esquerdo sobre o canvas. **Attract** puxa a imagem para o cursor, **Repel** a afasta e **Twist** a gira em torno dele; **Radius** e **Strength** definem o alcance e a intensidade. Com o caleidoscópio, o brush age em todos os setores; com feedback, deixa rastros.
- **Presets**, no topo do painel, carregam uma configuração completa como ponto de partida; o brush continua como estava.
- Os sliders do painel mostram e ajustam os mesmos valores. O **Reset** do topo volta tudo à configuração inicial; o **Reset** no título de cada grupo volta só aquele grupo.
- Em zooms profundos, aumente **Iterations**: regiões pretas costumam ser pontos que ainda não escaparam, não o interior do conjunto.
- **Feedback** mistura cada frame com o anterior: **Amount** define quanto do frame anterior permanece (0 desliga), **Zoom** o amplia (> 1 flui para fora, < 1 para o centro) e **Rotation** o gira a cada frame. Os valores são por frame a 60 fps e se ajustam à taxa real, então o efeito tem a mesma velocidade em qualquer monitor.

## Stack

Vite, TypeScript, WebGL 2 e GLSL — sem framework de UI e sem dependências de runtime. Os shaders ficam em arquivos `.vert`/`.frag` e são importados como texto (`?raw`).

## Estrutura

```text
src/
├── main.ts              ponto de entrada: monta renderer, controles e loop
├── style.css
├── app/                 orquestração (animation loop)
├── engine/              WebGL: contexto, programas, renderer, framebuffers do feedback
├── interaction/         mouse: navegação (arrastar, zoom) e brush
├── math/                matemática CPU-side (gêmeas de funções do shader)
├── shaders/             GLSL
├── state/               parâmetros (valores padrão e faixas), paletas e presets
└── ui/                  painel de controles, presets, sliders, stats
```

## Parâmetros

Todo valor controlável fica em um único objeto plano, `Params` (`src/state/params.ts`), com faixa e passo definidos em `PARAM_SPECS`. Os sliders escrevem diretamente nesse objeto e o renderer o lê a cada frame. Os presets (`src/state/presets.ts`) operam sobre ele, e estado na URL e mutação também vão operar; os grupos do painel (Fractal, Warp, Color…) são apenas apresentação, definidos em `src/ui/ControlsPanel.ts`.

Para adicionar um parâmetro: campo em `Params` + `PARAM_SPECS` + `DEFAULT_PARAMS`, uniform no shader e em `Renderer.ts`, e a chave em um grupo do painel.

## Debug

- O console mostra criação do contexto WebGL, a GPU usada, compilação/linkagem dos programas e o formato dos framebuffers de feedback (prefixo `[gl]`).
- Erros de shader trazem o log do driver; os números de linha correspondem aos arquivos em `src/shaders/`.
- Um uniform não encontrado no shader gera aviso no console (erro de digitação ou uniform não usado).
- O topo da página mostra FPS e a resolução do drawing buffer.

## Contribuindo

Regras do projeto, do fluxo por tasks e do git estão em [AGENTS.md](AGENTS.md).
