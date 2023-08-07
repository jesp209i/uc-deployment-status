# uc-deployment-status

This actions pools the Deployment Api for status - continues until deployment finishes (both on success or failure) or we hit the timeout 

## Inputs

### `project-alias`

**Required** The alias of the project you want to tract progress on.

### `deployment-id`

**Required** The Deployment Id you want to track progress on.

### `api-key`

**Required** Your project api key.

### `timeout-seconds`

Default: 600 (10 minutes)

### `api-base-url`

Default: to current url needed

## Example usage

```yaml
uses: jesp209i/uc-deployment-status@v0.2-beta8
with:
    project-alias: ${{ env.PROJECT_ALIAS }}
    deployment-id: ${{ steps.deployment-meta.outputs.DEPLOYMENT_ID }}
    api-key: ${{ secrets.API_KEY }}
    timeout-seconds: 600
    api-base-url: http://real.url.here/
```
