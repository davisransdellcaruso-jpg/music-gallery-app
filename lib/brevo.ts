// lib/brevo.ts
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from "sib-api-v3-typescript";

// Create the transactional email API instance
const brevo = new TransactionalEmailsApi();

// Configure API key using the enum
if (process.env.BREVO_API_KEY) {
  brevo.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

export default brevo;
