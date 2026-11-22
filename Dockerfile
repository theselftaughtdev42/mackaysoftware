FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build
RUN apk add --no-cache make rsync
WORKDIR /src
COPY . .
RUN make dist

FROM scratch
COPY --from=build /src/dist/ /site/
