import { singleton } from "tsyringe";
import { Configuration, UsersApi, AuthenticationApi } from "vrchat";
import { generateToken } from "node-2fa";
import axios from "axios";

// Step 1. We begin with creating a Configuration, which contains the username and password for authentication.
const configuration = new Configuration({
  username: process.env.VRC_USERNAME,
  password: process.env.VRC_PASSWORD,
});

const axiosConfig = axios.create({
  headers: {
    "User-Agent": "Council-Bot/1.0.0 justin.scopelleti@gmail.com",
    "Content-Type": "application/json",
  },
});
axios.defaults.withCredentials = true;

@singleton()
export class VRC_UsersApi {
  private authApi: AuthenticationApi;
  private usersApi: UsersApi;

  constructor() {
    this.authApi = new AuthenticationApi(configuration, undefined, axiosConfig);
    this.usersApi = new UsersApi(configuration, undefined, axiosConfig);
  }

  async get() {
    const user = await this.authApi.getCurrentUser();
    //@ts-ignore
    if (user.data.requiresTwoFactorAuth) {
      const code = generateToken("muys6sdpga2ta4skirjg6ntrojxes3dy");
      if (!code) {
        throw new Error("Error generating 2FA code!");
      }
      await this.authApi.verify2FA({ code: code.token });
      await this.authApi.getCurrentUser();
    }

    console.log(user.data);
    return this.usersApi;
  }
}
