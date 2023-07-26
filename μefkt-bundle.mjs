import μefkt from './μefkt.core.mjs';
import './μefkt.BioBus.mjs';
export default μefkt;

// node client.js
const BioBusPushMxn = ($superclass,this$mx) => class extends $superclass {
  initThis() {
    super.initThis();
  }
  async sendXlinkPush(options) {
    //🔰 assumes `sendXlinkPush().then..` or `await ..`
    const btrq = {
      ...options,
      type: '/loc.st/sendXlinkPush',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  }
}
const BioBusAcctMxn = ($superclass,this$mx) => class extends $superclass {
  initThis() {
    super.initThis();
  }
  async updateAcctDetails(options) {
    //🔰 assumes `updateAcctDetails().then..` or `await ..`
    const btrq = {
      ...options,
      type: '/loc.st/updateAcctDetails',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  }
}

class BioBus extends μefkt.mixin(Object, μefkt.CoreBioApiMxn,
  μefkt.EfsBioApiMxn, BioBusPushMxn, BioBusAcctMxn)
{
  constructor() { super();
    //👷 construction-complete; run abia-init-phase
    (μefkt.Shell = this).initThis();
  }
  initThis() {
    super.initThis();
    //🚧 extend the API as appropriate to HCTA design ｢acdn-EFS bio-pipe-api exposed-by-default for efs-file-io｣
    this.addEventListener('/:bio/acdn/updateAuthRp', e=>this.onUpdateAuthRp(e));
    this.addEventListener('/:bio/bioPipeError',      e=>this.onBioPipeError(e));
    this.addEventListener('/:bio/bioPipeClosed',     e=>this.onBioPipeClosedClosed(e));
  }
  dispatchEvent(...a) {return this.apvMgr.dispatchEvent(...a);}
  addEventListener(...a) {return this.apvMgr.addEventListener(...a);}
  removeEventListener(...a) {return this.apvMgr.removeEventListener(...a);}
  async onUpdateAuthRp(e) {
    //🦜 see: `onBioPipeChanged`. This call always follows `onBioPipeChanged`.
    const detail = e?.detail, status = detail?.status;
    // console.log(`RECV onUpdateAuthRp[${e.type}]:`, JSON.stringify(detail, null, 2));
    //🚧 handle login success/failure notification
  }
  onBioPipeError(e) {
    const detail = e?.detail;
    console.log(`BioPipe error ${detail?.status?.code} ${detail?.status?.msg}`, detail?.status?.detail);
  }
  onBioPipeClosedClosed(e) {
    const detail = e?.detail;
    console.log(`BioPipe connection closed ${detail?.status?.code} ${detail?.status?.msg}`);
  }
  async example() {
    let btrp; const btrp_apv = this.getFiles({
      path: '/user/*',
    });
    try {btrp = await btrp_apv;} catch(e) {console.log(e);}
    console.log(`FIN example[${btrp?.type}]:`, JSON.stringify(btrp, null, 2));
  }
  static singleton = (()=>{return(new this());})();
}

// merge into μefkt
μefkt.BioBus = BioBus;
