# Push to GitHub & publish to npm

Same flow as [`prompt-protection`](https://github.com/mughalhere/prompt-protection) / [`react-crash-guard`](https://github.com/mughalhere/react-crash-guard): code lives on GitHub; **pushing a version tag** publishes to npm via Actions.

Remote: `git@github.com:mughalhere/streamguard-react.git`

---

## 0. First npm publish (do this before GitHub Actions tokens)

Create the package on the registry once from your laptop (where `npm whoami` works). Granular tokens can only be scoped after the package exists.

From the **portfolio** repo root on this branch:

```bash
npm whoami   # must print your npm username
./scripts/first-npm-publish.sh
```

Or per package:

```bash
cd packages/PACKAGE_NAME
npm ci
npm run prepublishOnly
npm publish --access public
```

Then create package-scoped tokens on npm and add `NPM_TOKEN` to each GitHub repo. Later releases use version tags (section 3 below).

---

## 1. First-time push to GitHub

### Option A — from this package folder

```bash
cd packages/streamguard-react
git init -b main
git add .
git commit -m "chore: initial streamguard-react release"
git remote add origin git@github.com:mughalhere/streamguard-react.git
git push -u origin main
```

### Option B — preserve staggered history (recommended)

From the portfolio repo root:

```bash
./scripts/push-from-bundles.sh
# or just streamguard-react:
git clone oss-bundles/streamguard-react.bundle /tmp/streamguard-react
cd /tmp/streamguard-react
git remote add origin git@github.com:mughalhere/streamguard-react.git
git push -u origin main
```

Confirm: https://github.com/mughalhere/streamguard-react

---

## 2. One-time npm / Actions setup

1. On [npmjs.com](https://www.npmjs.com/) create an **automation** (or granular) token that can publish `streamguard-react`.
2. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `NPM_TOKEN`
   - Value: the npm token
3. Optional: enable trusted publishing / provenance on npm for this package.

---

## 3. Publish a version to npm

Peer dependency: **React 18+** (not bundled).

1. Land changes on `main` (PR + green CI).
2. Bump `version` in `package.json` and update `CHANGELOG.md`.
3. Push a version tag:

```bash
git checkout main && git pull
git tag v0.1.0
git push origin v0.1.0
```

4. **Publish to npm** (`.github/workflows/publish.yml`) runs on `v*` tags and executes `npm publish --access public` with `NPM_TOKEN`.

5. Verify: https://www.npmjs.com/package/streamguard-react

### Checklist

| Step | Action |
|------|--------|
| Local verify | `npm test && npm run typecheck && npm run build` |
| Version + changelog | `package.json`, `CHANGELOG.md` |
| Tag | `git tag vX.Y.Z && git push origin vX.Y.Z` |
| Secret | `NPM_TOKEN` on the repo |

---

## 4. Later releases

```bash
npm version patch   # or minor / major
git push origin main --follow-tags
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent cannot push | Push from your machine or grant Cursor GitHub App access to this repo |
| Publish auth failure | Refresh `NPM_TOKEN` with publish rights for `streamguard-react` |
| Peer dep warnings | Expected — consumers install `react` themselves |
| No workflow on tag | Tag must match `v*` (e.g. `v0.1.0`) |
