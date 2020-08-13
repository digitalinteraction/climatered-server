import { TypedChow } from '../../server'
import { HttpMessage } from '@robb_j/chowchow'

export default function getSettings(chow: TypedChow) {
  //
  // GET /schedule/settings
  //
  chow.route('get', '/schedule/settings', async ({ schedule }) => {
    const settings = await schedule.getSettings()

    if (!settings) return new HttpMessage(400, 'Api not ready')

    return { settings }
  })
}
