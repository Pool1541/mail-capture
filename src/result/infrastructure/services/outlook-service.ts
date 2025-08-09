import * as msal from "@azure/msal-node";

import type { IEmailClientService, MessageData } from "../../domain/contracts/email-client-service";

export class OutlookService implements IEmailClientService {
  private clientConfig: msal.Configuration;
  constructor() {
    this.clientConfig = {
      auth: {
        clientId: process.env.APP_ID ?? "",
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID ?? ""}`,
        clientSecret: process.env.CLIENT_SECRET ?? "",
      },
    };
  }

  public async getAccessToken(): Promise<string> {
    const confidentialClientApplication = new msal.ConfidentialClientApplication(this.clientConfig);
    const token = await this.getClientCredentialsToken(confidentialClientApplication);

    if (!token) {
      throw new Error("Failed to acquire Outlook access token");
    }

    return token.accessToken;
  }

  public async getMessageById(messageId: string): Promise<MessageData | null> {
    const accesToken = await this.getAccessToken();
    const endpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL ?? ""}/messages/${messageId}`;
    const requestInit: RequestInit = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accesToken}`,
        "Content-Type": "application/json",
      },
    };

    if (!accesToken) {
      throw new Error("Access token is not available. Please initialize the client first.");
    }

    const response = await fetch(endpoint, requestInit);

    if (!response.ok) {
      throw new Error(`Error retrieving email: ${response.status.toString()} - ${response.statusText}`);
    }

    const data = (await response.json()) as MessageData;

    return data;
  }

  private async getClientCredentialsToken(
    confidentialClientApplication: msal.ConfidentialClientApplication,
  ): Promise<msal.AuthenticationResult | null> {
    const clientCredentialRequest: msal.ClientCredentialRequest = {
      scopes: ["https://graph.microsoft.com/.default"],
      skipCache: true,
    };

    return confidentialClientApplication.acquireTokenByClientCredential(clientCredentialRequest);
  }
}
