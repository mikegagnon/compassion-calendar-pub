<script setup lang="ts">
import { CompassionCalendar, type DatedCard } from './CompassionCalendar.ts';
import { theLojong } from './theLojong.ts';
import CalendarEntry from './components/CalendarEntry.vue';
import { ref, onMounted, nextTick, type Ref } from 'vue';

// `calendarEntryMarginTop` should match the margin
// from css class `calendar-entry` from CalendarEntry.vue.
//
// Code review: it would be nice if the CSS class for
// `calendar-entry` imported this constant (or the other
// way around, i.e. if this constant were defined by
// grabbing the margin value from the CSS class for
// `calendar-entry`). However, I could not find a simple
// way to share constants between CSS and JS. (The
// exception being: it is possible to dynamically
// retrieve the computed value for a CSS property, at
// runtime, but that's dynamic and this static solution
// seems preferrable as it avoids complexity). Am I
// missing something?
const calendarEntryMarginTop = 30;

const cards = theLojong;

const schedule : Ref<DatedCard[]> = ref([]);

// The calendar object maps calendar dates to "cards" (each card is a lojong slogan)
const today = undefined;
const beginDate = undefined;
const hashSeed = undefined;
const calendar = new CompassionCalendar(schedule, cards, today, beginDate, hashSeed);

// This component features infinite scroll, both above and below. The gist of how
// it works is it uses `needsPadAbove()` to determine when more content needs
// to be added above, and then uses `padAbove()` to actually add more content above.
// And similarly for `needsPadBelow()` and `padBelow()`
const padAbovePixels = 500;
const padBelowPixels = 500;

function needsPadAbove() {
  const hiddenAboveHeight = window.scrollY;
  return hiddenAboveHeight < padAbovePixels;
}

function needsPadBelow() {
  const bodyHeight = document.body.offsetHeight;
  const windowHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const hiddenBelowHeight = bodyHeight - scrollY - windowHeight;
  return hiddenBelowHeight < padBelowPixels;
}

function padAbove() {
  const bodyHeightBefore = document.body.offsetHeight;
  const scrollBefore = window.scrollY;
  calendar.padAbove();
  
  nextTick(() => {
    const bodyHeightAfter = document.body.offsetHeight;
    const diff = bodyHeightAfter - bodyHeightBefore;
    const scrollAfter = diff + scrollBefore;
    window.scrollTo(window.scrollX, scrollAfter);
  });
}

function padBelow() {
  calendar.padBelow();
}

function checkPad() {
  if (needsPadBelow() && needsPadAbove()) {
    console.warn('Needs pad above AND below');
  }

  if (needsPadAbove()) {
    padAbove();
  } else if (needsPadBelow()) {
    padBelow();
  }
}

function getToday() : HTMLElement | undefined {
  const i = calendar.getIndexForToday();
  const elem = document.querySelectorAll('.calendar-entry')[i];

  if (elem instanceof HTMLElement) {
    return elem as HTMLElement;
  } else {
    console.error('Unexpected today calendary-entry');
    return undefined;
  }
}

// We want to vertically center today's calendar entry
// so that it is the only entry visible.
// Adjacent calendar entries should be barely off screen.
function vertCenterToday() {
  const elem : HTMLElement | undefined = getToday();

  if (elem === undefined) {
    console.error("Could not get the element for today's slogan");
    return;
  }

  const todayHeight = elem.clientHeight;
  const windowHeight = window.innerHeight;
  const margin = Math.ceil((windowHeight - todayHeight) / 2);
  const marginStr = Math.max(calendarEntryMarginTop, margin) + 'px';
  elem.style.marginTop = marginStr;
  elem.style.marginBottom = marginStr;
  elem.style.scrollMargin = marginStr;
}

function init() {
  window.addEventListener('scroll', checkPad);
  window.addEventListener('resize', checkPad);  

  // When the user refreshes the page, we need to re-init manually 
  window.addEventListener('beforeunload', init);

  vertCenterToday();

  const elem = getToday();
  if (elem === undefined) {
    console.error("error getting today");
    return;
  }
  elem.scrollIntoView();
  checkPad();
}

onMounted(init);

</script>

<template>
  <div class="schedule-container">
    <div v-for="entry in schedule">
      <CalendarEntry :entry=entry />
    </div>
  </div>
</template>


<style scoped>

.schedule-container {
  margin: auto;
  width: 370px;
}

</style>
