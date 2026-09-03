import { registerAs } from '@nestjs/config';

export default registerAs('zoho', () => ({
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  redirectUri: process.env.ZOHO_REDIRECT_URI,
  // Change per data center if your Zoho org isn't on the .com DC
  // (.eu, .in, .com.au, .jp, .com.cn, .ca)
  accountsBaseUrl: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
  defaultScopes: (
    process.env.ZOHO_DEFAULT_SCOPES || 'WorkDrive.files.ALL,WorkDrive.team.READ'
  ).split(','),
}));
