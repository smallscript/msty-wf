//👷 provision dependencies
import μefkt    from './μefkt-bundle.mjs';
import fs       from 'fs';
import fs_path  from 'path';
import { fileURLToPath } from 'url';
//🔰 provision a local report writer tool
import emitReport from './msty-report.mjs';

//👷 obtain job's input parameters
var client_payload;
if(process?.env?.PAYLOAD) {
  client_payload = JSON.parse(process.env.PAYLOAD);
  console.log('client_payload:', JSON.stringify(client_payload,null,2));
}
else {
  const thisFilePath = fileURLToPath(import.meta.url);
  var {client_payload} = JSON.parse(fs.readFileSync(fs_path.join(
    fs_path.dirname(fs_path.dirname(thisFilePath)),'/curl-runner/trigger.curl.json'), 'utf-8'));
}

//👷 prepare job-run configuration settings
const Shell         = μefkt.Shell;
const msty_url      = new URL(client_payload.msty_endpoint);
const fileList      = [],
      directoryPath = client_payload?.path || process.cwd();
const msty_bio_api  = {
  //🔰  MSTY API Suite
  async eachYamlFsEntryDeepDo$({path: rootPath, do: eachDo$}) {
    var result; async function dirEachWalk$(curPath) {
      const dirEntries = fs.readdirSync(curPath);
      for (const fnm of dirEntries) {
        const fpn      = fs_path.join(curPath, fnm),
              fpn_stat = fs.statSync(fpn);
        if(fpn_stat.isSymbolicLink())
          continue;
        else if (fpn_stat.isDirectory())
          await dirEachWalk$(fpn);
        else if (fpn_stat.isFile()) {
          const ext = fs_path.extname(fnm);
          if (ext === '.yml' || ext === '.yaml')
            result = await eachDo$({
              name        : fnm,
              path        : fpn.replace('\\','/'),
              size        : fpn_stat.size,
              etCreated   : fpn_stat.birthtime.getTime(),
              etModified  : fpn_stat.mtime.getTime(),
              data        : fs.readFileSync(fpn,{encoding:'utf-8'}),
          });
        }
      }
    };
    await dirEachWalk$(rootPath);
    return result;
  },
  yamlFsEntryDo(fse) {
    //🦜 log it for debugging
    const {data: ignore, ...rest} = fse;
    console.log(`submitYaml.${fileList.length}`, JSON.stringify(rest,null,2));
    //🧶 track it for inspection and reporting aggregation
    fileList.push(fse);
    //👷 submit `fse` for processing to the msty-service
    return Shell.submitYaml(fse);
  },
  submitYaml(fse) {
    const btrq = {...fse,
      type: '/:msty.sm.st/submitYaml',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  },
  onSubmitYamlReply(event) {
    const payload = event?.detail?.type ? event.detail : event;
    console.log(`on[${payload.type}]`, JSON.stringify(payload,null,2))
  },
  sendSubmitYamlFinished(fse) {
    const btrq = {...fse,
      type: '/:msty.sm.st/submitYaml/finished',
    }
    return this.sendAsyncBioMsg(btrq); //, μefkt.APromise());
  },
}; Object.assign(Shell, msty_bio_api);

//🦜 NodeJs based auto-run testing
if(μefkt.fIsNodeJsPolyfillMode) {
  //🔰 pre-flight msty-service configuration
  // μefkt.Shell.bio_token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODczNTU3NDIsImV4cCI6MTY4Nzk2MDU0MiwiaXNzIjoiaGN0YS5jb3JwLnN0Iiwic3ViIjoiezFlZTBiOGUxLTA3MmUtNjAyMC1iZTVkLTQ4ZTI0NGY2MDUxYX0iLCJiaWQiOiJ7MzYzZjZlZjQtODM4Zi01Yzc3LWE1ZWQtMjU4YzgyM2MwOTg5fSIsIm9pZCI6IntlOTVhOTVkNy03OTJkLTUyMmUtOTA4ZS1hZDRiNjY3NzFhOGN9IiwiYXVkIjoiaGN0YS5jb3JwLnN0Iiwic2NwIjoib3BlbmlkIGF1dG8tcmVuZXcgaGN0YS1hZG1pbiJ9.ouY6WtidivmzqvB1YRs_dSBplhFeSztL2BPc67T3_r5chNpiuG7M_tohHtU38ZT_AxzEnM_FudRfMMkgN5L6ow";
  const bio_endpoint = `https://${Shell.pga_buid = msty_url.host}${msty_url.pathname}`;

  // const bio_endpoint_open = Shell.get$({
  //   key:Symbol(`bio_endpoint_open`), once: true,
  //   event: {type: `/:bio/bioPipeOpen`}});
  const bio_auth_received$ = Shell.get$({
    key:Symbol(`bio_auth_received`), once: true,
    event: {type: `/:bio/acdn/updateAuthRp`}});
  Shell.addEventListener('/:msty.sm.st/submitYaml/reply', Shell.onSubmitYamlReply, {passive:true});
  const bio_pipe_closed$ = Shell.get$({
    key:Symbol(`bio_pipe_closed`), once: true,
    event: {type: `/:bio/bioPipeClosed`}});

  // 👷 await pipe-established with auth-approval
  Shell.connect(bio_endpoint);
  const bio_auth = await bio_auth_received$;
  console.log(`on[${bio_auth?.type}]:`, JSON.stringify(bio_auth, null, 2));

  console.log(`MSTY Job Scanning: "${directoryPath}"`);
  await Shell.eachYamlFsEntryDeepDo$({path: directoryPath, do: Shell.yamlFsEntryDo});
  Shell.sendSubmitYamlFinished();  // await results OR just close
  const bio_close = await bio_pipe_closed$;
  console.log(`on[${bio_close?.type}]:`, JSON.stringify(bio_close, null, 2));
  // Shell.removeEventListener('/:msty.sm.st/ackYaml', Shell.onAckYaml, {passive:true});
}