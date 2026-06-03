<script setup lang="ts">
import { ref, nextTick } from 'vue'

const router = useRouter()
const wardrobeStore = useWardrobeStore()
const insightsStore = useInsightsStore()

definePageMeta({ layout: 'default' })
useHead({ title: 'Upload — Clad' })

const uploading = ref(false)
const statusLabel = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function triggerCapture() {
  fileInput.value?.click()
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

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  const validFiles = Array.from(files).filter(f => f.size > 0)
  if (validFiles.length === 0) return

  // Clear input
  if (fileInput.value) fileInput.value.value = ''

  uploading.value = true

  for (const file of validFiles) {
    try {
      statusLabel.value = 'Compressing...'
      const compressed = await compressImage(file)
      const jpegFile = new File([compressed], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })

      statusLabel.value = 'Uploading...'
      const formData = new FormData()
      formData.append('file', jpegFile, jpegFile.name)
      const uploadRes = await $fetch<{ imageUrl: string }>('/api/wardrobe/upload-image', {
        method: 'POST',
        body: formData,
      })

      statusLabel.value = 'Analyzing...'
      const analyzeRes = await $fetch('/api/wardrobe/analyze', {
        method: 'POST',
        body: { imageUrl: uploadRes.imageUrl },
      })

      statusLabel.value = 'Saving...'
      await $fetch('/api/wardrobe/upload', {
        method: 'POST',
        body: {
          imageUrl: uploadRes.imageUrl,
          clothingType: (analyzeRes as any).clothingType || 'other',
          clothingSubType: (analyzeRes as any).clothingSubType || null,
          colour: (analyzeRes as any).colour || 'unknown',
          pattern: (analyzeRes as any).pattern || 'solid',
          material: (analyzeRes as any).material || 'unknown',
          formalityLevel: (analyzeRes as any).formalityLevel || 'casual',
          season: (analyzeRes as any).season || 'all_season',
          aiConfidence: (analyzeRes as any).confidence || 0.5,
        },
      })
    } catch {
      // Silently continue — user can edit the item later from wardrobe
    }
  }

  uploading.value = false
  wardrobeStore.invalidate()
  insightsStore.invalidate()
  router.push('/wardrobe')
}
</script>

<template>
  <div>
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

    <!-- Uploading state -->
    <div v-if="uploading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p class="text-brand-700 font-medium">{{ statusLabel || 'Processing...' }}</p>
      <p class="text-sm text-brand-400 mt-1">This will just take a moment</p>
    </div>

    <!-- Capture button -->
    <button
      v-else
      @click="triggerCapture"
      class="w-full rounded-lg border-2 border-dashed border-brand-300 py-20 text-center hover:border-brand-400 hover:bg-brand-50 transition active:bg-brand-100"
    >
      <div class="text-4xl mb-2">📸</div>
      <p class="text-brand-700 font-medium">Tap to take a photo</p>
      <p class="text-sm text-brand-400 mt-1">or select from gallery</p>
    </button>
  </div>
</template>
