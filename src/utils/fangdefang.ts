const defangActions: Record<string, any>[] = [
  {
    find: '(?<!\\[\\.)\\.(?!\\])',
    replace: '[.]'
  },
  {
    find: 'http:\\/\\/',
    replace: 'hXXp://'
  },
  {
    find: 'https:\\/\\/',
    replace: 'hXXps://'
  },
  {
    find: '@',
    replace: '[@]'
  },
  {
    find: '\\:',
    replace: '[:]'
  }
];
const fangActions: Record<string, any>[] = [
  {
    find: '\\[\\.\\]',
    replace: '.'
  },
  {
    find: '\\(\\.\\)',
    replace: '.'
  },
  {
    find: '\\[dot\\]',
    replace: '.'
  },
  {
    find: '\\(dot\\)',
    replace: '.'
  },
  {
    find: '\\[punkt\\]',
    replace: '.'
  },
  {
    find: '\\(punkt\\)',
    replace: '.'
  },
  {
    find: ' DOT ',
    replace: '.',
    case_sensitive: true
  },
  {
    find: ' @ ',
    replace: '@'
  },
  {
    find: '\\[@\\]',
    replace: '@'
  },
  {
    find: '\\(@\\)',
    replace: '@'
  },
  {
    find: ' AT ',
    replace: '@',
    case_sensitive: true
  },
  {
    find: '\\[at\\]',
    replace: '@'
  },
  {
    find: '\\(at\\)',
    replace: '@'
  },
  {
    find: '\\(et\\)',
    replace: '@'
  },
  {
    find: '\\[:\\]',
    replace: ':'
  },
  {
    find: '\\[www\\]',
    replace: 'www'
  },
  {
    find: '\\(www\\)',
    replace: 'www'
  },
  {
    find: 'xxxx:\\/\\/',
    replace: 'http://'
  },
  {
    find: 'xxxxx:\\/\\/',
    replace: 'https://'
  },
  {
    find: 'hxxp',
    replace: 'http'
  },
  {
    find: 'hXXp',
    replace: 'http'
  },
  {
    find: 'http \\:\\/\\/',
    replace: 'http://'
  },
  {
    find: 'https \\:\\/\\/',
    replace: 'https://'
  },
  {
    find: '\\[http\\]',
    replace: 'http'
  },
  {
    find: '\\[https\\]',
    replace: 'https'
  },
  {
    find: 'http\\/\\/',
    replace: 'http://'
  },
  {
    find: 'https\\/\\/',
    replace: 'https://'
  },
  {
    find: 'http\\:\\/\\/\\/',
    replace: 'http://'
  },
  {
    find: 'https\\:\\/\\/\\/',
    replace: 'https://'
  },
  {
    find: '\\:\\/\\/ ',
    replace: '://'
  },
  {
    find: '\\/',
    replace: '/'
  },
  {
    find: '%3A',
    replace: ':'
  },
  {
    find: '\\[:\\]',
    replace: ':'
  }
];
const validfdf =
  /([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+)|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*)|((([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))|([a-f0-9]{32})|([A-Fa-f0-9]{64})|((?:(?:https?|ftps?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:25[0-5]|2[0-4]\d|[0-1]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}|([a-z¡-\uffff0-9](?:[a-z¡-\uffff0-9-]{0,61}[a-z¡-\uffff0-9])?(?:\.(?!-)[a-z¡-\uffff0-9-]{1,63}(?!-))*(?!-)\.(?:[a-z¡-\uffff-]{2,63}|xn--[a-z0-9]{1,59})(?!-)\.?|localhost))(?::\d{2,5})?(?:[/?#][^\s]*)?|\.\w{2,63}|(?:https?:\/\/)?[a-z0-9.-]*\[\.\][a-z0-9.]+\/\S*)/gm;

const savedListMap: Record<string, any> = {};

export function validateAndDefang(input: string) {
  extractLinksFromString(input);
  let inp = input.replace(validfdf, (match: string) => {
    let rep = match;
    defangActions.forEach((action: any) => {
      rep = rep.replace(new RegExp(action.find, 'g'), action.replace);
    });
    return rep;
  });
  inp = inp.replace(/href=["'][^"']*["']/g, '');
  return inp;
}

export function makeFang(input: string) {
  let prs = input;
  fangActions.forEach((action: any) => {
    prs = prs.replace(new RegExp(action.find, 'g'), action.replace);
  });
  if (Object.keys(savedListMap)?.length) prs = insertFangLinks(prs);
  return prs;
}

function getTextFromString(link: string) {
  const contentRegex = /<a\b[^>]*>(.*?)<\/a>/i;
  const contentMatch = link.match(contentRegex);
  const content = contentMatch ? contentMatch[1] : '';
  return content;
}

function extractLinksFromString(htmlContent: string) {
  const linkRegex = /<a\b[^>]*href=['"](.*?)['"][^>]*>(.*?)<\/a>/gi;
  const hrefRegex = /href=["'](.*?)["']/gi;
  htmlContent.replace(linkRegex, (match) => {
    const hrefMatch = match.match(hrefRegex);
    const hashKey = getTextFromString(match);
    if (hrefMatch) {
      const href = hrefMatch[0].replace(/(href=|['"])/gi, '');
      savedListMap[hashKey] = href;
    }
    return match;
  });
}

function insertFangLinks(input: string) {
  const savedListMapRegex = /<a\b(?![^>]*\bhref=['"][^'"]*['"])[^>]*>(.*?)<\/a>/gi;
  return input.replace(savedListMapRegex, (match) => {
    const hashKey = getTextFromString(match);
    const preservedLink = savedListMap[hashKey];
    if (preservedLink) {
      return `<a href="${preservedLink}" target="_blank">${hashKey}</a>`;
    }
    return match;
  });
}
