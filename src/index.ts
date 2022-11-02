import QRCode from "qrcode";
import { Request, Router } from "itty-router";
import { createCors } from "itty-cors";

const { preflight, corsify } = createCors({ origins: ["*"] });



const router = Router();
const allowedQueryParams = ["size"];
const headers = {
  json: { headers: { "Content-Type": "application/json" } },
  html: { headers: { "Content-Type": "text/html" } },
  yaml: { headers: { "Content-Type": "text/yaml" } },
};

router.get("/qr/*", preflight, async (request: Request) => {
  console.log("Hitting qr route");
  // Parse data from URL
  const data = request.url.substring(request.url.indexOf("/qr/") + 4);

  if (data.length == 0) {
    return new Response(`
# You are seeing this because you have provided no data to generate a
# QR code. Read the usage below.

name: qr-cf

description: >
  You may use this endpoint to generate QR codes from alphanumeric text
  There are currently no restrictions to its usage - apart from the
  100,000 request/day limit on the Cloudflare Workers free plan.

usage:
  baseUrl: "https://qr.muhl.is/qr/*"
  accepts: "Any alphanumeric character combination."
  queryParams:
    size:
      usage: "size?=256"
      example: "https://qr.muhl.is/qr/foo?size=128"
      limits: "Value must be between 64 and 2048."
  returns: "SVG in text/html format."

github: "https://github.com/ak-tr/cf-qr"`, headers.json);
  }

  // Don't allow more than 1852 characters
  if (data.length > 1852) {
    return new Response(
      stringify({
        error:
          "Cannot have more than 1852 characters with high error correction",
      }),
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
    const unknownPropInQueryParams = Object.keys(query).reduce((arr, prop) => {
      if (!allowedQueryParams.includes(prop)) {
        arr.push(prop);
      }
      return arr;
    }, [] as string[]);

    // If there are any unknown props, return error
    if (unknownPropInQueryParams.length > 0) {
      return new Response(
        stringify({
          error: `Unknown query parameters: ${unknownPropInQueryParams.join(
            ", "
          )}`,
        }),
        headers.json
      );
    }

    // If requested size is less than 64 or more than 2048, return error
    if (+query.size < 64 || +query.size > 2048) {
      return new Response(
        stringify({ error: "Size must be between 64 and 2048" }),
        headers.json
      );
    }

    // Otherwise, assign size to size from query params
    size = +query.size;
  }

  // Generate SVG QR Code
  const qrCodeAsSVGString = await getQRCode(decodeURIComponent(data), size);
  return new Response(qrCodeAsSVGString, headers.html);
});

router.all("*", preflight, () => {
  return new Response();
});

const getQRCode = async (text: string, size?: number) => {
  console.log("Generating QR code");
  return await QRCode.toString(text, {
    width: size,
    errorCorrectionLevel: "H",
    margin: 0,
    type: "svg",
  });
};

const stringify = (obj: Record<string, unknown>) =>
  JSON.stringify(obj, null, 4);

export default {
  async fetch(request: Request): Promise<Response> {
    return await router.handle(request).then(corsify);
  },
};
