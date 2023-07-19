/*§
  module    : μefkt BioBus - EdgeS FrontEnd Kit ｢part of the AOS⋰AfBox platform family｣
  copyright : ©2019..present Smallscript, portions copyright David Simmons ©1991-present
  author    : David Simmons (@smallscript.com⋰@sm.st)
  license   : MPL-2.0 license "AS IS" ｢Mozilla Public License 2.0｣
  links     : https://efkt.js.st; https://github.com/Smallscript-Corp/efkt; https://ess.dev/af/efkt/
*/
import μefkt from './μefkt.core.mjs';

μefkt.CoreBioApiMxn = ($superclass,this$mx) => class extends $superclass {
  constructor() { super(); this.pipe = null; }
  initThis() {
  }
  connect(...options) {
    const wsOptions = μefkt.BioPipe.prepareWsOptions(...options);
    //👷 see: `onBioPipeChanged`
    this.pipe = new μefkt.BioPipe(wsOptions.url, wsOptions.bioProtocol, this);
  }
  onBioPipeChanged(pipe) { //👷 invoked on lazy re-opening of the pipe as needed
    //🦜 see: `onUpdateAuthRp`. This call always precedes `onUpdateAuthRp`.
    this.pipe = pipe;
  }
  sendAsyncBioMsg(...args) /* returns-async-apv */ {
    return this.pipe.sendAsyncBioMsg(...args);
  }
  getCountOfPendingBioMsgRequests() {
    return (this.pipe)
      ? this.pipe.getCountOfPendingBioMsgRequests()
      : 0;
  }
  close() {
    if(this.pipe && !this.pipe.fIsClosed) {
      const nPendingBioMsgRequests = this.getCountOfPendingBioMsgRequests();
      if(nPendingBioMsgRequests) {
        console.warn(`Bridge preparing to close with ${
          this.getCountOfPendingBioMsgRequests()} outstanding bio-msg requests`);
      }
      this.pipe.close();
    }
  }
}

μefkt.EfsBioApiMxn = ($superclass,this$mx) => class extends $superclass {
  constructor() { super();}
  initThis() {
    super.initThis();
  }
  async upsertFile(options) {
    //🔰 assumes `upsertFile().then..` or `await ..`
    const btrq = {
      ...options,
      type: '/bio/acdn/upsertFile',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  }
  async deleteFile(options) {
    //🔰 assumes `deleteFile().then..` or `await ..`
    const btrq = {
      ...options,
      type: '/bio/acdn/deleteFile',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  }
  async renameFile(options) {
    //🔰 assumes `renameFile().then..` or `await ..`
    const btrq = {
      ...options,
      type: '/bio/acdn/renameFile',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  }
  async getFiles(options) {
    //🔰 assumes `getFiles().then..` or `await ..`
    const btrq = {
      ...options,
      type: '/bio/acdn/getFiles',
    }
    return this.sendAsyncBioMsg(btrq, μefkt.APromise());
  }
}
