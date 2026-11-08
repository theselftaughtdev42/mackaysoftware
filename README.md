# mackaysoftware

Landing page for Mackay Software Limited. Static HTML, no dependencies, no framework.

## Build

```sh
make build     # content.json -> index.html
make serve     # build dist/, serve it on http://localhost:8000
make release   # tag HEAD with today's date (e.g. 2026.11.08) and push it
```

`index.html` is generated and not tracked. `build.mjs` needs nothing but Node.

## Releases

Releases are published by pushing a version tag (`make release`, or a date tag
made on GitHub). `.github/workflows/docker.yml` builds the `Dockerfile` and
publishes the image:

```
ghcr.io/theselftaughtdev42/mackaysoftware:<version>
```

The image is `FROM scratch` and holds only the built site under `/site`. Tags
must be on `main`; there is no `latest` tag. PRs build the image without pushing.

To check what the image contains:

```sh
docker build -t mackaysoftware .
cid=$(docker create mackaysoftware none) && docker export "$cid" | tar -t | grep '^site/'; docker rm "$cid"
```
