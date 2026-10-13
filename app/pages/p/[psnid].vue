<template>
  <!-- Loading: the page's own frame in placeholders -->
  <ProfileSkeleton v-if="view === 'loading'" />

  <!-- Never synced / deleted (served as a 404) or banned -->
  <ProfileUnavailable v-else-if="view === 'missing' || view === 'banned'" :kind="view" :psnid="psnid" />

  <div v-else-if="profile" class="space-y-6">
    <ProfileHeader :profile="profile" :follow-pending="followPending" @toggle-follow="toggleFollow" />

    <template v-if="profile.is_profile_public">
      <ProfileTrophyCalendar v-if="profile.calendar?.length" :calendar="profile.calendar" />

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left: tabbed activity -->
        <div class="lg:col-span-2">
          <ProfileMainCard :psnid="psnid" />
        </div>

        <!-- Right: extended info -->
        <aside class="space-y-6">
          <ProfileStatsCard :profile="profile" />
          <ProfileRecentTips
            v-if="profile.recent_tips !== null"
            :psnid="psnid"
            :tip-count="profile.tip_count"
            :tips="profile.recent_tips"
          />
          <ProfileSocialCard :profile="profile" />
          <ProfileAccountCard :profile="profile" />
        </aside>
      </div>
    </template>

    <!-- Private: no trophy data (the stats come back zeroed), but the basic
         profile and the player's comments are still public. -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <ProfilePrivatePanel :psnid="profile.psnid" />
      </div>
      <aside class="space-y-6">
        <ProfileRecentTips
          v-if="profile.recent_tips !== null"
          :psnid="psnid"
          :tip-count="profile.tip_count"
          :tips="profile.recent_tips"
        />
        <ProfileSocialCard :profile="profile" />
        <ProfileAccountCard :profile="profile" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserCheck } from 'lucide'
import type { Profile } from '~/services/profile'
import { useProfiles } from '~/services/profile'
import { ApiError } from '~/utils/ApiError'
import { DEFAULT_LOCALE, HTML_LANG, isUiLocale } from '#shared/locales'

const route = useRoute()
const { t, locale } = useI18n()
const psnid = computed(() => String(route.params.psnid))
const auth = useAuth()
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')
const cardBase = useRuntimeConfig().public.cardBase.replace(/\/+$/, '')
// Server-only: both write to the response of the page render.
const requestEvent = import.meta.server ? useRequestEvent() : undefined
const cacheControl = import.meta.server ? useResponseHeader('cache-control') : undefined

// `lazy` lets client-side navigation open the page at once and show
// placeholders while the profile loads; the server still waits for it, so an
// unknown PSN ID still answers 404 on first load.
const { data: profile, status, error } = await useApiFetch<Profile>(
  () => `/profile/${psnid.value}`,
  { lazy: true },
)
// A lazy fetch sits at `idle` until it starts, so count that as loading too.
const pending = computed(() => status.value === 'pending' || status.value === 'idle')

/**
 * What the page shows. Besides a profile (public or private, both 200), the
 * API answers 404 `USER_NOT_FOUND` for a PSN ID it has never synced (or whose
 * owner deleted their account) and 410 `USER_BANNED` for a terminated one.
 * Read off the HTTP status: unlike the error code, it survives the trip from
 * the server render to the client.
 */
type ProfileView = 'loading' | 'missing' | 'banned' | 'profile'
const errorStatus = computed(() => (error.value as { statusCode?: number } | undefined)?.statusCode)
const view = computed<ProfileView>(() => {
  if (profile.value) return 'profile'
  if (errorStatus.value === 404) return 'missing'
  if (errorStatus.value === 410) return 'banned'
  return 'loading'
})

// Missing and banned are answers, not failures: fill the bar normally.
useLoadingBar(pending, () => status.value === 'error' && view.value === 'loading')

// Missing and banned profiles render their own state in the page. A missing
// one answers a real 404 rather than a 200, so crawlers don't index an endless
// supply of empty `/p/<anything>` pages, and it is never cached: once someone
// syncs the ID, the same URL has to serve the new profile straight away. A
// banned one stays a 200 for now, kept out of the index by `noindex` (see
// `useSeo` below). Anything else is a service failure and gets the full error
// page. Watched, not checked once: moving between two profiles reuses this
// component.
function raiseFetchError(err: typeof error.value) {
  if (!err) return
  const statusCode = (err as { statusCode?: number }).statusCode
  if (statusCode === 404) {
    if (requestEvent) setResponseStatus(requestEvent, 404)
    if (cacheControl) cacheControl.value = 'no-store'
    return
  }
  if (statusCode === 410) return
  showError(createError({
    statusCode: 502,
    statusMessage: 'Profile service unavailable',
    fatal: true,
  }))
}
raiseFetchError(error.value)
watch(error, raiseFetchError)

const { follow, unfollow } = useProfiles()
const followPending = ref(false)
const toast = useToast()

function redirectToLogin() {
  return navigateTo({
    path: '/auth/login',
    query: { redirect: route.fullPath },
  })
}

/**
 * Set whether the viewer follows this profile, moving the follower count with
 * it. `useFetch` data is a shallow ref, so the profile is replaced rather than
 * edited in place: mutating its fields would change nothing on screen.
 */
function setFollowing(following: boolean) {
  const p = profile.value
  if (!p || p.is_following === following) return
  profile.value = {
    ...p,
    is_following: following,
    follower_count: Math.max(0, p.follower_count + (following ? 1 : -1)),
  }
}

/**
 * Toggle the follow relationship. Optimistically flips `is_following` and the
 * follower count (so the header button and the social card update instantly),
 * then reconciles with the server response and rolls back on failure.
 */
async function toggleFollow() {
  const p = profile.value
  if (!p || followPending.value) return
  if (!auth.loggedIn.value) {
    await redirectToLogin()
    return
  }

  const next = !p.is_following
  setFollowing(next)

  followPending.value = true
  try {
    const res = next ? await follow(p.psnid) : await unfollow(p.psnid)
    setFollowing(res.following)
    if (next && res.following) {
      toast.add({
        title: t('toast.followed.title'),
        description: t('toast.followed.description', { psnid: p.psnid }),
        icon: UserCheck,
      })
    }
  }
  catch (err) {
    setFollowing(!next)
    if (err instanceof ApiError && err.code === 'UNAUTHENTICATED') {
      await redirectToLogin()
      return
    }
    throw err
  }
  finally {
    followPending.value = false
  }
}

const canonicalProfilePath = computed(() => profile.value
  ? `/p/${encodeURIComponent(profile.value.psnid)}`
  : route.path)

useSeo({
  title: () => {
    if (profile.value) return t('seo.profile.title', { psnid: profile.value.psnid })
    if (view.value === 'missing') return t('seo.profile.titleMissing', { psnid: psnid.value })
    if (view.value === 'banned') return t('seo.profile.titleBanned')
    return t('seo.profile.titleFallback')
  },
  description: () => (profile.value
    ? t('seo.profile.description', { psnid: profile.value.psnid })
    : ''),
  // A generated card, not the raw PSN avatar: that is a 240×240 square, which
  // every platform then stretches or shrinks to fit its 2:1 preview slot.
  // Private profiles advertise nothing and fall back to the brand card.
  image: () => (profile.value?.is_profile_public
    ? `${cardBase}/card/profile/${encodeURIComponent(profile.value.psnid.toLowerCase())}.png?v=3`
    : undefined),
  // Dimensions of the backend-generated card.
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/png',
  canonicalPath: () => canonicalProfilePath.value,
  // A private profile exposes no trophy data, so there is nothing worth indexing.
  noindex: () => !profile.value?.is_profile_public,
})

const canonicalProfileUrl = computed(() => {
  const lang = isUiLocale(locale.value) ? locale.value : DEFAULT_LOCALE
  return `${siteUrl}${canonicalProfilePath.value}${lang === DEFAULT_LOCALE ? '' : `?lang=${encodeURIComponent(lang)}`}`
})

function isoDate(value: Profile['registered_at']): string | undefined {
  if (value == null || value === '') return undefined
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

// Only registered PSRay members are creators affiliated with this site. A
// synced-only PSN record is useful content, but it is not a community profile.
const profileJsonLd = computed(() => {
  const p = profile.value
  if (!p?.is_profile_public || p.registered_at == null) return null

  const url = canonicalProfileUrl.value
  const person: Record<string, unknown> = {
    '@id': `${url}#person`,
    '@type': 'Person',
    'name': p.psnid,
    'identifier': p.psnid,
    'url': url,
    'image': p.avatar_url,
    'interactionStatistic': [{
      '@type': 'InteractionCounter',
      'interactionType': 'https://schema.org/FollowAction',
      'userInteractionCount': p.follower_count,
    }],
    'agentInteractionStatistic': [
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/FollowAction',
        'userInteractionCount': p.following_count,
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/WriteAction',
        'userInteractionCount': p.tip_count,
      },
    ],
  }
  if (p.about_me) person.description = p.about_me

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'url': url,
    'dateCreated': isoDate(p.registered_at),
    'inLanguage': HTML_LANG[isUiLocale(locale.value) ? locale.value : DEFAULT_LOCALE],
    'mainEntity': person,
  }
})

useHead(() => ({
  script: profileJsonLd.value
    ? [{
        key: 'profile-jsonld',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(profileJsonLd.value).replace(/</g, '\\u003c'),
      }]
    : [],
}))
</script>
