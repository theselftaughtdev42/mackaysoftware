FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS build
RUN apk add --no-cache make rsync
WORKDIR /src
COPY . .
RUN make dist

FROM scratch
COPY --from=build /src/dist/ /site/
