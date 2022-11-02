/*

                       .::.
                  .:'  .:
        ,MMM8&&&.:'   .:'
       MMMMM88&&&&  .:'
      MMMMM88&&&&&&:'
      MMMMM88&&&&&&
    .:MMMMM88&&&&&&
  .:'  MMMMM88&&&&
.:'   .:'MMM8&&&'
:'  .:'
'::'    ak-tr

  QR code generator using qrcode.js deployed onto
  Cloudlfare as a Cloudflare Worker.

  Made purely for fun and to further expand knowledge on
  deploying code to Cloudlfare Workers.

*/

import { Request, Router } from "itty-router";
import { createCors } from "itty-cors";
import * as utils from "./utils";

const { preflight, corsify } = createCors({ origins: ["*"] });

const router = Router();

const headers = {
  json: { headers: { "Content-Type": "application/json" } },
  html: { headers: { "Content-Type": "text/html" } },
  yaml: { headers: { "Content-Type": "text/yaml" } },
};

router.get("/qr/*", preflight, async (request: Request) => {
  console.log("Hitting qr route");

  // Parse data from URL
  const data = utils.parseURL(request.url);

  if (data.length == 0) {
    return new Response(utils.usageText, headers.yaml);
  }

  // Don't allow more than 1852 characters
  if (data.length > 1852) {
    return utils.generateResponse(
      "Cannot have more than 1852 characters with high error correction",
      headers.json
    );
  }

  // Get query parameters from request
  const { query } = request;
  // Set default size to 500
  let size: number = 500;

  // Check for query object and existence of key/value pairs
  if (query && Object.keys(query).length > 0) {
    // Check for any unknown props in query params
    const unknownPropInQueryParams = utils.getUnknownProps(query);

    // If there are any unknown props, return error
    if (unknownPropInQueryParams.length > 0) {
      return utils.generateResponse(
        `Unknown query parameters: ${unknownPropInQueryParams.join(", ")}`,
        headers.json
      );
    }

    // If requested size is less than 64 or more than 2048, return error
    if (+query.size < 64 || +query.size > 2048) {
      return utils.generateResponse(
        "Size must be between 64 and 2048",
        headers.json
      );
    }

    // Otherwise, assign size to size from query params
    size = +query.size;
  }

  // Generate SVG QR Code
  const qrCodeAsSVGString = await utils.generateQRCode(
    decodeURIComponent(data),
    size
  );

  // Return response as HTML
  return new Response(qrCodeAsSVGString, headers.html);
});

router.all("*", preflight, () => {
  return new Response();
});

export default {
  async fetch(request: Request): Promise<Response> {
    return await router.handle(request).then(corsify);
  },
};
