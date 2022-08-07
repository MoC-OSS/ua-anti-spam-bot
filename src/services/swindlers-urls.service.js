const FuzzySet = require('fuzzyset');
const axios = require('axios');

const harmfulUrlStart = ['https://bitly.com/a/blocked'];

class SwindlersUrlsService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * @param {number} [rate]
   * */
  constructor(dynamicStorageService, rate = 0.9) {
    this.dynamicStorageService = dynamicStorageService;
    this.rate = rate;

    this.urlRegexp =
      /(https?:\/\/(?:www\.|(?!www))?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|(https?:\/\/(?:www\.|(?!www)))?[a-zA-Z0-9-]+\.[^\s]{2,}|www\.?[a-zA-Z0-9]+\.[^\s]{2,})/g;
    this.validUrlRegexp = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    );
    this.exceptionDomains = [
      'gmail.com',
      'google.com',
      'irs.gov',
      'liqpay.ua',
      'monobank.ua',
      'next.privat24.ua',
      'pay.vn.ua',
      'payoneer.com',
      'paypal.com',
      'privat24.ua',
      'www.google.com',
      'instagram.com',
      't.me',
      't.me/',
    ];

    this.shorts = [
      'privat24.io',
      'privat-24.net',
      'privat24bank.io',
      'cutt.ly',
      'money.ui-pay.me',
      'privat24.ypayments.cc',
      'www.mopays.me',
      'surl.li',
      '0rz.tw',
      '1-url.net',
      '126.am',
      '1tk.us',
      '1un.fr',
      '1url.com',
      '1url.cz',
      '1wb2.net',
      '2.gp',
      '2.ht',
      '2ad.in',
      '2doc.net',
      '2fear.com',
      '2long.cc',
      '2tu.us',
      '2ty.in',
      '2u.xf.cz',
      '3ra.be',
      '3x.si',
      '4i.ae',
      '4view.me',
      '5em.cz',
      '5url.net',
      '5z8.info',
      '6fr.ru',
      '6g6.eu',
      '7.ly',
      '76.gd',
      '77.ai',
      '7fth.cc',
      '7li.in',
      '7vd.cn',
      '8u.cz',
      '944.la',
      '98.to',
      'L9.fr',
      'Lvvk.com',
      'To8.cc',
      'a0.fr',
      'abbr.sk',
      'abcn.ws',
      'ad-med.cz',
      'ad5.eu',
      'ad7.biz',
      'adb.ug',
      'adf.ly',
      'adfa.st',
      'adfly.fr',
      'adli.pw',
      'adv.li',
      'ajn.me',
      'aka.gr',
      'alil.in',
      'any.gs',
      'apne.ws',
      'aqva.pl',
      'ares.tl',
      'asso.in',
      'au.ms',
      'ayt.fr',
      'azali.fr',
      'b00.fr',
      'b23.ru',
      'b54.in',
      'baid.us',
      'bc.vc',
      'bee4.biz',
      'bim.im',
      'bit.do',
      'bit.ly',
      'bitw.in',
      'blap.net',
      'ble.pl',
      'blip.tv',
      'boi.re',
      'bote.me',
      'bougn.at',
      'br4.in',
      'brk.to',
      'brzu.net',
      'buff.ly',
      'bul.lu',
      'bxl.me',
      'bzh.me',
      'cachor.ro',
      'captur.in',
      'cbs.so',
      'cbsn.ws',
      'cbug.cc',
      'cc.cc',
      'ccj.im',
      'cf.ly',
      'cf2.me',
      'cf6.co',
      'cjb.net',
      'cli.gs',
      'clikk.in',
      'cn86.org',
      'couic.fr',
      'cr.tl',
      'cudder.it',
      'cur.lv',
      'curl.im',
      'cut.pe',
      'cut.sk',
      'cutt.eu',
      'cutt.us',
      'cutu.me',
      'cybr.fr',
      'cyonix.to',
      'd75.eu',
      'daa.pl',
      'dai.ly',
      'dd.ma',
      'ddp.net',
      'dft.ba',
      'dlvr.it',
      'doiop.com',
      'dolp.cc',
      'dopice.sk',
      'droid.ws',
      'dv.gd',
      'dyo.gs',
      'e37.eu',
      'ecra.se',
      'ely.re',
      'erax.cz',
      'erw.cz',
      'ex9.co',
      'ezurl.cc',
      'fff.re',
      'fff.to',
      'fff.wf',
      'filz.fr',
      'fnk.es',
      'foe.hn',
      'folu.me',
      'freze.it',
      'fur.ly',
      'fxn.ws',
      'g00.me',
      'gg.gg',
      'goo.gl',
      'goo.lu',
      'goo-gl.me',
      'grem.io',
      'guiama.is',
      'hadej.co',
      'hide.my',
      'hill.cm',
      'hjkl.fr',
      'hops.me',
      'href.li',
      'ht.ly',
      'i-2.co',
      'i99.cz',
      'icit.fr',
      'ick.li',
      'icks.ro',
      'iiiii.in',
      'iky.fr',
      'ilix.in',
      'info.ms',
      'is.gd',
      'isra.li',
      'itm.im',
      'ity.im',
      'ix.sk',
      'j.gs',
      'j.mp',
      'jdem.cz',
      'jieb.be',
      'jp22.net',
      'jqw.de',
      'kask.us',
      'kfd.pl',
      'korta.nu',
      'kr3w.de',
      'krat.si',
      'kratsi.cz',
      'krod.cz',
      'kuc.cz',
      'kxb.me',
      'l-k.be',
      'lc-s.co',
      'lc.cx',
      'lcut.in',
      'letop10.',
      'libero.it',
      'lick.my',
      'lien.li',
      'lien.pl',
      'lin.io',
      'linkn.co',
      'llu.ch',
      'lnk.co',
      'lnk.ly',
      'lnk.sk',
      'lnks.fr',
      'lnky.fr',
      'lnp.sn',
      'lp25.fr',
      'm1p.fr',
      'm3mi.com',
      'make.my',
      'mcaf.ee',
      'mdl29.net',
      'mic.fr',
      'migre.me',
      'minu.me',
      'more.sh',
      'mut.lu',
      'myurl.in',
      'nbcnews.to',
      'net.ms',
      'net46.net',
      'nicou.ch',
      'nig.gr',
      'nov.io',
      'nq.st',
      'nxy.in',
      'nyti.ms',
      'o-x.fr',
      'okok.fr',
      'ou.af',
      'ou.gd',
      'oua.be',
      'ow.ly',
      'p.pw',
      'parky.tv',
      'past.is',
      'pdh.co',
      'ph.ly',
      'pich.in',
      'pin.st',
      'plots.fr',
      'pm.wu.cz',
      'po.st',
      'ppfr.it',
      'ppst.me',
      'ppt.cc',
      'ppt.li',
      'prejit.cz',
      'ptab.it',
      'ptm.ro',
      'pw2.ro',
      'py6.ru',
      'q.gs',
      'qbn.ru',
      'qqc.co',
      'qr.net',
      'qrtag.fr',
      'qxp.cz',
      'qxp.sk',
      'rb6.co',
      'rcknr.io',
      'rdz.me',
      'redir.ec',
      'redir.fr',
      'redu.it',
      'ref.so',
      'reise.lc',
      'relink.fr',
      'reut.rs',
      'ri.ms',
      'riz.cz',
      'rod.gs',
      'roflc.at',
      'rt.se',
      's-url.fr',
      'safe.mn',
      'sagyap.tk',
      'sdu.sk',
      'seeme.at',
      'segue.se',
      'sh.st',
      'shar.as',
      'short.cc',
      'short.ie',
      'short.pk',
      'shrt.in',
      'shy.si',
      'sicax.net',
      'sina.lt',
      'sk.gy',
      'skr.sk',
      'skroc.pl',
      'smll.co',
      'sn.im',
      'snsw.us',
      'soo.gd',
      'spn.sr',
      'sq6.ru',
      'ssl.gs',
      'su.pr',
      'surl.me',
      'sux.cz',
      'sy.pe',
      't.cn',
      't.co',
      't.me',
      'ta.gd',
      'tabzi.com',
      'tau.pe',
      'tdjt.cz',
      'tek.io',
      'thesa.us',
      'tin.li',
      'tini.cc',
      'tiny.cc',
      'tiny.lt',
      'tiny.ms',
      'tiny.pl',
      'tinyurl.com',
      'tinyurl.hu',
      'tixsu.com',
      'tldr.sk',
      'tllg.net',
      'tnij.org',
      'tny.cz',
      'to.ly',
      'tohle.de',
      'tpmr.com',
      'tr.im',
      'tr5.in',
      'trck.me',
      'trib.al',
      'trick.ly',
      'trkr.ws',
      'trunc.it',
      'twet.fr',
      'twi.im',
      'twlr.me',
      'twurl.nl',
      'u.to',
      'uby.es',
      'ucam.me',
      'ug.cz',
      'ulmt.in',
      'unlc.us',
      'upzat.com',
      'ur1.ca',
      'url2.fr',
      'url5.org',
      'urlin.it',
      'urls.fr',
      'urlz.fr',
      'urub.us',
      'utfg.sk',
      'v.gd',
      'v.ht',
      'v5.gd',
      'vaaa.fr',
      'valv.im',
      'vaza.me',
      'vbly.us',
      'vd55.com',
      'verd.in',
      'vgn.me',
      'vov.li',
      'vsll.eu',
      'vt802.us',
      'vur.me',
      'vv.vg',
      'w1p.fr',
      'waa.ai',
      'wapo.st',
      'wb1.eu',
      'web99.eu',
      'wed.li',
      'wideo.fr',
      'wn.nr',
      'wp.me',
      'wtc.la',
      'wu.cz',
      'ww7.fr',
      'wwy.me',
      'x.co',
      'x.nu',
      'x10.mx',
      'x2c.eu',
      'x2c.eumx',
      'xav.cc',
      'xgd.in',
      'xib.me',
      'xl8.eu',
      'xoe.cz',
      'xrl.us',
      'xt3.me',
      'xua.me',
      'xub.me',
      'xurls.co',
      'yagoa.fr',
      'yagoa.me',
      'yau.sh',
      'yeca.eu',
      'yect.com',
      'yep.it',
      'yogh.me',
      'yon.ir',
      'youfap.me',
      'youtu.be',
      'ysear.ch',
      'yyv.co',
      'z9.fr',
      'zSMS.net',
      'zapit.nu',
      'zeek.ir',
      'zip.net',
      'zkr.cz',
      'zkrat.me',
      'zkrt.cz',
      'zoodl.com',
      'zpag.es',
      'zti.me',
      'zxq.net',
      'zyva.org',
      'zzb.bz',
    ];

    this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
    console.info('swindlersRegex', this.swindlersRegex);
    this.initFuzzySet();
    this.dynamicStorageService.fetchEmmiter.on('fetch', () => {
      this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
      console.info('swindlersRegex', this.swindlersRegex);
      this.initFuzzySet();
    });
  }

  buildSiteRegex(sites) {
    const regex = /(?:https?:\/\/)?([[sites]])(?!ua).+/;
    return new RegExp(regex.source.replace('[[sites]]', sites.join('|')));
  }

  /**
   * @description
   * Create and saves FuzzySet based on latest data from dynamic storage
   * */
  initFuzzySet() {
    this.swindlersFuzzySet = FuzzySet(this.dynamicStorageService.swindlerDomains);
  }

  /**
   * @param {string} message - raw message from user to parse
   */
  async processMessage(message) {
    const urls = this.parseUrls(message);
    if (urls) {
      let lastResult = null;
      const getUrls = urls.map((e) => this.isSpamUrl(e));
      const allUrls = await Promise.all(getUrls);
      const foundSwindlerUrl = allUrls.some((value) => {
        lastResult = value;
        return lastResult.isSpam;
      });

      if (foundSwindlerUrl) {
        return lastResult;
      }
    }

    return null;
  }

  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseUrls(message) {
    return (message.match(this.urlRegexp) || []).filter((url) => {
      const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
      try {
        const urlInstance = new URL(validUrl);
        return urlInstance && !this.exceptionDomains.includes(urlInstance.host) && this.validUrlRegexp.test(validUrl);
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * @param {string} url
   * @returns {string | null}
   */
  getUrlDomain(url) {
    const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
    return `${new URL(validUrl).host}/`;
  }

  /**
   * @param {string} url
   * @param {number} [customRate]
   */
  async isSpamUrl(url, customRate) {
    if (!url) {
      return {
        rate: 0,
        isSpam: false,
      };
    }

    /**
     * @see https://loige.co/unshorten-expand-short-urls-with-node-js/
     * */
    const redirectUrl = this.shorts.includes(new URL(url).host)
      ? await axios
          .get(url, { maxRedirects: 0 })
          .then(() => url)
          .catch(
            /**
             * @param {AxiosError} err
             */
            (err) => {
              if (err.code === 'ENOTFOUND' && err.syscall === 'getaddrinfo') {
                return url;
              }

              if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
                return url;
              }

              if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
                return url;
              }

              if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
                return url;
              }

              if (err.code === 'ECONNRESET') {
                return url;
              }

              try {
                if (!err.response) {
                  console.error(err);
                }

                return err.response.headers.location || err.response.config.url || url;
              } catch (e) {
                console.error(e);
                return url;
              }
            },
          )
      : url;

    if (harmfulUrlStart.some((start) => redirectUrl.startsWith(start))) {
      return { isSpam: true, rate: 300 };
    }

    const domain = this.getUrlDomain(redirectUrl);
    const isRegexpMatch = this.swindlersRegex.test(domain);
    if (isRegexpMatch) {
      return { isSpam: isRegexpMatch, rate: 200 };
    }

    const [[rate, nearestName]] = this.swindlersFuzzySet.get(domain) || [[0]];

    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: domain,
      redirectUrl,
    };
  }
}

module.exports = {
  SwindlersUrlsService,
};
