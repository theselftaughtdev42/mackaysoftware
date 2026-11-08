.PHONY: help build dist package release serve clean check-clean

DIST    := dist
# Newest tag on HEAD if there is one, otherwise the short commit hash.
VERSION ?= $(shell t=$$(git tag --points-at HEAD --sort=-v:refname | head -1); [ -n "$$t" ] && echo $$t || git rev-parse --short HEAD)
TARBALL  = mackaysoftware-$(VERSION).tar.gz
FILES   := index.html styles.css logos mackay-design-system/tokens.css

help:    ## List commands
	@grep -E '^[a-z]+:.*##' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  %-8s %s\n", $$1, $$2}'

build:   ## Generate index.html from content.json
	node build.mjs

dist: build ## Copy only the files the site needs into dist/
	rm -rf $(DIST)
	mkdir -p $(DIST)
	rsync -aR $(FILES) $(DIST)/

package: check-clean dist ## Zip dist/ into a versioned tarball plus SHA256SUMS
	tar -czf $(TARBALL) -C $(DIST) .
	shasum -a 256 $(TARBALL) > SHA256SUMS
	@echo "$(TARBALL)"

# Tags HEAD with today's date (YYYY.MM.DD; .2, .3… for repeats that day) and pushes
# the tag. CI (.github/workflows/release.yml) builds and publishes the release.
release: check-clean ## Tag HEAD with a date version and push it to trigger a CI release
	@set -e; \
	tag=$$(git tag --points-at HEAD --sort=-v:refname | head -1); \
	if [ -n "$$tag" ]; then echo "HEAD is already tagged $$tag; pushing it"; else \
	  base=$$(date +%Y.%m.%d); tag=$$base; n=1; \
	  while git rev-parse -q --verify "refs/tags/$$tag" >/dev/null; do n=$$((n+1)); tag=$$base.$$n; done; \
	  git tag -a "$$tag" -m "Release $$tag"; echo "tagged $$tag"; \
	fi; \
	git push origin "refs/tags/$$tag"

serve: dist ## Serve dist/ on http://localhost:8000
	python3 -m http.server 8000 -d $(DIST)

clean:   ## Remove build output
	rm -rf $(DIST) mackaysoftware*.tar.gz SHA256SUMS

check-clean:
	@git diff-index --quiet HEAD -- || { echo "Uncommitted changes. Commit or stash them first." >&2; exit 1; }
