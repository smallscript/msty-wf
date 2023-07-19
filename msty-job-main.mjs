import μefkt    from './μefkt-bundle.mjs';
import fs       from 'fs';
import fs_path  from 'path';
import { fileURLToPath } from 'url';
// report writer
import emitReport from './msty-report.mjs';

async function eachYamlFsEntryDeepDo({path: rootPath, do: eachDo}) {
  var result; async function dirEachWalk(curPath) {
    const dirEntries = fs.readdirSync(curPath);
    for (const fnm of dirEntries) {
      const fpn      = fs_path.join(curPath, fnm),
            fpn_stat = fs.statSync(fpn);
      if(fpn_stat.isSymbolicLink())
        continue;
      else if (fpn_stat.isDirectory())
        await dirEachWalk(fpn);
      else if (fpn_stat.isFile()) {
        const ext = fs_path.extname(fnm);
        if (ext === '.yml' || ext === '.yaml')
          result = await eachDo({
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
  await dirEachWalk(rootPath);
  return result;
}

// await pipeConnectedApv;
var client_payload;
if(process?.env?.PAYLOAD) {
  client_payload = JSON.parse(process.env.PAYLOAD);
  console.log('client_payload:', JSON.stringify(client_payload,null,2));
}
else {
  const thisFilePath = fileURLToPath(import.meta.url);
  var {client_payload} = JSON.parse(fs.readFileSync(fs_path.join(
    fs_path.dirname(fs_path.dirname(thisFilePath)),'trigger.curl.json'), 'utf-8'));
}

const msty_endpoint = client_payload.msty_endpoint;
const fileList      = [],
      cwd           = process.cwd(),
      directoryPath = client_payload?.path || cwd;
const esh           = μefkt.esh;
//🚧 open code for now
esh.submitYaml      = function(fse) {
  const btrq = {...fse,
    type: '/msty.sm.st/submitYaml',
  }
  return this.sendAsyncBioMsg(btrq); //, μefkt.APromise());
}

// only for auto-testing connection
if(μefkt.fIsNodeJsPolyfillMode) {
  // μefkt.esh.bio_token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODczNTU3NDIsImV4cCI6MTY4Nzk2MDU0MiwiaXNzIjoiaGN0YS5jb3JwLnN0Iiwic3ViIjoiezFlZTBiOGUxLTA3MmUtNjAyMC1iZTVkLTQ4ZTI0NGY2MDUxYX0iLCJiaWQiOiJ7MzYzZjZlZjQtODM4Zi01Yzc3LWE1ZWQtMjU4YzgyM2MwOTg5fSIsIm9pZCI6IntlOTVhOTVkNy03OTJkLTUyMmUtOTA4ZS1hZDRiNjY3NzFhOGN9IiwiYXVkIjoiaGN0YS5jb3JwLnN0Iiwic2NwIjoib3BlbmlkIGF1dG8tcmVuZXcgaGN0YS1hZG1pbiJ9.ouY6WtidivmzqvB1YRs_dSBplhFeSztL2BPc67T3_r5chNpiuG7M_tohHtU38ZT_AxzEnM_FudRfMMkgN5L6ow";
  const bio_endpoint = `https://${esh.pga_buid = 'msty.sm.st'}/`;
  // const bio_endpoint_open = esh.apvMap.get({
  //   key:Symbol(`bio_endpoint_open`), once: true,
  //   event: {type: `/bio/bioPipeOpen`}});
  const bio_auth_received = esh.apvMap.get({
    key:Symbol(`bio_auth_received`), once: true,
    event: {type: `/bio/acdn/updateAuthRp`}});
  esh.connect(bio_endpoint);
  // await bio_endpoint_open;
  await bio_auth_received;

  function yamlFsEntryDo(fse) {
    fileList.push(fse);
    const {data: ignore, ...rest} = fse;
    console.log(JSON.stringify(rest,null,2));
    return esh.submitYaml(fse);
  }

  console.log(`MSTY Job Scanning: "${directoryPath}"`);
  await eachYamlFsEntryDeepDo({path: directoryPath, do:yamlFsEntryDo});
  // await results OR just close
  esh.close();
}