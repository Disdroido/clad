<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Calendar — Clad' })

interface ScheduledOutfit {
  id: string
  outfitId: string
  outfitName: string
  outfitOccasion: string
  notes?: string
  items: Array<{ id: string; imageUrl: string; clothingType: string; colour: string }>
  scheduledDate: string
}

interface CalendarDay {
  date: string
  count: number
  outfits: ScheduledOutfit[]
}

const scheduledDates = ref<CalendarDay[]>([])
const loading = ref(true)
const error = ref(false)
const selectedDate = ref<Date | null>(null)
const selectedDayOutfits = ref<ScheduledOutfit[]>([])
const showScheduleModal = ref(false)
const scheduleModalDate = ref('')
const editingOutfit = ref<ScheduledOutfit | null>(null)

// Fetch calendar data for a given month/year
async function fetchMonth(month: number, year: number) {
  loading.value = true
  error.value = false
  try {
    const data: any = await $fetch('/api/calendar', {
      params: { month, year }
    })
    scheduledDates.value = data?.dates || []
  } catch {
    error.value = true
    scheduledDates.value = []
  } finally {
    loading.value = false
  }
}

// When a date is clicked
function onDateClick(date: Date) {
  selectedDate.value = date
  const dateKey = date.toISOString().split('T')[0]
  const day = scheduledDates.value.find(d => d.date === dateKey)
  selectedDayOutfits.value = day?.outfits || []
}

function onMonthChange(month: number, year: number) {
  fetchMonth(month, year)
}

function openScheduleModal(dateKey?: string) {
  scheduleModalDate.value = dateKey || ''
  editingOutfit.value = null
  showScheduleModal.value = true
}

function onScheduled() {
  // Refresh current month
  const now = selectedDate.value || new Date()
  fetchMonth(now.getMonth() + 1, now.getFullYear())
  // If a date was selected, refresh its outfits
  if (selectedDate.value) {
    onDateClick(selectedDate.value)
  }
}

async function removeScheduledOutfit(id: string) {
  try {
    await $fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    // Refresh
    if (selectedDate.value) {
      const dateKey = selectedDate.value.toISOString().split('T')[0]
      selectedDayOutfits.value = selectedDayOutfits.value.filter(o => o.id !== id)
      // Also remove from scheduledDates cache
      const dayIdx = scheduledDates.value.findIndex(d => d.date === dateKey)
      if (dayIdx >= 0) {
        scheduledDates.value[dayIdx].outfits = scheduledDates.value[dayIdx].outfits.filter(o => o.id !== id)
        scheduledDates.value[dayIdx].count = scheduledDates.value[dayIdx].outfits.length
      }
    }
  } catch {
    alert('Could not remove scheduled outfit.')
  }
}

// Load current month on mount
onMounted(() => {
  const now = new Date()
  fetchMonth(now.getMonth() + 1, now.getFullYear())
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand-950">Calendar</h1>
      <NuxtLink to="/outfits" class="rounded-lg border border-brand-300 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">
        ✨ + New Outfit
      </NuxtLink>
    </div>

    <!-- Loading state -->
    <div v-if="loading && scheduledDates.length === 0" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p class="mb-3 text-red-700">Couldn't load your schedule. Please try again.</p>
      <button @click="fetchMonth(new Date().getMonth() + 1, new Date().getFullYear())"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition">
        Retry
      </button>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-6 md:flex-row">
      <!-- Left column: Calendar grid + detail panel -->
      <div class="flex-1">
        <!-- Empty state -->
        <div v-if="!loading && scheduledDates.length === 0 && !selectedDate"
             class="mb-4 rounded-lg border-2 border-dashed border-brand-200 py-12 text-center">
          <p class="mb-2 text-lg font-medium text-brand-600">No outfits scheduled yet</p>
          <p class="mb-4 text-sm text-brand-400">Schedule an outfit or plan a trip to get started</p>
          <button @click="openScheduleModal()"
                  class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition">
            📅 Schedule Outfit
          </button>
        </div>

        <!-- Calendar grid -->
        <CalendarGrid
          :scheduled-dates="scheduledDates"
          :loading="loading"
          @date-click="onDateClick"
          @month-change="onMonthChange"
        />

        <!-- Detail panel (shown when date selected) -->
        <DetailPanel
          v-if="selectedDate"
          :date="selectedDate"
          :outfits="selectedDayOutfits"
          @schedule="openScheduleModal"
          @remove="removeScheduledOutfit"
        />
      </div>

      <!-- Right sidebar: Trip list (desktop) -->
      <div class="w-full md:w-72 shrink-0">
        <TripSidebar />
      </div>
    </div>

    <!-- Schedule modal -->
    <ScheduleModal
      :show="showScheduleModal"
      :selected-date="scheduleModalDate"
      @close="showScheduleModal = false"
      @scheduled="onScheduled"
    />
  </div>
</template>
