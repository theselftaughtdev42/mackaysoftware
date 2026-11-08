# mackaysoftware

Landing page for Mackay Software Limited. Static HTML, no dependencies, no framework.

## Build

```sh
make build     # content.json -> index.html
make serve     # build dist/, serve it on http://localhost:8000
make package   # dist/ -> mackaysoftware-<version>.tar.gz
make release   # tag HEAD with today's date (e.g. 2026.11.08) and push it
```

Packages are named after the newest release tag if HEAD has one,
otherwise the commit hash. Both refuse to run with uncommitted changes.
`index.html` is generated and not tracked.

`build.mjs` needs nothing but Node. Deploy the contents of `dist/` (or the
tarball) to any static host.

## Releases

Pushing a date tag (`make release`, or a tag made on GitHub) runs
`.github/workflows/release.yml`, which builds the site and publishes a GitHub
Release with `mackaysoftware-<tag>.tar.gz`, a `mackaysoftware.tar.gz` copy and
`SHA256SUMS`. The repo is public, so services can pull without credentials:

```sh
# newest release
curl -fsSL https://github.com/theselftaughtdev42/mackaysoftware/releases/latest/download/mackaysoftware.tar.gz | tar -xz -C /srv/site
# a specific release
curl -fsSLO https://github.com/theselftaughtdev42/mackaysoftware/releases/download/2026.11.08/mackaysoftware-2026.11.08.tar.gz
```
