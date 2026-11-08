# mackaysoftware

Landing page for Mackay Software Limited. Static HTML, no dependencies, no framework.

## Build

```sh
make build     # content.json -> index.html
make serve     # build dist/, serve it on http://localhost:8000
make package   # dist/ -> mackaysoftware-<version>.tar.gz
```

`build.mjs` needs nothing but Node. Deploy the contents of `dist/` (or the
tarball) to any static host.
