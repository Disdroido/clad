<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'New Trip — Clad' })

const router = useRouter()

const name = ref('')
const destination = ref('')
const startDate = ref('')
const endDate = ref('')
const purpose = ref('')
const saving = ref(false)
const error = ref('')

const purposeOptions = [
  { value: 'vacation', label: '🏖️ Vacation' },
  { value: 'business', label: '💼 Business' },
  { value: 'adventure', label: '🏔️ Adventure' },
  { value: 'city', label: '🌆 City Trip' },
  { value: 'family', label: '👪 Family' },
  { value: 'event', label: '🎉 Event' },
  { value: 'other', label: '✈️ Other' },
]

const isValid = computed(() =>
  name.value.trim() && destination.value.trim() && startDate.value && endDate.value && purpose.value
)

const dateError = computed(() => {
  if (startDate.value && endDate.value && new Date(endDate.value) < new Date(startDate.value)) {
    return 'End date must be on or after start date'
  }
  return ''
})

async function saveTrip() {
  if (!isValid.value || dateError.value) return
  saving.value = true
  error.value = ''
  try {
    const trip: any = await $fetch('/api/trips', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        destination: destination.value.trim(),
        startDate: startDate.value,
        endDate: endDate.value,
        purpose: purpose.value,
      },
    })
    router.push(`/trips/${trip.id}`)
  } catch (err: any) {
    error.value = err?.data?.message || 'Couldn\'t save trip. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4">
      <NuxtLink to="/trips" class="text-sm text-brand-400 hover:text-brand-600">&larr; All Trips</NuxtLink>
    </div>

    <div class="mx-auto max-w-lg">
      <h1 class="mb-6 text-2xl font-bold text-brand-950">New Trip</h1>

      <div class="rounded-xl bg-white p-6 shadow-sm border border-brand-100">
        <div class="space-y-4">
          <!-- Trip Name -->
          <div>
            <label class="mb-1 block text-sm font-medium text-brand-700">Trip Name</label>
            <input v-model="name" type="text" placeholder="e.g. Summer Vacation"
                   class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>

          <!-- Destination -->
          <div>
            <label class="mb-1 block text-sm font-medium text-brand-700">Destination</label>
            <input v-model="destination" type="text" placeholder="e.g. Paris, France"
                   class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>

          <!-- Date range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-brand-700">Start Date</label>
              <input v-model="startDate" type="date"
                     class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-brand-700">End Date</label>
              <input v-model="endDate" type="date"
                     class="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>
          <p v-if="dateError" class="text-sm text-red-600">{{ dateError }}</p>

          <!-- Purpose -->
          <div>
            <label class="mb-2 block text-sm font-medium text-brand-700">Purpose</label>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button v-for="opt in purposeOptions" :key="opt.value"
                      @click="purpose = opt.value"
                      class="rounded-lg border px-3 py-2.5 text-sm transition"
                      :class="purpose === opt.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                        : 'border-brand-200 text-brand-600 hover:border-brand-300'">
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

        <div class="mt-6 flex gap-3">
          <NuxtLink to="/trips"
                    class="flex-1 rounded-lg border border-brand-300 px-4 py-2.5 text-center text-sm font-medium text-brand-700 hover:bg-brand-50 transition">
            Cancel
          </NuxtLink>
          <button @click="saveTrip" :disabled="!isValid || !!dateError || saving"
                  class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save Trip' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
