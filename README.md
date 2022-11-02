## cf-qr

This is a spin-off from the [qr.muhl.is](https://github.com/ak-tr/qr.muhl.is) project allowing anyone to generate QR codes from by simply making a `GET` request to `https://qr.muhl.is/qr/*` where `*` may be any alphanumeric text of length less than 1852.

As of yet, the endpoint returns an SVG as `text/html`. A query parameter of `size` with a value between 64 and 2048 may be provided to specify the size of the returned SVG.

The project is hosted on Cloudflare Workers.