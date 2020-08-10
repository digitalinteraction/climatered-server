import { TypedChow } from '../../server'

export default function getThemes(chow: TypedChow) {
  //
  // GET /schedule/themes
  //
  chow.route('get', '/schedule/themes', async ({ schedule }) => {
    //
    // Get and return the themes
    //
    return {
      themes: await schedule.getThemes(),
    }
  })
}
