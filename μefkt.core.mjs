/*§
  module    : μefkt core - EdgeS FrontEnd Kit ｢part of the AOS⋰AfBox platform family｣
  copyright : ©2019..present Smallscript, portions copyright David Simmons ©1991-present
  author    : David Simmons (@smallscript.com⋰@sm.st)
  license   : MPL-2.0 license "AS IS" ｢Mozilla Public License 2.0｣
  links     : https://efkt.js.st; https://github.com/Smallscript-Corp/efkt; https://ess.dev/af/efkt/
*/
// let μefkt = (await import('./efkt-core.mjs')).default;
var fIsNodeJsPolyfillMode = false;
if (typeof global === 'undefined') {
  // Browser environment
  if (typeof window !== 'undefined')
    window.global = window;
  else if (typeof self !== 'undefined')
    self.global = self;
}
// globally pollute NodeJs to expose WebSocket, URL etc
else {
  // NodeJs environment
  fIsNodeJsPolyfillMode = true;
  global.URL            = (await import('url')).URL;
  global.WebSocket      = (await import('ws')).WebSocket;
  global.location       = undefined;
}

class μefkt {
  static esh = undefined;
  static fIsNodeJsPolyfillMode  = fIsNodeJsPolyfillMode;
  static #fHas_Buffer_from      = global?.Buffer?.from !== undefined;
  static #compose($superclass, mixinTemplateFn) {
    const mixin = mixinTemplateFn($superclass);
    const mxNameDefn = Reflect.getOwnPropertyDescriptor(mixinTemplateFn, 'name');
    if (mxNameDefn) {
      Reflect.deleteProperty(mixin, 'name');
      Reflect.defineProperty(mixin, 'name', mxNameDefn);
      // Define here to minimize js-future-legacy change-impact.
      // Polyfill support for: "ess.dev" `this-fn` and "qks.st/S#"
      // PerspectiveType "family" (protected) selector-namespace `super`
      Reflect.defineProperty(mixin, 'mixin$' + mxNameDefn.value,
        { value: mixin, writeable: false });
    }
    // Provide it the opportunity to run a class INIT specialization
    const mxInitDefn = Reflect.getOwnPropertyDescriptor(mixin, '$INIT');
    if (typeof mxInitDefn?.value === 'function') {
      Reflect.deleteProperty(mixin, '$INIT'); // Remove the value
      mxInitDefn.value.call(mixin); // Invoke the constructor
    }
    return mixin;
  }
  static mixin(base, ...mixinTemplateFns) {
    // `reduceRight` changed to `reduce` WILL BREAK code
    return mixinTemplateFns.reduce(this.#compose, base /* base-class */);
  }
  static camelCaseToDash(zStr) {
    return zStr.replace(/(?:([A-Z])([A-Z])|([a-z])([A-Z]))/g, '$1$3-$2$4').toLowerCase();
  }
  static #utf8Decoder = new TextDecoder(/*character-encoding:default-utf8*/);
  static #utf8Encoder = new TextEncoder(/*character-encoding:default-utf8*/);
  static utf8Encode(...args) { return μefkt.#utf8Encoder.encode(...args); }
  static utf8Decode(...args) {
    return (typeof (args?.[0]) === 'string') // patch Apple/iOS issue
      ? args[0] : μefkt.#utf8Decoder.decode(...args);
  }
  static btoa64(...a) {
    let b64 = btoa(...a);
    b64 = b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    return b64;
  }
  static b64Encode(z, mode/*?`url-safe`*/) {
    var fIsTypedArray = false;
    if (typeof (z) === 'object' && !(fIsTypedArray = z?.byteLength !== undefined/*?ArrayBuffer*/))
      z = JSON.stringify(z);
    var b64 = μefkt.#fHas_Buffer_from
      ? Buffer.from(z, fIsTypedArray ? 'utf8' : 'binary').toString('base64')
      : btoa(fIsTypedArray
        ? (new Uint8Array(z).reduce((d, b) => d + String.fromCharCode(b), ''))
        : this.utf8Encode(z));
    if (mode == 'url-safe')
      b64 = b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    return b64;
  }
  static b64Decode(b64, mode/*?`binary`*/) {
    /*
      🦜: VAPID RFC8292 keys in B64 use alt-encoding where `=` padExtra is removed
          and `+/` is remapped to `-_` per RFC4648 filesystem-safe-base64 encoding.
    */
    console.log("b64Decode:", b64, mode);
    b64 = b64.replaceAll('-', '+').replaceAll('_', '/');
    // pad to multiple of 4 bytes (lcm 6 and 8):<#note, valid encoding will never pad by 3>
    // const n = 3 - (b64.length+3)%4; if(n) b64 += new String('=',n);
    let result = (mode !== 'binary')
      ? (μefkt.#fHas_Buffer_from
        ? Buffer.from(b64, 'base64').toString('utf8')
        : (this.utf8Decode(atob(b64))))
      : (μefkt.#fHas_Buffer_from
        ? Buffer.from(b64, 'base64')
        : atob(b64));
    return (result);
  }
}

class Xuid {
  static #init = (() => {μefkt.Xuid = this})();
  //! Can't use `static const field = const` xbrowser (thus, const's duped)
  static get kAppConfId() { return '{1ebceedd-dfd7-18cd-ddd2-9debe8248a3f}'; }
  static get v1New() { // 🗿 ｢time-based｣
    const ns7Now = this.ns7Now, xnode48 = this.xnode48; let clock_seq13;
    // monotonic `clock_seq` guarantee (13-bits/time-quantum - NOTE: upper 5 bits reserved)
    if (ns7Now <= this.ns7Now_prevSeq && this.ns7Now_prevSeq)
      clock_seq13 = ((this.ns7Now_prevSeq += 1n) - ns7Now) & 0b0_0000_1111_1111n;
    else
      clock_seq13 = 0n, this.ns7Now_prevSeq = ns7Now;

    // const k  = 0x1_00000000_0000_0000_0000_000000000000n | ns7Now
    // efekt.log(`euce%%life-dg%! <${k.toString(16)}>`)
    const time60 = ((ns7Now << 4n) & 0xFFFF_FFFF_FFFF_0000n) |
      (ns7Now & 0x0000_0000_0000_0FFFn),
      v4 = 0x1_00000000_0000_0000_0000_000000000000n |
        (time60 << 64n) | (0x00000000_0000_1000_0000_000000000000n) | // M: V1
        (0b110n << 61n) | (clock_seq13 << 48n) | // N: Variant-2 time-seq xuid-collation
        xnode48, s = v4.toString(16);//.substring(1)
    return `{${s.substring(1, 1+8)}-${s.substring(9, 9+4)}-${s.substring(13, 13+4)}-${s.substring(17, 17+4)}-${s.substring(21, 21+12)}}`;
  }
  static get xnode48()/*:<BigInt#48>*/ {
    if (this.xnode48_) return this.xnode48_;
    let clockSeqNode; if (typeof URL !== 'undefined' && URL.createObjectURL) {
      const url = URL.createObjectURL(new Blob());
      const id = (url.toString().split('/').reverse()[0]).split('-');
      URL.revokeObjectURL(url);
      clockSeqNode = BigInt('0x' + id[3] + id[4]);
    }
    else {
      const a4 = this.a4; this.getRandomValues(this.a4);
      clockSeqNode = (BigInt(a4[2]) << 32n) | BigInt(a4[3]);
    }
    // Simulate the 48-bit node-id and 13-bit clock-seq to combine with
    // 3-bit uuid-variant / 0x02_00_00_00_00_00n L-local node bit set.
    // RFC 4122 (random address indicator: 0x01_00_00_00_00_00n)
    return this.xnode48_ = 0x03_00_00_00_00_00n
      | (clockSeqNode & 0xFFFF_FFFF_FFFFn);
  }
  static set xnode48(v) {
    if (typeof v === 'string' && v.indexOf('-') > 0) {
      if (v[0] == '{') v = v.substring(1, 1+v.length - 1);
      const sqid = v.substring(1, 1+v.length - 2).split('-');
      this.xnode48_ = BigInt(`0x${sqid[4]}`);
    }
    else {
      this.xnode48_ = BigInt(v);
    }
    return v;
  }
  static seqIdFromXuid(xuid)/*:<BigInt#64>*/ {
    //@ extract temporal `seqid` from the 64-bit monotonic epoch70 μs of `xuid`
    //! assumes N-Variant2 representation (should verify)
    const sqid = xuid.substring(1, 1+xuid.length - 2).split('-');
    let v = BigInt(`0x${sqid[0]}${sqid[1]}${sqid[2]}`);
    v = ((v >> 16n) << 12n) | (v & 0xFFFn);
    return `0x${v.toString(16)}`;
  }
  static get jdNow()/*:<double#ns7>*/ {
    // return 2440587.5+Date.now()/864e5 // <- Date-quantum-ms form (7ns form below)
    return this.jdFromNs7(this.ns7Now);
  }
  static get ftNow() {return Number(this.ns7Now);}
  static get ns7Now()/*:<BigInt#60>*/ {
    if (false && typeof performance !== 'undefined' && performance.now)
      Reflect.defineProperty(this, 'ns7Now', Reflect.
        getOwnPropertyDescriptor(this, 'ns7Now_performance'));
    else
      Reflect.defineProperty(this, 'ns7Now', Reflect.
        getOwnPropertyDescriptor(this, 'ns7Now_Date'));
    return this.ns7Now;
  }
  static get ns7Now_Date()/*:<BigInt#60>*/ {
    const epoch1970Ns7 = BigInt(Date.now() * 1000_0.0);
    return epoch1970Ns7 + 0x1b2_1dd2_1381_4000n;
  }
  static get ns7Now_performance()/*:<BigInt#60>*/ {
    const epochPgNs7 = BigInt(performance.now() */*15*/1000_0.0 |/*17*/0);
    if (!this.epoch1970PgNs7) // performance.timing.navigationStart
      this.epoch1970PgNs7 = this.ns7Now_Date - epochPgNs7;
    return epochPgNs7 + this.epoch1970PgNs7;
  }
  static dateFromJd(jd) { return new Date((jd - 2440587.5) * 864e5); }
  static dateFromNs7(ns7) {
    return new Date(Number(ns7 - 0x1b2_1dd2_1381_4000n) / 1000_0.0);
  }
  static dateFromMsPeriod(nMsPeriod) {
    //@ Return the `date` corresponding to the next period cycle relative
    //@ to startup. Providing a pg-start staggered cycle for fetch actions.
    const dateNowInMs = Date.now(),
      startNowInMs = (global?.performance?.now) ? performance.now()
        : (dateNowInMs - (this.epochStartMs || (this.epochStartMs = dateNowInMs))),
      deltaInMs = Math.floor(nMsPeriod - (startNowInMs % nMsPeriod));
    return new Date(dateNowInMs + ((deltaInMs < nMsPeriod) ? deltaInMs : 0));
  }
  static jdFromNs7(ns7) {   // atomic-clock leap-seconds (ignored)
    // const epoch1582Ns7_bias = 0x1b2_1dd2_1381_4000  // V1 1582 Oct 15
    // const epoch1601Ns7_bias = 0x19d_b1de_d53e_8000n // FILETIME base
    return 2440587.5 + (Number(ns7 - 0x1b2_1dd2_1381_4000n) / 864e9);
  }
  static ns7FromJd(jd) {
    return BigInt((jd - 2440587.5) * 864e9) + 0x1b2_1dd2_1381_4000n;
  }
  static getRandomValues(va/*:<Uint32Array>*/) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues)
      crypto.getRandomValues(va);
    else for (let i = 0, n = va.length; i < n; i += 1)
      va[i] = Math.random() * 0x1_0000_0000 >>> 0;
  }
  static get a4() { return this.a4_ || (this.a4_ = new Uint32Array(4)); }
  static ntohl(v)/*:<BigInt>*/ {
    let r = '0x', sign = 1n, s = BigInt(v).toString(16);
    if (s[0] == '-') s = s.substring(1), sign = -1n;
    for (let i = s.length; i > 0; i -= 2)
      r += (i == 1) ? ('0' + s[i - 1]) : s[i - 2] + s[i - 1];
    return sign * BigInt(r);
  }
  static ntohl32(v)/*:<Number>*/ { return Number(this.ntohl(v)); }
  static strftime(sFormat, date) {
    /* Port of strftime(). Compatibility notes:
    *
    * %c - formatted string is slightly different
    * %D - not implemented (use "%m/%d/%y" or "%d/%m/%y")
    * %e - space is not added
    * %E - not implemented
    * %h - not implemented (use "%b")
    * %k - space is not added
    * %n - not implemented (use "\n")
    * %O - not implemented
    * %r - not implemented (use "%I:%M:%S %p")
    * %R - not implemented (use "%H:%M")
    * %t - not implemented (use "\t")
    * %T - not implemented (use "%H:%M:%S")
    * %U - not implemented
    * %W - not implemented
    * %+ - not implemented
    * %% - not implemented (use "%")
    *
    * strftime() reference:
    * http://man7.org/linux/man-pages/man3/strftime.3.html
    *
    * Day of year (%j) code based on Joe Orost's answer:
    * http://stackoverflow.com/questions/8619879/javascript-calculate-the-day-of-the-year-1-366
    *
    * Week number (%V) code based on Taco van den Broek's prototype:
    * http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html
    */
    if (!(date instanceof Date && !isNaN(date.getTime()))) date = new Date();
    var nDay = date.getDay(),
      nDate = date.getDate(),
      nMonth = date.getMonth(),
      nYear = date.getFullYear(),
      nHour = date.getHours(),
      aDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      aMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      aDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
      isLeapYear = function () {
        if ((nYear & 3) !== 0) return false;
        return nYear % 100 !== 0 || nYear % 400 === 0;
      },
      getThursday = function () {
        var target = new Date(date);
        target.setDate(nDate - ((nDay + 6) % 7) + 3);
        return target;
      },
      zeroPad = function (nNum, nPad) {
        return ('' + (Math.pow(10, nPad) + nNum)).slice(1);
      };
    return sFormat.replace(/%[a-z]/gi, function (sMatch) {
      return {
        '%a': aDays[nDay].slice(0, 3),
        '%A': aDays[nDay],
        '%b': aMonths[nMonth].slice(0, 3),
        '%B': aMonths[nMonth],
        '%c': date.toUTCString(),
        '%C': Math.floor(nYear / 100),
        '%d': zeroPad(nDate, 2),
        '%e': nDate,
        '%F': date.toISOString().slice(0, 10),
        '%G': getThursday().getFullYear(),
        '%g': ('' + getThursday().getFullYear()).slice(2),
        '%H': zeroPad(nHour, 2),
        '%I': zeroPad((nHour + 11) % 12 + 1, 2),
        '%j': zeroPad(aDayCount[nMonth] + nDate + ((nMonth > 1 && isLeapYear()) ? 1 : 0), 3),
        '%k': '' + nHour,
        '%l': (nHour + 11) % 12 + 1,
        '%m': zeroPad(nMonth + 1, 2),
        '%M': zeroPad(date.getMinutes(), 2),
        '%p': (nHour < 12) ? 'AM' : 'PM',
        '%P': (nHour < 12) ? 'am' : 'pm',
        '%s': Math.round(date.getTime() / 1000),
        '%S': zeroPad(date.getSeconds(), 2),
        '%u': nDay || 7,
        '%V': (function () {
          var target = getThursday(),
            n1stThu = target.valueOf();
          target.setMonth(0, 1);
          var nJan1 = target.getDay();
          if (nJan1 !== 4) target.setMonth(0, 1 + ((4 - nJan1) + 7) % 7);
          return zeroPad(1 + Math.ceil((n1stThu - target) / 604800000), 2);
        })(),
        '%w': '' + nDay,
        '%x': date.toLocaleDateString(),
        '%X': date.toLocaleTimeString(),
        '%y': ('' + nYear).slice(2),
        '%Y': nYear,
        '%z': date.toTimeString().replace(/.+GMT([+-]\d+).+/, '$1'),
        '%Z': date.toTimeString().replace(/.+\((.+?)\)$/, '$1')
      }[sMatch] || sMatch;
    });
  }
}
class μPromise extends Promise {
  state = 'pending';
  constructor(fnAny, ...a) {
    const descendentType = new.target;
    let r, f; super((re, rt) => { r = re, f = rt; }, ...a); this.resolve_ = r, this.reject_ = f;
    switch (typeof fnAny) {
      case 'undefined':
      case 'undefined': break;
      case 'function': //! `then` will issue a `[native code]` callback on our species; conform!
        if (fnAny.toString().indexOf('[native code]') >= 0)
          fnAny(r, f, this, ...a);
        else
          fnAny.call(this, this, ...a);
        break;
      case 'object':
        if (fnAny instanceof Date) { this.setTimeout(fnAny, ...a); break; }
      default:
        this.resolve(fnAny);
    }
  }
  get settled() { return (this.state !== 'pending' /* i.e., 'fulfilled' */); }
  get fIsSettled() { return (this.state !== 'pending' /* i.e., 'fulfilled' */); }
  settle(v,...a) {
    return (v instanceof Error)
      ? this.reject(v,...a)
      : this.resolve(v,...a);
  }
  resolve(v, ...a) {
    if (this.state === 'pending') {
      //? onPreResolve intercept hook?
      this.state = 'resolved';
      this.value = v;
      // console.log(`μPromise RESOLVING:`,this);
      if (typeof (this.onSettling) === 'function')
        this.onSettling(this, ...a);
      else if (typeof (this.onResolving) === 'function')
        this.onResolving(this, ...a);
      this.resolve_(this.value = v, ...a);
      // if (typeof (this.onResolved) === 'function')
      //   this.onResolved(this, ...a);
    }
    this.cancelTimer();
    return this.value;
  }
  reject(e, ...a) {
    if (this.state === 'pending') {
      //? onPreReject intercept hook?
      this.state = 'rejected';
      this.value = (e instanceof Error) ? e : μPromise.Error(e, this.name);
      // console.log(`μPromise REJECTING[${e}]:`,this);
      if (typeof (this.onSettling) === 'function')
        this.onSettling(this, ...a);
      else if (typeof (this.onRejecting) === 'function')
        this.onRejecting(this, ...a);
      this.reject_(this.value, ...a);
      // if (typeof (this.onRejected) === 'function')
      //   this.onRejected(this, ...a);
    }
    this.cancelTimer();
    return this.value;
  }
  setTimeout(nMsFromNowOrDate, value, fIssueReject, ...a) {
    const deltaInMs = (nMsFromNowOrDate instanceof Date)
      ? (nMsFromNowOrDate.valueOf() - Date.now()) : nMsFromNowOrDate;
    return (deltaInMs > 0)
      ? (this.timerId = setTimeout(() =>
        this.onTimeout(nMsFromNowOrDate, value, fIssueReject, ...a), deltaInMs))
      : (fIssueReject
        ? this.reject(value, nMsFromNowOrDate, ...a)
        : this.resolve(value, nMsFromNowOrDate, ...a),
        undefined);
  }
  onTimeout(when, value, fIssueReject, ...a) {
    this.timerId = undefined;
    return fIssueReject ? this.reject(value, when, ...a) : this.resolve(value, when, ...a);
  }
  cancelTimer() { if (this.timerId !== undefined) clearInterval(this.timerId); }
  static Error(v, name) {
    var type = (typeof v === 'string') ? v : 'value-rejected';
    if (name) type = `${name} ${type}`; const e = Error(type); e.value = v;
    return (e);
  }
  static APromise = (() => { const $class = this; return function (...a) { return new $class(...a); }; })();
};
class ApvMap extends Map {
  initNewPromise(mrec) {
    // mrec supports `{event:{type, once, signal}, once‹unregister-onSettling›}`
    // ToDo: add support for a watchdog-settlement timer
    (mrec.apv = new μefkt.APromise()).options = mrec;
    if(mrec?.once)
      mrec.apv.onSettling = (...a)=> {
        // console.log(`｢ApvMap⋱onSettling｣ '${mrec.key.toString()}'`,mrec,...a);
        this.delete(mrec.symKey)
      };
  }
  get(optionsOrKey) {
    // options supports `{event:{type, once, signal}, once‹unregister-onSettling›}`
    var {key, ...rest} = optionsOrKey?.key ? optionsOrKey : {key:optionsOrKey};
    var symKey = (typeof(key) == 'symbol') ? key : Symbol.for(key), mrec;
    if(!(mrec = super.get(symKey))) {
      this.initNewPromise(mrec = {key, symKey, ...rest});
      if(mrec?.event?.type) { const event = mrec.event;
        event.target = event.target || μefkt?.esh;
        const eventOptions = {
          once    : mrec.once || event.once,
          capture : event.capture,
          passive : event.passive,
          signal  : event.signal,
        };
        event.target.addEventListener(event.type, (e)=> {
          // console.log(`｢ApvMap⋱get⋱new⋱event⋱fired｣ '${event.type}'`,mrec.apv, e);
          mrec.apv.settle(e);
          if(!eventOptions.once)
            this.initNewPromise(mrec);
        }, eventOptions);
        // console.log(`｢ApvMap⋱get⋱new⋱event⋱registered｣ '${key.toString()}'`,mrec.apv);
      }
      super.set(symKey,mrec);
      // console.log(`｢ApvMap⋱get⋱new⋱fin｣ '${key.toString()}'`,mrec.apv);
    }
    // console.log(`｢ApvMap⋱get｣ querying apvMap.map @ '${key.toString()}'`, mrec.apv);
    return mrec.apv;
  }
  delete(optionsOrKey) {
    var {key, ...rest} = optionsOrKey?.key ? optionsOrKey : {key:optionsOrKey};
    var symKey = (typeof(key) == 'symbol') ? key : Symbol.for(key);
    super.delete(symKey);
    // console.log(`｢ApvMap⋱delete｣ '${key.toString()}'`, optionsOrKey);
  }
}

class BioPipe extends WebSocket {
  constructor(url, options, eventTarget) {
    super(url, options);
    if(fIsNodeJsPolyfillMode) //👷 polyfill
      this.addEventListener = (...a)=>this.on(...a);
    //
    this.btRpId_last = 0;
    this.btRpId_apvCompletionMap = new Map();
    this.wsOptions = {url, options, eventTarget}
    this.init_listeners();
    if(eventTarget)
      eventTarget.onBioPipeChanged(this);
  }
  static #init = (() => {μefkt.BioPipe = this})();
  static eBpStatus = Object.freeze({
    closed:{
      code: 4500,
      msg : 'BioPipeError connection not open. Unable to send message.',
    },
    btrpUnsettledAtClose:{
      code: 4501,
      msg : 'BioPipeError connection closed with btrq having pending async-btrp.',
    },
  });
  static BioPipeError = class BioPipeError extends Error {
    constructor(eBpCode, pipe /* optional */) {
      super(eBpCode.msg);
      this.eBpStatus = eBpCode;
      this.name = 'WebSocketError';
      if(pipe) this.pipe = pipe;
    }
  }
  static prepareWsOptions(...options) {
    var [host, route] = options;
    if(typeof host == 'string' && host.indexOf(':') > 0)
      host = new URL(host);
    if(Array.isArray(host))
      var [host, route] = host;
    else if (host instanceof URL)
      var {host, pathname: route} = host;
    else if(typeof host == 'object')
      var {host, route} = host;

    let esh = μefkt.esh;
    const bphv = {
      host      : host,
      pathname  : route?.[0] == '/' ? route : '/'.concat(route || ''),
      bio_openid  : {
        bcsid         : esh?.bcsid,
        pga_buid      : esh?.pga_buid || location?.hostname,
        jwtz          : esh?.bio_token,
        bio_keep_alive: true,

        oidc_redirect : location?.href,
        oidc_tenancy  : esh?.oidc_tenancy,
      },
    };
    // compose BasicAuthProtocol
    bphv.bio_auth_b64 = μefkt.btoa64(JSON.stringify(bphv.bio_openid));
    bphv.wssUrl = `wss://${bphv.host}${bphv.pathname}`;
    console.log(`BioPipe.prepareWsOptions`,bphv);

    const wsOptions = { url: bphv.wssUrl, bioProtocol: [`BASIC-${bphv.bio_auth_b64}`]};
    console.log(`wsOptions ${JSON.stringify(wsOptions, null, 2)}`);
    return wsOptions;
  }
  init_listeners() {
    this.addEventListener('open', () => {
      this.recvBioMsg({type: '/bio/bioPipeOpen',
        status:{code: 4200, msg: 'BioPipe connected to server'}});
    });
    this.addEventListener('message', (msg) => {
      msg = (global.Buffer && msg instanceof global.Buffer)
        ? μefkt.utf8Decode(msg) : msg?.data;
      if (typeof (msg) === 'string' && msg.length >= 2 && msg[0] === '{') try {
        msg = JSON.parse(msg);
      } catch (err) {console.warn(`parse-msg-failed:`, e); return;};
      return this.recvBioMsg(msg);
    });
    this.addEventListener('close', (code, msg) => {
      // fail every outstanding request
      for (const [btRpId, btrp_apv] of this.btRpId_apvCompletionMap.entries()) {
        console.log(btRpId, btrp_apv);
        try {
          const error     = new this.constructor.BioPipeError(
            this.constructor.eBpStatus.btrpUnsettledAtClose, this);
          error.btRpId    = btRpId;
          (error.btrp_apv = btrp_apv).reject(error);
        } catch(e) {
          console.error(e);
        }
      }
      this.recvBioMsg({type: '/bio/bioPipeClosed', status:{code, msg: msg}});
      // console.log(`BioPipe connection closed ${code} ${msg}`);
    });
    this.addEventListener('error', (error) => {
      // console.error('BioPipe WebSocket error:', error);
      this.recvBioMsg({type: '/bio/bioPipeError', status:{code: 1011, msg: 'Unexpected condition', detail: error}});
    });
  }
  dispatchBioMsg(type, detail) {
    const eventTarget = this.wsOptions.eventTarget;
    const event = new Event(type, { cancelable: true, composed: true, composed: true });
    event.detail = detail;
    return eventTarget.dispatchEvent(event);
  }
  get fIsClosed() {
    return this.readyState !== WebSocket.OPEN;
  }
  getCountOfPendingBioMsgRequests() {
    //🔰 return a count of the number of pending async-rtrp `btRq2RpId` entries
    return this.btRpId_apvCompletionMap.size;
  }
  recvBioMsg(msg) {
    // Settle any async responses here
    if(msg.btRp2RqId) {
      const btrp_apv = this.btRpId_apvCompletionMap.get(msg.btRp2RqId);
      if(btrp_apv) {
        if(!msg?.type || msg?.status?.fIsError)
          btrp_apv.reject(msg);
        else
          btrp_apv.resolve(msg);
      }
    }
    this.dispatchBioMsg(msg?.type || '/bio/undefined', msg);
  }
  async ensureOpenBioPipe() {
    //🚧 given this.wsOptions, we can re-open a closed pipe on demand. When
    //   that happens the constructor notifies the eventTarget via `onBioPipeChanged`.
    //   In that manner, the pipe does not need to remain open and can be closed or
    //   reopened at any time.
    if (this.fIsClosed) {
      const error = new this.constructor.BioPipeError(
        this.constructor.eBpStatus.closed, this);
      console.error(error);
      throw(error);
    }
  }
  async sendAsyncBioMsg(msg, btrp_apv) {
    // Assign a bio-type response-id
    if(btrp_apv) {
      this.btRpId_apvCompletionMap.set(
        msg.btRq2RpId = (this.btRpId_last += 1), btrp_apv);
    }
    // Initiate the request ｢on receiving a btRpId msg, `btrp_apv` is settled｣
    await this.ensureOpenBioPipe(); //👹 may-throw `BioPipeError`
    try {
      await this.send(JSON.stringify(msg));
    } catch(e) {
      console.error(e);
    }
    // Return the completion promise
    return btrp_apv;
  }
}
μefkt.APromise = μPromise.APromise;
μefkt.ApvMap   = ApvMap;
export default μefkt;
