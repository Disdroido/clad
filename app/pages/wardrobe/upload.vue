<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const router = useRouter()
const wardrobeStore = useWardrobeStore()
const insightsStore = useInsightsStore()

definePageMeta({ layout: 'default' })
useHead({ title: 'Upload — Clad' })

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
  id: number
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
  imageUrl?: string
  result?: AnalysisResult
  saved?: boolean
  error?: string
  retries?: number
}

function fetchErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { data?: { message?: string }; statusMessage?: string; message?: string }
    return e.data?.message || e.statusMessage || e.message || 'Upload failed'
  }
  return 'Upload failed'
}

async function compressImage(file: File, maxDimension = 1024, quality = 0.8): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })

  let { width, height } = img
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(img.src)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality)
  })
}

function statusLabel(item: UploadItem): string {
  switch (item.status) {
    case 'pending': return 'Ready to analyze'
    case 'uploading': return 'Uploading...'
    case 'analyzing': return 'AI is analyzing...'
    case 'done':
      if (item.saved) return 'Saved to wardrobe'
      if (item.result) {
        const sub = item.result.clothingSubType ? ` ${item.result.clothingSubType}` : ''
        return `${item.result.clothingType}${sub} — ${item.result.colour} (${Math.round(item.result.confidence * 100)}% confident)`
      }
      return 'Analysis complete'
    case 'error': return item.error || 'Upload failed'
    default: return ''
  }
}

const uploadItems = ref<UploadItem[]>([])
const processing = ref(false)
const progressLabel = ref('')
const uploadKey = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

let idCounter = 0

function triggerCapture() {
  fileInput.value?.click()
}

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  const newFiles = Array.from(files).filter(f => f.size > 0)

  if (newFiles.length === 0) return

  // Clear input so re-selecting the same file works
  if (fileInput.value) fileInput.value.value = ''

  const items: UploadItem[] = []
  for (const file of newFiles) {
    try {
      const compressed = await compressImage(file)
      items.push({
        id: ++idCounter,
        file: new File([compressed], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }),
        preview: URL.createObjectURL(compressed),
        status: 'pending' as const,
      })
    } catch {
      items.push({
        id: ++idCounter,
        file: file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      })
    }
  }

  uploadItems.value = [...uploadItems.value, ...items]
  uploadKey.value++

  // Force DOM update on mobile — double nextTick + rAF
  await nextTick()
  await nextTick()
  await new Promise(r => requestAnimationFrame(r))

  // Small delay to let mobile browser finish camera write + blob URL resolve
  await new Promise(r => setTimeout(r, 300))

  // Auto-analyze
  analyzeItems()
}

const hasPendingItems = computed(() =>
  uploadItems.value.some(item => item.status === 'pending' || item.status === 'error'),
)

const canSaveToWardrobe = computed(() =>
  uploadItems.value.some(item => item.status === 'done' && !item.saved && item.result && item.imageUrl),
)

const doneCount = computed(() => uploadItems.value.filter(i => i.status === 'done').length)

async function analyzeItems() {
  if (processing.value) return
  processing.value = true

  const pending = uploadItems.value.filter(i => i.status === 'pending' || i.status === 'error')
  if (pending.length === 0) {
    processing.value = false
    return
  }

  const total = pending.length
  const BATCH_SIZE = 2

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE)
    const doneSoFar = uploadItems.value.filter(i => i.status === 'done').length
    const batchStart = doneSoFar + (i > 0 ? batch[0] && batch === pending.slice(i) ? i : i) : doneSoFar

    await Promise.all(batch.map(async (item) => {
      if (item.status !== 'pending' && item.status !== 'error') return

      item.status = 'uploading'
      item.error = undefined
      item.saved = false
      item.retries = (item.retries || 0) + 1

      try {
        const idx = uploadItems.value.indexOf(item)
        progressLabel.value = `Uploading ${idx + 1}/${uploadItems.value.length}...`

        const formData = new FormData()
        formData.append('file', item.file, item.file.name)

        const uploadRes = await $fetch<{ imageUrl: string }>('/api/wardrobe/upload-image', {
          method: 'POST',
          body: formData,
        })

        item.imageUrl = uploadRes.imageUrl
        item.status = 'analyzing'
        progressLabel.value = `Analyzing ${idx + 1}/${uploadItems.value.length}...`

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
    }))
  }

  progressLabel.value = ''
  processing.value = false
}

async function retryItem(item: UploadItem) {
  item.status = 'pending'
  item.error = undefined
  item.retries = 0
  await analyzeItems()
}

async function saveToWardrobe() {
  processing.value = true

  const toSave = uploadItems.value.filter(i => i.status === 'done' && !i.saved && i.result && i.imageUrl)

  for (const item of toSave) {
    try {
      await $fetch('/api/wardrobe/upload', {
        method: 'POST',
        body: {
          imageUrl: item.imageUrl,
          clothingType: item.result!.clothingType,
          clothingSubType: item.result!.clothingSubType,
          colour: item.result!.colour,
          pattern: item.result!.pattern,
          material: item.result!.material,
          formalityLevel: item.result!.formalityLevel,
          season: item.result!.season,
          aiConfidence: item.result!.confidence,
        },
      })
      item.saved = true
    } catch (err) {
      item.status = 'error'
      item.error = fetchErrorMessage(err)
    }
  }

  processing.value = false
  wardrobeStore.invalidate()
  insightsStore.invalidate()
  router.push('/wardrobe')
}

function removeItem(id: number) {
  const idx = uploadItems.value.findIndex(i => i.id === id)
  if (idx === -1) return
  const item = uploadItems.value[idx]
  if (item?.preview) URL.revokeObjectURL(item.preview)
  uploadItems.value.splice(idx, 1)
  uploadKey.value++
}

onUnmounted(() => {
  for (const item of uploadItems.value) {
    if (item.preview) URL.revokeObjectURL(item.preview)
  }
})
</script>

<template>
  <div>
    <!-- Hidden native file input — more reliable than useFileDialog on mobile -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      capture="environment"
      class="hidden"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    />

    <h1 class="text-2xl font-bold text-brand-950 mb-6">Add Clothing</h1>

    <!-- Upload area -->
    <div v-if="uploadItems.length === 0">
      <button
        @click="triggerCapture"
        class="w-full rounded-lg border-2 border-dashed border-brand-300 py-20 text-center hover:border-brand-400 hover:bg-brand-50 transition active:bg-brand-100"
      >
        <div class="text-4xl mb-2">📸</div>
        <p class="text-brand-700 font-medium">Tap to take a photo</p>
        <p class="text-sm text-brand-400 mt-1">or select from gallery</p>
      </button>
    </div>

    <!-- Progress bar -->
    <div
      v-if="processing"
      class="mb-4 rounded-lg bg-brand-50 px-4 py-2 flex items-center gap-3"
    >
      <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 shrink-0" />
      <span class="text-sm text-brand-700">{{ progressLabel || 'Processing...' }}</span>
    </div>

    <!-- Preview & results -->
    <div v-if="uploadItems.length > 0" class="space-y-4">
      <div
        v-for="item in uploadItems"
        :key="item.id"
        class="rounded-lg bg-white p-4 shadow-sm border border-brand-100"
      >
        <div class="flex gap-4">
          <img
            :src="item.preview"
            class="h-24 w-24 rounded-lg object-cover shrink-0 bg-brand-50"
            alt="Preview"
          />
          <div class="flex-1 min-w-0">
            <p class="truncate font-medium text-brand-900">{{ item.file.name }}</p>
            <p class="break-words text-sm mt-0.5" :class="{
              'text-brand-400': item.status === 'pending',
              'text-yellow-600': item.status === 'uploading',
              'text-blue-600': item.status === 'analyzing',
              'text-green-600': item.status === 'done' && item.saved,
              'text-brand-700': item.status === 'done' && !item.saved,
              'text-red-600': item.status === 'error',
            }">
              {{ statusLabel(item) }}
            </p>
          </div>
          <button
            @click="removeItem(item.id)"
            class="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-brand-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Error with retry -->
        <div v-if="item.status === 'error'" class="mt-3 flex items-center gap-2">
          <button
            @click="retryItem(item)"
            class="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
          >
            Retry
          </button>
          <span class="text-xs text-red-500">{{ item.error }}</span>
        </div>

        <!-- Analysis results form -->
        <div v-if="item.status === 'done' && item.result" class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-brand-600">Type</label>
            <select v-model="item.result.clothingType" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200">
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
            <input v-model="item.result.colour" type="text" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200" />
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Pattern</label>
            <select v-model="item.result.pattern" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200">
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
            <input v-model="item.result.material" type="text" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200" />
          </div>
          <div>
            <label class="block text-xs font-medium text-brand-600">Sub-Type</label>
            <input v-model="item.result.clothingSubType" type="text" placeholder="e.g. henley, polo, bomber" class="mt-1 w-full rounded border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200" />
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          @click="triggerCapture"
          :disabled="processing"
          class="flex-1 rounded-lg border border-brand-300 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50 transition disabled:opacity-50"
        >
          + Add More
        </button>
        <button
          v-if="canSaveToWardrobe"
          @click="saveToWardrobe"
          :disabled="processing"
          class="flex-1 rounded-lg bg-brand-600 py-3 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ processing ? 'Saving...' : 'Save to Wardrobe' }}
        </button>
      </div>
    </div>
  </div>
</template>
