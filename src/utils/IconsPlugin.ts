import { resolve, join } from 'path';
import { promises as fs } from 'fs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
type IconPath = {
  icon: string;
  type: string;
  style: string;
};
type Imports = { library: Array<string>; imports: Array<string> };
function iconsImportsMap() {
  const listIcons: Array<{ icon: string; type: string; style: string }> = [];
  let imports: string = '';
  function kebabToCamel(str: string) {
    return str.replace(/-(.)/g, function (match, char) {
      return char.toUpperCase();
    });
  }
  const types = ['classic', 'duotone', 'kit', 'sharp'];
  const styles = ['solid', 'regular', 'light', 'thin', 'brands'];
  const defaultMap: Record<string, string> = {
    kit: 'custom',
    duotone: 'solid',
    classic: 'regular'
  };

  async function readFilesFromDir(directory: string) {
    try {
      const files = await fs.readdir(directory);
      const fileReadPromises = files.map(async (file) => {
        const filePath = join(directory, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          return readFilesFromDir(filePath);
        } else {
          await findIcons(filePath);
        }
      });
      await Promise.all(fileReadPromises);
    } catch (err) {
      console.error('Error reading directory:', err);
    }
  }

  const findIcons = async function (filePath: string) {
    const content = await readFileSync(filePath, 'utf-8');
    const iconRegex = /icon="([^"]*)"/g;
    let match;
    while ((match = iconRegex.exec(content)) !== null) {
      const iconClass = match[1];
      const iconMap = iconClass.split(' ')?.reduce(
        (acc, item) => {
          if (item.includes('fa-')) {
            const find = item.replace('fa-', '');
            if (types.includes(find)) {
              acc.type = find;
            } else if (styles.includes(find)) {
              acc.style = find;
            } else {
              acc.icon = kebabToCamel(item);
            }
          }
          return acc;
        },
        { type: 'classic' } as IconPath
      );
      listIcons.push(iconMap);
    }
    return listIcons;
  };

  const makeImports = function () {
    const addIcons = `import { library } from '@fortawesome/fontawesome-svg-core'; `;
    const map: Imports = listIcons.reduce(
      (list, iconMap) => {
        if (iconMap.icon) {
          const style = `${iconMap.type}${iconMap.style || defaultMap[iconMap.type]}`;
          const as = `${style}${iconMap.icon}`;
          if (!list.library.includes(as)) {
            list.library.push(as);
            list.imports.push(
              `import { ${iconMap.icon} as ${as} } from '@awesome.me/kit-ee50856570/icons/${
                iconMap.type
              }/${iconMap.style || defaultMap[iconMap.type]}';`
            );
          }
        }
        return list;
      },
      { library: [], imports: [] } as Imports
    );
    imports = `${addIcons} ${map.imports.join('')} library.add(${map.library.join(',')});`;
  };

  const createFile = async function () {
    const dir = './node_modules/icons';
    if (!existsSync('./node_modules')) {
      mkdirSync('./node_modules');
    }
    if (!existsSync(dir)) {
      mkdirSync(dir);
    }
    const path = `${dir}/icons.ts`;
    const absoluteFilePath = resolve(path);
    await writeFileSync(absoluteFilePath, imports);
    return `import '${absoluteFilePath}';`;
  };

  const processIcons = async function () {
    await readFilesFromDir(resolve('./src'));
    await makeImports();
    await createFile();
  };
  return {
    processIcons
  };
}

export function IconsAutoImport() {
  const iconsMap = iconsImportsMap();
  let config: Record<string, any>;
  return {
    name: 'vite-plugin-icons-importer',
    async configResolved(resolved: Record<string, any>) {
      config = resolved;
      await iconsMap.processIcons();
    },
    async handleHotUpdate() {
      if (config.command === 'serve') {
        await iconsMap.processIcons();
      }
    }
  };
}

export function CyIconResolver() {
  return (componentName: string) => {
    if (componentName === 'CyIcon')
      return { name: 'FontAwesomeIcon', from: '@fortawesome/vue-fontawesome' };
  };
}
