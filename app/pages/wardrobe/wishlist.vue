<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Wishlist — Clad' })

const route = useRoute()

const activeTab = computed(() => {
  if (route.path.startsWith('/wardrobe/wishlist')) return 'wishlist'
  if (route.path.startsWith('/wardrobe/laundry')) return 'laundry'
  return 'wardrobe'
})

// Reactive state
const items = ref<any[]>([])
const loading = ref(true)

// Add/Edit form state
const showForm = ref(false)
const editingItem = ref<any>(null)
const form = ref({
  name: '',
  category: '',
  priority: 'medium',
  notes: '',
  url: '',
})

// Confirmation state
const confirmingDelete = ref<string | null>(null)
const purchaseToast = ref<{ name: string; category: string } | null>(null)

// Clothing type options for dropdown
const clothingTypes = [
  't-shirt', 'shirt', 'blouse', 'sweater', 'hoodie',
  'jacket', 'coat', 'jeans', 'trousers', 'shorts',
  'skirt', 'dress', 'shoes', 'accessory', 'other',
]

const priorityOptions = ['high', 'medium', 'low']

// Fetch wishlist items
async function fetchItems() {
  loading.value = true
  try {
    const data: any = await $fetch('/api/wardrobe/wishlist')
    items.value = data.items ?? []
  } finally {
    loading.value = false
  }
}

// Open add form
function openAddForm() {
  editingItem.value = null
  form.value = { name: '', category: '', priority: 'medium', notes: '', url: '' }
  showForm.value = true
}

// Open edit form
function openEditForm(item: any) {
  editingItem.value = item
  form.value = {
    name: item.name,
    category: item.category,
    priority: item.priority,
    notes: item.notes ?? '',
    url: item.url ?? '',
  }
  showForm.value = true
}

// Close form
function closeForm() {
  showForm.value = false
  editingItem.value = null
}

// Submit form (create or update)
async function submitForm() {
  if (!form.value.name.trim() || !form.value.category) return

  if (editingItem.value) {
    // Update existing item
    const updated: any = await $fetch(`/api/wardrobe/wishlist/${editingItem.value.id}`, {
      method: 'PATCH',
      body: {
        name: form.value.name.trim(),
        category: form.value.category,
        priority: form.value.priority,
        notes: form.value.notes || undefined,
        url: form.value.url || undefined,
      },
    })
    // Update in place
    const idx = items.value.findIndex((i: any) => i.id === editingItem.value.id)
    if (idx !== -1) items.value[idx] = updated
    closeForm()
  } else {
    // Create new item
    const created: any = await $fetch('/api/wardrobe/wishlist', {
      method: 'POST',
      body: {
        name: form.value.name.trim(),
        category: form.value.category,
        priority: form.value.priority,
        notes: form.value.notes || undefined,
        url: form.value.url || undefined,
      },
    })
    items.value.unshift(created)
    closeForm()
  }
}

// Mark as purchased
async function markPurchased(item: any) {
  const updated: any = await $fetch(`/api/wardrobe/wishlist/${item.id}`, {
    method: 'PATCH',
    body: { isPurchased: true },
  })
  // Update in place
  const idx = items.value.findIndex((i: any) => i.id === item.id)
  if (idx !== -1) items.value[idx] = updated

  // Show purchase toast
  if (updated.purchasedItem) {
    purchaseToast.value = updated.purchasedItem
    setTimeout(() => { purchaseToast.value = null }, 8000)
  }
}

// Delete item
async function deleteItem(id: string) {
  await $fetch(`/api/wardrobe/wishlist/${id}`, { method: 'DELETE' })
  items.value = items.value.filter((i: any) => i.id !== id)
  confirmingDelete.value = null
}

// Priority badge color
function priorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700'
    case 'medium': return 'bg-amber-100 text-amber-700'
    case 'low': return 'bg-blue-100 text-blue-700'
    default: return 'bg-brand-100 text-brand-700'
  }
}

// Purchase link query params
function purchaseLink(item: any) {
  const params = new URLSearchParams()
  if (item.name) params.set('prefill_name', item.name)
  if (item.category) params.set('prefill_category', item.category)
  return `/wardrobe/upload?${params.toString()}`
}

onMounted(() => fetchItems())
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-brand-950">My Wishlist</h1>
      <button
        class="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition"
        @click="openAddForm"
      >
        + Add Item
      </button>
    </div>

    <!-- Sub-navigation tabs -->
    <div class="mb-4 flex border-b border-brand-200">
      <NuxtLink
        to="/wardrobe"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'wardrobe' ? 'border-brand-600 text-brand-600' : 'border-transparent text-brand-500 hover:text-brand-600'"
      >
        My Wardrobe
      </NuxtLink>
      <NuxtLink
        to="/wardrobe/wishlist"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'wishlist' ? 'border-brand-600 text-brand-600' : 'border-transparent text-brand-500 hover:text-brand-600'"
      >
        Wishlist
      </NuxtLink>
      <NuxtLink
        to="/wardrobe/laundry"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'laundry' ? 'border-brand-600 text-brand-600' : 'border-transparent text-brand-500 hover:text-brand-600'"
      >
        Laundry
      </NuxtLink>
    </div>

    <!-- Purchase toast -->
    <div
      v-if="purchaseToast"
      class="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
    >
      <span class="text-green-700">&#10003; Item marked as purchased!</span>
      <NuxtLink
        :to="purchaseLink(purchaseToast)"
        class="text-sm font-medium text-brand-600 hover:text-brand-700 underline"
      >
        Add to wardrobe?
      </NuxtLink>
      <button
        class="ml-auto text-brand-400 hover:text-brand-600"
        @click="purchaseToast = null"
      >
        &#10005;
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="items.length === 0 && !showForm"
      class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 py-20"
    >
      <p class="mb-4 text-brand-500">Your wishlist is empty</p>
      <button
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
        @click="openAddForm"
      >
        Add Your First Item
      </button>
    </div>

    <!-- Add/Edit Form -->
    <div
      v-if="showForm"
      class="mb-6 rounded-lg border border-brand-200 bg-white p-6"
    >
      <h2 class="mb-4 text-lg font-semibold text-brand-900">
        {{ editingItem ? 'Edit Item' : 'Add New Item' }}
      </h2>

      <div class="space-y-4">
        <!-- Name -->
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">Name *</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. Navy Blue Oxford Shirt"
            class="w-full rounded-lg border border-brand-200 px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">Category *</label>
          <select
            v-model="form.category"
            class="w-full rounded-lg border border-brand-200 px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none capitalize"
          >
            <option value="" disabled>Select category</option>
            <option
              v-for="cat in clothingTypes"
              :key="cat"
              :value="cat"
            >
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Priority -->
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">Priority</label>
          <select
            v-model="form.priority"
            class="w-full rounded-lg border border-brand-200 px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none capitalize"
          >
            <option
              v-for="p in priorityOptions"
              :key="p"
              :value="p"
            >
              {{ p }}
            </option>
          </select>
        </div>

        <!-- URL -->
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">Link</label>
          <input
            v-model="form.url"
            type="url"
            placeholder="https://store.com/item"
            class="w-full rounded-lg border border-brand-200 px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="mb-1 block text-sm font-medium text-brand-700">Notes</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Size, color preference, brand, etc."
            class="w-full rounded-lg border border-brand-200 px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            class="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition disabled:opacity-50"
            :disabled="!form.name.trim() || !form.category"
            @click="submitForm"
          >
            {{ editingItem ? 'Save Changes' : 'Add to Wishlist' }}
          </button>
          <button
            class="rounded-lg border border-brand-200 px-4 py-2 text-brand-600 hover:bg-brand-50 transition"
            @click="closeForm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Items list -->
    <div v-if="items.length > 0" class="space-y-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="rounded-lg border border-brand-200 bg-white p-4 transition hover:shadow-sm"
        :class="{ 'opacity-75': item.isPurchased }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <!-- Top row: name + priority badge -->
            <div class="mb-1 flex items-center gap-2">
              <h3 class="text-base font-semibold text-brand-900 truncate">
                {{ item.name }}
              </h3>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="priorityColor(item.priority)"
              >
                {{ item.priority }}
              </span>
            </div>

            <!-- Category badge -->
            <span class="inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs capitalize text-brand-600">
              {{ item.category }}
            </span>

            <!-- Notes (truncated) -->
            <p v-if="item.notes" class="mt-1 text-sm text-brand-600 truncate">
              {{ item.notes }}
            </p>

            <!-- URL link -->
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-700 transition"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View item
            </a>

            <!-- Purchased badge -->
            <span
              v-if="item.isPurchased"
              class="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
            >
              Purchased ✓
            </span>
          </div>

          <!-- Action buttons -->
          <div class="flex shrink-0 items-center gap-1">
            <!-- Edit -->
            <button
              class="rounded p-1.5 text-brand-400 hover:bg-brand-50 hover:text-brand-600 transition"
              title="Edit"
              @click="openEditForm(item)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            <!-- Mark purchased -->
            <button
              v-if="!item.isPurchased"
              class="rounded p-1.5 text-brand-400 hover:bg-green-50 hover:text-green-600 transition"
              title="Mark as Purchased"
              @click="markPurchased(item)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Delete with confirm -->
            <template v-if="confirmingDelete === item.id">
              <span class="text-xs text-red-600">Delete?</span>
              <button
                class="rounded p-1 text-red-600 hover:bg-red-50 transition"
                title="Confirm Delete"
                @click="deleteItem(item.id)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                class="rounded p-1 text-brand-400 hover:bg-brand-50 hover:text-brand-600 transition"
                title="Cancel"
                @click="confirmingDelete = null"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </template>
            <button
              v-else
              class="rounded p-1.5 text-brand-400 hover:bg-red-50 hover:text-red-600 transition"
              title="Delete"
              @click="confirmingDelete = item.id"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
