// lib/brevo.ts
import { TransactionalEmailsApi, ApiClient } from "sib-api-v3-typescript";

// Create a new API client instance
const client = new ApiClient();

// Set API key
if (process.env.BREVO_API_KEY) {
  client.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;
}

// Create a transactional email API instance using the configured client
const brevo = new TransactionalEmailsApi(client);

export default brevo;
