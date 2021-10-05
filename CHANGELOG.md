# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.1.0](https://github.com/digitalinteraction/climatered-server/compare/v3.0.1...v3.1.0) (2021-10-05)

### Features

- add endpoint to query verified attendes ([58e2a4d](https://github.com/digitalinteraction/climatered-server/commit/58e2a4dfa7feed0cdb925f128a0bc31f04dc2a95))

### [3.0.1](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0...v3.0.1) (2021-09-30)

### Bug Fixes

- fix verification email i18n ([4bb85b2](https://github.com/digitalinteraction/climatered-server/commit/4bb85b2c17eed400ef504775edadf39bced22fbb))

## [3.0.0](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0-beta.5...v3.0.0) (2021-09-30)

## [3.0.0-beta.5](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-09-30)

### Features

- add new "contact" content ([a1ba42f](https://github.com/digitalinteraction/climatered-server/commit/a1ba42f5ffde5591ddc6a53f265c548aa7f1c392))

### Bug Fixes

- **login:** no longer emits errors ([1e2a44e](https://github.com/digitalinteraction/climatered-server/commit/1e2a44e065245c79c6a8ba72ff3e009fe01b3dee))
- update email copy and split out ([db42ca6](https://github.com/digitalinteraction/climatered-server/commit/db42ca67b89ce8cdbcd441ea6b37e54a87b779d9))

## [3.0.0-beta.4](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-09-29)

### Features

- add command to read the live site visitors from socket.io and log it as a metric ([d251f3b](https://github.com/digitalinteraction/climatered-server/commit/d251f3bd0ff3bc67395ff3f993693250dcec412b))
- fetch interpret-help content ([08b39ff](https://github.com/digitalinteraction/climatered-server/commit/08b39ffc2d3fa98e719770c636539a0fafe934e0))

### Bug Fixes

- **pretalx:** command now fails if it fails to aquire a semaphore lock ([2f5554a](https://github.com/digitalinteraction/climatered-server/commit/2f5554a4ac9a56a8aa77738bdb64292e80b75430))
- server closes more smoothly by disconnecting from socket.io's redis clients ([658ebab](https://github.com/digitalinteraction/climatered-server/commit/658ebab33b2624029f49434961f729ad31efe859))

## [3.0.0-beta.3](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-09-28)

### Features

- add sampleRate option to rebuild-audio command ([e004858](https://github.com/digitalinteraction/climatered-server/commit/e0048586572530ef9eec3676957797073cb28e0b))
- pull interpreters from content repo ([65a7f92](https://github.com/digitalinteraction/climatered-server/commit/65a7f92572787fc5e3846ec92a3a3746adf5d66f))

### Bug Fixes

- add debug to InterpreterBroker ([c1460f5](https://github.com/digitalinteraction/climatered-server/commit/c1460f530e1282932a93941cc37a0f75c83e6fb2))
- increase sockets reliability ([36c29fe](https://github.com/digitalinteraction/climatered-server/commit/36c29fea1b3cf8aba5848ec97544d89c5e074ee9))

## [3.0.0-beta.2](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-09-24)

### Features

- **metrics:** add metrics admin-only route ([c3f725a](https://github.com/digitalinteraction/climatered-server/commit/c3f725a91abe1fbb74ed1528debf7a4ada9f7502))
- redirect verification errors to the client and send "already verified" emails ([24ecd45](https://github.com/digitalinteraction/climatered-server/commit/24ecd4516cc1a3ff7b7910f76680c34d2ba8a5a9))

## [3.0.0-beta.1](https://github.com/digitalinteraction/climatered-server/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2021-09-22)

### Features

- add metrics ([bc90bc2](https://github.com/digitalinteraction/climatered-server/commit/bc90bc29f4cffeaac80b68b15bebf4a8b73de6c6))

### Bug Fixes

- **metric:** fix initial metrics not captured ([7bb6900](https://github.com/digitalinteraction/climatered-server/commit/7bb6900d50768fa8cca6baae5272603e015b8a71))

## [3.0.0-beta.0](https://github.com/digitalinteraction/climatered-server/compare/v2.1.6...v3.0.0-beta.0) (2021-09-21)

### Features

- add "reuse" to fetch-content & fetch faqs ([a612dc2](https://github.com/digitalinteraction/climatered-server/commit/a612dc22418eb0ad40900ae57e0b644547536da3))
- add content command and endpoints ([f472ab6](https://github.com/digitalinteraction/climatered-server/commit/f472ab6b43a87cbea2d190ab062fd2c3bcf8c3b2))
- add content transforms ([14ef099](https://github.com/digitalinteraction/climatered-server/commit/14ef09916b463e8649bc6d930c7b639d774257bb))
- add fake-schedule command ([96d98e6](https://github.com/digitalinteraction/climatered-server/commit/96d98e63735cc03e8de389f8fb49ff99886d887c))
- add index route ([3d75e71](https://github.com/digitalinteraction/climatered-server/commit/3d75e718c792494d10a267ab5394152f6feac5c8))
- add whats-on endpoint for accepted/confirmed sessions ([bd3821d](https://github.com/digitalinteraction/climatered-server/commit/bd3821d999d6f0dc76e3dfc3e637750a75d74c12))
- fetch login content ([6853ff2](https://github.com/digitalinteraction/climatered-server/commit/6853ff2444fdeef955cc6bca92aa0afcadc781d8))
- fetch-content pulls if using --reuse ([6811b73](https://github.com/digitalinteraction/climatered-server/commit/6811b73a09b951bb2cc0ad69a53a0e9b0f58082d))
- first draft of pretalx scrape ([edaa6f4](https://github.com/digitalinteraction/climatered-server/commit/edaa6f404cf26482ee753008a496e89acb04ca61))
- improve content-scrape cli ([4e6cc47](https://github.com/digitalinteraction/climatered-server/commit/4e6cc47f44fc9265b73284dcf74b2804b708a7b2))
- moving to deconf toolkit ([051626c](https://github.com/digitalinteraction/climatered-server/commit/051626c65b906d8882a4e2dca4503146fe52ac2a))
- pull registered text ([e4b68b1](https://github.com/digitalinteraction/climatered-server/commit/e4b68b19200f165cbbc510461cfff5855747d2aa))
- randomise fake-schedule ([c81ea3f](https://github.com/digitalinteraction/climatered-server/commit/c81ea3f604efcb5af27e966fe41aa91963476289))
- send transactional emails ([1fc558f](https://github.com/digitalinteraction/climatered-server/commit/1fc558fc3ec3317e438ada4fe71641fa4cb5a685))
- update deconf-version ([4fec900](https://github.com/digitalinteraction/climatered-server/commit/4fec90009dd9d5339b26f501ccef8cf3b4f3ded5))

### Bug Fixes

- add i18n & res to container ([c84a363](https://github.com/digitalinteraction/climatered-server/commit/c84a3632217c1cc781ea4f99efb4aae1c5ac2030))
- fix #me and #finishRegister ([c520ed3](https://github.com/digitalinteraction/climatered-server/commit/c520ed3435aaaf0e609a3ecaafa90d32b78926f4))
- fix AttendanceRouter /me not working ([ac9a24c](https://github.com/digitalinteraction/climatered-server/commit/ac9a24cf0eca7c3349aa0ce39b6723156a1284fa))
- fix build ([af9cf96](https://github.com/digitalinteraction/climatered-server/commit/af9cf96a3a29c34e9d627225e3eda4a3f12efd3e))
- fix ConfRouter links ([706bdb4](https://github.com/digitalinteraction/climatered-server/commit/706bdb45e4b7ed77406b9ee9a2d7501f3d4a2a95))
- fix Dockerfile ([f7ea98e](https://github.com/digitalinteraction/climatered-server/commit/f7ea98e77fb0a95b25e70af939ba15038be00616))
- fix Dockerfile ENTRYPOINT ([aca2adf](https://github.com/digitalinteraction/climatered-server/commit/aca2adf71436f121177870e9cb5c49563b3fae14))
- fix fake-schedule duplicate speaker ids ([b729fa5](https://github.com/digitalinteraction/climatered-server/commit/b729fa5edf363c4d1427bae2f409d3a497c66125))
- fix i18n strings ([6d4812c](https://github.com/digitalinteraction/climatered-server/commit/6d4812cdfaa2fb4e23a4bcf1ce64925758e05b99))
- fix ics route ([48ee1e5](https://github.com/digitalinteraction/climatered-server/commit/48ee1e5b09d978ef584f8bc583390ef65deb3cbb))
- fix linter ([6703830](https://github.com/digitalinteraction/climatered-server/commit/67038302610c2eb27294810324ecb771427ba0e3))
- fix login ([0ae3167](https://github.com/digitalinteraction/climatered-server/commit/0ae3167a1401315c8e2f1cb7a34a424b1c55c2cb))
- fix pretalx scrape relations ([60aab6b](https://github.com/digitalinteraction/climatered-server/commit/60aab6b709e078b0c7d88e74a0e7647596dca8f5))
- improve fake-schedule algorithm ([d4c8655](https://github.com/digitalinteraction/climatered-server/commit/d4c86550f57bf8148149f1152bad8ee7edac145b))
- remove i18n from Dockerfile ([81c65a1](https://github.com/digitalinteraction/climatered-server/commit/81c65a1460277faf2f775ee94e89dfe751400359))
- set fake-schedule layout=workshops ([a017e91](https://github.com/digitalinteraction/climatered-server/commit/a017e9154476562e75cb948d7aa4da53cd0faf14))
