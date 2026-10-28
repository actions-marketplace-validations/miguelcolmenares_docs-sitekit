# @miguelcolmenares/sitekit

Documentation sites that look like a product, published to GitHub Pages. A dark design system, a content
pipeline that reads your repository, and a scaffold you run once with `npx`.

- **Design system**: tokens and components built on Astro, Tailwind, shadcn/ui and lucide-react. The components are
  copied into your site, so you own them.
- **Your repository is the source**: `docs/`, `examples/` and `CHANGELOG.md` become pages. Relative links keep working
  on GitHub and on the site.
- **Safe to publish**: a closed config contract, and a check that scans the content and the built files for
  credentials and internal hosts, and for a private repository whose Pages site would be public.
- **No token, no private registry**: a generated site builds with public packages only, and does not depend on this CLI.
- **Static and fast**: every route is a real HTML file with its own title. Only the copy buttons and the mobile menu ship JavaScript.
- MIT licensed.

## Start

Run this in the root of the repository you want to document. It needs Node 22.23.4 or newer.

```bash
npx @miguelcolmenares/sitekit init
cd site && npm ci && npm run dev
```

`init` reads `package.json` and the git remote to fill `site/sitekit.config.json`, copies the site into `site/`, and writes
a GitHub Pages workflow to `.github/workflows/docs.yml`. It refuses a folder that already has files unless you pass `--force`,
and `--dry-run` shows what it would write.

## Commands

| Command                                 | What it does                                                                |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `sitekit init [--dir site] [--dry-run]` | Create the site, its config and the deploy workflow.                        |
| `sitekit check [--dist site/dist]`      | Scan the content and the built site, and check the repository's visibility. |
| `sitekit list`                          | List the components.                                                        |
| `sitekit add <component> [--force]`     | Copy a component and what it needs. A file you edited is kept.              |

## Content

| Source         | Becomes                  |
| -------------- | ------------------------ |
| `docs/**/*.md` | Pages under **Docs**     |
| `examples/`    | Pages under **Examples** |
| `CHANGELOG.md` | The **Changelog** page   |

A source that does not exist makes no page and no menu entry. The title is the frontmatter `title`, else the first `#` heading,
else the file name. The description is the frontmatter `description`, else the first paragraph of prose (badges, tables, quotes,
HTML and code are skipped). `order: 1` in the frontmatter moves a page up.

## Documentation

The documentation site is built with this kit. Read it under `docs/`: getting started, components, design tokens, content, deploying.

## Development

```bash
npm ci
npm test               # unit and integration
npm run test:e2e       # packs the package, generates a site, builds it, and drives it in a browser
npm run build:tokens   # regenerate the CSS from template/design/tokens.json
```

See [AGENTS.md](AGENTS.md) for the layout and the rules.

## Credits

Built on [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (MIT),
[Radix UI](https://www.radix-ui.com), [lucide](https://lucide.dev) (ISC) and the Geist fonts (OFL). The look takes its
direction from [skills.addy.ie](https://skills.addy.ie) by Addy Osmani: dark, mono labels, thin borders. Nothing of that site's code,
styles or text is used.

## License

[MIT](LICENSE)
