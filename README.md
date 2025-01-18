# lojong-calendar

# Copyrights and license
1. The contents of this project are dedicated to the public domain, except where otherwise noted
2. The heart logo (`logo./public/favicon.png` and `./src/assets/heart.png`) is dedicated to the public domain, and available from https://commons.wikimedia.org/wiki/File:Red_heart_pulse.svg
3. The 59 Lojong slogans were orginally written in Tibetan, about a thousand years ago. However, my favorite English translation of the slogans is copyright protected by Diana J. Mukpo and the Nalanda Translation Committee.  Therefore, I do not distribute the copyrighted English slogans with this project. However, on my local computer, I use the translated slogans, which I believe constitutes "fair use" under United States copyright law.
4. `CompassionCalendar.ts` and `CalendarEntry.vue` contain three snippets from Stack Overflow, which are licensed by the Creative Commons Attribution-ShareAlike license
    - https://stackoverflow.com/help/licensing
    - https://creativecommons.org/licenses/by-sa/4.0/

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
