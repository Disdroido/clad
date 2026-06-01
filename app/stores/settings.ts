export const useSettingsStore = defineStore('settings', () => {
  const profile = ref<any>(null)
  const archivedOutfits = ref<any[]>([])
  const archivedItems = ref<any[]>([])
  const profileLoaded = ref(false)
  const archiveLoaded = ref(false)

  async function fetchProfile(force = false) {
    if (profileLoaded.value && !force) return
    try {
      profile.value = await $fetch('/api/profile/public')
      profileLoaded.value = true
    } catch { /* ignore */ }
  }

  async function fetchArchive(force = false) {
    if (archiveLoaded.value && !force) return
    try {
      const [outfits, items] = await Promise.all([
        $fetch('/api/archive/outfits'),
        $fetch('/api/archive/items'),
      ])
      archivedOutfits.value = outfits.outfits ?? []
      archivedItems.value = items.items ?? []
      archiveLoaded.value = true
    } catch { /* ignore */ }
  }

  function invalidateProfile() {
    profileLoaded.value = false
    profile.value = null
  }

  function invalidateArchive() {
    archiveLoaded.value = false
    archivedOutfits.value = []
    archivedItems.value = []
  }

  function invalidateAll() {
    invalidateProfile()
    invalidateArchive()
  }

  return {
    profile, archivedOutfits, archivedItems, profileLoaded, archiveLoaded,
    fetchProfile, fetchArchive,
    invalidateProfile, invalidateArchive, invalidateAll,
  }
})
