import {HttpClient, MediaTypes, Headers } from '@actions/http-client';

export interface DeploymentStatusResponse {
    "deploymentId": string,
    "projectAlias": string,
    "deploymentState": string,
    "updateMessage": string,
    "errorMessage": string,
    "created": string,
    "lastModified": string,
    "completed": string
}

export async function getStatusFromApi(callUrl: string, apiKey: string): Promise<DeploymentStatusResponse>
{
    const headers = {
        [Headers.ContentType]: MediaTypes.ApplicationJson,
        "Umbraco-Api-Key": apiKey
    };

    const client = new HttpClient();
    var response = await client.getJson<DeploymentStatusResponse>(callUrl, headers);

    if (response.statusCode === 200 && response.result !== null)
    {
        return Promise.resolve(response.result!);
    }

    return Promise.reject(`Unexpected response coming from server. ${response.statusCode} - ${response.result} `);
}