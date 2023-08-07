import { getInput, info, setFailed, error, InputOptions } from '@actions/core';
import { ApiClient } from '@jam-test-umbraco/umbraco-cloud-deployment-apiclient';
import { DeploymentPromiseResult, DeploymentResponse, DeploymentProblemDetails } from '@jam-test-umbraco/umbraco-cloud-deployment-apiclient/src/apiTypes';

async function run() 
{
    const apiBaseUrl = getInput('api-base-url', {required: true });
    const projectAlias = getInput('project-alias', { required: true});
    const deploymentId = getInput('deployment-id', { required: true});
    const apiKey = getInput('api-key', { required: true});
    const timeoutSeconds = getInput('timeout-seconds', { required: true});

    let interval: NodeJS.Timer;
    let timeout: NodeJS.Timer;
    let currentRun = 1;
    let messageCursor = 0;
    
    info("running");
    interval = await setInterval( async () =>
    {
        info(currentRun);
        await getStatusFromApi(apiBaseUrl,apiKey, projectAlias, deploymentId).then(
            response =>
            {
                const statusResponse = response as DeploymentResponse;
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
            }, 
            rejected => {
                clearInterval(interval);
                clearTimeout(timeout);
                apiRejectedResponse(rejected);
                
            });
    }, 15000);
    
    timeout = setTimeout(() => {
        clearInterval(interval);
        info("\n------------------------------------\n-- Timeout reached, exiting loop");
        setFailed("Deployment reached timeout");
    }, +timeoutSeconds * 1000);        
}

run();

async function getStatusFromApi(baseUrl: string, apiKey: string, projectAlias: string, deploymentId: string) : Promise<DeploymentPromiseResult>
{
    const apiClient = new ApiClient(baseUrl, projectAlias, apiKey);

    return await apiClient.getDeploymentStatus(deploymentId);
}

function writeCurrentProgress(statusResponse: DeploymentResponse, updateRun: number = 1, currentMessage: number): number
{
    const updateMessages = statusResponse.updateMessage!.split('\n');
    const numberOfMessages = updateMessages.length;
    let latestMessages: string = '';
    
    while (numberOfMessages > currentMessage){
        const newline = latestMessages.length === 0 ? `` : `\n`;

        latestMessages += `${newline}${updateMessages[currentMessage]}`
        currentMessage++;
    }
 
    const latestMessage = updateMessages.pop();

    var hasNewLatestMessages = latestMessages.length > 0;

    info(`Update ${updateRun} - ${hasNewLatestMessages ? statusResponse.deploymentState : `Still running`} - Last update: ${statusResponse.lastModified}`);
    if (hasNewLatestMessages){
        info(`${latestMessages}`);    
    }

    return currentMessage;
}

function apiRejectedResponse(rejected: DeploymentPromiseResult) 
{
    if (typeof rejected === 'string')
    {
        info(`Error while calling ApiClient: ${rejected}`);
    }
    if (typeof rejected === 'object')
    {
        const problemDetails = rejected as DeploymentProblemDetails;
        info(`Api returned ${problemDetails.statusCode} details: ${problemDetails.details}`);
    }
    setFailed("Error happened during polling for Deployment Status");
}