import { TypedChow } from '../../server'

export default function getSpeakers(chow: TypedChow) {
  //
  // GET /schedule/speakers
  //
  chow.route('get', '/schedule/speakers', async ({ schedule }) => {
    //
    // Get and return the speakers
    //
    return {
      speakers: await schedule.getSpeakers(),
    }
  })
}
