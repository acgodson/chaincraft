import bs58 from 'bs58';
import pinataSDK from '@pinata/sdk';

//Function checking if algo adress length is valid
export function isValidAlgoAddress(address) {
  if (address.length !== 58) {
    return false;
  }
  return true;
}

//Function to convert hexstring to base 64
export function hexToBase64(hexStr: string) {
  let base64 = '';
  for (let i = 0; i < hexStr.length; i++) {
    base64 += !((i - 1) & 1)
      ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16))
      : '';
  }
  return btoa(base64);
}


//Function to convert IPFS hash to byte32
export function ipfscidv0ToByte32(cid: string) {
  // Convert ipfscidv0 to 32 bytes hex string.
  const decoded = bs58.decode(cid);
  const slicedDecoded = decoded.slice(2);
  return Buffer.from(slicedDecoded).toString('hex');
}

// function that verifies if a number is a power of 10 greater than 1
export function isPowerOf10(num) {
  return num > 1 && Math.log10(num) % 1 === 0;
}

// PINATA information
const PINATA_API_KEY = 'fd8ae52c28c49866c91d';
const PINATA_API_SECRET =
  'f487fd6d90dcbda86149e5ed1e5b9e5a5053b4056d9f505f9a9a4931a8670cdf';

export const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
