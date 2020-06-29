// Doesn't use import here so typescript doesn't process the file
const { name, version } = require('../package.json')

export const pkg = { name, version }
