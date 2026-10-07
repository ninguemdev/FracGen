# Estrutura Matemática — Motor de Fractais Psicodélicos Dinâmicos

## 1. Objetivo matemático

O objetivo é criar um sistema capaz de gerar imagens:

- fractais;
- recursivas;
- orgânicas;
- caleidoscópicas;
- fluidas;
- animadas;
- sensíveis ao mouse;
- com transições contínuas entre configurações.

Em vez de depender de uma única fórmula, o motor será uma **composição de transformações matemáticas**.

Pipeline:

```text
coordenadas
    ↓
transformação geométrica
    ↓
kaleidoscope
    ↓
domain warp
    ↓
iteração fractal
    ↓
orbit traps
    ↓
feedback temporal
    ↓
colorização
```

Matematicamente:

\[
C(x,y,t)=P\left(
F\left(
W\left(
K\left(
T(x,y,t)
\right)
\right)
\right),t
\right)
\]

onde:

- \(T\) = transformação de coordenadas;
- \(K\) = simetria caleidoscópica;
- \(W\) = domain warp;
- \(F\) = campo fractal;
- \(P\) = função de cor.

---

# 2. Sistema de coordenadas

Para um pixel:

```text
px ∈ [0, width]
py ∈ [0, height]
```

normalizar:

\[
u = \frac{x}{W}
\]

\[
v = \frac{y}{H}
\]

centralizar:

\[
p_x = 2u-1
\]

\[
p_y = 2v-1
\]

corrigir aspecto:

\[
p_x = p_x \frac{W}{H}
\]

Então:

\[
p=(p_x,p_y)
\]

---

# 3. Zoom, rotação e posição

## Zoom

\[
p' = \frac{p}{z}
\]

onde \(z\) é o zoom.

## Rotação

\[
R(\theta)=
\begin{bmatrix}
\cos\theta & -\sin\theta\\
\sin\theta & \cos\theta
\end{bmatrix}
\]

\[
p'=R(\theta)p
\]

## Translação

\[
p'=p+c
\]

onde:

\[
c=(c_x,c_y)
\]

---

# 4. Coordenadas polares

Converter:

\[
r=\sqrt{x^2+y^2}
\]

\[
\theta=\operatorname{atan2}(y,x)
\]

Isso permite criar:

- túneis;
- espirais;
- círculos;
- simetria radial;
- caleidoscópios.

---

# 5. Kaleidoscope Fold

Dividir o círculo em \(N\) setores.

Tamanho angular:

\[
s=\frac{2\pi}{N}
\]

Repetir o ângulo:

\[
\theta'=\operatorname{mod}(\theta,s)
\]

Espelhar:

\[
\theta'=
\left|
\theta'-\frac{s}{2}
\right|
\]

Reconstruir:

\[
p_x=r\cos(\theta')
\]

\[
p_y=r\sin(\theta')
\]

Parâmetro:

```text
symmetrySides = N
```

Valores interessantes:

```text
3
4
5
6
8
12
16
```

Valores não inteiros também podem produzir deformações interessantes se tratados adequadamente.

**Nota de implementação.** No shader, caleidoscópio e domain warp formam uma **lente em coordenadas de tela**, aplicada **antes** do zoom e da posição — e não depois de `T` completo como em §29/§42:

```text
p = W(K(pixel))            lente: simetria e warp
z = p / zoom + position    câmera
```

Assim o centro de simetria fica fixo no centro da tela e zoom/posição deslizam o fractal "por baixo da lente", como girar um caleidoscópio — cada movimento gera um padrão novo. Como `K` é homogêneo (`K(λp) = λK(p)`), aplicá-lo antes ou depois do zoom dá o mesmo resultado; com `position = 0` também equivale à ordem original. Os setores são centrados no eixo +x, `N = 1` desliga a simetria, e só valores inteiros são usados por enquanto (um `N` fracionário deixa uma costura onde os setores não fecham). Sem espelhamento, o resultado é apenas repetição rotacional (simetria de ordem N).

---

# 6. Spiral Transform

Adicionar rotação proporcional ao raio:

\[
\theta'=\theta+\alpha r
\]

Para animação:

\[
\theta'=\theta+\alpha r+\omega t
\]

onde:

```text
alpha = spiral strength
omega = rotation speed
```

Uma versão mais agressiva:

\[
\theta'=\theta+\alpha\log(r+\epsilon)
\]

que tende a produzir sensação de túnel.

---

# 7. Breathing Transform

Criar uma expansão e contração temporal:

\[
b(t)=1+A\sin(\omega t)
\]

e:

\[
p'=p\cdot b(t)
\]

Outra versão:

\[
r'=r+A\sin(\omega t+\beta r)
\]

Isso cria ondas concêntricas que parecem atravessar a estrutura.

---

# 8. Domain Warping

Domain warping significa distorcer as coordenadas **antes** de calcular o fractal.

Forma simples:

\[
p'=p+w(p,t)
\]

onde \(w\) é um campo vetorial.

Exemplo trigonométrico:

\[
w_x=A\sin(fy+\omega t)
\]

\[
w_y=A\cos(fx-\omega t)
\]

Então:

\[
p'_x=p_x+w_x
\]

\[
p'_y=p_y+w_y
\]

Parâmetros:

```text
A = warp strength
f = warp frequency
ω = animation speed
```

---

# 9. Warp recursivo

Aplicar múltiplas frequências:

\[
w(p)=
\sum_{i=0}^{n-1}
\frac{A}{2^i}
\begin{bmatrix}
\sin(2^ifp_y+\phi_i)\\
\cos(2^ifp_x+\psi_i)
\end{bmatrix}
\]

Isso funciona de maneira parecida com octaves de ruído.

Exemplo:

```text
octave 1 → formas grandes
octave 2 → deformação média
octave 3 → pequenos detalhes
octave 4 → microestrutura
```

**Nota de implementação.** O warp é aplicado em coordenadas de tela (ver nota do §5), então suas ondas mantêm o mesmo tamanho na tela em qualquer zoom — no plano do fractal, um zoom profundo transformaria o warp num deslocamento gigante. As oitavas são **compostas**: cada uma desloca o ponto já deslocado pela anterior (`p ← p + w_i(p)`), lendo "recursivo" literalmente; com uma oitava é idêntico ao §8. As fases são `φ_i = ωt + 1.7·i` e `ψ_i = −ωt + 1.7·i`, para as oitavas não se moverem em sincronia. Em seguida vem o warp rotacional do §10, com a mesma frequência `f` e fase `ωt`. A fase `ωt` é acumulada frame a frame na CPU (`ω` = Animation).

---

# 10. Rotational Warp

Uma transformação especialmente útil:

\[
\theta'=\theta+A\sin(fr-\omega t)
\]

Depois:

\[
p'=
\begin{bmatrix}
r\cos\theta'\\
r\sin\theta'
\end{bmatrix}
\]

Esse tipo de warp produz movimentos de giro que parecem atravessar a geometria.

---

# 11. Fractal principal — Julia Set

Representar o pixel como número complexo:

\[
z=x+iy
\]

Escolher constante:

\[
c=c_x+ic_y
\]

Iterar:

\[
z_{n+1}=z_n^2+c
\]

até:

\[
|z|>R
\]

ou atingir:

```text
maxIterations
```

Normalmente:

```text
R = 2
```

---

# 12. Potência variável

Generalizar:

\[
z_{n+1}=z_n^p+c
\]

onde:

```text
p = fractal power
```

Valores:

```text
1.5
2.0
2.5
3.0
4.0
```

produzem famílias muito diferentes.

Para potência inteira, em coordenadas polares complexas:

\[
z^p=r^p e^{ip\theta}
\]

---

# 13. Mandelbrot

Outra opção:

\[
z_0=0
\]

\[
z_{n+1}=z_n^2+c
\]

mas agora:

\[
c=p
\]

onde \(p\) é a coordenada do pixel transformada.

---

# 14. Burning Ship

Iteração:

\[
z_{n+1}=
(|\Re(z_n)|+i|\Im(z_n)|)^2+c
\]

Isso gera formas muito mais angulares e agressivas.

---

# 15. Fractal modulado

Para fugir das fórmulas clássicas, introduzir uma pequena perturbação:

\[
z_{n+1}=z_n^p+c+\lambda q(z_n,t)
\]

onde:

\[
q(z,t)=
\sin(a\Re(z)+\omega t)
+
i\cos(a\Im(z)-\omega t)
\]

Portanto:

\[
\Re(z_{n+1})=
\Re(z_n^p+c)
+
\lambda\sin(a\Re(z_n)+\omega t)
\]

\[
\Im(z_{n+1})=
\Im(z_n^p+c)
+
\lambda\cos(a\Im(z_n)-\omega t)
\]

`λ` deve começar pequeno:

```text
0.00 – 0.15
```

Isso preserva a estrutura fractal, mas faz a geometria se deformar.

---

# 16. Continuous Escape Time

Usar apenas o número inteiro de iterações cria bandas.

Para suavizar:

\[
\nu=
n+1-\frac{\log(\log|z_n|)}{\log p}
\]

Depois:

\[
s=\frac{\nu}{N}
\]

onde:

```text
N = maxIterations
```

Isso gera gradientes muito mais contínuos.

---

# 17. Orbit Traps

Durante a iteração, registrar a menor distância até uma forma.

## Trap circular

\[
d=\min_n ||z_n|-r_0|
\]

## Trap linha

\[
d=\min_n |\Im(z_n)|
\]

## Trap cruz

\[
d=\min_n \min(|\Re(z_n)|,|\Im(z_n)|)
\]

## Trap ponto

\[
d=\min_n |z_n-z_t|
\]

Orbit traps permitem revelar estruturas internas que o escape-time tradicional não mostra.

---

# 18. Trap animado

Mover o ponto-alvo:

\[
z_t(t)=
A\cos(\omega t)
+
iA\sin(\omega t)
\]

Então:

\[
d=\min_n|z_n-z_t(t)|
\]

Isso gera estruturas internas que parecem se mover através do fractal.

---

# 19. Campo vetorial

Definir um campo:

\[
V(p,t)=
\begin{bmatrix}
V_x\\
V_y
\end{bmatrix}
\]

Exemplo swirl:

\[
V=
\frac{1}{r+\epsilon}
\begin{bmatrix}
-y\\
x
\end{bmatrix}
\]

Adicionar:

\[
p'=p+\alpha V
\]

---

# 20. Vortex

Um vortex em posição \(c\):

\[
d=p-c
\]

\[
V(d)=
\frac{A}{|d|^2+\epsilon}
\begin{bmatrix}
-d_y\\
d_x
\end{bmatrix}
\]

Vários vórtices podem ser somados:

\[
V(p)=\sum_i V_i(p)
\]

Isso cria distorções espaciais complexas.

---

# 21. Mouse como força

Para posição do mouse \(m\):

\[
d=p-m
\]

Influência:

\[
g=e^{-\frac{|d|^2}{2\sigma^2}}
\]

Attractor:

\[
p'=p-\alpha g d
\]

Repulsor:

\[
p'=p+\alpha g d
\]

Twist:

\[
p'=p+\alpha g
\begin{bmatrix}
-d_y\\
d_x
\end{bmatrix}
\]

---

# 22. Feedback temporal

A imagem pode depender do frame anterior.

Representar o frame anterior por:

\[
I_{t-1}(p)
\]

Mistura simples:

\[
I_t=(1-\beta)F(p,t)+\beta I_{t-1}(p)
\]

onde:

```text
β = feedback strength
```

Valores típicos:

```text
0.70
0.85
0.94
0.98
```

---

# 23. Feedback com transformação

Em vez de amostrar o mesmo pixel:

\[
q=R(\theta_f)\frac{p}{s_f}+d
\]

Então:

\[
I_t(p)=
(1-\beta)F(p,t)+
\beta I_{t-1}(q)
\]

Parâmetros:

```text
feedback scale
feedback rotation
feedback offset
feedback strength
```

Com:

```text
scale < 1
```

a imagem tende a parecer expandir.

Com:

```text
scale > 1
```

tende a parecer contrair para o centro.

Uma pequena rotação por frame gera espirais persistentes.

**Nota de implementação (§22–§23).** O feedback mistura a **cor final** (depois da paleta e dos ajustes de cor), como no §43, e não o valor de escape antes da paleta como sugerem §29/§41: os rastros guardam a fase de paleta com que foram desenhados (o color cycle deixa rastros coloridos) e o interior do conjunto não precisa de tratamento especial. O controle **Zoom** é a ampliação do frame anterior a cada frame: o shader lê `I_{t-1}(q)` com `q = R(−θ)·p / zoom`, então o que estava em `q` vai para `p` — `zoom > 1` faz a imagem fluir para fora e `zoom < 1`, para o centro. É a fórmula acima com `s_f = zoom` e `θ_f = −θ`; note que, por ela, `s_f < 1` faz o conteúdo convergir para o centro, o oposto do que diz o texto acima. `p` são as coordenadas de tela centradas e com aspecto corrigido do §2: o centro do feedback é o centro da tela, como a lente do §5, e a rotação não se deforma em telas retangulares. O offset `d` não foi implementado. Fora da imagem a textura se repete espelhada, continuando-a sem costura. Amount, Zoom e Rotation valem por frame a 60 fps (as unidades do §34) e são convertidos para a duração real de cada frame — `β^(60Δt)`, `zoom^(60Δt)`, `θ·60Δt` — para que os rastros se apaguem, cresçam e girem à mesma velocidade em qualquer taxa de quadros. A memória são duas texturas RGBA16F em ping-pong. Com feedback forte, a mudança por frame `(1−β)(F−I)` fica menor que a precisão do half float e o arredondamento a descartaria para sempre (imagens antigas nunca terminariam de sumir); por isso o shader arredonda o resultado estocasticamente para um dos dois half floats vizinhos, o que é exato na média.

---

# 24. Feedback não linear

Em vez de mistura linear:

\[
I_t=
\tanh(
aF+bI_{t-1}
)
\]

ou:

\[
I_t=
\operatorname{fract}(
aF+bI_{t-1}
)
\]

ou ainda:

\[
I_t=
|F-I_{t-1}|
\]

Essas operações podem criar regimes muito diferentes.

---

# 25. Estrutura híbrida com reação-difusão

Uma camada opcional pode usar Gray-Scott.

Campos:

\[
U(x,y,t)
\]

\[
V(x,y,t)
\]

Equações:

\[
\frac{\partial U}{\partial t}
=
D_U\nabla^2U
-
UV^2
+
F(1-U)
\]

\[
\frac{\partial V}{\partial t}
=
D_V\nabla^2V
+
UV^2
-
(F+K)V
\]

Segundo o tutorial de Karl Sims, valores típicos são aproximadamente:

```text
DU = 1.0
DV = 0.5
F  = 0.055
K  = 0.062
dt = 1.0
```

com variação de `F` e `K` para diferentes padrões.

---

# 26. Laplaciano discreto

Uma aproximação 3×3 citada no tutorial de Sims usa:

```text
0.05  0.20  0.05
0.20 -1.00  0.20
0.05  0.20  0.05
```

Portanto:

\[
\nabla^2 U
\approx
- U_c
+0.2(U_N+U_S+U_E+U_W)
+0.05(U_{NE}+U_{NW}+U_{SE}+U_{SW})
\]

O mesmo vale para \(V\).

---

# 27. Fractal dirigindo reação-difusão

Aqui aparece uma combinação particularmente poderosa.

Em vez de `F` e `K` serem constantes:

\[
F(x,y)=F_0+\alpha H(x,y)
\]

\[
K(x,y)=K_0+\beta H(x,y)
\]

onde \(H\) é um campo derivado do fractal.

Exemplo:

\[
H=\sin(2\pi s)
\]

com \(s\) sendo o smooth escape value.

O fractal passa a determinar **onde cada regime de reação-difusão existe**.

---

# 28. Reação-difusão dirigindo o fractal

Também pode ocorrer o inverso:

\[
c(x,y)=c_0+\alpha V(x,y)
\]

ou:

\[
p'=p+\alpha\nabla V
\]

A textura orgânica de Gray-Scott passa então a deformar o domínio fractal.

---

# 29. Sistema híbrido recomendado

A arquitetura matemática principal recomendada é:

\[
p_0=T(x,y)
\]

\[
p_1=K(p_0)
\]

\[
p_2=W(p_1,t)
\]

\[
s=F(p_2,t)
\]

\[
o=O(p_2,t)
\]

\[
h=\operatorname{mix}(s,o,\eta)
\]

\[
g=\operatorname{Feedback}(h,I_{t-1})
\]

\[
C=P(g,t)
\]

onde:

```text
T = zoom/rotation/position
K = kaleidoscope
W = domain warp
F = fractal
O = orbit trap
Feedback = temporal memory
P = color palette
```

Essa combinação é suficiente para uma variedade visual enorme sem exigir dezenas de sistemas independentes.

---

# 30. Paleta cossenoidal

Uma excelente função procedural de cor:

\[
color(t)=
a+b\cos(2\pi(ct+d))
\]

onde:

\[
a,b,c,d \in \mathbb{R}^3
\]

Em GLSL:

```glsl
vec3 palette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);

    return a + b * cos(6.28318 * (c * t + d));
}
```

Animar fase:

```glsl
color = palette(value + time * colorSpeed);
```

---

# 31. Cor dependente do ângulo

Adicionar:

\[
\phi=\operatorname{atan2}(\Im z,\Re z)
\]

Cor:

\[
q=s+\alpha\frac{\phi}{2\pi}
\]

Então:

\[
C=P(q)
\]

Isso cria regiões cromáticas seguindo a geometria do fractal.

---

# 32. Cor dependente da profundidade

Usar:

\[
q=
a\cdot escape
+
b\cdot orbitTrap
+
c\cdot angle
+
d\cdot radius
\]

Depois:

\[
C=P(q)
\]

Isso permite construir paletas muito ricas a partir de poucos sinais.

---

# 33. Sistema de parâmetros

Estrutura sugerida:

```ts
type FractalParams = {
  formula: "julia" | "mandelbrot" | "burningShip";
  iterations: number;
  power: number;
  escapeRadius: number;

  juliaX: number;
  juliaY: number;

  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;

  symmetry: number;

  spiralStrength: number;

  warpStrength: number;
  warpFrequency: number;
  warpOctaves: number;

  perturbation: number;

  feedback: number;
  feedbackScale: number;
  feedbackRotation: number;

  timeSpeed: number;
};
```

---

# 34. Faixas iniciais recomendadas

```text
iterations
32 – 256

power
1.5 – 5.0

zoom
0.2 – 20

symmetry
1 – 16

spiralStrength
-8 – 8

warpStrength
0 – 1.5

warpFrequency
0.1 – 12

warpOctaves
1 – 5

perturbation
0 – 0.2

feedback
0 – 0.99

feedbackScale
0.96 – 1.04

feedbackRotation
-0.03 – 0.03 rad/frame

timeSpeed
-3 – 3
```

---

# 35. Preset matemático — Breathing Labyrinth

```text
formula          = Julia
power            = 2
iterations       = 120

symmetry         = 6
spiralStrength   = 1.4

warpStrength     = 0.22
warpFrequency    = 3.1
warpOctaves      = 3

feedback         = 0.91
feedbackScale    = 0.997
feedbackRotation = 0.002

timeSpeed        = 0.25
```

---

# 36. Preset — Infinite Tunnel

```text
formula          = Julia
power            = 2.7
iterations       = 96

symmetry         = 8
spiralStrength   = 4.0

warpStrength     = 0.12
warpFrequency    = 5.0

feedback         = 0.95
feedbackScale    = 1.005
feedbackRotation = -0.004

timeSpeed        = 0.4
```

---

# 37. Preset — Organic Melt

```text
formula          = Mandelbrot
power            = 2
iterations       = 128

symmetry         = 3

warpStrength     = 0.45
warpFrequency    = 1.7
warpOctaves      = 4

perturbation     = 0.08

feedback         = 0.88
feedbackScale    = 0.999
feedbackRotation = 0.001
```

---

# 38. Preset — Recursive Eyes

```text
formula          = Julia
power            = 2
iterations       = 150

symmetry         = 12

orbitTrap        = point
orbitTrapRadius  = animated

warpStrength     = 0.08

feedback         = 0.93
feedbackScale    = 1.002
```

---

# 39. Seed determinística

Para reproduzir um resultado:

```text
seed = integer
```

Todo valor pseudoaleatório deve vir dessa seed.

Exemplo:

\[
r_{n+1}=
(a r_n+c)\mod m
\]

Ou usar um PRNG melhor no JavaScript e enviar somente resultados determinísticos para o shader.

Isso permite:

```text
mesma seed
+
mesmos parâmetros
=
mesmo resultado
```

---

# 40. Random Mutation

Para explorar vizinhanças no espaço de parâmetros:

\[
p_i'=p_i+\sigma_i N(0,1)
\]

onde:

- \(N(0,1)\) é distribuição normal;
- \(\sigma_i\) controla a força de mutação de cada parâmetro.

Exemplo:

```text
power σ = 0.1
warp σ = 0.05
symmetry σ = 1
juliaX σ = 0.02
juliaY σ = 0.02
```

Isso é muito melhor que simplesmente sortear todos os parâmetros novamente.

---

# 41. Fórmula mínima da primeira versão

A V1 não precisa implementar tudo.

Usar apenas:

\[
p=T(x,y)
\]

\[
p=K(p)
\]

\[
p=W(p,t)
\]

\[
z_0=p
\]

\[
z_{n+1}=z_n^2+c
\]

\[
s=\text{smoothEscape}(z)
\]

\[
I_t=(1-\beta)s+\beta I_{t-1}(q)
\]

\[
C=palette(I_t+\omega_ct)
\]

Isso sozinho já cria um sistema extremamente rico.

---

# 42. GLSL conceitual

```glsl
vec2 p = uvToWorld(vUv);

p = rotate(p, rotation);
p /= zoom;
p += offset;

p = kaleidoscope(p, symmetry);

p += domainWarp(p, time) * warpStrength;

vec2 z = p;
vec2 c = juliaC;

float trap = 1000.0;
float iter = 0.0;

for (int i = 0; i < MAX_ITER; i++) {
    if (i >= iterations) break;

    z = complexPow(z, power) + c;

    trap = min(trap, length(z - trapPoint));

    if (dot(z, z) > escapeRadius * escapeRadius) {
        iter = float(i);
        break;
    }
}

float fractalValue = smoothEscape(iter, z);
float value = mix(fractalValue, trapFunction(trap), trapMix);

vec3 color = palette(
    value * colorFrequency
    + time * colorSpeed
);
```

---

# 43. Feedback shader conceitual

```glsl
vec2 p = vUv - 0.5;

p = rotate(p, feedbackRotation);
p /= feedbackScale;

vec2 feedbackUv = p + 0.5;

vec3 previous =
    texture(previousFrame, feedbackUv).rgb;

vec3 current =
    texture(currentFractal, vUv).rgb;

vec3 result =
    mix(current, previous, feedbackAmount);
```

---

# 44. Evolução matemática futura

Somente depois da V1:

## Signed Distance Fields

Combinar fractais com SDFs.

## Iterated Function Systems

Transformações afins iterativas:

\[
x_{n+1}=a_ix_n+b_iy_n+e_i
\]

\[
y_{n+1}=c_ix_n+d_iy_n+f_i
\]

## Newton Fractals

Iteração:

\[
z_{n+1}=
z_n-
\frac{f(z_n)}{f'(z_n)}
\]

## Reaction-Diffusion

Integrar Gray-Scott como campo secundário.

## Flow Fields

Advecção:

\[
\frac{\partial C}{\partial t}
+
v\cdot\nabla C
=
0
\]

## Noise

Simplex/Perlin/value noise para domain warping.

## Audio

Usar FFT para alterar parâmetros matemáticos.

---

# 45. Relação com o RD Tool

O RD Tool mostra uma ideia importante:

> pequenas mudanças em poucos parâmetros de um sistema dinâmico podem criar comportamentos visualmente muito diferentes.

No Gray-Scott isso ocorre principalmente através de `feed`, `kill`, difusão, flow, orientation e scale.

Neste projeto, o espaço de exploração será composto principalmente por:

```text
fractal power
Julia C
symmetry
warp
spiral
feedback
orbit trap
color phase
```

Assim como no RD Tool, o usuário pode explorar matematicamente o sistema **sem precisar conhecer as equações**.

---

# 46. Referências pesquisadas

### Karl Sims — Reaction-Diffusion Tutorial

Modelo Gray-Scott, Laplaciano 3×3, parâmetros e extensões:

https://karlsims.com/rd.html

### Karl Sims — RD Tool Help

Documentação de flow, orientation, scale e pattern variation:

https://karlsims.com/rdtool-help.html

### Gray-Scott examples

Equações do sistema:

https://github.com/wigging/gray-scott

### GPU Reaction-Diffusion

Exemplo de execução em fragment shader e ping-pong framebuffer:

https://github.com/cangdongcheng/reaction-diffusion

### Karl Sims — Artificial Evolution for Computer Graphics

Uso de fórmulas procedurais, noise, warping, IFS e mutação de parâmetros:

https://www.karlsims.com/papers/siggraph91-backup.html

---

# 47. Fórmula conceitual final

Uma maneira compacta de representar o motor inteiro:

\[
\boxed{
I_t(x,y)=
P\left(
(1-\beta)
F\left(
W\left(
K\left(
T(x,y,t)
\right),t
\right)
\right)
+
\beta
I_{t-1}
\left(
G(x,y)
\right)
,t
\right)
}
\]

onde:

```text
T → transformação espacial
K → simetria caleidoscópica
W → domain warp
F → fractal iterativo
G → transformação do feedback
β → memória temporal
P → paleta procedural
```

Essa é a estrutura matemática central recomendada para o projeto.
