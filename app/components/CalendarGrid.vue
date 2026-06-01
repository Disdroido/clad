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
  <div class="calendar-grid-wrapper p-5 sm:p-6">
    <VCalendar
      expanded
      :attributes="calendarAttrs"
      :initial-page="{
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }"
      color="accent"
      borderless
      transparent
      :disabled="loading"
      :min-date="null"
      :max-date="null"
      @dayclick="onDayClick"
      @did-move="onDidMove"
    />
  </div>
</template>

<style scoped>
.calendar-grid-wrapper {
  width: 100%;
}

/* Override v-calendar to fill the full card width */
.calendar-grid-wrapper :deep(.vc-container) {
  width: 100% !important;
  max-width: none !important;
  border: none;
}

.calendar-grid-wrapper :deep(.vc-pane) {
  width: 100%;
  min-width: 0;
}

.calendar-grid-wrapper :deep(.vc-weeks) {
  width: 100%;
  table-layout: fixed;
}

.calendar-grid-wrapper :deep(.vc-header) {
  padding: 0 0 16px 0;
}

.calendar-grid-wrapper :deep(.vc-title) {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--brand-950, #1a1a2e);
  letter-spacing: -0.01em;
}

.calendar-grid-wrapper :deep(.vc-nav-arrow) {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--brand-500, #5c7cfa);
  font-size: 1.1rem;
}

.calendar-grid-wrapper :deep(.vc-nav-arrow:hover) {
  background: var(--brand-50, #f0f4ff);
}

.calendar-grid-wrapper :deep(.vc-weekday) {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--brand-400, #91a7ff);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 0 12px 0;
  text-align: center;
}

.calendar-grid-wrapper :deep(.vc-day) {
  min-height: 52px;
  position: relative;
}

.calendar-grid-wrapper :deep(.vc-day-content) {
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--brand-800, #1a1a2e);
  border-radius: 12px;
  transition: all 0.15s ease;
  margin: 0 auto;
}

.calendar-grid-wrapper :deep(.vc-day-content:hover) {
  background: var(--brand-50, #f0f4ff);
  color: var(--brand-600, #4c6ef5);
}

/* Today */
.calendar-grid-wrapper :deep(.is-today .vc-day-content) {
  background: var(--brand-100, #dbe4ff);
  color: var(--brand-700, #4263eb);
  font-weight: 700;
}

/* Selected day */
.calendar-grid-wrapper :deep(.vc-highlight) {
  background: var(--brand-500, #5c7cfa) !important;
  border-radius: 12px;
  color: white !important;
}

/* Dot indicators */
.calendar-grid-wrapper :deep(.vc-dot) {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--brand-500, #5c7cfa);
  margin-top: 2px;
}

/* Accent color system - crisp indigo */
.calendar-grid-wrapper :deep(.vc-accent) {
  --vc-accent-50: #eef2ff;
  --vc-accent-100: #e0e7ff;
  --vc-accent-200: #c7d2fe;
  --vc-accent-300: #a5b4fc;
  --vc-accent-400: #818cf8;
  --vc-accent-500: #6366f1;
  --vc-accent-600: #4f46e5;
  --vc-accent-700: #4338ca;
  --vc-accent-800: #3730a3;
  --vc-accent-900: #312e81;
}

/* Other-month days */
.calendar-grid-wrapper :deep(.vc-day.is-not-in-month .vc-day-content) {
  color: var(--brand-300, #c7d2fe);
  font-weight: 400;
}
</style>
