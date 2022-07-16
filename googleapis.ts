import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export default class GoogleApis {
   oauth2Client: OAuth2Client;
   redirectUrl: string;
   constructor(clientId: string, clientSecret: string, callbackUrl: string, scopes: string[]) {
      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, callbackUrl);

      this.redirectUrl = this.oauth2Client.generateAuthUrl({
         access_type: "offline",
         scope: scopes,
         prompt: "consent",
      });
   }

   getTokenFromCode(code: string) {
      return this.oauth2Client.getToken(code);
   }

   revokeToken(token: string) {
      return this.oauth2Client.revokeToken(token);
   }

   refreshTokens(tokens: any) {
      this.oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
      return this.oauth2Client.refreshAccessToken().then((toks) => toks.credentials);
   }

   getUserInfo(access_token: string) {
      this.oauth2Client.setCredentials({ access_token });
      let oauth2 = google.oauth2({ auth: this.oauth2Client, version: "v2" });
      return oauth2.userinfo.get().then((res) => res.data);
   }
}
