<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Set Up Your Profile — Clad'
})

const step = ref(1)
const totalSteps = 4

// Step 1: Basics
const name = ref('')
const location = ref('')

// Step 2: Style
const styleVibes = ref<string[]>([])
const styleOptions = [
  { id: 'minimal', label: 'Minimal', icon: '◻️' },
  { id: 'classic', label: 'Classic', icon: '👔' },
  { id: 'streetwear', label: 'Streetwear', icon: '🧢' },
  { id: 'bohemian', label: 'Bohemian', icon: '🌸' },
  { id: 'sporty', label: 'Sporty', icon: '🏃' },
  { id: 'preppy', label: 'Preppy', icon: '🎀' },
  { id: 'edgy', label: 'Edgy', icon: '🖤' },
  { id: 'romantic', label: 'Romantic', icon: '🌹' },
]

const preferredColours = ref<string[]>([])
const colourSwatches = [
  'black', 'white', 'navy', 'grey', 'beige', 'cream',
  'brown', 'burgundy', 'red', 'pink', 'orange', 'yellow',
  'green', 'olive', 'blue', 'purple',
]
const dislikedColours = ref<string[]>([])

// Step 3: Body & Fit
const bodyType = ref('')
const bodyTypes = [
  { id: 'slim', label: 'Slim' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'average', label: 'Average' },
  { id: 'plus', label: 'Plus-size' },
  { id: 'tall', label: 'Tall' },
  { id: 'petite', label: 'Petite' },
]

// Step 4: Lifestyle
const climate = ref('')
const climates = [
  { id: 'tropical', label: 'Tropical' },
  { id: 'temperate', label: 'Temperate' },
  { id: 'cold', label: 'Cold' },
  { id: 'mixed', label: 'Mixed/Variable' },
]
const wardrobeGoal = ref('')
const goals = [
  "Help me dress better",
  "Save time getting dressed",
  "Use what I already own",
  "Build a capsule wardrobe",
]

const canProceed = computed(() => {
  if (step.value === 1) return name.value.trim().length > 0
  if (step.value === 2) return styleVibes.value.length > 0
  if (step.value === 3) return true // Optional step
  if (step.value === 4) return climate.value && wardrobeGoal.value
  return false
})

function toggleStyle(id: string) {
  const idx = styleVibes.value.indexOf(id)
  if (idx === -1) styleVibes.value.push(id)
  else styleVibes.value.splice(idx, 1)
}

function toggleColour(list: string[], colour: string) {
  const idx = list.indexOf(colour)
  if (idx === -1) list.push(colour)
  else list.splice(idx, 1)
}

async function next() {
  if (step.value < totalSteps) step.value++
}

async function finish() {
  // TODO: Save profile to API
  await navigateTo('/wardrobe')
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Progress -->
    <div class="mb-8">
      <div class="flex justify-between text-sm text-brand-500 mb-2">
        <span>Step {{ step }} of {{ totalSteps }}</span>
        <span>{{ Math.round((step / totalSteps) * 100) }}%</span>
      </div>
      <div class="h-2 rounded-full bg-brand-100">
        <div
          class="h-2 rounded-full bg-brand-600 transition-all"
          :style="{ width: `${(step / totalSteps) * 100}%` }"
        />
      </div>
    </div>

    <!-- Step 1: Basics -->
    <div v-if="step === 1" class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-brand-950">Welcome to Clad!</h2>
        <p class="text-brand-500 mt-1">Let's get to know you.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-brand-700 mb-1">What's your name?</label>
        <input
          v-model="name"
          type="text"
          placeholder="Your first name"
          class="w-full rounded-lg border border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
        />
      </div>
    </div>

    <!-- Step 2: Style -->
    <div v-if="step === 2" class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-brand-950">Your Style</h2>
        <p class="text-brand-500 mt-1">Pick all that vibe with you.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-brand-700 mb-2">Style vibes</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in styleOptions"
            :key="opt.id"
            @click="toggleStyle(opt.id)"
            :class="[
              'rounded-full border-2 px-4 py-2 text-sm transition',
              styleVibes.includes(opt.id)
                ? 'border-brand-600 bg-brand-50 text-brand-900'
                : 'border-brand-200 text-brand-600 hover:border-brand-300'
            ]"
          >
            {{ opt.icon }} {{ opt.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-brand-700 mb-2">Colours you love</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in colourSwatches"
            :key="c"
            @click="toggleColour(preferredColours, c)"
            :class="[
              'rounded-full border-2 px-3 py-1 text-xs capitalize transition',
              preferredColours.includes(c)
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-brand-200 text-brand-600 hover:border-brand-300'
            ]"
          >
            {{ c }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: Body & Fit -->
    <div v-if="step === 3" class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-brand-950">Body & Fit</h2>
        <p class="text-brand-500 mt-1">Optional — helps with fit suggestions.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-brand-700 mb-2">Body type</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="bt in bodyTypes"
            :key="bt.id"
            @click="bodyType = bt.id"
            :class="[
              'rounded-lg border-2 px-4 py-3 text-sm transition',
              bodyType === bt.id
                ? 'border-brand-600 bg-brand-50 text-brand-900'
                : 'border-brand-200 text-brand-600 hover:border-brand-300'
            ]"
          >
            {{ bt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 4: Lifestyle -->
    <div v-if="step === 4" class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-brand-950">Lifestyle</h2>
        <p class="text-brand-500 mt-1">Almost done!</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-brand-700 mb-2">Your climate</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="c in climates"
            :key="c.id"
            @click="climate = c.id"
            :class="[
              'rounded-lg border-2 px-4 py-3 text-sm transition',
              climate === c.id
                ? 'border-brand-600 bg-brand-50 text-brand-900'
                : 'border-brand-200 text-brand-600 hover:border-brand-300'
            ]"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-brand-700 mb-2">What do you want from Clad?</label>
        <div class="space-y-2">
          <button
            v-for="g in goals"
            :key="g"
            @click="wardrobeGoal = g"
            :class="[
              'w-full rounded-lg border-2 px-4 py-3 text-left text-sm transition',
              wardrobeGoal === g
                ? 'border-brand-600 bg-brand-50 text-brand-900'
                : 'border-brand-200 text-brand-600 hover:border-brand-300'
            ]"
          >
            {{ g }}
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="mt-8 flex gap-3">
      <button
        v-if="step > 1"
        @click="step--"
        class="flex-1 rounded-lg border border-brand-300 py-3 text-brand-700 hover:bg-brand-50 transition"
      >
        Back
      </button>
      <button
        v-if="step < totalSteps"
        @click="next"
        :disabled="!canProceed"
        class="flex-1 rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
      <button
        v-if="step === totalSteps"
        @click="finish"
        class="flex-1 rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 transition"
      >
        Start Using Clad →
      </button>
    </div>
  </div>
</template>
