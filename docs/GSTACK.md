# Using GoLive with gstack

[gstack](https://github.com/garrytan/gstack) is an agent workflow for building and shipping code
(`/office-hours` through `/ship`); GoLive is the step before that: it takes a built repository live
on your own accounts. This page is the seam between them — what gstack's deploy path needs to know
about a GoLive-managed project, and which answers to give once.

Nothing here is required. GoLive never calls gstack and gstack never calls GoLive; the two meet
through the repository's `CLAUDE.md`.

## The division of labour

| Work | GoLive | gstack |
| --- | --- | --- |
| First bring-up — hosting, database, auth, domain and DNS, email, payments | plans, asks, applies, verifies | — |
| Each later change: merge, wait for the deploy, verify production (`/land-and-deploy`) | not its job (see below) | ✔ |
| Post-deploy monitoring (`/canary`) | — | ✔ |
| Drift on what GoLive wired (`golive status`, read-only) | ✔ | — |
| Teardown (`golive teardown`) | removes only what it created | — |

GoLive plans a production deploy only for the first deploy, a redeploy pending after a production
env write, or a retry after a failure. It does not redeploy code-only changes — so the honest
per-change path on a CLI-only host is the host's own command, and gstack is the tool that holds it.

## After GoLive has taken the repo live

Run `/setup-deploy` once. The answers depend on how the host deploys:

- **A host with Git integration** (a Vercel project connected to this repository, Render, Netlify):
  answer *automatically on push*. gstack records the platform, the production URL and a health
  check, and each later merge is verified against a deployment record tied to the merge commit.
- **A CLI-only deploy** — what GoLive leaves behind when the host has no Git integration: answer
  the Custom / Manual questions with the host's own command as the trigger, the host's own listing
  as the status check and the production URL as the health check, for example:

  ```text
  Platform:       Custom (Vercel CLI)
  Deploy trigger: <the host CLI command, e.g. vercel deploy --prod --yes>
  Deploy status:  <the host CLI listing, e.g. vercel ls <project> --prod>
  Health check:   <the production URL, e.g. https://your-app.example/api/health>
  ```

  On gstack v1.91.85.0 and later, `/land-and-deploy` then says production has not moved, names the
  recorded command and asks the human to run it — running it only with explicit approval — before
  it looks for a deployment tied to the merge. Earlier versions can end the wait as "reachable,
  revision unproven" without ever naming the command.
- **Nothing is live yet**: `/setup-deploy` stops and writes nothing, because it configures how a
  deploy is verified, not the bring-up itself (gstack v1.91.85.0). That is the moment to run
  GoLive; re-run `/setup-deploy` after the first production deploy exists.

`golive status` stays useful next to gstack: it re-reads what GoLive wired and reports drift, while
`/land-and-deploy` and `/canary` cover each change.

## A worked example

[golive-gstack-demo](https://github.com/mikehasa/golive-gstack-demo) is a disposable fixture — one
static page plus a serverless `/api/health`, deployed to the owner's own Vercel account by GoLive,
with a CLI-only trigger recorded in `CLAUDE.md`. Its `evidence/` directory carries the runs:

- the original walkthrough and its session transcript:
  [WALKTHROUGH.md](https://github.com/mikehasa/golive-gstack-demo/blob/main/evidence/WALKTHROUGH.md);
- before/after runs for the two deploy seams above:
  [deploy-seam-2026-10-08](https://github.com/mikehasa/golive-gstack-demo/blob/main/evidence/deploy-seam-2026-10-08/README.md).

## Limits worth knowing

- On a CLI-only host nothing deploys on merge, so gstack asks before every verification; that is
  the designed shape, not a stalled pipeline.
- gstack's own text names no bring-up tool on purpose. v1.91.85.0 teaches `/setup-deploy` to stop
  honestly instead of asking for values that do not exist; this page is GoLive's side of that
  handoff, not a claim about gstack's.
- A static deploy publishes the whole folder unless filtered: keep `golive.yaml`, `.golive/` and
  the run reports out of it (the walkthrough's fix was an allowlist `.vercelignore`).
- What GoLive itself can do today — including everything that is mock-covered rather than live —
  is in [provider scope](PROVIDERS.md) and the [validation record](VALIDATION.md).
