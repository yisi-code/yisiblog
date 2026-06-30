<template>
  <div class="background-canvas" aria-hidden="true">
    <div class="background-canvas__mode background-canvas__mode--light">
      <div class="background-canvas__light-gradient" />
      <div class="background-canvas__light-glow background-canvas__light-glow--primary" />
      <div class="background-canvas__light-glow background-canvas__light-glow--secondary" />
    </div>

    <div class="background-canvas__mode background-canvas__mode--dark transform-gpu">
      <div class="background-canvas__night-sky" />
      <div class="background-canvas__moon" />
      <span
        v-for="star in activeDarkEffect.staticStars"
        :key="star.id"
        class="background-canvas__static-star"
        :style="star.style"
      />
      <span
        v-for="particle in activeDarkEffect.particles"
        :key="particle.id"
        class="background-canvas__stardust-orbit"
        :class="`background-canvas__stardust-orbit--${particle.path}`"
        :style="particle.orbitStyle"
      >
        <span class="background-canvas__stardust-core" :style="particle.coreStyle" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
type BackgroundMode = 'light' | 'dark'
type WeatherEffectType = 'clear-gradient' | 'night-stardust'

interface WeatherEffectConfig {
  mode: BackgroundMode
  type: WeatherEffectType
  staticStars: StaticStar[]
  particles: StardustParticle[]
}

interface StaticStar {
  id: number
  style: Record<string, string>
}

interface StardustParticle {
  id: number
  path: 1 | 2 | 3 | 4
  orbitStyle: Record<string, string>
  coreStyle: Record<string, string>
}

const particleCount = 44
const staticStarCount = 64

function seededRatio(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function range(seed: number, min: number, max: number) {
  return min + seededRatio(seed) * (max - min)
}

function createNightStardust(): StardustParticle[] {
  return Array.from({ length: particleCount }, (_, index) => {
    const path = (index % 4 + 1) as StardustParticle['path']
    const left = range(index + 1, 4, 96)
    const top = range(index + 11, 8, 88)
    const size = range(index + 21, 1.6, 4.2)
    const floatDuration = range(index + 31, 16, 36)
    const floatDelay = -range(index + 41, 0, 24)
    const breatheDuration = range(index + 51, 3.4, 8.4)
    const breatheDelay = -range(index + 61, 0, 10)
    const opacity = range(index + 71, 0.28, 0.92)

    return {
      id: index,
      path,
      orbitStyle: {
        left: `${left}%`,
        top: `${top}%`,
        '--background-stardust-float-duration': `${floatDuration}s`,
        '--background-stardust-float-delay': `${floatDelay}s`
      },
      coreStyle: {
        width: `${size}px`,
        height: `${size}px`,
        opacity: opacity.toFixed(2),
        '--background-stardust-breathe-duration': `${breatheDuration}s`,
        '--background-stardust-breathe-delay': `${breatheDelay}s`
      }
    }
  })
}

function createStaticStars(): StaticStar[] {
  return Array.from({ length: staticStarCount }, (_, index) => {
    const size = range(index + 101, 1, 2.7)
    const opacity = range(index + 111, 0.18, 0.68)

    return {
      id: index,
      style: {
        left: `${range(index + 121, 2, 98)}%`,
        top: `${range(index + 131, 3, 82)}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: opacity.toFixed(2),
        '--background-static-star-duration': `${range(index + 141, 3.5, 8.5)}s`,
        '--background-static-star-delay': `${-range(index + 151, 0, 8)}s`
      }
    }
  })
}

const backgroundEffects: Record<BackgroundMode, WeatherEffectConfig> = {
  light: {
    mode: 'light',
    type: 'clear-gradient',
    staticStars: [],
    particles: []
  },
  dark: {
    mode: 'dark',
    type: 'night-stardust',
    staticStars: createStaticStars(),
    particles: createNightStardust()
  }
}

const activeDarkEffect = backgroundEffects.dark
</script>
