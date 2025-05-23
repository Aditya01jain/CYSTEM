// Config
const testConfig: Record<string, string> = {
  ac: 'alert-create',
  al: 'alert-list',
  ad: 'alert-details',
  rss: 'rss'
};

// function
export function initTestId(module: string, section?: string) {
  let id = testConfig[module] || module;
  if (section) {
    id += `-${section}`;
  }
  return function (element?: string) {
    if (element) {
      return { 'data-testid': `${id}-${element}` };
    }
    return { 'data-testid': id };
  };
}
