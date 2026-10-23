/** Steps of a Telegram login, as reported back to the client */
export const LOGIN_STAGE = Object.freeze({
  PHONE: "phone",
  CODE: "code",
  PASSWORD: "password",
  TOKEN: "token",
  AUTHENTICATED: "authenticated",
});
