# Collab workflow: Mac (leader) + Ubuntu (worker)

Offload **file-isolated, self-contained** tasks to a second Claude Code on the
Ubuntu box to reduce load on the Mac. Modeled on the sillara-theme setup.

## Topology
- **Mac** = leader / integrator (this machine). Interactive Claude Code; owns
  `main`; pushes to GitHub `origin` (`frankydinh/color-palette-detector`).
- **Ubuntu** = headless worker — `vmo-desktop`, Tailscale, ssh alias
  **`ubuntu-test`**. Has Claude Code 2.1, node 22, git.
- **One-way (Mac → Ubuntu).** Mac initiates everything: push, dispatch, fetch.
  Ubuntu never connects back to Mac.

## Sync — git over Tailscale (no GitHub auth needed on Ubuntu)
- Ubuntu hosts a **bare** repo `~/color-palette-detector.git` + a **working
  clone** `~/color-palette-detector` (with `node_modules` installed).
- Mac has remote **`ubuntu`** → `ubuntu-test:color-palette-detector.git`.
- Mac → `git push ubuntu main`; worker branches come back via `git fetch ubuntu`.
- GitHub `origin` stays canonical (Mac still pushes there).

## One-time setup (already done, kept here for reproducibility)
```bash
# On Ubuntu:
git init --bare ~/color-palette-detector.git

# On Mac:
git remote add ubuntu ubuntu-test:color-palette-detector.git
git push ubuntu main

# On Ubuntu — working clone + deps:
git clone ~/color-palette-detector.git ~/color-palette-detector
cd ~/color-palette-detector && npm install
```

## Dispatch a task
```bash
scripts/ubuntu-dispatch.sh "<self-contained task prompt>" [branch]
# parallel lanes (independent worktrees on Ubuntu):
scripts/ubuntu-dispatch-lane.sh <lane> "<task>" [branch]
```
The remote runner is launched **detached (`setsid`)**, so it survives an ssh
disconnect or a killed dispatch — long `claude -p` runs are never orphaned and
the commit + push tail always executes. Dispatch returns immediately; poll with:
```bash
scripts/ubuntu-status.sh <branch>            # tail log + RUNNING/COMPLETE
scripts/ubuntu-status.sh <branch> --fetch    # when COMPLETE, fetch to Mac
```
Runner steps: checkout a fresh branch off `origin/main` · `claude -p` headless
(acceptEdits, model `sonnet` — override with `MODEL=opus …`) · `npm install` ·
`npm run lint` + `npm run build` + `npm run test` · commit + push the branch ·
`touch ~/.cpd-done-<branch>`.

Then the **leader reviews and merges** (never auto-merge):
```bash
git fetch ubuntu
git diff main..ubuntu/<branch>
git merge ubuntu/<branch>     # then: git push origin main ; git push ubuntu main
```

> Why detached: the Mac tool/ssh session has a ~10-min ceiling. A foreground
> dispatch that exceeds it gets SIGHUP'd — `claude` orphans on but the shell
> running commit/push dies, leaving work uncommitted. `setsid` decouples the run
> from the ssh session so it completes regardless; the Mac just polls.

Permission mode is fixed to **`acceptEdits`** — the worker may create/edit
**files only**, never run arbitrary shell. The script (not Claude) runs
install/lint/build. Every change returns on a branch for leader review; nothing
is auto-merged or auto-executed.

## Rules of engagement (avoid conflicts)
- **One concern per machine.** Mac and Ubuntu must **not edit the same files** at
  the same time.
- Worker prompts are **self-contained** — the prompt + repo are all it has (no
  chat memory). Point it at the exact files, the PRD, and the acceptance criteria.
- Branch off latest `main`; **merge promptly**; leader reviews **every** diff.
- **Leader keeps:** integration, interactive/ambiguous work, cross-cutting
  changes, anything touching the manifest / build config / messaging contract.
- **Worker takes:** well-scoped, file-isolated tasks — a new test suite under
  `src/**/__tests__`, a single self-contained component, a docs pass, an isolated
  `lib/` module.

## Good worker candidates for this project
File-isolated, low conflict risk:
- **Vitest unit tests** for `src/lib/*` (new `*.test.ts` files only — quantize,
  contrast, harmony, convert, export-ase, mood).
- **JSDoc / README polish** or a usage GIF script.
- A new **isolated `lib/` helper** (e.g. an alternate export format) behind its
  own file.

Keep on the leader (Mac): `manifest.config.ts`, `vite.config.ts`, the worker
message protocol in `src/types/index.ts`, and anything spanning worker ↔ panel ↔
service-worker wiring.
