import { TypedChow } from '../../server'

export default function getTracks(chow: TypedChow) {
  //
  // GET /schedule/tracks
  //
  chow.route('get', '/schedule/tracks', async ({ schedule }) => {
    //
    // Get and return the tracks
    //
    return {
      tracks: await schedule.getTracks(),
    }
  })
}
