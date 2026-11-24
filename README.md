# manojkumbhar.com

Public template for a one-page personal site. The layout, type, color, and motion are fixed. The words, portrait, and trip media come from a content folder.

`npm run build` with nothing else configured builds the fictional **Alex Sample** profile in `content/sample`. That is the page this repository can preview on its own. The real site is produced when Vercel builds this repo with a read-only token for a separate private content repository. Real copy and media stay in that private repository and are not part of this git history.

## Build

Node.js 20 or newer. There are no npm dependencies.

```bash
npm run build
npm run preview
```

`npm run preview` serves `dist/` at <http://127.0.0.1:4173>. `npm test` builds the sample profile and checks the safety switches below.

## Content folder

A content folder looks like this:

```text
site.json
assets/portrait.jpg
assets/trips/glass-lake.jpg
assets/trips/red-canyon.jpg
```

The portrait file name and the trip file names are whatever `site.json` points at. The build copies only those files into `dist/assets/` and writes `dist/assets/trips/trips.json` for the hero slideshow. The slideshow shows the first five trips.

`content/sample/site.json` is a complete example. Copy it and replace every string and image.

### site.json

`schemaVersion` must be `1`.

| Key | What it fills |
| --- | --- |
| `site` | `<title>`, meta description, language, footer tagline, theme storage key, and the `~/handle.suffix` crumb |
| `profile` | Name, portrait file, alt text, sidebar line, status, headline, prompt, intro, and the two location labels |
| `navigation` | Sidebar links. Include an item with `"id": "top"`. `icon` is one of `home`, `now`, `notes`, `projects`, `about`, `beyond`, `experience`, `contact` |
| `topMenu` | Links in the top bar |
| `social` | Sidebar icons, in sidebar order. `icon` is one of `mail`, `linkedin`, `github`, `x`, `link`. Optional `ariaLabel` and `title` |
| `contact.links` | Contact rows, in their own order. Each has `label`, `href`, and `short` |
| `now` | The dark strip and the cards under it. Four cards match the grid |
| `cta` | Hero buttons. `style` is `solid` or `ghost` |
| `heroTrip` | The kicker and the two stats under the trip photo |
| `explore`, `notes`, `about`, `projects`, `beyond`, `experience`, `contact` | Those sections |
| `trips` | Hero slideshow. `type` is `image` or `video` |

A project `statusKind` is `prog` (teal), `built` (accent), or `""` (plain). One project may include `"demo": { "type": "carryover", "title": "...", "badge": "..." }`, which mounts the on-page addition widget.

An image trip is `{ "type": "image", "src", "alt", "caption", "trip", "year" }`. A video trip adds `"poster"` and an optional `"srcWebm"`. Optional `"objectPosition"` is a simple value such as `"center 30%"`. Put the newest trip first. Photos work best as portraits (JPEG or WebP). A video is a short muted MP4, an optional WebM, and a poster still. Strip location metadata from files before they go into a content repo you might publish.

## Which content the build uses

The build picks exactly one source:

1. **`SITE_DATA_REPO` and `SITE_DATA_TOKEN`.** The Vercel path. The repo wins even if a local folder is also present, so a forgotten directory cannot override production. If the repo variable is set and the token is missing or GitHub rejects the download, the build **exits with an error**. It does not publish the sample site in that case.
2. **`SITE_DATA_DIR`.** A local folder that contains `site.json`. Used only when `SITE_DATA_REPO` is unset.
3. **`content/private/`.** Same shape as the sample folder. Gitignored, so a local copy of private content is not committed by accident.
4. **`content/sample/`.** The fictional profile.

If a `.env` file exists, the build reads `SITE_DATA_*` names from it when they are not already set in the environment. `.env` is gitignored. Start from `.env.example`.

## Vercel

Import this repository. `vercel.json` sets the build command to `npm run build` and the output directory to `dist`. The install step can stay the default `npm install`. Use Node.js 20 or newer.

### Environment variables

| Name | Required | Example | Purpose |
| --- | --- | --- | --- |
| `SITE_DATA_REPO` | To use private content | `manojkumbhar/manojkumbhar-site-data` | `owner/repo`, or a `github.com` URL to that repo |
| `SITE_DATA_TOKEN` | Whenever `SITE_DATA_REPO` is set | stored only in Vercel | Read-only access to that one repository |
| `SITE_DATA_REF` | No | `main` | Branch, tag, or commit. Defaults to `main` |

Mark `SITE_DATA_TOKEN` as Sensitive. Set the three variables on **Production** so the live site is built from the private repo.

On **Preview**, leave them unset if a pull request on this public repo should keep showing Alex Sample. Setting them on Preview puts the private copy on that preview URL. The token is still not committed.

With the variables unset, Vercel builds the sample site.

### Token

Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens):

- Resource owner: the account that owns the content repository
- Repository access: **Only select repositories** → `manojkumbhar-site-data`
- Repository permissions: **Contents: Read-only**
- Account permissions: none

The build requests:

```http
GET https://api.github.com/repos/<owner>/<repo>/tarball/<ref>
Authorization: Bearer <SITE_DATA_TOKEN>
Accept: application/vnd.github+json
```

It follows GitHub's download redirect, unpacks the tarball, and looks for `site.json`. The token stays in the build environment. It is not printed and it is not written into `dist/`.

## What must not land in this repo

Do not commit a real biography, portrait, trip photo, trip video, email address, phone number, or token. `content/private/`, `.env`, and `dist/` are gitignored. `npm test` checks that those paths stay ignored and that a build with `SITE_DATA_REPO` set but no token fails instead of falling back to sample data.
