import { TypedChow } from '../../server'
import { HttpMessage } from '@robb_j/chowchow/dist'

export default function unregister(chow: TypedChow) {
  //
  // DELETE /me
  //
  chow.route('delete', '/me', async ({ request, auth, users }) => {
    //
    // Get the user's auth from the request or fail out
    //
    const authToken = await auth.fromRequest(request)
    if (!authToken) return new HttpMessage(401, 'Not authorized')

    //
    // Unregister that user
    //
    await users.unregister(authToken?.sub)
    return new HttpMessage(200, 'ok')
  })
}
