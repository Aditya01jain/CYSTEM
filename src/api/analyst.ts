import alerts from './alerts';
import rss from './rss';
export default {
  userdetails: {
    api: 'rest-auth/user/'
  },
  ...alerts,
  ...rss
};
