const algosdk = require("algosdk");
const pinataSDK = require("@pinata/sdk");

//  ALGORAND NETWORK information
const ALGO_API_KEY = "QKWEVf6lsO3OCrb0ZTpTp1OaEJJwUKiYP1hTqTS4";
const server = "https://testnet-algorand.api.purestake.io/ps2";
const port = "";
const token = {
  "x-api-key": ALGO_API_KEY,
};
// PINATA information
const PINATA_API_KEY = "87abe523b949a211053f";
const PINATA_API_SECRET =
  "6acdb103a6ce89a7a98646ee9dc62cd7077c6b34b3fcd8d3f408bffd852c0ab9";

// Create a client object
exports.algodClient = new algosdk.Algodv2(token, server, port);

// Create pinate object
exports.pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
