import WebSocket from 'ws';
// globally pollute to expose WebSocket
import μefkt    from './μefkt.core.mjs';
import fs       from 'fs';
import fs_path  from 'path';
import { fileURLToPath } from 'url';
// report writer
import emitReport from './msty-report.mjs';

function eachYamlFsEntryDeepDo({path: rootPath, do: eachDo}) {
  var result; function dirEachWalk(curPath) {
    const dirEntries = fs.readdirSync(curPath);
    for (const fnm of dirEntries) {
      const fpn      = fs_path.join(curPath, fnm),
            fpn_stat = fs.statSync(fpn);
      if(fpn_stat.isSymbolicLink())
        continue;
      else if (fpn_stat.isDirectory())
        dirEachWalk(fpn);
      else if (fpn_stat.isFile()) {
        const ext = fs_path.extname(fnm);
        if (ext === '.yml' || ext === '.yaml')
          result = eachDo({
            name        : fnm,
            path        : fpn,
            size        : fpn_stat.size,
            etCreated   : fpn_stat.birthtime.getTime(),
            etModified  : fpn_stat.mtime.getTime(),
            data        : fs.readFileSync(fpn,{encoding:'utf-8'}),
        });
      }
    }
  };
  dirEachWalk(rootPath);
  return result;
}
function yamlFsEntryDo(fse) {
  const {data: ignore, ...rest} = fse;
  console.log(JSON.stringify(rest,null,2))
  fileList.push(fse);
  return fileList;
}

var client_payload;
if(process?.env?.PAYLOAD) {
  client_payload = JSON.parse(process.env.PAYLOAD);
}
else {
  // = `{"msty_endpoint": "msty.sm.st"}`;
  const thisFilePath = fileURLToPath(import.meta.url);
  var {client_payload} = JSON.parse(fs.readFileSync(fs_path.join(
    fs_path.dirname(fs_path.dirname(thisFilePath)),'trigger.curl.json'), 'utf-8'));
}
console.log('client_payload:', JSON.stringify(client_payload,null,2));

const msty_endpoint = client_payload.msty_endpoint;
const fileList      = [],
      cwd           = process.cwd(),
      directoryPath = client_payload?.path || cwd;
console.log(`directoryPath: ${directoryPath}`);
eachYamlFsEntryDeepDo({path: directoryPath, do:yamlFsEntryDo});
console.log(fileList);
