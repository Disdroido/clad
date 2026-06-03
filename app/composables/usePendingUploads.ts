// Shared state for uploads that survive navigation (fire-and-forget)
export const usePendingUploads = () => {
  const count = useState('pendingUploads:count', () => 0)
  const items = useState<any[]>('pendingUploads:items', () => [])

  function add(count: number = 1) {
    // Add placeholder items that will show as skeleton cards
    for (let i = 0; i < count; i++) {
      items.value.push({ id: `pending-${Date.now()}-${i}`, pending: true })
    }
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  return { count, items, add, remove }
}
