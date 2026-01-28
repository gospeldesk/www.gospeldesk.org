# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Gospel Desk is a Jekyll-based static website hosted on GitHub Pages. It presents Gospel readings with a custom navigation system.

## Development Commands

```bash
make              # Install dependencies and run dev server
make run          # Run Jekyll dev server with live reload, drafts, and future posts
make bundle       # Install dependencies via Bundler
make clean        # Remove installed gems
```

The dev server runs at http://localhost:4000 with `--livereload --drafts --future --incremental`.

## Content Workflow

**Create new draft post:**
```bash
bin/new "Post Title"  # Creates year/post-title/index.md with front matter
```

**Publish a draft:**
```bash
bin/pub year/post-title  # Moves to _posts with dated filename
```

**Prepare post for email:**
```bash
bin/prep  # Outputs latest post with absolute URLs for newsletter
```

## Architecture

**Jekyll Collections** (`_config.yml`):
- `_posts` - Blog posts (permalink: `/:year/:title/`)
- `_readings` - Gospel pericopes (permalink: `/readings/:slug/`)
- `_characters` - People in the Gospels (permalink: `/characters/:slug/`)
- `synaxis` - Synaxis pages (permalink: `/synaxis/:slug/`)

**Layouts** (`_layouts/`):
- `default.html` - Base layout with header, footer, Plausible analytics
- `page.html`, `post.html`, `reading.html`, `character.html`, `synaxis.html` - Content-specific layouts

**Data Pipeline** (`src/`):
- `source.txt` - Raw pericope definitions with character appearances
- `build-collections.py` - Parses `source.txt`, generates `_readings/` and `_characters/` files
- `gospels.csv` / `gospels.xml` - Bible text data
- `synaxis.csv` - Synaxis configuration

## Ruby Version

Uses Ruby 2.7.8 via Homebrew (`/opt/homebrew/Cellar/ruby@2.7/2.7.8_1/bin/bundle`). Versions specified in both `Gemfile` and `Makefile`.
