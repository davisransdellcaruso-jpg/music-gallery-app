// lib/brevo.ts
import SibApiV3Sdk from "sib-api-v3-typescript";

// Initialize the Brevo API client
const brevo = new SibApiV3Sdk.TransactionalEmailsApi();

// Configure API key authorization: api-key
const apiKey = SibApiV3Sdk.ApiClient.instance.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY as string;

// Export as default so it matches your import
export default brevo;
