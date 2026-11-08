FROM node:22-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS build
RUN apk add --no-cache make rsync
WORKDIR /src
COPY . .
RUN make dist

FROM scratch
COPY --from=build /src/dist/ /site/
