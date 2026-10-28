---
order: 5
---

# Deploying

The site is static, so GitHub Pages serves it directly.

## GitHub Pages

Set the repository to publish from GitHub Actions, and keep `site.base` equal to `/<repository>/` in `sitekit.config.json`.

## Check before you publish

```bash
npx @miguelcolmenares/sitekit check --dist dist
```

It rebuilds the content, scans it and the built files for credentials and internal hosts, and checks the repository visibility. A private repository's Pages site is public, so the check fails until you say that is intended.
