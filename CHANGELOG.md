# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `sitekit init`, `check`, `list` and `add`.
- A dark design system on Astro, Tailwind, shadcn/ui and lucide-react: tokens, header, hero, section headers, cards, feature grid,
  flow diagram, command table, callouts, footer, doc layout with table of contents, and copy buttons.
- A content pipeline that turns `docs/`, `examples/` and `CHANGELOG.md` into pages, rewrites relative links, and fails on two files that
  would get the same route.
- A publish check: credentials and internal hosts in content and built files, repository visibility, and the shape of the output.
- Pack-and-install verification and Playwright end-to-end tests on a phone and a desktop, including measured WCAG contrast,
  touch targets, scrollable code blocks and keyboard use.
