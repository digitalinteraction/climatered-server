import { TypedChow } from '../../server'
import { HttpMessage } from '@robb_j/chowchow'

export default function me(chow: TypedChow) {
  //
  // GET /me
  //
  chow.route('get', '/me', async ({ users, auth, request }) => {
    //
    // Get their authentication from the request they made (or fail)
    //
    const authToken = await auth.fromRequest(request)
    if (!authToken) return new HttpMessage(401, 'Not authorized')

    //
    // Get their attendee record based on the email in their jwt (or fail)
    //
    const user = await users.getRegistration(authToken.sub, true)
    if (!user) return new HttpMessage(401, 'Not authorized')

    //
    // Return the user
    //
    return { user }
  })
}
