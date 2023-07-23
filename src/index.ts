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
    
    while (numberOfMessages > currentMessage){
        
        latestMessages += `\n${updateMessages[currentMessage]}`
        currentMessage++;
    }
 
    const latestMessage = updateMessages.pop();

    info(`Update ${updateRun} - ${statusResponse.deploymentState} - Last update: ${statusResponse.lastModified}`);
    if (latestMessages.length > 0){
        info(`${latestMessages}`);    
    }

    return currentMessage;
}