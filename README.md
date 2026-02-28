# FusionBots - Reinventing Competition

Un videojuego 2D competitivo local que reimagina qué puede ser un deporte mediante sistemas de puntuación no convencionales, objetivos variables y riesgo activo.

## 🎯 Respuesta al Tema "Reinventing Competition"

FusionBots desafía la noción tradicional de competición deportiva al:

1. **Combinar géneros deportivos**: Cada modo fusiona dos deportes con mecánicas incompatibles
2. **Riesgo dinámico**: Los puntos no solo se ganan, también se pierden por errores
3. **Objetivos variables**: Las porterías se mueven, las zonas se reducen, los balones explotan
4. **Puntuación no lineal**: Arriesgarse puede multiplicar puntos o destruirlos
5. **Supervivencia integrada**: Anotar no garantiza el punto si no sobrevives

## 🕹️ Controles

| Acción | Jugador 1 | Jugador 2 |
|--------|-----------|-----------|
| Movimiento (8 direcciones) | `W A S D` | `↑ ↓ ← →` |
| Empujar | `F` | `Shift` |

## 🎮 Los 5 Modos Híbridos

Cada modo dura 60 segundos. El score global se acumula a través de todos los modos.

### Modo 1: Gol de Supervivencia (Fútbol + Sumo)
- Marca goles en la portería rival: +1 punto
- Empuja al rival fuera del campo: +1 punto
- **Riesgo**: Si caes después de anotar (3 segundos), el gol se anula
- Sin paredes laterales - zona de caída activa

### Modo 2: Dominación de Carga (Rugby + Control Territorial)
- Cruza la línea rival con el balón: +2 puntos
- Controla la zona central sin el balón: +1 cada 3 segundos
- El portador del balón tiene velocidad reducida al 60%

### Modo 3: Triple Riesgo (Baloncesto + Zona de Lava)
- Encesta desde zona segura: +1 punto
- Encesta desde zona de lava: +3 puntos
- Estar en lava: -1 punto cada 2 segundos
- La zona segura se reduce progresivamente cada 15 segundos

### Modo 4: Objetivo Dinámico (Hockey + Porterías Móviles)
- Las porterías se mueven de forma sinusoidal
- Gol: +1 punto
- Gol + empujar al rival durante su intento: +2 puntos

### Modo 5: Impacto Controlado (Boxeo + Balón Explosivo)
- El balón tiene un temporizador visible (6 segundos)
- Al explotar: el jugador más cercano pierde 2 puntos
- Estrategia: empujar al rival hacia el balón

## 🏗️ Arquitectura de Clases

```
┌─────────────────────────────────────────────────────────────┐
│                      MainScene                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  UIManager  │ │GameModeManager│ │   Arena    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│         │               │               │                    │
│         │        ┌──────┴──────┐        │                    │
│         │        │   GameMode  │←───────┘                    │
│         │        │   (base)    │                             │
│         │        └──────┬──────┘                             │
│         │               │                                    │
│    ┌────┴────┬────┬────┬────┬────┐                          │
│    │         │    │    │    │    │                          │
│ Survival  Carry Triple Dynamic Impact                       │
│  Goal   Dominance Risk  Objective                           │
│         │                                                    │
│  ┌──────┴───────┐                                           │
│  │   Player     │ × 2                                       │
│  └──────────────┘                                           │
│         │                                                    │
│  ┌──────┴───────┐                                           │
│  │    Ball      │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### Clases Principales

- **`Player`**: Maneja movimiento, empujón con cooldown, efectos visuales (glow, flash, barra de cooldown)
- **`Ball`**: Física del balón, modo explosivo con temporizador visible
- **`Arena`**: Crea y gestiona zonas, límites, porterías, lava, zonas centrales
- **`GameMode`**: Clase base con `setupArena()`, `setupPlayers()`, `setupBall()`, `updateModeLogic()`, `checkWinCondition()`, `cleanup()`
- **`GameModeManager`**: Ciclo de modos, prevención de repetición consecutiva, registro de scores
- **`UIManager`**: Marcadores, anuncios, overlay de explicación con countdown, resultados finales

## 🎨 Paleta Visual

- Fondo: `#0a0a0f` (negro profundo con tono azul)
- Jugador 1: `#00f5ff` (cyan neón con glow)
- Jugador 2: `#ff2d78` (magenta neón con glow)
- Balón: `#ffffff` con sombra difusa
- Lava: `#ff4500` con transparencia y animación de pulso
- Zona segura: `#00ff88` semitransparente

## 🚀 Deploy en GitHub Pages

1. Sube los archivos al repositorio:
   - `index.html`
   - `style.css`
   - `main.js`
   - `README.md`

2. Ve a Settings → Pages

3. Selecciona:
   - Source: Deploy from a branch
   - Branch: main (o master)
   - Folder: / (root)

4. Guarda y espera unos minutos

5. Tu juego estará disponible en: `https://[usuario].github.io/FusionBots/`

**Nota**: No se requiere build ni configuración adicional. El juego funciona abriendo `index.html` directamente.

## ⚙️ Configuración de Físicas

```javascript
playerSpeed: 220        // Velocidad base del jugador
ballBounce: 0.85        // Rebote del balón
pushForce: 600          // Fuerza de empujón sobre balón
knockbackForce: 500     // Fuerza de empujón sobre rival
maxBallVelocity: 800    // Velocidad máxima del balón
pushCooldown: 800       // Milisegundos de cooldown
pushRadius: 120         // Radio de efecto del empujón
```

## 🗺️ Roadmap Futuro

### Fase 1: Audio
- [ ] Efectos de sonido para empujones, goles, explosiones
- [ ] Música de fondo dinámica que cambia según el modo
- [ ] Feedback auditivo para countdown y alertas

### Fase 2: Power-ups
- [ ] Velocidad boost temporal
- [ ] Escudo anti-empujón
- [ ] Empujón con mayor alcance
- [ ] Invisibilidad parcial

### Fase 3: IA
- [ ] Modo un jugador vs IA
- [ ] Dificultades: Fácil, Normal, Difícil
- [ ] IA adaptativa que aprende del jugador

### Fase 4: Mobile
- [ ] Controles táctiles con joystick virtual
- [ ] Adaptación de UI para pantallas pequeñas
- [ ] Modo vertical y horizontal

### Fase 5: Torneo
- [ ] Modo torneo con brackets
- [ ] Guardado de records locales
- [ ] Tabla de clasificación
- [ ] Modos eliminatorios

### Fase 6: Multijugador Online
- [ ] WebSockets para juego en tiempo real
- [ ] Matchmaking básico
- [ ] Sistema de salas

## 📜 Licencia

MIT License - Libre para uso, modificación y distribución.

---

*Desarrollado para Game Jam - Tema: "Reinventing Competition"*