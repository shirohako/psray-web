import type { WatchSource } from 'vue'
import { UserCheck } from 'lucide'
import { useProfiles, type FollowDirection, type MyFollowEntry } from '~/services/profile'
import { ApiError } from '~/utils/ApiError'

/**
 * Following and unfollowing from the /me/following lists, where `tab` says
 * which list is showing. A change shows at once and holds until `list` is
 * fetched again with the server's view of it. Unfollowing asks first (the
 * person waits in `confirming`); following, or following back, happens on
 * the click.
 */
export function useMyFollowToggle(tab: () => FollowDirection, list: WatchSource<unknown>) {
  const { t } = useI18n()
  const route = useRoute()
  const toast = useToast()
  const { user } = useAuth()
  const { follow, unfollow } = useProfiles()

  // Follow changes made on this page, by PSN ID, until the next fetch brings
  // the server's view of them.
  const changed = ref<Record<string, boolean>>({})
  const busy = ref<Record<string, boolean>>({})
  watch(list, () => { changed.value = {} })

  /** Whether the signed-in user follows this person right now. */
  function iFollow(person: MyFollowEntry) {
    return changed.value[person.psnid] ?? (tab() === 'following' || person.is_mutual)
  }

  /** Whether this person follows the signed-in user. */
  function followsMe(person: MyFollowEntry) {
    return tab() === 'followers' || person.is_mutual
  }

  /** Follow or unfollow right away; true when the server took the change. */
  async function toggle(person: MyFollowEntry): Promise<boolean> {
    const psnid = person.psnid
    if (busy.value[psnid]) return false
    const next = !iFollow(person)
    changed.value[psnid] = next
    busy.value[psnid] = true
    try {
      const result = next ? await follow(psnid) : await unfollow(psnid)
      changed.value[psnid] = result.following
      // Keep the tab count in step without reloading the whole session.
      if (user.value && result.following === next) {
        user.value.following_count = Math.max(0, user.value.following_count + (next ? 1 : -1))
      }
      if (result.following) toast.success({ title: t('toast.followed.title'), description: t('toast.followed.description', { psnid }), icon: UserCheck })
      return true
    }
    catch (error) {
      changed.value[psnid] = !next
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
        await navigateTo({ path: '/auth/login', query: { redirect: route.fullPath } })
        return false
      }
      toast.error({ title: t('me.following.toggleFailed'), description: error instanceof ApiError ? error.message : undefined })
      return false
    }
    finally {
      delete busy.value[psnid]
    }
  }

  // Unfollowing asks first; following (back) happens on the click.
  const confirming = ref<MyFollowEntry | null>(null)
  const confirmOpen = ref(false)

  function onFollowClick(person: MyFollowEntry) {
    if (!iFollow(person)) {
      toggle(person)
      return
    }
    confirming.value = person
    confirmOpen.value = true
  }

  async function confirmUnfollow() {
    const person = confirming.value
    if (person && await toggle(person)) confirmOpen.value = false
  }

  return { iFollow, followsMe, busy, onFollowClick, confirming, confirmOpen, confirmUnfollow }
}
