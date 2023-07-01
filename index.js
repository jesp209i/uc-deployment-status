const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
    try {
        const projectAlias = core.getInput('project-alias');
        const deploymentId = core.getInput('deployment-id');
        const apiKey = core.getInput('api-key');
        
        const src = __dirname;

        await exec.exec(`${src}/get-status.sh ${projectAlias} ${deploymentId} ${apiKey}`)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run();