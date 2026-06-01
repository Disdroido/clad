<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFileDialog, useObjectUrl } from '@vueuse/core'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Upload — Clad'
})

interface AnalysisResult {
  clothingType: string
  clothingSubType: string | null
  colour: string
  pattern: string
  material: string
  formalityLevel: string
  season: string
  confidence: number
}

interface UploadItem {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
  imageUrl?: string
  result?: AnalysisResult
  saved?: boolean
  error?: string
}

function fetchErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { data?: { message?: string }; statusMessage?: string; message?: string }
    return e.data?.message || e.statusMessage || e.message || 'Upload failed'
  }
  return 'Upload failed'
}

function statusLabel(item: UploadItem): string {
  switch (item.status) {
    case 'pending':
      return 'Ready to analyze'
    case 'uploading':
      return 'Uploading...'
    case 'analyzing':
      return 'AI is analyzing...'
    case 'done':
      if (item.saved) return 'Saved to wardrobe'
      if (item.result) {
        const sub = item.result.clothingSubType ? ` ${item.result.clothingSubType}` : ''
        return `${item.result.clothingType}${sub} — ${item.result.colour} (${Math.round(item.result.confidence * 100)}% confident)`
      }
      return 'Analysis complete'
    case 'error':
      return item.error || 'Upload failed'
    default:
      return ''
  }
}

const { files, open, reset } = useFileDialog({
  accept: 'image/*',
  multiple: true,
  capture: 'environment', // Prefer rear camera on mobile
})

const uploadItems = ref<UploadItem[]>([])
const processing = ref(false)

// Trigger file picker on mount for mobile camera
function handleCapture() {
  open()
}

async function onFilesSelected() {
  if (!files.value) return

  uploadItems.value = Array.from(files.value).map(file => ({
    file,
    preview: useObjectUrl(file).value || '',
    status: 'pending' as const,
  }))
}

const hasPendingItems = computed(() =>
  uploadItems.value.some(item => item.status === 'pending' || item.status === 'error'),
)

const canSaveToWardrobe = computed(() =>
  uploadItems.value.some(item => item.status === 'done' && !item.saved && item.result && item.imageUrl),
)

async function analyzeItems() {
  processing.value = true

  for (const item of uploadItems.value) {
    if (item.status !== 'pending' && item.status !== 'error') continue

    item.status = 'uploading'
    item.error = undefined
    item.saved = false

    try {
      const formData = new FormData()
      formData.append('file', item.file)

      const uploadRes = await $fetch<{ imageUrl: string }>('/api/wardrobe/upload-image', {
        method: 'POST',
        body: formData,
      })

      item.imageUrl = uploadRes.imageUrl
      item.status = 'analyzing'

      const analyzeRes = await $fetch<AnalysisResult>('/api/wardrobe/analyze', {
        method: 'POST',
        body: { imageUrl: uploadRes.imageUrl },
      })

      item.result = analyzeRes
      item.status = 'done'
    } catch (err) {
      item.status = 'error'
      item.error = fetchErrorMessage(err)
    }
  }

  processing.value = false
}

async function saveToWardrobe() {
  processing.value = true

  for (const item of uploadItems.value) {
    if (item.status !== 'done' || item.saved || !item.result || !item.imageUrl) continue

    try {
      await $fetch('/api/wardrobe/upload', {
        method: 'POST',
        body: {
          imageUrl: item.imageUrl,
          clothingType: item.result.clothingType,
          clothingSubType: item.result.clothingSubType,
          colour: item.result.colour,
          pattern: item.result.pattern,
          material: item.result.material,
          formalityLevel: item.result.formalityLevel,
          season: item.result.season,
          aiConfidence: item.result.confidence,
        },
      })
      item.saved = true
    } catch (err) {
      item.status = 'error'
      item.error = fetchErrorMessage(err)
    }
  }

  processing.value = false
}

async function handlePrimaryAction() {
  if (canSaveToWardrobe.value) {
    await saveToWardrobe()
    return
  }
  await analyzeItems()
}

function removeItem(index: number) {
  uploadItems.value.splice(index, 1)
}

watch(files, onFilesSelected)
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-brand-950 mb-6">Add Clothing</h1>

    <!-- Upload area -->
    <div v-if="uploadItems.length === 0">
      <button
        @click="handleCapture"
        class="w-full rounded-lg border-2 border-dashed border-brand-300 py-20 text-center hover:border-brand-400 hover:bg-brand-50 transition"
      >
        <div class="text-4xl mb-2">📸</div>
        <p class="text-brand-700 font-medium">Tap to take a photo</p>
        <p class="text-sm text-brand-400 mt-1">or select from gallery</p>
      </button>
    </div>

    <!-- Preview & results -->
    <div v-else class="space-y-4">
      <div
        v-for="(item, index) in uploadItems"
        :key="index"
        class="rounded-lg bg-white p-4 shadow"
      >
        <div class="flex gap-4">
          <img
            :src="item.preview"
            class="h-24 w-24 rounded-lg object-cover"
            alt="Preview"
          />
          <div class="flex-1 min-w-0">
            <p class="truncate font-medium">{{ item.file.name }}</p>
            <p class="break-words text-sm" :class="{
              'text-brand-500': item.status === 'pending',
              'text-yellow-600': item.status === 'uploading' || item.status === 'analyzing',
              'text-green-600': item.status === 'done' && item.saved,
              'text-brand-700': item.status === 'done' && !item.saved,
              'text-red-600': item.status === 'error',
            }">
              {{ statusLabel(item) }}
            </p>
          </div>
          <button
            @click="removeItem(index)"
            class="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        <!-- Editable labels when done -->
        <div v-if="item.status === 'done' && item.result" class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-brand-600">Type</label>
            <select v-model="item.result.clothingType" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm">
              <option value="t-shirt">T-Shirt</option>
              <option value="shirt">Shirt</option>
              <option value="blouse">Blouse</option>
              <option value="sweater">Sweater</option>
              <option value="hoodie">Hoodie</option>
              <option value="jacket">Jacket</option>
              <option value="coat">Coat</option>
              <option value="jeans">Jeans</option>
              <option value="trousers">Trousers</option>
              <option value="shorts">Shorts</option>
              <option value="skirt">Skirt</option>
              <option value="dress">Dress</option>
              <option value="shoes">Shoes</option>
              <option value="accessory">Accessory</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Colour</label>
            <input v-model="item.result.colour" type="text" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Pattern</label>
            <select v-model="item.result.pattern" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm">
              <option value="solid">Solid</option>
              <option value="striped">Striped</option>
              <option value="checked">Checked</option>
              <option value="floral">Floral</option>
              <option value="graphic">Graphic</option>
              <option value="abstract">Abstract</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Material</label>
            <input v-model="item.result.material" type="text" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Sub-Type</label>
            <input v-model="item.result.clothingSubType" type="text" placeholder="e.g. henley, polo, bomber" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          @click="handleCapture"
          class="flex-1 rounded-lg border border-brand-300 py-3 text-brand-700 hover:bg-brand-100 transition"
        >
          + Add More
        </button>
        <button
          @click="handlePrimaryAction"
          :disabled="processing || (!hasPendingItems && !canSaveToWardrobe)"
          class="flex-1 rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{
            processing
              ? 'Processing...'
              : canSaveToWardrobe
                ? 'Save to Wardrobe'
                : hasPendingItems
                  ? 'Analyze Photos'
                  : 'Saved'
          }}
        </button>
      </div>
    </div>
  </div>
</template>
