import QRCode from "qrcode";
import { Obj } from "itty-router";

const allowedQueryParams = ["size"];

export const usageText = `
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

github: "https://github.com/ak-tr/cf-qr"`

export const parseURL = (url: string) => {
  const queryParamChar = url.indexOf("?");
  const data = url.substring(
    url.indexOf("/qr/") + 4,
    queryParamChar == -1 ? undefined : queryParamChar
  );

  return data;
}

export const getUnknownProps = (query: Obj) => {
  const unknownPropInQueryParams = Object.keys(query).reduce((arr, prop) => {
    if (!allowedQueryParams.includes(prop)) {
      arr.push(prop);
    }
    return arr;
  }, [] as string[]);

  return unknownPropInQueryParams;
}

export const generateQRCode = async (text: string, size?: number) => {
  console.log("Generating QR code");
  return await QRCode.toString(text, {
    width: size,
    errorCorrectionLevel: "H",
    margin: 0,
    type: "svg",
  });
};

export const generateResponse = (errorMsg: string, headers: Record<string, unknown>) => {
  return new Response(stringify({ error: errorMsg }), headers);
}

export const stringify = (obj: Record<string, unknown>) =>
  JSON.stringify(obj, null, 4);

