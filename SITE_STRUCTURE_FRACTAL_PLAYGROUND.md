# Estrutura do Site — Gerador Interativo de Fractais Psicodélicos

## 1. Objetivo

Criar uma aplicação web interativa inspirada na filosofia do **RD Tool de Karl Sims**: um grande canvas em tempo real, parâmetros visuais manipuláveis, presets, desenho direto sobre a simulação e possibilidade de reproduzir uma configuração por URL.

A proposta, porém, não é copiar o RD Tool. Em vez de usar apenas reação-difusão, o projeto será um **laboratório de sistemas fractais dinâmicos**, combinando:

- fractais no plano complexo;
- domain warping;
- simetria caleidoscópica;
- campos vetoriais;
- feedback temporal;
- opcionalmente reação-difusão como uma camada adicional;
- coloração procedural animada.

O objetivo visual é produzir estruturas que pareçam **orgânicas, recursivas, respirando, se dobrando e se transformando continuamente**.

---

# 2. O que o RD Tool faz

Segundo a documentação oficial de Karl Sims, o RD Tool:

- roda uma simulação de reação-difusão em uma grade 2D;
- utiliza o modelo Gray-Scott;
- permite alterar `feed` e `kill` para mudar o comportamento do padrão;
- permite desenhar diretamente no canvas;
- possui controles de escala, velocidade, fluxo e orientação;
- varia parâmetros espacialmente;
- colore o resultado em tempo real;
- pode aplicar efeito de relevo/emboss;
- codifica os parâmetros atuais na URL;
- utiliza aceleração por GPU;
- requer WebGL 2, suporte a `EXT_color_buffer_float` e WebAssembly.

A documentação também explica que os campos de **Flow** acrescentam um campo de velocidade à simulação e que **Orientation** altera a velocidade da difusão de acordo com a direção.

A estrutura exata do código interno do RD Tool não está documentada publicamente na página analisada. Portanto, a arquitetura proposta abaixo reproduz a **ideia de interação e processamento GPU**, não sua implementação interna.

---

# 3. Filosofia do nosso projeto

Nome provisório:

**Fractal Playground**

Princípios:

1. canvas é o centro da experiência;
2. qualquer parâmetro importante deve responder em tempo real;
3. usuário não precisa entender matemática para criar algo bonito;
4. parâmetros matemáticos avançados ficam disponíveis em um painel secundário;
5. presets devem ser pontos de partida, não resultados fixos;
6. configurações devem ser reproduzíveis por seed + parâmetros;
7. processamento pesado ocorre na GPU;
8. o núcleo matemático deve ser independente da interface;
9. novas fórmulas devem poder ser adicionadas como módulos;
10. começar pequeno.

---

# 4. Stack recomendada

## V1

```text
Vite
TypeScript
WebGL 2
GLSL
HTML/CSS
```

Sem React na primeira versão.

Motivo: o projeto é essencialmente um **canvas GPU com um painel de parâmetros**. Um framework de UI não é necessário para provar a ideia.

Depois da V1, se a interface crescer muito:

```text
Vite
React
TypeScript
WebGL 2 / GLSL
Zustand
```

Uma evolução futura pode considerar WebGPU, mas **WebGL 2 é suficiente para a primeira versão** e se aproxima do requisito técnico documentado pelo RD Tool.

---

# 5. Arquitetura de alto nível

```text
┌────────────────────────────────────────────┐
│                  Browser                   │
│                                            │
│ ┌──────────────────┐  ┌─────────────────┐ │
│ │        UI        │  │ Parameter Store │ │
│ └────────┬─────────┘  └────────┬────────┘ │
│          │                     │           │
│          └──────────┬──────────┘           │
│                     ▼                      │
│             Simulation Engine              │
│                     │                      │
│          ┌──────────┴───────────┐          │
│          ▼                      ▼          │
│  Fractal / Warp Shader    Feedback Pass    │
│          │                      │          │
│          └──────────┬───────────┘          │
│                     ▼                      │
│               Color Shader                 │
│                     │                      │
│                     ▼                      │
│                  Canvas                    │
└────────────────────────────────────────────┘
```

---

# 6. Estrutura de diretórios

```text
fractal-playground/
│
├── index.html
├── package.json
├── vite.config.ts
│
├── src/
│   ├── main.ts
│   │
│   ├── app/
│   │   ├── App.ts
│   │   ├── animationLoop.ts
│   │   └── lifecycle.ts
│   │
│   ├── engine/
│   │   ├── Renderer.ts
│   │   ├── Simulation.ts
│   │   ├── Framebuffer.ts
│   │   ├── Texture.ts
│   │   └── ShaderProgram.ts
│   │
│   ├── shaders/
│   │   ├── fullscreen.vert
│   │   ├── fractal.frag
│   │   ├── feedback.frag
│   │   ├── color.frag
│   │   └── common.glsl
│   │
│   ├── math/
│   │   ├── parameters.ts
│   │   ├── presets.ts
│   │   ├── random.ts
│   │   └── seeds.ts
│   │
│   ├── interaction/
│   │   ├── PointerController.ts
│   │   ├── KeyboardController.ts
│   │   └── Brush.ts
│   │
│   ├── state/
│   │   ├── ParameterStore.ts
│   │   ├── History.ts
│   │   └── UrlState.ts
│   │
│   ├── ui/
│   │   ├── Controls.ts
│   │   ├── Slider.ts
│   │   ├── Toggle.ts
│   │   ├── PresetBrowser.ts
│   │   └── ColorControls.ts
│   │
│   └── export/
│       ├── Screenshot.ts
│       └── Configuration.ts
│
└── docs/
    ├── SITE_STRUCTURE.md
    └── FRACTAL_MATH.md
```

---

# 7. Pipeline gráfico

A renderização deve ocorrer em passes.

## Passo 1 — Coordenadas

O fragment shader recebe a posição do pixel e transforma para coordenadas normalizadas:

```text
pixel -> uv -> centered coordinates -> corrected aspect ratio
```

## Passo 2 — Transformação espacial

Aplicar:

- zoom;
- rotação;
- deslocamento;
- simetria;
- kaleidoscope fold;
- domain warp.

## Passo 3 — Fórmula fractal

Executar uma fórmula iterativa sobre cada pixel.

Exemplos:

- Mandelbrot;
- Julia;
- Burning Ship;
- Newton fractal;
- fórmula customizada.

O shader gera dados como:

```text
iteration count
orbit distance
escape distance
angle
derivative
```

## Passo 4 — Feedback

O resultado atual pode ser misturado com o frame anterior.

```text
current frame
      +
previous frame
      ↓
feedback shader
```

Isso permite movimento semelhante a:

- respiração;
- arrasto;
- eco;
- melting;
- ondas;
- túnel.

Para isso são usados dois framebuffers alternados:

```text
Framebuffer A -> Framebuffer B
Framebuffer B -> Framebuffer A
```

Esse padrão é chamado normalmente de **ping-pong framebuffer**.

## Passo 5 — Coloração

Converter o campo matemático para RGB.

Possíveis entradas:

```text
iteration
orbit trap
distance
angle
previous frame
time
```

## Passo 6 — Pós-processamento

Opcional:

- bloom simples;
- emboss;
- edge enhancement;
- chromatic shift;
- vignette;
- grain;
- tone mapping.

---

# 8. Interface

Layout recomendado:

```text
┌──────────────────────────────────────────────────────┐
│ Fractal Playground     Randomize   Reset   Export    │
├───────────────────────────────────────┬──────────────┤
│                                       │ PRESET       │
│                                       │ ○ Organic    │
│                                       │ ○ Tunnel     │
│                                       │ ○ Cells      │
│                                       │              │
│                                       │ FRACTAL      │
│                                       │ Formula      │
│              CANVAS                   │ Iterations   │
│                                       │ Power        │
│                                       │ Zoom         │
│                                       │              │
│                                       │ WARP         │
│                                       │ Strength     │
│                                       │ Frequency    │
│                                       │              │
│                                       │ MOTION       │
│                                       │ Speed        │
│                                       │ Feedback     │
│                                       │              │
│                                       │ COLOR        │
│                                       │ Palette      │
│                                       │ Cycle        │
└───────────────────────────────────────┴──────────────┘
```

O canvas deve ocupar aproximadamente **75–85% da tela**.

---

# 9. Grupos de controles

## Fractal

```text
Formula
Iterations
Power
Escape Radius
Zoom
Rotation
Position X
Position Y
Julia X
Julia Y
```

## Symmetry

```text
Mirror X
Mirror Y
Kaleidoscope Sides
Polar Fold
Rotation Repeat
```

## Warp

```text
Warp Strength
Warp Frequency
Warp Octaves
Warp Rotation
Warp Animation
```

## Motion

```text
Time Speed
Pulse
Breathing
Feedback Amount
Feedback Scale
Feedback Rotation
Flow Strength
```

## Color

```text
Palette
Hue
Saturation
Brightness
Contrast
Frequency
Phase
Color Cycle Speed
Invert
```

## Interaction

```text
Brush Radius
Brush Strength
Brush Mode
Attractor Strength
Repulsor Strength
```

---

# 10. Pattern Map inspirado em Karl Sims

Um dos elementos mais interessantes do RD Tool é o mapa 2D usado para selecionar pares de parâmetros.

O mesmo conceito pode ser reutilizado.

Exemplo:

```text
       warp strength
             ↑
             │
             │
             │
             │
             └────────────→ fractal power
```

Cada posição representa uma combinação de parâmetros.

Outra possibilidade:

```text
X = symmetry
Y = feedback
```

O usuário arrasta um ponto e vê a imagem mudar continuamente.

Isso transforma parâmetros abstratos em uma **exploração visual de espaço matemático**.

---

# 11. Presets

Formato:

```ts
interface Preset {
  name: string;
  seed: number;
  fractal: FractalParams;
  warp: WarpParams;
  feedback: FeedbackParams;
  color: ColorParams;
}
```

Exemplos:

```text
Organic Bloom
Infinite Tunnel
Liquid Geometry
Recursive Eyes
Electric Coral
Breathing Labyrinth
Kaleidoscope Melt
Cellular Dream
Spiral Cathedral
Chromatic Void
```

---

# 12. Randomização controlada

Não randomizar tudo de maneira uniforme.

Cada parâmetro deve possuir:

```text
min
max
mutationAmount
probability
```

Exemplo:

```ts
power += gaussianRandom() * 0.15;
warpStrength += gaussianRandom() * 0.05;
```

Isso permite gerar variações próximas da configuração atual.

Essa ideia é especialmente útil porque Karl Sims já explorava **navegação de espaços procedurais por mutação e seleção visual** em trabalhos anteriores.

Um recurso futuro muito interessante seria:

```text
CURRENT IMAGE

↓ mutate

┌──────┬──────┬──────┐
│ var1 │ var2 │ var3 │
├──────┼──────┼──────┤
│ var4 │ var5 │ var6 │
└──────┴──────┴──────┘
```

O usuário escolhe a variação favorita e gera outra geração.

---

# 13. Estado na URL

Inspirado diretamente no comportamento documentado do RD Tool.

Em vez de salvar cada valor em parâmetros legíveis:

```text
?power=2&warp=0.7&...
```

usar:

```text
?p=ENCODED_STATE
```

Pipeline:

```text
Parameters
    ↓
JSON
    ↓
compact serialization
    ↓
Base64URL
    ↓
URL
```

Também armazenar:

```text
version
seed
```

Exemplo conceitual:

```json
{
  "v": 1,
  "seed": 81424,
  "f": {...},
  "w": {...},
  "c": {...}
}
```

---

# 14. Interação com mouse

O cursor pode alterar diretamente um campo.

Modos:

```text
Seed
Warp
Attractor
Repulsor
Erase
Twist
```

Por exemplo:

```text
distance = length(pixelPosition - mousePosition)

force = exp(-distance² / radius²)
```

Essa força pode modificar:

- coordenadas;
- fase;
- feedback;
- campo de velocidade;
- seed de reação-difusão.

---

# 15. Loop principal

Pseudo-código:

```ts
function frame(time: number) {
  updateParameters(time);

  fractalPass();
  feedbackPass();
  colorPass();

  swapBuffers();

  requestAnimationFrame(frame);
}
```

---

# 16. Ping-pong framebuffer

Estrutura:

```text
FRAME N

Texture A
   ↓
Shader
   ↓
Texture B

FRAME N+1

Texture B
   ↓
Shader
   ↓
Texture A
```

Isso permite que a imagem tenha memória temporal.

Sem feedback:

```text
image = F(x, y, t)
```

Com feedback:

```text
image_t = F(x, y, t, image_{t-1})
```

É isso que permite comportamentos visuais muito mais orgânicos.

---

# 17. Performance

## Resolução da simulação

Não é obrigatório calcular na resolução nativa da tela.

Exemplo:

```text
Canvas:     1920 × 1080
Simulation: 960 × 540
```

Depois fazer upscale.

Opções:

```text
0.25x
0.5x
0.75x
1.0x
```

## Iterações

Fractais podem exigir dezenas ou centenas de iterações por pixel.

Começar com:

```text
64
96
128
```

e aumentar apenas quando necessário.

## Qualidade adaptativa

Durante interação:

```text
resolution = 0.5
iterations = 64
```

Quando o mouse parar:

```text
resolution = 1.0
iterations = 160
```

---

# 18. Desenvolvimento em etapas

## Fase 1 — Canvas básico

Implementar apenas:

```text
WebGL initialization
fullscreen quad
fragment shader
time uniform
resolution uniform
```

Resultado esperado:

um shader simples ocupando a tela inteira.

---

## Fase 2 — Um fractal

Implementar apenas Julia Set:

```text
z(n+1) = z(n)^2 + c
```

Controles:

```text
zoom
position
c.real
c.imag
iterations
```

---

## Fase 3 — Coloração

Adicionar:

```text
palette
hue
contrast
color cycle
```

---

## Fase 4 — Kaleidoscope

Adicionar:

```text
polar coordinates
angular repetition
mirror folding
```

---

## Fase 5 — Domain Warp

Adicionar distorção procedural das coordenadas.

---

## Fase 6 — Feedback

Criar:

```text
2 textures
2 framebuffers
ping-pong rendering
```

Adicionar:

```text
feedback strength
feedback zoom
feedback rotation
```

---

## Fase 7 — Interação

Adicionar mouse:

```text
attractor
twist
brush
```

---

## Fase 8 — Presets

Criar aproximadamente 10 presets bem escolhidos.

---

## Fase 9 — Estado pela URL

Salvar:

```text
seed
parameters
version
```

---

## Fase 10 — Exportação

Adicionar captura PNG.

Vídeo pode ficar para versões posteriores.

---

# 19. O que NÃO fazer na V1

Não implementar inicialmente:

- WebGPU;
- sistema de nodes;
- editor de shaders;
- login;
- cloud;
- galeria online;
- contas;
- multiplayer;
- áudio reativo;
- exportação 4K;
- renderização offline;
- dezenas de fórmulas fractais;
- sistema evolutivo completo.

A primeira versão deve provar apenas:

> **“Consigo abrir o site, mover alguns controles e produzir rapidamente estruturas fractais dinâmicas muito diferentes e interessantes.”**

---

# 20. Referências pesquisadas

### Karl Sims — RD Tool

Página da aplicação:

https://karlsims.com/rdtool.html

### Karl Sims — RD Tool Help

Documenta controles, WebGL 2, WebAssembly, desenho, escala, fluxo, orientação, pattern map e salvamento do estado pela URL:

https://karlsims.com/rdtool-help.html

### Karl Sims — Reaction-Diffusion Tutorial

Explica o modelo Gray-Scott, parâmetros, Laplaciano, orientação, flow, style map e scale:

https://karlsims.com/rd.html

### Karl Sims — Artificial Evolution for Computer Graphics

Trabalho anterior de Sims sobre exploração de espaços procedurais por mutação e seleção visual:

https://www.karlsims.com/papers/siggraph91-backup.html

### Exemplo moderno de Gray-Scott em WebGL

Implementação com fragment shader e ping-pong framebuffers:

https://github.com/cangdongcheng/reaction-diffusion

---

# 21. Resumo da arquitetura

```text
USER
 │
 ▼
PARAMETERS
 │
 ▼
COORDINATE TRANSFORMS
 │
 ├── zoom
 ├── rotation
 ├── symmetry
 └── domain warp
 │
 ▼
FRACTAL EQUATION
 │
 ▼
FEEDBACK / FLOW
 │
 ▼
COLOR MAP
 │
 ▼
POST PROCESS
 │
 ▼
CANVAS
```

A inspiração mais importante do RD Tool não é uma fórmula específica.

É a ideia de transformar um **espaço matemático complexo em algo explorável visualmente em tempo real**.
