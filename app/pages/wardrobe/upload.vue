<script setup lang="ts">
import { ref } from 'vue'

const router = useRouter()
const wardrobeStore = useWardrobeStore()
const insightsStore = useInsightsStore()
const pendingUploads = usePendingUploads()

definePageMeta({ layout: 'default' })
useHead({ title: 'Upload — Clad' })

const fileInput = ref<HTMLInputElement | null>(null)

function triggerCapture() {
  fileInput.value?.click()
}

async function processFile(file: File) {
  try {
    const formData = new FormData()
    formData.append('file', file, file.name)
    const uploadRes = await fetch('/api/wardrobe/upload-image', {
      method: 'POST',
      body: formData,
    }).then(r => r.json())

    const analyzeRes = await fetch('/api/wardrobe/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: uploadRes.imageUrl }),
    }).then(r => r.json())

    await fetch('/api/wardrobe/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: uploadRes.imageUrl,
        clothingType: analyzeRes.clothingType || 'other',
        clothingSubType: analyzeRes.clothingSubType || null,
        colour: analyzeRes.colour || 'unknown',
        pattern: analyzeRes.pattern || 'solid',
        material: analyzeRes.material || 'unknown',
        formalityLevel: analyzeRes.formalityLevel || 'casual',
        season: analyzeRes.season || 'all_season',
        aiConfidence: analyzeRes.confidence || 0.5,
      }),
    })
  } catch {
    // Item can be re-added later
  }

  // Remove one pending placeholder — real item appears after re-fetch
  const pending = pendingUploads.items.value[0]
  if (pending) pendingUploads.remove(pending.id)

  // Force wardrobe refresh so the new item appears immediately
  await wardrobeStore.fetchItems(true)
}

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return
  const validFiles = Array.from(files).filter(f => f.size > 0)
  if (validFiles.length === 0) return

  if (fileInput.value) fileInput.value.value = ''

  // Add pending placeholders
  pendingUploads.add(validFiles.length)

  // Navigate immediately — processing continues in background
  router.push('/wardrobe')

  // Process all files in background
  for (const file of validFiles) {
    await processFile(file)
  }
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

    <button
      @click="triggerCapture"
      class="w-full rounded-lg border-2 border-dashed border-brand-300 py-20 text-center hover:border-brand-400 hover:bg-brand-50 transition active:bg-brand-100"
    >
      <div class="text-4xl mb-2">📸</div>
      <p class="text-brand-700 font-medium">Tap to take a photo</p>
      <p class="text-sm text-brand-400 mt-1">or select from gallery</p>
    </button>
  </div>
</template>
