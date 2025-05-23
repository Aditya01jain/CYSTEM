import Cookie from 'js-cookie';

const {
  location: { protocol }
} = window;

export default class Cookies {
  //private TENANT_TOKEN: string = 'dt1_token';
  public static tokenKey() {
    const domain: any = window.location.hostname;
    const tenant: any = 'cyanalyst';
    return `${tenant}_token`;
  }

  public static getTokenCookie() {
    const pair: any = Cookie.get(this.tokenKey());
    return pair ? `Token ${pair}` : '';
  }

  public static setTokenCookie(token: string) {
    if (import.meta.env.MODE !== 'development' && protocol === 'https:') {
      Cookie.set(this.tokenKey(), token, { secure: true });
    } else {
      Cookie.set(this.tokenKey(), token);
    }
  }

  public static removeTokenCookie() {
    Cookie.remove(this.tokenKey());
  }
}
