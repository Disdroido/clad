<script setup lang="ts">
import { ref } from 'vue'
import { useFileDialog, useObjectUrl } from '@vueuse/core'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Upload — Clad'
})

interface UploadItem {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
  result?: {
    clothingType: string
    colour: string
    pattern: string
    material: string
    formalityLevel: string
    season: string
    confidence: number
  }
  error?: string
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

async function uploadAll() {
  processing.value = true

  for (const item of uploadItems.value) {
    item.status = 'uploading'
    try {
      // Step 1: Upload image to R2
      const formData = new FormData()
      formData.append('file', item.file)

      const uploadRes = await $fetch('/api/wardrobe/upload', {
        method: 'POST',
        body: formData,
      })

      // Step 2: Analyze with AI vision model
      item.status = 'analyzing'
      const analyzeRes = await $fetch('/api/wardrobe/analyze', {
        method: 'POST',
        body: {
          imageUrl: uploadRes.imageUrl,
        },
      })

      item.result = analyzeRes
      item.status = 'done'
    } catch (err: any) {
      item.status = 'error'
      item.error = err.message || 'Upload failed'
    }
  }

  processing.value = false
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
          <div class="flex-1">
            <p class="font-medium">{{ item.file.name }}</p>
            <p class="text-sm" :class="{
              'text-yellow-600': item.status === 'uploading' || item.status === 'analyzing',
              'text-green-600': item.status === 'done',
              'text-red-600': item.status === 'error',
            }">
              {{ item.status === 'uploading' && 'Uploading...' }}
              {{ item.status === 'analyzing' && 'AI is analyzing...' }}
              {{ item.status === 'done' && item.result && `${item.result.clothingType} — ${item.result.colour} (${Math.round(item.result.confidence * 100)}% confident)` }}
              {{ item.status === 'error' && item.error }}
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
          @click="uploadAll"
          :disabled="processing"
          class="flex-1 rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ processing ? 'Processing...' : 'Save to Wardrobe' }}
        </button>
      </div>
    </div>
  </div>
</template>
