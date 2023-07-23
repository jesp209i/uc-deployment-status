import { getInput, info, setFailed, error } from '@actions/core';
import { DeploymentStatusResponse, getStatusFromApi } from './getDeploymentStatusApi';

async function run() 
{
    const projectAlias = getInput('project-alias');
    const deploymentId = getInput('deployment-id');
    const apiKey = getInput('api-key');
    const timeoutSeconds = getInput('timeout-seconds');

    const url = `https://api-internal.umbraco.io/projects/${projectAlias}/deployments/${deploymentId}`

    let interval: NodeJS.Timer;
    let timeout: NodeJS.Timer;
    let currentRun = 1;
    let messageCursor = 0;

    interval = await setInterval( async () =>
    {
        const statusResponse = await getStatusFromApi(url,apiKey);
        messageCursor = writeCurrentProgress(statusResponse, currentRun, messageCursor);
        currentRun++;
        
        if (statusResponse.deploymentState === 'Completed')
        {
            info("Deployment Completed");
            clearInterval(interval);
            clearTimeout(timeout);
        }
        if (statusResponse.deploymentState === 'Failed')
        {
            error('Deployment Failed');
            info(`Cloud Deployment Messages:\n${statusResponse.updateMessage}`);
            setFailed("Deployment Failed");
            clearInterval(interval);
            clearTimeout(timeout);
        }

    }, 15000);
    
    timeout = setTimeout(() => {
        clearInterval(interval);
        info("\n------------------------------------\n-- Timeout reached, exiting loop");
        setFailed("Deployment reached timeout");
    }, +timeoutSeconds * 1000);        
}

run();


function writeCurrentProgress(statusResponse: DeploymentStatusResponse, updateRun: number = 1, currentMessage: number): number
{
    const updateMessages = statusResponse.updateMessage.split('\n');
    const numberOfMessages = updateMessages.length;
    let latestMessages: string = '';
    
    while (numberOfMessages >= currentMessage){
        currentMessage++;

        if (updateMessages[currentMessage] !== undefined){
            latestMessages += `\n${updateMessages[currentMessage]}`
        }
    }
 
    const latestMessage = updateMessages.pop();

    info(`Update ${updateRun} - ${statusResponse.deploymentState}`);
    info(`Last Modified: ${statusResponse.lastModified}\nSteps: ${latestMessages}`);
    info("----------------------------------------- Sleeping for 15 seconds\n\n");

    return currentMessage;
}