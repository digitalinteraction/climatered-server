import { TypedChow } from '../../server'

export default function getSlots(chow: TypedChow) {
  //
  // GET /schedule/slots
  //
  chow.route('get', '/schedule/slots', async ({ schedule }) => {
    //
    // Get and send back the schedule's slots
    //
    const slots = await schedule.getSlots()
    slots.sort((a, b) => a.id.localeCompare(b.id))
    return { slots }
  })
}
