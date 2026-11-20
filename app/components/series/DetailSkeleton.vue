<template>
  <div class="animate-skeleton-in space-y-6" aria-hidden="true">
    <div class="skeleton skeleton-soft h-3 w-40 rounded" />
    <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div class="skeleton h-20 w-36 rounded-md" />
        <div class="flex-1 space-y-3">
          <div class="skeleton skeleton-soft h-3 w-16 rounded" />
          <div class="skeleton h-6 w-2/3 rounded" />
          <div class="skeleton skeleton-soft h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
    <div class="space-y-4">
      <div v-for="i in 4" :key="i" class="flex gap-4">
        <div class="skeleton size-9 shrink-0 rounded-full" />
        <div class="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-4 py-3"><div class="skeleton h-4 w-48 rounded" /></div>
          <div v-for="j in 2" :key="j" class="flex items-center gap-4 px-4 py-3">
            <div class="skeleton h-11 w-20 rounded-md" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3.5 w-2/3 rounded" />
              <div class="skeleton skeleton-soft h-3 w-1/3 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
