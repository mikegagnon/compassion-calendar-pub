<script setup lang="ts">
import type { DatedCard } from '@/CompassionCalendar';

defineProps<{
  entry: DatedCard
}>()

function dateStr(entry: DatedCard) {
  const d = new Date(`${entry.date.year}/${entry.date.month}/${entry.date.day}`);

  // https://stackoverflow.com/questions/32877278/tolocaledatestring-is-subtracting-a-day
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
}
</script>

<template>
  <div class="calendar-entry">
    <div v-if="entry.isToday">
      <div class="heart-container">
        <img width="100" height="100" src="@/assets/heart.png" class="heart"/>
      </div>
      <p class="minor-note">TODAY</p>
    </div>

    <div :class="{ todayWrapper: entry.isToday}">
      <p :class="{ todayDate: entry.isToday }">{{ dateStr(entry) }} </p>
      <p>From Point {{ entry.card.pointNum }}: {{ entry.card.pointTitle }}</p>
      <p>Lojong {{ entry.card.lojongNum }}</p>
      <p class="lojongTitle">&ldquo;{{ entry.card.lojongTitle }}&rdquo;</p>
    </div>
  </div>
</template>

<style scoped>

.todayWrapper {
  color: #fff;
}

.lojongTitle {
  font-style: italic;
  font-size: 20pt;
}


.minor-note {
  font-size: 70%;
  margin-bottom: 0px;
  color: hsla(160, 100%, 37%, 1);
}

.todayDate {
  margin-top: 0px;
  font-size: 175%;
}

.heart-container {
  margin: auto;

  /*
  https://www.w3schools.com/css/css_align.asp
  "Note: Center aligning has no effect if the width property is not set (or set to 100%)."
  */
  width: 100px;
}

.heart {
  opacity: 0.4;
}

h1 {
  font-size: 20pt;
}

.calendar-entry {
  margin-top: 30px;
  margin-bottom: 30px;
  font-family: serif;
  border-radius: 10px;
  background-color: #383838;
  padding: 20px;
  color: #aaa;
}
</style>
