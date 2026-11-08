.PHONY: help build dist package serve clean

DIST    := dist
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
FILES   := index.html styles.css logos mackay-design-system/tokens.css

help:    ## List commands
	@grep -E '^[a-z]+:.*##' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  %-8s %s\n", $$1, $$2}'

build:   ## Generate index.html from content.json
	node build.mjs

dist: build ## Copy only the files the site needs into dist/
	rm -rf $(DIST)
	mkdir -p $(DIST)
	rsync -aR $(FILES) $(DIST)/

package: dist ## Zip dist/ into a versioned tarball
	tar -czf mackaysoftware-$(VERSION).tar.gz -C $(DIST) .
	@echo "mackaysoftware-$(VERSION).tar.gz"

serve: dist ## Serve dist/ on http://localhost:8000
	python3 -m http.server 8000 -d $(DIST)

clean:   ## Remove build output
	rm -rf $(DIST) mackaysoftware-*.tar.gz
