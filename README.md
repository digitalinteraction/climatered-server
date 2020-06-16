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
# Run the dev server
# -> Runs on port 3000
# -> Exit with control+C
# -> Exit and run again if code changes
npm run dev serve
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

This is a very rough prototype, there aren't any unit tests.
If there were, you would run them like this:

```bash
# Run the tests
npm test -s

# Generate code coverage
npm run coverage -s
```

### Irregular use

These are commands you might need to run but probably won't, also in no particular order.

```bash
# See what the CLI can dp
npm run dev -- --help

# Generate the table-of-contents in this readme
npm run readme-toc
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

### Deployment

> WIP

**env vars**

- `SENDGRID_API_KEY`
- `SENDGRID_FROM`
- `JWT_SECRET`
- `SELF_URL`
- `WEB_URL`
- `CORS_HOSTS`
- `ENABLE_ACCESS_LOGS`
- `DEBUG=api*`

---

> This project was set up by [puggle](https://npm.im/puggle)
