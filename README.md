# mackaysoftware

Landing page for Mackay Software Limited. Static HTML, no dependencies, no framework.

## Build

```sh
npm run build     # content.json -> index.html
npm run serve     # build, then serve on http://localhost:8000
```

`build.mjs` needs nothing but Node. Commit the generated `index.html` so the
repository can be deployed as static files with no build step on the host.
