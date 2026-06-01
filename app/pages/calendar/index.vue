<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Calendar — Clad' })

const calendarStore = useCalendarStore()

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
const currentMonthLabel = ref('')

async function fetchMonth(month: number, year: number) {
  loading.value = true
  error.value = false
  currentMonthLabel.value = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  try {
    const dates = await calendarStore.fetchCalendar(month, year)
    scheduledDates.value = dates
  } catch {
    error.value = true
    scheduledDates.value = []
  } finally {
    loading.value = false
  }
}

function onDateClick(date: Date) {
  selectedDate.value = date
  const dateKey = date.toISOString().split('T')[0]
  const day = scheduledDates.value.find(d => d.date === dateKey)
  selectedDayOutfits.value = day?.outfits || []
}

function onMonthChange(month: number, year: number) {
  selectedDate.value = null
  fetchMonth(month, year)
}

function openScheduleModal(dateKey?: string) {
  scheduleModalDate.value = dateKey || ''
  showScheduleModal.value = true
}

function onScheduled() {
  const now = selectedDate.value || new Date()
  calendarStore.invalidate()
  fetchMonth(now.getMonth() + 1, now.getFullYear())
  if (selectedDate.value) {
    onDateClick(selectedDate.value)
  }
}

async function removeScheduledOutfit(id: string) {
  try {
    await $fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    if (selectedDate.value) {
      const dateKey = selectedDate.value.toISOString().split('T')[0]
      selectedDayOutfits.value = selectedDayOutfits.value.filter(o => o.id !== id)
      const dayIdx = scheduledDates.value.findIndex(d => d.date === dateKey)
      if (dayIdx >= 0) {
        scheduledDates.value[dayIdx].outfits = scheduledDates.value[dayIdx].outfits.filter(o => o.id !== id)
        scheduledDates.value[dayIdx].count = scheduledDates.value[dayIdx].outfits.length
      }
    }
    calendarStore.invalidate()
  } catch {
    alert('Could not remove scheduled outfit.')
  }
}

onMounted(() => {
  const now = new Date()
  fetchMonth(now.getMonth() + 1, now.getFullYear())
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand-950">Calendar</h1>
      <button @click="openScheduleModal()"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition">
        + Schedule
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading && scheduledDates.length === 0" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p class="mb-3 text-red-700">Couldn't load your schedule. Please try again.</p>
      <button @click="fetchMonth(new Date().getMonth() + 1, new Date().getFullYear())"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition">
        Retry
      </button>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-6 lg:flex-row">
      <!-- Left: Calendar + detail -->
      <div class="flex-1 min-w-0">
        <!-- Calendar card -->
        <div class="overflow-hidden rounded-xl bg-white border border-brand-100 shadow-sm">
          <CalendarGrid
            :scheduled-dates="scheduledDates"
            :loading="loading"
            @date-click="onDateClick"
            @month-change="onMonthChange"
          />
        </div>

        <!-- Detail panel -->
        <DetailPanel
          v-if="selectedDate"
          :date="selectedDate"
          :outfits="selectedDayOutfits"
          class="mt-4"
          @schedule="openScheduleModal"
          @remove="removeScheduledOutfit"
        />
      </div>

      <!-- Right: Trip sidebar (desktop) -->
      <div class="w-full lg:w-64 shrink-0">
        <TripSidebar @schedule="openScheduleModal" />
      </div>
    </div>

    <ScheduleModal
      :show="showScheduleModal"
      :selected-date="scheduleModalDate"
      @close="showScheduleModal = false"
      @scheduled="onScheduled"
    />
  </div>
</template>
