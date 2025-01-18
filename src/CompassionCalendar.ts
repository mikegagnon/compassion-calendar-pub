// There are several Jenkins hash implementations on npm.
// I chose this one because the type signaure for the hash function
// is easily discerned from its documentation. 
import { hashlittle } from 'jenkins-hash';

// Code review: I'm importing lodash solely for the _.isEqual() function. It seems
// excessive, but it also seems to be the best approach.
import _ from 'lodash';
import type { Ref } from 'vue';

interface MyDate {
    year: number,
    month: number,
    day: number,
};

interface Card {
    pointNum: string,
    pointTitle: string,
    lojongNum: number,
    lojongTitle: string,
};

interface DatedCard {
    date: MyDate,
    isToday: boolean,
    card: Card,
};

// https://stackoverflow.com/questions/23081158/javascript-get-date-of-the-next-day
function jumpDay(date: MyDate, jump: number) {
    var nextDay = new Date(`${date.year}/${date.month}/${date.day}`);
    nextDay.setDate(nextDay.getDate() + jump);
    return {
        year: nextDay.getFullYear(),
        month: nextDay.getMonth() + 1, // months are zero indexed
        day: nextDay.getDate(),
    };
}

function getNextDay(date: MyDate) {
    return jumpDay(date, 1);
}

class MyShuffle {

    static defaultHashSeed = 0x0;

    rollingDate: MyDate;
    hashSeed: number;

    static bytesFromYear(year: number) {
        const yearA = (year >> 8) & 0xff;
        const yearB = year & 0xff;
        return [yearA, yearB];
    }

    constructor(seed: MyDate, hashSeed: number | undefined) {
        this.rollingDate = seed;
        if (hashSeed === undefined) {
            this.hashSeed = MyShuffle.defaultHashSeed;
        } else {
            this.hashSeed = hashSeed;
        }
    }

    // Returns random number between 0 and 1, using Jenkins to hash the rollingDate
    getRandom() {
        // need 16 bits for year
        const [yearA, yearB] = MyShuffle.bytesFromYear(this.rollingDate.year);
        
        // 8 bits for each of month and day
        const month = this.rollingDate.month;
        const day = this.rollingDate.day;

        const hashInput = new Uint8Array([yearA, yearB, month, day]);
        const hashResult = hashlittle(hashInput, this.hashSeed);
        this.rollingDate = getNextDay(this.rollingDate);
        return hashResult / 0xffffffff;
    }

    // shuffles in place
    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    shuffle(array: number[]) {
        let currentIndex = array.length;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {

            // Pick a remaining element...
            const rando = this.getRandom();
            let randomIndex = Math.floor(rando * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
    }

    // return an array of length `numLojong`, containing
    // the numbers 0 through (numLojong - 1), in
    // random order
    getLojongIndices(numLojong: number) {
        const indices = Array(numLojong);
        for (let i = 0; i < numLojong; i++) {
            indices[i] = i;
        }
        this.shuffle(indices);
        return indices;
    }
};

function getLojongIndices(beginDate: MyDate, numLojong: number, hashSeed: number | undefined) {
    const myShuffle = new MyShuffle(beginDate, hashSeed);
    return myShuffle.getLojongIndices(numLojong);
}

class CompassionCalendar {

    static defaultHashSeed = 0x0;

    // The calendar will populate entries in the schedule beginning at this date,
    // and then padding until we include today's date.
    static defaultBeginDate: MyDate = {
        year: 2025,
        month: 1,
        day: 18,
    };

    hashSeed: number;
    cards: Card[];
    today: MyDate;
    beginDate: MyDate;

    // Code review: leaky abstration. Ref is a Vue concept. Wouldn't it be nice
    // if we didn't need to use `Ref`? However, using Ref here for schedule
    // seems to be the best design I could think of.
    schedule: Ref<DatedCard[]>;

    nextScheduledDate: MyDate;
    
    constructor(schedule: Ref<DatedCard[]>, cards: Card[], today: MyDate | undefined, beginDate: MyDate | undefined, hashSeed: number | undefined) {
        this.cards = cards;
        if (hashSeed === undefined) {
            this.hashSeed = CompassionCalendar.defaultHashSeed;
        } else {
            this.hashSeed = hashSeed;
        }
        if (today === undefined) {
            const d = new Date();
            this.today = {
                year: d.getFullYear(),
                month: d.getMonth() + 1, // months are zero indexed
                day: d.getDate(),
            };
        } else {
            this.today = today;
        }
        if (beginDate === undefined) {
            this.beginDate = CompassionCalendar.defaultBeginDate
        } else {
            this.beginDate = beginDate;
        }
        this.schedule = schedule;
        this.nextScheduledDate = this.beginDate;
        
        this.padBelow();
        this.padAbove();
        this.padUntilToday();
    }

    padUntilToday() {
        const MAX_I = 10000;
        let i = 0;
        while (i < MAX_I) {
            if (this.schedule.value[i]?.isToday) {
                return;
            }
            i++;
            if (i === this.schedule.value.length) {
                this.padBelow();
            }
        }
        console.error('breaking padUntilToday infinite loop');
    }

    // Note this has linear performance. But schedule should be
    // relatively small and, as they say: premature optimization... blah blah.
    getIndexForToday() {
        return this.schedule.value.findIndex((card) => card.isToday);
    }

    padAbove() {
        const jump = -this.cards.length;
        let date = jumpDay(this.schedule.value[0].date, jump);
        const shuffledIndices = getLojongIndices(date, this.cards.length, this.hashSeed);
        const aboveSchedule = [];

        for (const index of shuffledIndices) {
            let isToday = false;
            if (_.isEqual(date, this.today)) {
                isToday = true;
            } 

            const datedCard = {
                date,
                isToday,
                card: this.cards[index],
            }

            aboveSchedule.push(datedCard)
            date = getNextDay(date);
        }

        aboveSchedule.reverse();

        // Note this performance is O(m * n), where
        // m is length of aboveSchedule, and
        // n is length of this.schedule, since unshift is O(n)
        // However, m and n should be small, and
        // premature optimization... blah blah.
        for (const c of aboveSchedule) {
            this.schedule.value.unshift(c);
        }
    }

    padBelow() {
        const shuffledIndices = getLojongIndices(this.nextScheduledDate, this.cards.length, this.hashSeed);

        for (const index of shuffledIndices) {
            let isToday = false;
            if (_.isEqual(this.nextScheduledDate, this.today)) {
                isToday = true;
            } 

            const datedCard = {
                date: this.nextScheduledDate,
                isToday,
                card: this.cards[index]
            }

            this.schedule.value.push(datedCard)
            this.nextScheduledDate = getNextDay(this.nextScheduledDate);
        }
    }
}

export {
    type DatedCard,
    type MyDate,
    type Card,
    MyShuffle,
    getNextDay,
    getLojongIndices,
    CompassionCalendar,
    jumpDay
};
