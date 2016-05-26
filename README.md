# RxPoller

### Install

```sh
npm i webpack typings typescript -g
git clone git@github.com:jasonaden/rx-poller.git
cd rx-poller
npm install
npm test
```

Then it will automatically run the tests in Chrome

To run tests with a watcher (for development)

```sh
npm run test-watch
```

Coverage

```sh
open reports/coverage/index.html
```

Creating Docs
```sh
typedoc --ignoreCompilerErrors -m commonjs --out ./doc/ src/modules/desk/services/RxPoller.ts
typedoc --ignoreCompilerErrors -m commonjs --out ./doc/ src/modules
```