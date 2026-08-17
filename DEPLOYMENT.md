# Asset deployment

GitHub Actions publishes changed files to the `critter-library` R2 bucket.

Robots listed in `immutable_assets.json` use content-addressed releases:

- The complete robot directory is hashed and uploaded below
  `releases/robots/<robot-id>/<sha256>/`.
- Release files use `Cache-Control: public,max-age=31536000,immutable`.
- `manifests/robots/<robot-id>.json` points to the verified release and is published last with a
  60-second cache lifetime.
- Previous releases are retained so older application sessions and saved projects remain valid.

Other assets continue to use their repository-relative R2 keys with a one-hour cache lifetime.
R2 objects are never deleted automatically.

To migrate another robot, first deploy its immutable release and manifest by adding its ID to
`immutable_assets.json` and manually running the workflow. After that succeeds, set
`immutableAssets: true` on the matching Critter application catalog entry.
