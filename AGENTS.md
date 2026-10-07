# AGENTS.md — Fractal Playground

Instruções para agentes de IA (e pessoas) que desenvolvem este projeto. Leia este arquivo inteiro antes de começar qualquer trabalho.

## 1. Projeto

Aplicação web interativa, hospedada como site estático, que gera estruturas fractais e psicodélicas em tempo real na GPU. O usuário manipula parâmetros e explora visualmente um espaço matemático — inspirado na filosofia (não no visual) do RD Tool de Karl Sims.

Documentos de referência, **obrigatórios antes de qualquer decisão que afete arquitetura ou matemática**:

- `SITE_STRUCTURE_FRACTAL_PLAYGROUND.md` — produto, arquitetura, interface, fases
- `FRACTAL_MATH_ENGINE.md` — matemática do motor
- `README.md` — conceito, roadmap atual, como executar

Não é necessário reproduzir literalmente a estrutura de diretórios dos documentos; siga a estrutura atual do código (seção 5).

## 2. Fluxo de trabalho por tasks

1. O desenvolvimento acontece em **tasks pequenas, uma de cada vez**, seguindo o roadmap do `README.md`.
2. Cada task deve: ter objetivo específico; alterar poucas partes do projeto; poder ser testada isoladamente; deixar o projeto funcionando.
3. **Não antecipe funcionalidades de tasks futuras.** Nada de código "para quando precisar".
4. Ao terminar uma task: verificar (seção 9), commitar (seção 11), marcar a fase no roadmap do `README.md`, reportar (seção 12) e **PARAR**.
5. **Nunca comece a próxima task sem autorização explícita do usuário.**
6. Se uma decisão for genuinamente do usuário (muda o produto, adiciona dependência, contraria a especificação), pergunte antes.

## 3. Stack

```text
Vite · TypeScript · WebGL 2 · GLSL · HTML · CSS · Vitest (testes)
```

- Sem dependências de runtime. Toda nova dependência precisa de vantagem concreta e explicada.
- **Não introduza** React, Next.js, Three.js, WebGPU, Rust, WASM, Zustand ou outros frameworks/bibliotecas grandes só porque estão disponíveis.
- Menos é mais: se WebGL 2 + GLSL + TypeScript resolvem, use isso.

## 4. Princípios de código

- Clean code: funções pequenas, módulos pequenos, responsabilidades pequenas, nomes claros, baixo acoplamento.
- **Sem abstrações prematuras**: nada de factories desnecessárias, dependency injection, arquiteturas enterprise, sistemas de eventos, frameworks internos ou sistemas genéricos antes de existir necessidade real.
- Não coloque a aplicação em um único arquivo, nem crie um arquivo por função minúscula. Use bom senso.
- Prefira **solução simples que funciona** a arquitetura sofisticada que talvez seja útil no futuro.
- Comentários explicam matemática não óbvia, transformações e decisões incomuns — nunca o trivial.
- Idioma: código, comentários, textos da interface, mensagens de console e mensagens de commit em **inglês**; documentação (`README.md`, especificações, este arquivo) em **português**.
- TypeScript em modo `strict` com `erasableSyntaxOnly` (sem `enum`, sem parameter properties no construtor).
- Escreva código que se pareça com o código ao redor: mesma densidade de comentários, nomes e idiomas.

## 5. Arquitetura

Divisão de responsabilidades:

- **CPU (TypeScript):** interface, parâmetros, estado, interação, presets, comunicação com a GPU.
- **GPU (GLSL):** fractal, transformações, domain warp, colorização, feedback, efeitos matemáticos.
- **Nunca calcule fractais pixel a pixel em JavaScript.**

Pipeline alvo, construído progressivamente (uma fase por task):

```text
coordinates → zoom/rotation/position → kaleidoscope → domain warp → Julia
→ smooth escape → procedural palette → temporal feedback → canvas
```

Estrutura atual:

```text
src/
├── main.ts       ponto de entrada: monta renderer, controles e loop
├── app/          orquestração (animation loop)
├── engine/       WebGL: contexto, programas, renderer, framebuffers ping-pong
├── interaction/  mouse: navegação e brush
├── math/         matemática CPU-side (gêmeas de funções do shader)
├── shaders/      GLSL (.vert/.frag)
├── state/        parâmetros, paletas e presets
└── ui/           painel, presets, sliders, selects, stats
```

### Navegação e gêmeas na CPU

- A navegação (`src/interaction/viewNavigation.ts`) mantém fixo o ponto do fractal sob o cursor. Para isso, `fractalPointAt()` reproduz na CPU o mapeamento pixel → plano do fractal do shader.
- Toda etapa do shader que entra nesse mapeamento (hoje `kaleidoscope`, `brushForce` e `domainWarp`) tem uma **gêmea em `src/math/`**, com testes. **Ao mudar a função no shader, mude a gêmea junto** — senão o zoom deixa de ficar ancorado no cursor.
- Mudanças vindas de fora dos sliders passam por `clampParam()` para manter os valores dentro das faixas.

### Parâmetros

- Todo valor controlável vive em **um único objeto plano** `Params` em `src/state/params.ts`, com `PARAM_SPECS` (rótulo, faixa, passo, escala log) e `DEFAULT_PARAMS`.
- Presets, URL, seed e mutação operam sobre esse objeto. Grupos do painel são só apresentação (`src/ui/ControlsPanel.ts`).
- Um preset (`src/state/presets.ts`) é um `Params` parcial: `applyPreset()` volta ao padrão tudo o que ele não define, exceto o brush, que é ferramenta e não visual. Ao aplicar, as fases de `Animation` recomeçam do zero, para o preset abrir exatamente como foi desenhado.
- Os sliders escrevem direto em `params`; o renderer lê a cada frame. Não crie store/eventos até existir necessidade real.
- Para adicionar um parâmetro: `Params` + `PARAM_SPECS` + `DEFAULT_PARAMS` → uniform no shader → `UNIFORM_NAMES` e os métodos `set…Uniforms()` em `Renderer.ts` (mapeamento explícito, sem sistema genérico de uniforms) → chave em um grupo do painel.
- Faixas iniciais seguem `FRACTAL_MATH_ENGINE.md` §34; zoom (até 2000) e iterações (até 1024) foram ampliados para os zooms profundos da navegação.
- Escolhas discretas (ex.: paleta) são índices numéricos com `options` no spec; o painel mostra um `<select>`. Liga/desliga usa o mesmo mecanismo: valor 0/1 com `options: ['Off', 'On']`.

### Animação

- O animation loop entrega `deltaTime` (segundos desde o frame anterior, limitado após a aba ficar oculta).
- Parâmetros de velocidade são **integrados frame a frame** (`offset += speed × deltaTime`), nunca calculados como `speed × tempoTotal` — senão mover o slider de velocidade faz a imagem saltar.
- Esses offsets acumulados são estado de execução, não parâmetros: ficam em `Animation` (`src/state/animation.ts`, avançado por `advanceAnimation()`) e não entram em `Params`, presets nem URL. O mesmo vale para o brush: posição, botão pressionado e envelope de entrada/saída ficam em `Brush` (`src/state/brush.ts`, avançado por `advanceBrush()`); modo, raio e força são `Params`.
- Parâmetros aplicados "por frame" (feedback) valem por frame a 60 fps e são convertidos para a duração real do frame por `feedbackForFrame()`: o que se compõe de frame a frame vira potência (`β^(60Δt)`, `zoom^(60Δt)`) e o que se soma escala linearmente (`θ·60Δt`). Assim o efeito não depende da taxa de quadros.

### Pipeline do shader

- **Lente** em coordenadas de tela: `p = W(B(K(pixel)))` (caleidoscópio, brush, warp). **Câmera**: `z = p / zoom + position`. Ver as notas de implementação nos §5, §9 e §21 do `FRACTAL_MATH_ENGINE.md`.
- **Mouse**: botão esquerdo arrasta com o Brush em Off e aplica o brush nos outros modos; botão direito sempre arrasta; roda dá zoom. Navegação (`viewNavigation.ts`) e brush (`brushInput.ts`) decidem pelo botão e por `params.brushMode`.
- Efeitos novos de "lente" (simetria, distorções) entram antes da câmera; efeitos sobre o plano do fractal, depois.
- **Feedback** (§22–§23): a cor final é misturada com o frame anterior, ampliado e girado em torno do centro da tela. O frame é desenhado em uma de duas texturas RGBA16F (`PingPongBuffers`), copiado para o canvas com `blitFramebuffer` e as texturas trocam de papel. Com Amount 0 o renderer desenha direto no canvas, sem os buffers. O resultado do feedback é arredondado estocasticamente para half float (`stochasticRound()`); não remova, senão imagens antigas nunca terminam de sumir. Ver a nota de implementação do §23.

## 6. Shaders

- Arquivos separados em `src/shaders/`, importados com `?raw`. GLSL ES 3.00 (`#version 300 es`), `precision highp float`.
- Os fontes vão ao driver **sem modificação**, para que os números de linha dos erros batam com os arquivos. Se um dia houver `#include`, preserve esse mapeamento.
- Uniforms com prefixo `u` (`uTime`, `uJuliaC`). Aviso de uniform não encontrado no console indica erro de digitação ou uniform não usado.
- O fullscreen pass usa um único triângulo gerado por `gl_VertexID` (sem vertex buffer).
- Loops podem usar limites vindos de uniforms (permitido em GLSL ES 3.00).
- Referencie a seção do `FRACTAL_MATH_ENGINE.md` quando implementar uma fórmula dele.

## 7. Performance

- Sempre considere: custo por pixel, iterações, resolução interna, leituras de textura, número de passes, loops no fragment shader.
- A resolução do drawing buffer é limitada a 2× (`MAX_PIXEL_RATIO`). Resolução interna reduzida durante interação é permitida quando for necessária.
- Referência: manter 60 fps em GPU integrada (Intel UHD 730 a 1280×860) com os valores padrão e até 256 iterações. O máximo de 1024 iterações existe para zooms profundos e pode cair para ~37 fps — é escolha do usuário. O feedback ligado custa uma escrita RGBA16F e uma cópia por frame: mantém 60 fps na referência, mas a 2× com 256 iterações cai para ~48 fps.
- Não otimize prematuramente, mas não escolha soluções obviamente caras.

## 8. Debug

- Logs simples com prefixo `[gl]`: contexto criado (com a GPU), programas compilados/linkados, status de framebuffer quando existir.
- Erros de inicialização da GPU e de shader devem gerar mensagens compreensíveis no console **e** na página.
- FPS e resolução aparecem no topo da página.
- Não crie um sistema de logging.

## 9. Testes e verificação

- **Vitest** para código determinístico: parâmetros, serialização, seeds, presets, funções matemáticas CPU-side. Testes ficam ao lado do código (`*.test.ts`).
- Shaders são validados por compilação, ausência de erros WebGL, renderização e inspeção visual.

Checklist obrigatório antes de concluir uma task:

1. `npm test` — todos os testes passam.
2. `npm run build` — checagem de tipos e build sem erros.
3. `npm run dev` e abrir no navegador: console sem erros nem avisos, `gl.getError() === 0`, renderização correta, resize funcionando, controles respondendo.
4. Não deixar `dist/`, servidores rodando nem arquivos temporários no projeto.

## 10. Documentação

- Use apenas `README.md`, `SITE_STRUCTURE_FRACTAL_PLAYGROUND.md`, `FRACTAL_MATH_ENGINE.md` e este `AGENTS.md`. Não crie outros arquivos de documentação.
- Atualize a documentação existente quando surgir uma decisão arquitetural realmente importante.
- Mantenha o roadmap do `README.md` atualizado ao final de cada task.

## 11. Git

- Repositório remoto: `origin` → `https://github.com/ninguemdev/FracGen.git`. Branch principal: `main`.
- **Commit ao final de cada task**, depois que o checklist da seção 9 passar. Um commit por task ou poucos commits lógicos; **todo commit deve compilar e passar nos testes**.
- Mensagens em inglês no formato [Conventional Commits](https://www.conventionalcommits.org/):
  - tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`;
  - assunto no imperativo, minúsculo após o prefixo, até 72 caracteres, sem ponto final — ex.: `feat: add kaleidoscope fold`;
  - corpo opcional explicando o quê e por quê.
- **NUNCA adicione co-autoria ou atribuição**: nada de `Co-Authored-By`, "Generated with", ou qualquer trailer/menção a IA em commits, tags, PRs ou código.
- Use a identidade git já configurada no ambiente; não altere `user.name`/`user.email`.
- **Não faça push sem pedido explícito do usuário.** Nunca use `push --force`, nunca reescreva histórico já publicado, nunca use `--no-verify`.
- Revise `git status` e `git diff` antes de commitar; não inclua mudanças não relacionadas à task.
- Nunca commite `node_modules/`, `dist/`, arquivos `*.local`, segredos ou arquivos temporários.
- Finais de linha LF (garantido por `.gitattributes`).

## 12. Relatório ao final de cada task

Responda apenas com:

```text
## Implementado          descrição curta do que foi criado
## Arquivos principais   arquivos criados/modificados
## Como executar         comandos necessários
## Decisões técnicas     somente decisões importantes
## Próxima task sugerida e aguarde autorização
```
