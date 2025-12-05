<template>
  <div class="border rounded-md shadow-lg p-8">
    <ProfileRanking
      :country="profile.country"
      :rank="profile.rank"
      :server-rank="profile.server_rank"
      :updated-at="profile.updated_at"
      :last-trophy="profile.last_trophy"
    />

    <ProfileTrophyStats
      :first-trophy="profile.first_trophy"
      :trophy-level="profile.trophyLevel"
      :earned-trophies-count="profile.earnedTrophiesCount"
      :platinum="profile.platinum"
      :gold="profile.gold"
      :silver="profile.silver"
      :bronze="profile.bronze"
    />

    <ProfileGameStats
      :games-played="profile.games_played"
      :completion-rate="profile.completionRate"
      :abandoned-games="profile.abandoned_games"
      :trophy-tip="profile.trophy_tip"
    />

    <ProfileCalendar :calendar="calendar" />
  </div>
</template>

<script setup>
import ProfileRanking from './ProfileRanking.vue';
import ProfileTrophyStats from './ProfileTrophyStats.vue';
import ProfileGameStats from './ProfileGameStats.vue';
import ProfileCalendar from './ProfileCalendar.vue';

const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
});

const calendar = computed(() => {
  const _calendar = props.profile.calendar;
  if (!_calendar) {
    return [];
  }
  return _calendar;
});
</script>
