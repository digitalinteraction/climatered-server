import { TypedChow } from '../server'

import { HttpResponse } from '@robb_j/chowchow'

export default function postcard(chow: TypedChow) {
  //
  // GET /postcard
  //
  chow.route('get', '/postcard', async (ctx) => {
    const body = `
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solferino Air | Postcard</title>
    <meta content="website" property="og:type" />
    <meta content="https://solferinoair.com/postcard.jpg" property="og:image" />
    <meta content="https://solferinoair.com/" property="og:url" />
  </head>
  <body style="background: #111111;">
    <img src="https://solferinoair.com/postcard.jpg" style="margin: 50px;" />
  </body>
  <script>setTimeout(()=>{document.location='https://solferinoair.com/';},1000)</script>
  </html>
`

    return new HttpResponse(200, body, {
      'content-type': 'text/html; charset=UTF-8',
    })
  })
}
