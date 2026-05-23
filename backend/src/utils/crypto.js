// backend/src/utils/crypto.js
const CryptoJS = require("crypto-js");

const SECRET = process.env.CREDENTIAL_SECRET;

exports.encrypt = (text) => {
  if (!text) return "";
  return CryptoJS.AES.encrypt(text, SECRET).toString();
};

exports.decrypt = (cipher) => {
  if (!cipher) return "";
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};
