# ifrc-vconf-api

A prototype API for the ifrc's virtual conference, designed to:

- Protect zoom links to only give them out to registered participants
- Scope out the data we need to have/store/serve to the webapp

<!-- toc-head -->

## Table of contents

- [Development](#development)
  - [Setup](#setup)
  - [Regular use](#regular-use)
  - [Testing](#testing)
  - [Irregular use](#irregular-use)
  - [Code formatting](#code-formatting)
- [Deployment](#deployment)
  - [env vars](#env-vars)

<!-- toc-tail -->

## Development

### Setup

To develop on this repo you will need to have [Docker](https://www.docker.com/) and
[node.js](https://nodejs.org) installed on your dev machine and have an understanding of them.
This guide assumes you have the repo checked out and are on macOS, but equivalent commands are available.

You'll only need to follow this setup once for your dev machine.

```bash
# Setup your dev environment
# -> Fill in the values in your favourite text editor
# -> Ask Rob for a SENDGRID_API_KEY
cp .env.example .env

# Install node.js dependencies
npm install
```

### Regular use

These are the commands you'll regularly run to develop the API, in no particular order.

```bash
# Start the docker dev stack
# -> It runs a redis instance for socket.io to use and to store authentications
# -> It runs postgres on localhost (see docker-compose.yml for connection details)
# -> Remember "docker-compose down" afterwards to stop and remove containers
# -> Runs in headless mode (-d)
docker-compose up -d

# Run the content scraper
# -> Clones the schedule locally
# -> Reads in content and validates it
# -> Puts it into redis for the api
npm run dev scrape-content

# Run database migrations
# -> Connects to database from .env
# -> Sets up and maintains 'migrations' table to track migrations
# -> Runs any new migrations
npm run dev migrate

# Run the dev server
# -> Runs on port 3000
# -> Exit with control+C
# -> Exit and run again if code changes
npm run serve

# Run the cli
# -> npm run serve uses this under the hood
# -> Can add more uses/entrypoints in the future
npm run dev # ...
```

To run through an auth flow:

```bash
# Request a login token
# -> Example using httpie.org
http :3000/login/email email==rob@andrsn.uk

# Extract token from email
TOKEN=...

# Get an authentication token
http :3000/login/email/callback token==$TOKEN
```

### Testing

There are unit tests alongside code in `__tests__` directories
and integration tests in the `tests/` top-level directory.
Tests are using [Jest](https://jestjs.io/)

> Roughly, unit tests use jest's `it` and integration tests use `test`

```bash
# Run the tests
npm run test

# Generate code coverage
npm run coverage

# View the coverage report
open coverage/lcov-report/index.html
```

### Irregular use

These are commands you might need to run but probably won't, also in no particular order.

```bash
# See what the CLI can dp
npm run dev -- --help

# Manually build JavaScript from TypeScript
npm run build

# Manually run lint source code
npm run lint

# Generate the table-of-contents in this readme
npm run readme-toc

# Reset the jest cache
npx jest --clearCache

# Generate an authentication token
# -> pass --email user@example.com to specify an email
# -> pass --url to output it as a login url instead
# -> pass --lang en/fr/es/ar to specify a user_lang
npm run dev fake-auth
```

### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code to a consistent standard.
It works using the [yorkie](https://www.npmjs.com/package/yorkie)
and [lint-staged](https://www.npmjs.com/package/lint-staged) packages to
automatically format code whenever it is commited.
This means that code that is pushed to the repo is always formatted to a consistent standard
and you don't spend time worrying about code formatting.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [package.json#prettier](/package.json) under `"prettier"`
and can ignores files using [.prettierignore](/.prettierignore).

### Useful links

- https://sendgrid.com/docs/for-developers/sending-email/using-handlebars/

## Deployment

To deploy a new version, use the [npm version](https://docs.npmjs.com/cli/version) command.

```bash
npm version # minor | major | patch | --help
git push --follow-tags
```

This command will bump the version in the package.json, commit that change
and tag that commit with the new version.
When that tag is pushed to git, a GitHub action will automatically
build a docker image at that point in the git history.

This means that we have semantic versions for every change
and they can easily be deployed.

### env vars

**required**

- `SENDGRID_API_KEY`
- `SENDGRID_FROM`
- `SENDGRID_TRANSACTIONAL_TEMPLATE_ID`
- `JWT_SECRET`
- `SELF_URL`
- `WEB_URL`
- `REDIS_URL`
- `SQL_URL`

**optional**

- `CORS_HOSTS`
- `ENABLE_ACCESS_LOGS`
- `DEBUG=api*`

## Future work

- send an email when a scrape fails

---

> This project was set up by [puggle](https://npm.im/puggle)
