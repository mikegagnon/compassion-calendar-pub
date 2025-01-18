import { expect, test } from 'vitest'
import { type MyDate, type Card, getNextDay, getLojongIndices, CompassionCalendar, jumpDay, MyShuffle, type DatedCard } from '../CompassionCalendar.ts'
import { describe } from 'node:test';
import { ref, type Ref } from 'vue';
import _ from 'lodash';

// Testing the stats for MyShuffle appears in the tests for CompassionCalendar, below.
// Code review: the stats for MyShuffle appears in the tests for CompassionCalendar belong here.
// Code review: why is the describe string 'MuShuffle' not showing up in the test output on the terminal?
describe('MyShuffle', () => {
    test('bytesFromYear', () => {
        const year = 2025;
        expect(year).toBe(0x7E9);
        const [yearA, yearB] = MyShuffle.bytesFromYear(year);
        expect(yearA).toBe(0x07);
        expect(yearB).toBe(0xE9);
    })
});

interface VisitCount {
    [key: number]: number
};

describe('117-day spans should contain each slogan at least once', () => {

    const mockCards = [
        {
            pointNum: "One",
            pointTitle: 'The first point',
            lojongNum: 1,
            lojongTitle: 'First, do something.',
        },
        {
            pointNum: "Two",
            pointTitle: 'The second point',
            lojongNum: 2,
            lojongTitle: 'Regard something.',
        },
        {
            pointNum: "Two",
            pointTitle: 'The second point',
            lojongNum: 3,
            lojongTitle: 'Examine something',
        },
        {
            pointNum: "Three",
            pointTitle: 'The third point',
            lojongNum: 4,
            lojongTitle: 'Think about something',
        },
    ];

    // returns: does the guarantee hold for this window?
    function checkSchedulingGuaranteeForWindow(window: DatedCard[]): boolean {
        const visited: VisitCount = {};
        for (const entry of window) {
            if (entry.card.lojongNum in visited) {
                visited[entry.card.lojongNum]++;
            } else {
                visited[entry.card.lojongNum] = 1;
            }
        }

        for (let lojongNum = 1; lojongNum <= mockCards.length; lojongNum++) {
            if (!(lojongNum in visited)) {
                return false;
            }
        }

        return true;
    }

    test('checkSchedulingGuaranteeForWindow', () => {
        function getDatedCard(day: number, lojongNum: number) : DatedCard{
            return {
                date: {year: 2025, month: 1, day},
                isToday: false,
                card: {
                    pointNum: "Point num",
                    pointTitle: 'Point title',
                    lojongNum,
                    lojongTitle: 'Lojong title.',
                },
            }
        }

        expect(checkSchedulingGuaranteeForWindow([
            getDatedCard(1, 1),
            getDatedCard(2, 2),
            getDatedCard(3, 3),
            getDatedCard(4, 4),
            getDatedCard(5, 1),
            getDatedCard(6, 2),
        ])).toBeTruthy();

        expect(checkSchedulingGuaranteeForWindow([
            getDatedCard(1, 2),
            getDatedCard(2, 3),
            getDatedCard(3, 4),
            getDatedCard(4, 1),
            getDatedCard(5, 2),
            getDatedCard(6, 3),
        ])).toBeTruthy();

        // lojong #1 is missing
        const window = [
            getDatedCard(1, 2),
            getDatedCard(2, 2),
            getDatedCard(3, 3),
            getDatedCard(4, 4),
            getDatedCard(5, 2),
            getDatedCard(6, 2),
        ];
        expect(checkSchedulingGuaranteeForWindow(window)).toBeFalsy();

        // lojong #1 is no longer missing
        window[5].card.lojongNum = 1;
        expect(checkSchedulingGuaranteeForWindow(window)).toBeTruthy();
    });

    // a "window of indices" is a list of N sequential indices, where N === windowSize.
    // windowsIndices is the list of every possible "window of indices", i.e.
    // if windowSize === 6, then windowsIndices ===
    //      [
    //          [ 0, 1, 2, 3, 4, 5 ],
    //          [ 1, 2, 3, 4, 5, 6 ],
    //          [ 2, 3, 4, 5, 6, 7 ],
    //          ...
    //      ];
    function getWindowsIndices(windowSize: number, numEntriesInSchedule: number) {
        // indices[i] === i
        const indices = (new Array(numEntriesInSchedule))
            .fill(undefined)
            .map((v, index) => index);

        const windowsIndices = indices
            .map((i) => indices.slice(i, i + windowSize))
            .filter((w) => w.length === windowSize);

        return windowsIndices;
    }

    test('getWindowsIndices', () => {
        const expected = [
            [ 0, 1, 2, 3, 4, 5 ],
            [ 1, 2, 3, 4, 5, 6 ],
            [ 2, 3, 4, 5, 6, 7 ],
            [ 3, 4, 5, 6, 7, 8 ],
            [ 4, 5, 6, 7, 8, 9 ],
            [ 5, 6, 7, 8, 9, 10 ],
            [ 6, 7, 8, 9, 10, 11 ],
            [ 7, 8, 9, 10, 11, 12 ],
            [ 8, 9, 10, 11, 12, 13 ],
            [ 9, 10, 11, 12, 13, 14 ],
            [ 10, 11, 12, 13, 14, 15 ]
          ]
        expect(getWindowsIndices(6, 16)).toEqual(expected);

    });

    // returns: does every lojong card appear at least once, for a given windowSize?
    function checkGuaranteeEveryWindow(hashSeed: number, windowSize: number) {

        const today = {year: 2025, month: 1, day: 2};
        const beginDate = {year: 2025, month: 1, day: 1};

        // Schedule the slogans
        const schedule: Ref<DatedCard[]> = ref([]);
        const cc = new CompassionCalendar(schedule, mockCards, today, beginDate, hashSeed);
        cc.padBelow();
        cc.padAbove();

        // Find every window (i.e., every sub-schedule from schedule of length windowSize)
        const windowsIndices = getWindowsIndices(windowSize, schedule.value.length);
        const windows = windowsIndices.map((indices) => {
            return indices.map((i) => schedule.value[i]);
        });
        
        // Does the scheduling guarantee hold for every possible window of the schedule?
        return windows.map(w => checkSchedulingGuaranteeForWindow(w)).every(result => result)
    }

    function checkGuaranteeEveryHashSeed(windowSize: number) {
        for (let hashSeed = 0; hashSeed < 1000; hashSeed++) {
            if (!checkGuaranteeEveryWindow(hashSeed, windowSize)) {
                return false;
            }
        }
        return true;
    }
    
    test('check slogan-scheduling guarantee', () => {
        // the guarantee should _always_ hold for windowSize = mockCards.length * 2 - 1
        let windowSize = mockCards.length * 2 - 1;
        expect(checkGuaranteeEveryHashSeed(windowSize)).toBeTruthy();

        // But, if windowSize is at least one item smaller, the guarantee should be
        // violated at least once.
        windowSize--;
        expect(checkGuaranteeEveryHashSeed(windowSize)).toBeFalsy();
    })
});

test('getNextDay', () => {
  expect(getNextDay({year: 2000, month: 2, day: 28})).toEqual(
    {year: 2000, month: 2, day: 29}
  );

  expect(getNextDay({year: 2000, month: 2, day: 29})).toEqual(
    {year: 2000, month: 3, day: 1}
  );

  expect(getNextDay({year: 2000, month: 3, day: 1})).toEqual(
    {year: 2000, month: 3, day: 2}
  );
  
  expect(getNextDay({year: 1900, month: 2, day: 28})).toEqual(
    {year: 1900, month: 3, day: 1}
  );

  expect(getNextDay({year: 2000, month: 12, day: 31})).toEqual(
    {year: 2001, month: 1, day: 1}
  );
});

test('getLojongIndices', () => {
    const hashSeed = undefined;
    const NUM_LOJONG = 5;

    // Two spot-check regression checks
    expect(getLojongIndices({year: 2000, month: 1, day: 1}, NUM_LOJONG, hashSeed)).toEqual(
        [1,2,3,4,0]
    );
    expect(getLojongIndices({year: 2000, month: 1, day: 6}, NUM_LOJONG, hashSeed)).toEqual(
        [2,1,3,0,4]
    );

    // statistical testing
    const NUM_SHUFFLES = 10000;
    const shuffles: number[][] = [];
    
    let date = {year: 2000, month: 1, day: 1};

    for (let i = 0; i < NUM_SHUFFLES;i ++) {
        const shuffled = getLojongIndices(date, NUM_LOJONG, hashSeed);
        date = getNextDay(date);
        shuffles.push(shuffled);
    }

    function percentSlotEquals(slot: number, index: number) {
        let count = 0;
        for (const shuf of shuffles) {
            if (shuf[slot] === index) {
                count += 1;
            }
        }
        return count / NUM_SHUFFLES;
    }

    const EPSILON = 0.01;
    const expectedMin = (1 / NUM_LOJONG) - EPSILON;
    const expectedMax = (1 / NUM_LOJONG) + EPSILON;

    // Slot 0
    // When you shuffle [0,1,2,3,4], shuffled[0] should equal 0 about 1/5th of the time
    const percentIndex0Equals0 = percentSlotEquals(0, 0);
    expect(percentIndex0Equals0).toBeGreaterThan(expectedMin);
    expect(percentIndex0Equals0).toBeLessThan(expectedMax);

    // When you shuffle [0,1,2,3,4], shuffled[0] should equal 1 about 1/5th of the time
    const percentIndex0Equals1 = percentSlotEquals(0, 0);
    expect(percentIndex0Equals1).toBeGreaterThan(expectedMin);
    expect(percentIndex0Equals1).toBeLessThan(expectedMax);

    // When you shuffle [0,1,2,3,4], shuffled[0] should equal 2 about 1/5th of the time
    const percentIndex0Equals2 = percentSlotEquals(0, 0);
    expect(percentIndex0Equals2).toBeGreaterThan(expectedMin);
    expect(percentIndex0Equals2).toBeLessThan(expectedMax);

    const percentIndex0Equals3 = percentSlotEquals(0, 0);
    expect(percentIndex0Equals3).toBeGreaterThan(expectedMin);
    expect(percentIndex0Equals3).toBeLessThan(expectedMax);

    const percentIndex0Equals4 = percentSlotEquals(0, 0);
    expect(percentIndex0Equals4).toBeGreaterThan(expectedMin);
    expect(percentIndex0Equals4).toBeLessThan(expectedMax);

    // Do some spot testing
    // Code review: more thorough test, rather than spot testing?

    // Slot 1
    // When you shuffle [0,1,2,3,4], shuffled[1] should equal 0 about 1/5th of the time
    const percentIndex1Equals0 = percentSlotEquals(1, 0);
    expect(percentIndex1Equals0).toBeGreaterThan(expectedMin);
    expect(percentIndex1Equals0).toBeLessThan(expectedMax);

    // Slot 3
    // When you shuffle [0,1,2,3,4], shuffled[3] should equal 4 about 1/5th of the time
    const percentIndex3Equals4 = percentSlotEquals(3, 4);
    expect(percentIndex3Equals4).toBeGreaterThan(expectedMin);
    expect(percentIndex3Equals4).toBeLessThan(expectedMax);

    // Slot 4
    // When you shuffle [0,1,2,3,4], shuffled[4] should equal 2 about 1/5th of the time
    const percentIndex4Equals2 = percentSlotEquals(4, 2);
    expect(percentIndex4Equals2).toBeGreaterThan(expectedMin);
    expect(percentIndex4Equals2).toBeLessThan(expectedMax);  
});

test('jumpDay', () => {
    expect(jumpDay({year: 2000, month: 1, day: 1}, -1)).toEqual(
        {year: 1999, month: 12, day: 31}
    );
    expect(jumpDay({year: 2000, month: 1, day: 2}, -4)).toEqual(
        {year: 1999, month: 12, day: 29}
    );
});

// Code review: `describe` does not show up as a top-level group
// in the command-line output.
describe('CompassionCalendar', () => {
    const mockCards = [
        {
            pointNum: "One",
            pointTitle: 'The first point',
            lojongNum: 1,
            lojongTitle: 'First, do something.',
        },
        {
            pointNum: "Two",
            pointTitle: 'The second point',
            lojongNum: 2,
            lojongTitle: 'Regard something.',
        },
        {
            pointNum: "Two",
            pointTitle: 'The second point',
            lojongNum: 3,
            lojongTitle: 'Examine something',
        },
    ];
    const beginDate = {
        year: 2025,
        month: 1,
        day: 1
    };
    const hashSeed = undefined;

    test('constructor', () => {
        const today = {year: 2025, month: 1, day: 2};
        const schedule = ref([]);
        const cc = new CompassionCalendar(schedule, mockCards, today, beginDate, hashSeed);

        const expected = ref([
            {date: {year: 2024, month: 12, day: 29}, isToday: false, card: mockCards[0]},
            {date: {year: 2024, month: 12, day: 30}, isToday: false, card: mockCards[2]},
            {date: {year: 2024, month: 12, day: 31}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 1}, isToday: false, card: mockCards[0]},
            {date: {year: 2025, month: 1, day: 2}, isToday: true, card: mockCards[2]},
            {date: {year: 2025, month: 1, day: 3}, isToday: false, card: mockCards[1]},
        ]);
        expect(cc.schedule).toEqual(expected);
    });
    test('padBelow', () => {
        const today = {year: 2025, month: 1, day: 2};
        const schedule = ref([]);
        const cc = new CompassionCalendar(schedule, mockCards, today, beginDate, hashSeed);

        cc.padBelow();
        const expected = ref([
            {date: {year: 2024, month: 12, day: 29}, isToday: false, card: mockCards[0]},
            {date: {year: 2024, month: 12, day: 30}, isToday: false, card: mockCards[2]},
            {date: {year: 2024, month: 12, day: 31}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 1}, isToday: false, card: mockCards[0]},
            {date: {year: 2025, month: 1, day: 2}, isToday: true, card: mockCards[2]},
            {date: {year: 2025, month: 1, day: 3}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 4}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 5}, isToday: false, card: mockCards[2]},
            {date: {year: 2025, month: 1, day: 6}, isToday: false, card: mockCards[0]},
        ]);
        expect(cc.schedule).toEqual(expected);
    });
    test('padBelow then padAbove', () => {
        const today = {year: 2025, month: 1, day: 2};
        const schedule = ref([]);

        const cc = new CompassionCalendar(schedule, mockCards, today, beginDate, hashSeed);
        cc.padBelow();
        cc.padAbove();
        const expected = ref([
            {date: {year: 2024, month: 12, day: 26}, isToday: false, card: mockCards[1]},
            {date: {year: 2024, month: 12, day: 27}, isToday: false, card: mockCards[0]},
            {date: {year: 2024, month: 12, day: 28}, isToday: false, card: mockCards[2]},
            {date: {year: 2024, month: 12, day: 29}, isToday: false, card: mockCards[0]},
            {date: {year: 2024, month: 12, day: 30}, isToday: false, card: mockCards[2]},
            {date: {year: 2024, month: 12, day: 31}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 1}, isToday: false, card: mockCards[0]},
            {date: {year: 2025, month: 1, day: 2}, isToday: true, card: mockCards[2]},
            {date: {year: 2025, month: 1, day: 3}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 4}, isToday: false, card: mockCards[1]},
            {date: {year: 2025, month: 1, day: 5}, isToday: false, card: mockCards[2]},
            {date: {year: 2025, month: 1, day: 6}, isToday: false, card: mockCards[0]},
        ]);
        expect(cc.schedule.value).toEqual(expected.value);
    });
});
