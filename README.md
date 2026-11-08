# mackaysoftware

Landing page for Mackay Software Limited. Static HTML, no dependencies, no framework.

## Build

```sh
make build     # content.json -> index.html
make serve     # build dist/, serve it on http://localhost:8000
make package   # dist/ -> mackaysoftware-<version>.tar.gz
make release   # tag HEAD with today's date (e.g. 2026.11.08), then package
```

Packages are named after the newest release tag if HEAD has one,
otherwise the commit hash. Both refuse to run with uncommitted changes.
`index.html` is generated and not tracked.

`build.mjs` needs nothing but Node. Deploy the contents of `dist/` (or the
tarball) to any static host.
