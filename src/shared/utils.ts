export const hasSecureProtocol = function () {
  return import.meta.env.VITE_FORCE_HTTPS === 'true' || window.location.protocol === 'https:';
};
export const baseUrl = () => {
  const protocol = hasSecureProtocol() ? 'https:' : 'http:';
  return `${protocol}//${import.meta.env.VITE_TOKEN_URL || window.location.host}`;
};
export const convertToMB = (fileSize: number) => {
  return fileSize / (1024 * 1024);
}
const UtilFuncs = {
  hasSecureProtocol,
  baseUrl,
  convertToMB
};
export default UtilFuncs;
