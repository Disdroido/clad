<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const outfit = ref<any>(null)
const loading = ref(true)
const archiving = ref(false)
const wearing = ref(false)
const wearSuccess = ref(false)
const userRating = ref<number>(0)
const savingRating = ref(false)

// Share state
const sharing = ref(false)
const shareUrl = ref('')
const shareCopied = ref(false)

// Schedule state
const scheduledOutfit = ref<any>(null)
const showScheduleModal = ref(false)
const schedulingDate = ref('')
const schedulingNotes = ref('')
const scheduleSaving = ref(false)
const scheduleError = ref('')

definePageMeta({ layout: 'default' })
useHead({ title: 'Outfit — Clad' })

async function fetchOutfit() {
  loading.value = true
  try {
    outfit.value = await $fetch(`/api/outfits/${route.params.id}`)
    userRating.value = outfit.value?.rating || 0
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to load outfit'
    alert(msg)
    router.push('/outfits')
  } finally {
    loading.value = false
  }
}

async function archiveOutfit() {
  if (!confirm('Archive this outfit? You can restore it from Settings.')) return
  archiving.value = true
  try {
    await $fetch(`/api/outfits/${route.params.id}/archive`, {
      method: 'PATCH',
      body: { isArchived: true },
    })
    router.push('/outfits')
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Failed to archive outfit'
    alert(msg)
  } finally {
    archiving.value = false
  }
}

async function logWear() {
  wearing.value = true
  wearSuccess.value = false
  try {
    await $fetch('/api/outfits/' + outfit.value.id + '/wear', { method: 'POST' })
    wearSuccess.value = true
    setTimeout(() => { wearSuccess.value = false }, 2000)
    await fetchOutfit() // refresh to get updated wearCount
  } catch { /* ignore */ }
  finally { wearing.value = false }
}

async function setRating(rating: number) {
  savingRating.value = true
  userRating.value = rating // optimistic
  try {
    await $fetch('/api/outfits/' + outfit.value.id + '/rating', {
      method: 'PATCH',
      body: { rating }
    })
  } catch {
    userRating.value = outfit.value?.rating || 0 // revert
  }
  finally { savingRating.value = false }
}

async function checkExistingSchedule() {
  try {
    const data: any = await $fetch('/api/calendar', {
      params: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    })
    // Find if this outfit is scheduled
    for (const day of data.dates || []) {
      const match = day.outfits.find((o: any) => o.outfitId === route.params.id)
      if (match) {
        scheduledOutfit.value = match
        break
      }
    }
  } catch { /* ignore */ }
}

async function scheduleFromDetail() {
  if (!schedulingDate.value) return
  scheduleSaving.value = true
  scheduleError.value = ''
  try {
    const result: any = await $fetch('/api/calendar', {
      method: 'POST',
      body: {
        outfitId: route.params.id,
        scheduledDate: schedulingDate.value,
        notes: schedulingNotes.value || null,
      },
    })
    scheduledOutfit.value = result
    showScheduleModal.value = false
  } catch (err: any) {
    scheduleError.value = err?.data?.message || 'Couldn\'t schedule outfit. Please try again.'
  } finally {
    scheduleSaving.value = false
  }
}

async function shareOutfit() {
  sharing.value = true
  shareCopied.value = false
  try {
    const result: any = await $fetch('/api/share', {
      method: 'POST',
      body: { outfitId: route.params.id },
    })
    shareUrl.value = result.shareUrl
    await navigator.clipboard.writeText(result.shareUrl)
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 2000)
  } catch (err: any) {
    alert(err?.data?.message || 'Failed to share outfit')
  } finally {
    sharing.value = false
  }
}

onMounted(() => {
  fetchOutfit()
  checkExistingSchedule()
})
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <NuxtLink to="/outfits" class="text-sm text-brand-400 hover:text-brand-600">&larr; All Outfits</NuxtLink>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <span class="inline-block mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <div v-else-if="outfit" class="rounded-xl bg-white p-6 shadow-lg md:p-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-brand-900">Your Outfit</h2>
        <span class="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700 capitalize">
          {{ outfit.occasion }}
        </span>
      </div>

      <p class="text-brand-600 italic mb-6">{{ outfit.explanation }}</p>

      <div class="flex gap-4 text-sm text-brand-500 mb-4">
        <span v-if="outfit.wearCount > 0">
          👗 Worn {{ outfit.wearCount }} time{{ outfit.wearCount === 1 ? '' : 's' }}
        </span>
        <span v-if="outfit.lastWornAt">
          Last worn {{ new Date(outfit.lastWornAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
        </span>
        <span v-else-if="outfit.wearCount === 0 || outfit.wearCount === undefined">
          Not worn yet
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div
          v-for="item in outfit.items"
          :key="item.id"
          class="overflow-hidden rounded-lg border border-brand-100"
        >
          <img :src="item.imageUrl" :alt="item.clothingType" class="aspect-square w-full object-cover" />
          <div class="p-2 text-center">
            <p class="text-sm font-medium text-brand-900 capitalize">{{ item.clothingType }}</p>
            <p class="text-xs text-brand-500">{{ item.colour }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mb-4">
        <button
          @click="logWear"
          :disabled="wearing"
          class="flex-1 rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ wearing ? 'Logging...' : wearSuccess ? '✅ Logged!' : '👕 Log as Worn Today' }}
        </button>
      </div>

      <div class="mb-6">
        <p class="text-sm font-medium text-brand-700 mb-2">Rate this outfit</p>
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            @click="setRating(star)"
            :disabled="savingRating"
            class="text-2xl transition hover:scale-110 disabled:opacity-50"
          >
            {{ (userRating >= star) ? '⭐' : '☆' }}
          </button>
        </div>
      </div>

      <!-- Schedule section -->
      <div class="mb-4">
        <!-- Scheduled badge -->
        <div v-if="scheduledOutfit"
             class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700">
          📅 Scheduled for {{ new Date(scheduledOutfit.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
        </div>

        <button @click="showScheduleModal = true"
                class="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition">
          📅 {{ scheduledOutfit ? 'Reschedule' : 'Schedule Outfit' }}
        </button>
      </div>

      <!-- Schedule modal -->
      <Teleport to="body">
        <div v-if="showScheduleModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
             @click.self="showScheduleModal = false">
          <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h2 class="mb-4 text-lg font-semibold text-brand-900">Schedule Outfit</h2>

            <div class="mb-4">
              <label class="mb-1 block text-sm font-medium text-brand-700">Date</label>
              <input type="date" v-model="schedulingDate"
                     class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>

            <div class="mb-4">
              <label class="mb-1 block text-sm font-medium text-brand-700">Notes (optional)</label>
              <textarea v-model="schedulingNotes" placeholder="Any notes for this day?"
                        class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                        rows="2" />
            </div>

            <p v-if="scheduleError" class="mb-3 text-sm text-red-600">{{ scheduleError }}</p>

            <div class="flex gap-3">
              <button @click="showScheduleModal = false"
                      class="flex-1 rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition">
                Cancel
              </button>
              <button @click="scheduleFromDetail" :disabled="!schedulingDate || scheduleSaving"
                      class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50">
                {{ scheduleSaving ? 'Scheduling...' : '📅 Schedule' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Share button -->
      <div class="mb-4 mt-6">
        <button
          @click="shareOutfit"
          :disabled="sharing"
          class="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {{ sharing ? 'Sharing...' : shareCopied ? '✅ Link Copied!' : '🔗 Share Outfit' }}
        </button>
      </div>

      <button
        @click="archiveOutfit"
        :disabled="archiving"
        class="w-full rounded-lg border border-red-200 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition disabled:opacity-50"
      >
        {{ archiving ? 'Archiving...' : 'Archive Outfit' }}
      </button>
    </div>
  </div>
</template>
