# Fractal Playground

Laboratório interativo de fractais e estruturas matemáticas dinâmicas, renderizado na GPU (WebGL 2 + GLSL).

Especificação:

- [SITE_STRUCTURE_FRACTAL_PLAYGROUND.md](SITE_STRUCTURE_FRACTAL_PLAYGROUND.md) — produto, arquitetura, interface e fases
- [FRACTAL_MATH_ENGINE.md](FRACTAL_MATH_ENGINE.md) — matemática do motor

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

Vite, TypeScript, WebGL 2 e GLSL — sem framework de UI. Os shaders ficam em arquivos `.vert`/`.frag` e são importados como texto (`?raw`).

## Estrutura

```text
src/
├── main.ts              ponto de entrada: monta renderer, loop e UI
├── style.css
├── app/                 orquestração (animation loop)
├── engine/              WebGL: contexto, programas, renderer
├── shaders/             GLSL
├── state/               parâmetros (valores padrão e faixas)
└── ui/                  painel de controles, sliders, stats
```

Novas pastas (`math/`, `interaction/`) surgem quando a primeira task precisar delas.

## Parâmetros

Todo valor controlável fica em um único objeto plano, `Params` (`src/state/params.ts`), com faixa e passo definidos em `PARAM_SPECS`. Os sliders escrevem diretamente nesse objeto e o renderer o lê a cada frame. Presets, estado na URL e mutação vão operar sobre ele; os grupos do painel (Fractal, Warp, Color…) são apenas apresentação, definidos em `src/ui/ControlsPanel.ts`.

Para adicionar um parâmetro: campo em `Params` + `PARAM_SPECS` + `DEFAULT_PARAMS`, uniform no shader e em `Renderer.ts`, e a chave em um grupo do painel.

## Debug

- O console mostra criação do contexto WebGL e compilação/linkagem dos programas (prefixo `[gl]`).
- Erros de shader trazem o log do driver; os números de linha correspondem aos arquivos em `src/shaders/`.
- O topo da página mostra FPS e a resolução do drawing buffer.
