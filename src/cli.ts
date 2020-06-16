import yargs = require('yargs')
import jwt = require('jsonwebtoken')
import { validateEnv } from 'valid-env'
import { runServer } from './server'

yargs.help().alias('h', 'help').demandCommand().recommendCommands()

yargs.command(
  'serve',
  'Run the api server',
  (yargs) => yargs,
  async (args) => {
    try {
      await runServer()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
)

yargs.command(
  'fake-auth',
  '',
  (yargs) => yargs,
  (args) => {
    validateEnv(['JWT_SECRET'])
    console.log(
      jwt.sign({ typ: 'auth', sub: 'rob@andrsn.uk' }, process.env.JWT_SECRET!)
    )
  }
)

yargs.parse()
