import { TypedChow } from '../../server'

export default function getTypes(chow: TypedChow) {
  //
  // GET /schedule/types
  //
  chow.route('get', '/schedule/types', async ({ schedule }) => {
    //
    // Get and return the types
    //
    return {
      types: await schedule.getTypes(),
    }
  })
}
