import { getInput, info, setFailed, error } from '@actions/core';
import {HttpClient, MediaTypes, Headers, HttpClientError} from '@actions/http-client';
import { Response } from './response';

async function run() 
{
    const projectAlias = getInput('project-alias');
    const deploymentId = getInput('deployment-id');
    const apiKey = getInput('api-key');
    const timeoutSeconds = getInput('timeout-seconds');

    const url = `https://api-internal.umbraco.io/projects/${projectAlias}/deployments/${deploymentId}`

    var interval = await setInterval( async () =>
    {
        const statusResponse = await getStatusFromApi(url,apiKey);
        writeCurrentProgress(statusResponse);
        
        if (statusResponse.deploymentState === 'Completed')
        {
            info("Deployment Completed");
            clearInterval(interval);
        }
        if (statusResponse.deploymentState === 'Failed')
        {
            info('Deployment Failed');
            info(`Cloud Deployment Messages: ${statusResponse.updateMessage}`);
            setFailed("Deployment Failed");
            clearInterval(interval);
        }

    }, 15000);
    
    setTimeout(() => {
        clearInterval(interval);
        info("\n------------------------------------\n-- Timeout reached, exiting loop");
        setFailed("Deployment reached timeout");
    }, +timeoutSeconds * 1000);        
}

run();

async function getStatusFromApi(callUrl: string, apiKey: string): Promise<Response>
{
    const headers = {
        [Headers.ContentType]: MediaTypes.ApplicationJson,
        "Umbraco-Api-Key": apiKey
    };

    const client = new HttpClient();
    var response = await client.getJson<Response>(callUrl, headers);

    if (response.statusCode === 200 && response.result !== null)
    {
        return Promise.resolve(response.result!);
    }

    return Promise.reject(`Unexpected response coming from server. ${response.statusCode} - ${response.result} `);
}

function writeCurrentProgress(statusResponse: Response){
    info(`Current Status: ${statusResponse.deploymentState}`);
    info(`Modified: ${statusResponse.lastModified} - Latest message: ${statusResponse.updateMessage}`);
    info("\n");
    info("--------------------------------- Sleeping for 15 seconds --");
}