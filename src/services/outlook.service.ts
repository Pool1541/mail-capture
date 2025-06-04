/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as msal from "@azure/msal-node";

export class OutlookService {
  private clientConfig: msal.Configuration;
  private accessToken: string | null = null;

  constructor() {
    this.clientConfig = {
      auth: {
        clientId: process.env.CLIENT_ID ?? "",
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID ?? ""}`,
        clientSecret: process.env.CLIENT_SECRET ?? "",
      },
    };

    this.initializeClient();
  }

  private async initializeClient() {
    const tokenObject = await this.getAccessToken();
    this.accessToken = tokenObject.accessToken;
  }

  public async getAccessToken() {
    const confidentialClientApplication = new msal.ConfidentialClientApplication(this.clientConfig);
    const token = await this.getClientCredentialsToken(confidentialClientApplication);
    return token;
  }

  public async retrieveMails() {
    const userPrincipalName = process.env.EMAIL ?? "";
    const endpoint = `https://graph.microsoft.com/v1.0/users/${userPrincipalName}/messages`;

    if (!this.accessToken) {
      console.error("Access token is not available. Please initialize the client first.");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${String(response.status)} - ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error al obtener los correos:", error.message, "token:", this.accessToken);
      }
    }
  }

  private getClientCredentialsToken(cca: any) {
    const credentialsRequest = {
      scopes: ["https://graph.microsoft.com/.default"],
      azureregion: null,
      skipCache: true,
    };

    return cca.acquireTokenByClientCredential(credentialsRequest);
  }
}
