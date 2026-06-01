<script setup lang="ts">
interface CalendarDayData {
  date: string
  count: number
  outfits: any[]
}

const props = defineProps<{
  scheduledDates: CalendarDayData[]
  loading?: boolean
}>()

const emit = defineEmits<{
  dateClick: [date: Date]
  monthChange: [month: number, year: number]
}>()

// Build v-calendar attributes array for dot indicators
const calendarAttrs = computed(() =>
  props.scheduledDates.map(s => ({
    key: s.date,
    dot: { color: 'brand' },
    dates: new Date(s.date + 'T00:00:00'),
    customData: { count: s.count },
  }))
)

function onDayClick(day: any) {
  if (day?.date) {
    emit('dateClick', day.date)
  }
}

function onDidMove(pages: any[]) {
  if (pages?.length > 0) {
    emit('monthChange', pages[0].month, pages[0].year)
  }
}
</script>

<template>
  <div class="calendar-grid-wrapper">
    <VCalendar
      :attributes="calendarAttrs"
      :initial-page="{
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }"
      color="brand"
      borderless
      transparent
      :disabled="loading"
      @dayclick="onDayClick"
      @did-move="onDidMove"
    />
  </div>
</template>

<style scoped>
.calendar-grid-wrapper :deep(.vc-brand) {
  --vc-accent-50: #faf5f0;
  --vc-accent-100: #f0e6d8;
  --vc-accent-200: #e0ccb1;
  --vc-accent-300: #cba87a;
  --vc-accent-400: #b88a52;
  --vc-accent-500: #a6743a;
  --vc-accent-600: #8f5d2f;
  --vc-accent-700: #744727;
  --vc-accent-800: #603a25;
  --vc-accent-900: #523223;
}

.calendar-grid-wrapper :deep(.vc-day) {
  min-height: 40px;
}
</style>
