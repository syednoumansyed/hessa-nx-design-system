# nx-fe

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Requirements

- Node version ^18.13.0 || ^20.9.0
- Angular CLi V17.0.1
- [Ionic CLI](https://ionicframework.com/docs/intro/cli)

## Steps to Run App locally

1. `npm install`
2. `ionic serve`

### NOTE

- If npm install give issue regarding `npm login`. Set below variables

```
export NPM_FONTAWESOME_AUTH_TOKEN=
```

## to generate new page, components, service, etc..

use `ionic generate` command in your cli

## Environment variables

Make sure to add below environment variable in your environment.ts file or in CI/CD environment config

- SENTRY_DSN
- BE_API_BASE_URL
- AUTH_API_BASE_URL

## Guides

- [Working with dates](./guides/dates.md)
- [Working with tables](./guides/table/table.md)
- [How to Use @Input() to Read Angular Route Parameters](https://www.freecodecamp.org/news/use-input-for-angular-route-parameters/)
- [Passing Data Between Components in Angular](https://medium.com/@reurairin/passing-data-between-components-in-angular-6230619fe0e3)
- [Angular Signals: Complete Guide](https://blog.angular-university.io/angular-signals/)

## Resources

- [Capacitor Android Documentation
  ](https://capacitorjs.com/docs/android)
- [Capacitor iOS Documentation
  ](https://capacitorjs.com/docs/ios)
- [fontawesome angular](https://github.com/FortAwesome/angular-fontawesome?tab=readme-ov-file)
- [Angular Callback Functions for Communication Between Components](https://www.bitovi.com/blog/angular-callback-functions-for-communication-between-components)
- [A Modern Sass Folder Structure](https://dev.to/dostonnabotov/a-modern-sass-folder-structure-330f)
- [Are Angular Signals safe for use in the template?](https://stackoverflow.com/questions/76814848/are-angular-signals-safe-for-use-in-the-template)
- [Should I use Signals for any variable I want to display in my Angular 17+ component?](https://stackoverflow.com/questions/77702648/should-i-use-signals-for-any-variable-i-want-to-display-in-my-angular-17-compon)

## LOCAL SETUP

Set

```
MOCK_ENABLED: false
```

when running locally
