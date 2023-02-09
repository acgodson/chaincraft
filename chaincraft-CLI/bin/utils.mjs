import bs58 from "bs58";
import CID from "cids";
import fse from "fs-extra";

//Function checking if algo adress length is valid
export function isValidAlgoAddress(address) {
  if (address.length !== 58) {
    return false;
  }
  return true;
}

//Function to convert hexstring to base 64
export function hexToBase64(hexStr) {
  let base64 = "";
  for (let i = 0; i < hexStr.length; i++) {
    base64 += !((i - 1) & 1)
      ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16))
      : "";
  }
  return btoa(base64);
}

//Funtion to find image integrity from imageHash
export function encodeCID(cid) {
  //Convert CID to version 1
  const cidV1 = new CID(cid).toV1().toString("base32");
  const hex = new CID(cidV1).toString("base16").substring(9);
  let base64 = hexToBase64(hex);
  return base64;
}

//Function to convert IPFS hash to byte32
export function ipfscidv0ToByte32(cid) {
  // Convert ipfscidv0 to 32 bytes hex string.
  const decoded = bs58.decode(cid);
  const slicedDecoded = decoded.slice(2);
  return new Buffer.from(slicedDecoded).toString("hex");
}

//Function to create or recreate folder
export async function CreateFolder(folderPath) {
  try {
    if (await fse.pathExists(folderPath)) {
      await fse.remove(folderPath);
    }
    await fse.mkdir(folderPath);
  } catch (err) {
    console.error(err);
  }
}

// function that verifies if a number is a power of 10 greater than 1
export function isPowerOf10(num) {
  return num > 1 && Math.log10(num) % 1 === 0;
}
