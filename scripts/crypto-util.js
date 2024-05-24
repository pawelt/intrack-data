// Please, don't change the key...
// It's all for personal use only, data fetched barely a few times a day.
const KEY = "24ayqVo7yJma";

const CryptoJS = require("./crypto-js.min.js");

const CryptoJSAesJson = {
  stringify: (cipherParams) => {
    const j = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64) };
    if (cipherParams.iv) j.iv = cipherParams.iv.toString();
    if (cipherParams.salt) j.s = cipherParams.salt.toString();
    return JSON.stringify(j);
  },
  parse: (jsonStr) => {
    const j = JSON.parse(jsonStr);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(j.ct),
    });
    if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv);
    if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s);
    return cipherParams;
  },
};

 module.exports = {
  decryptAesPayload: (raw) => {
    if (!raw.length) return raw;
    const plain = CryptoJS.AES
      .decrypt(raw, KEY, { format: CryptoJSAesJson })
      .toString(CryptoJS.enc.Utf8);
    return plain;
  }
};
