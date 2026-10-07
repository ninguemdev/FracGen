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
- [ ] 5. Domain warp
- [ ] 6. Feedback temporal (ping-pong framebuffers)
- [ ] 7. Interação com o mouse — attractor, twist, brush
- [ ] 8. Presets
- [ ] 9. Estado na URL — seed + parâmetros
- [ ] 10. Exportação PNG

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

## Stack

Vite, TypeScript, WebGL 2 e GLSL — sem framework de UI e sem dependências de runtime. Os shaders ficam em arquivos `.vert`/`.frag` e são importados como texto (`?raw`).

## Estrutura

```text
src/
├── main.ts              ponto de entrada: monta renderer, controles e loop
├── style.css
├── app/                 orquestração (animation loop)
├── engine/              WebGL: contexto, programas, renderer
├── shaders/             GLSL
├── state/               parâmetros (valores padrão e faixas) e paletas
└── ui/                  painel de controles, sliders, stats
```

Novas pastas (`math/`, `interaction/`) surgem quando a primeira task precisar delas.

## Parâmetros

Todo valor controlável fica em um único objeto plano, `Params` (`src/state/params.ts`), com faixa e passo definidos em `PARAM_SPECS`. Os sliders escrevem diretamente nesse objeto e o renderer o lê a cada frame. Presets, estado na URL e mutação vão operar sobre ele; os grupos do painel (Fractal, Warp, Color…) são apenas apresentação, definidos em `src/ui/ControlsPanel.ts`.

Para adicionar um parâmetro: campo em `Params` + `PARAM_SPECS` + `DEFAULT_PARAMS`, uniform no shader e em `Renderer.ts`, e a chave em um grupo do painel.

## Debug

- O console mostra criação do contexto WebGL, a GPU usada e compilação/linkagem dos programas (prefixo `[gl]`).
- Erros de shader trazem o log do driver; os números de linha correspondem aos arquivos em `src/shaders/`.
- Um uniform não encontrado no shader gera aviso no console (erro de digitação ou uniform não usado).
- O topo da página mostra FPS e a resolução do drawing buffer.

## Contribuindo

Regras do projeto, do fluxo por tasks e do git estão em [AGENTS.md](AGENTS.md).
