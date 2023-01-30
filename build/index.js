/**
 * Copies over index files and sets page titles / page headers
 */
const fs = require('fs');
const crypto = require('crypto');
const pathModule = require('path');

const TARGETS = [
    {
        dir: 'public/swarm',
        replace: {
            title: 'Swarm',
            header: "Defeat Operation: Enduring Victory!",
            description: "Take control of the Faro Plague and exterminate humanity!",
            url: "https://horizon.miapi.dev/swarm",
        },
    },
    {
        dir: 'public/zerodawn',
        replace: {
            title: 'Zero Dawn',
            header: "Rebuild the Earth!",
            description: "Restore the Earth after the decimation from the Faro Plague!",
            url: "https://horizon.miapi.dev/zerodawn",
        },
    },
];
const template = fs.readFileSync('./index.template.html', 'utf-8');

const seen = new Set();
const versionImports = (dir, file) => {
    file = pathModule.join(dir, file);
    if (seen.has(file)) return;
    seen.add(file);
    let fileText = fs.readFileSync(file, 'utf-8');
    fileText = fileText.replace(/import (.*) from '(.*)'/g, (_, imports, path) => {
        path = path.replace(/['"`]/g, '');
        if (path.includes('?')) {
            path = path.split('?')[0];
        }
        versionImports(dir, path);
        const hash = hashFile(pathModule.join(dir, path));
        return `import ${imports} from '${path}?${hash}'`;
    });
    fs.writeFileSync(file, fileText);
}

const hashFile = file => crypto.createHash('md5')
    .update(fs.readFileSync(file))
    .digest()
    .toString('hex')
    .slice(0, 10);

for (const target of TARGETS) {
    const {dir, replace} = target;
    const hash = hashFile(dir + '/index.js');
    let out = template;
    replace.version = hash;
    for (const k in replace) {
        out = out.replaceAll(`{{${k}}}`, replace[k]);
    }
    out = out.replaceAll('{{site_base}}', 'https://horizon.miapi.dev/assets');

    fs.writeFileSync(dir + '/index.html', out);

    versionImports(dir, 'index.js');
}
