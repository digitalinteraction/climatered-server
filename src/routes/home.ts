import { TypedChow } from '../server'

export default function home(chow: TypedChow) {
  const pkg = require('../../package.json')

  //
  // GET /
  //
  chow.route('get', '/', (ctx) => {
    //
    // Return an 'ok' and information about the deployment
    //
    return {
      message: 'ok',
      pkg: {
        name: pkg.name,
        version: pkg.version,
      },
    }
  })
}
