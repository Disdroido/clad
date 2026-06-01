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

const calendarAttrs = computed(() =>
  props.scheduledDates.map(s => ({
    key: s.date,
    dot: { color: 'accent', class: 'calendar-dot' },
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
  <div class="calendar-grid-wrapper p-4">
    <VCalendar
      :attributes="calendarAttrs"
      :initial-page="{
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }"
      color="accent"
      borderless
      transparent
      :disabled="loading"
      @dayclick="onDayClick"
      @did-move="onDidMove"
    />
  </div>
</template>

<style scoped>
.calendar-grid-wrapper :deep(.vc-accent) {
  --vc-accent-50: #f0f4ff;
  --vc-accent-100: #dbe4ff;
  --vc-accent-200: #bac8ff;
  --vc-accent-300: #91a7ff;
  --vc-accent-400: #748ffc;
  --vc-accent-500: #5c7cfa;
  --vc-accent-600: #4c6ef5;
  --vc-accent-700: #4263eb;
  --vc-accent-800: #3b5bdb;
  --vc-accent-900: #364fc7;
}

.calendar-grid-wrapper :deep(.vc-header) {
  padding-bottom: 12px;
}

.calendar-grid-wrapper :deep(.vc-title) {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--brand-950, #1a1a2e);
}

.calendar-grid-wrapper :deep(.vc-nav-arrow) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--brand-600, #4c6ef5);
}

.calendar-grid-wrapper :deep(.vc-nav-arrow:hover) {
  background: var(--brand-50, #f0f4ff);
}

.calendar-grid-wrapper :deep(.vc-weeks) {
  padding: 4px 0;
}

.calendar-grid-wrapper :deep(.vc-weekday) {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand-400, #91a7ff);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 8px;
}

.calendar-grid-wrapper :deep(.vc-day) {
  min-height: 44px;
  position: relative;
}

.calendar-grid-wrapper :deep(.vc-day-content) {
  width: 34px;
  height: 34px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--brand-900, #1a1a2e);
  border-radius: 10px;
  transition: all 0.15s ease;
}

.calendar-grid-wrapper :deep(.vc-day-content:hover) {
  background: var(--brand-50, #f0f4ff);
  color: var(--brand-700, #4263eb);
}

.calendar-grid-wrapper :deep(.vc-day-content:focus) {
  background: var(--brand-600, #4c6ef5);
  color: white;
  font-weight: 600;
}

.calendar-grid-wrapper :deep(.is-today .vc-day-content) {
  background: var(--brand-100, #dbe4ff);
  color: var(--brand-700, #4263eb);
  font-weight: 600;
}

.calendar-grid-wrapper :deep(.vc-highlight) {
  background: var(--brand-600, #4c6ef5) !important;
  border-radius: 10px;
}

.calendar-grid-wrapper :deep(.vc-dot) {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--brand-500, #5c7cfa);
}
</style>
