import puppeteer from "puppeteer";
import fs from "fs";
import { algodClient, pinata } from "./config.js";
import chalk from "chalk";
import boxen from "boxen";
import readline from "readline";
import url from "url";
import https from "https";
import { fileTypeFromBuffer } from "file-type";
import request from "request";
import path from "path";
import ora from "ora";
import algosdk from "algosdk";
import { hexToBase64, encodeCID, ipfscidv0ToByte32 } from "./utils.mjs";

//Function to print Created Asset
async function printAsset(assetid) {
  fs.readFile("keyStore.json", async (err, data) => {
    let keyPair = JSON.parse(data);
    let accountInfo = await algodClient.accountInformation(keyPair.addr).do();
    let idx;
    for (idx = 0; idx < accountInfo["created-assets"].length; idx++) {
      let scrutinizedAsset = accountInfo["created-assets"][idx];
      if (scrutinizedAsset["index"] == assetid) {
        console.log(
          chalk.green("AssetID: ") + chalk.yellow(scrutinizedAsset["index"])
        );
        let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);

        console.log(chalk.green("parms: ") + myparms);
        console.log(
          chalk.green(
            `Preview NFT at https://asset.chaincraft-algo.web.app/${assetid}`
          )
        );

        break;
      }
    }
  });
}

//Check asset holding
async function checkAsset(assetid) {
  fs.readFile("keyStore.json", async (err, data) => {
    let keyPair = JSON.parse(data);
    let accountInfo = await algodClient.accountInformation(keyPair.addr).do();
    let idx;
    for (idx = 0; idx < accountInfo["created-assets"].length; idx++) {
      let scrutinizedAsset = accountInfo["created-assets"][idx];
      if (scrutinizedAsset["index"] == assetid) {
        let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);
        return myparms;
      }
    }
  });
}

// Function to sign and Send Transaction
async function signAndsendTransaction() {
  // Read a JSON file for arc info
  const data = fs.readFileSync("arc.json", "utf-8");
  const arcData = JSON.parse(data);
  const spinner = ora(chalk.gray("Waiting for Transaction")).start();
  const params = await algodClient.getTransactionParams().do();
  const defaultFrozen = false;
  const unitName = arcData.asset.unitName;
  const assetName = arcData.asset.assetName;
  const url = arcData.asset.url;
  const managerAddr =
    arcData.asset.manager.length === 58 ? arcData.asset.manager : undefined;
  const freezeAddr =
    arcData.asset.freezer.length === 58 ? arcData.asset.freezer : undefined;
  const clawbackAddr = undefined;
  const reserveAddr = undefined;
  const decimals = arcData.asset.decimals;
  const total = arcData.asset.total;
  let bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(arcData.asset.metadata.substr(i * 2, 2), 16);
  }
  const metadata = bytes;
  //Retrieve user address and secret key from json file
  fs.readFile("keyStore.json", async (err, data) => {
    let keyPair = JSON.parse(data);
    let array = JSON.parse(keyPair.sk);
    let sk = new Uint8Array(array);

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: keyPair.addr,
      total,
      decimals,
      assetName,
      unitName,
      assetURL: url,
      assetMetadataHash: metadata,
      defaultFrozen,
      freeze: freezeAddr,
      manager: managerAddr,
      clawback: clawbackAddr,
      reserve: reserveAddr,
      suggestedParams: params,
    });
    const rawSignedTxn = txn.signTxn(sk);
    const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
    // wait for transaction to be confirmed
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      tx.txId,
      4
    );
    spinner.succeed(
      chalk.gray("Transaction confirmed; " + chalk.green("Pure NFT Created"))
    );
    console.log(
      chalk.green("Confirmed Round: ") +
        chalk.yellow(confirmedTxn["confirmed-round"])
    );
    const assetID = confirmedTxn["asset-index"];

    printAsset(assetID);
  });
}

//Copy artwork from local path into ipfs folder
async function copyImageToFolder(url, ext) {
  // Read a JSON file for arc info
  const data = fs.readFileSync("arc.json", "utf-8");
  const arcData = JSON.parse(data);
  const filename = arcData.asset.unitName.toLowerCase();
  //Copy file from local device to folder
  fs.copyFile(url, `images/${filename + ext}`, async (err) => {
    if (err) throw err;
    const filePath = `images/${filename + ext}`;
    console.log(chalk.gray(`file saved to ${filePath}`));
    // Add the image file to IPFS and get the IPFS CID
    const spinner = ora(chalk.gray("Pinning file on IPFS")).start();
    const image = fs.createReadStream(filePath);
    const imageOptions = {
      pinataMetadata: {
        name: filename,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const imagePinned = await pinata.pinFileToIPFS(image, imageOptions);
    const ipfsCid = imagePinned.IpfsHash;
    spinner.succeed(chalk.gray("file pinned on IPFS"));
    const integrity = encodeCID(ipfsCid);
    const imageIntegrity = "sha256-" + integrity;

    // Create a metadata object for the NFT description

    const arc3Metadata = {
      image: ipfsCid,
      description: arcData.asset.description,
      image: `ipfs://${ipfsCid}`,
      image_integrity: imageIntegrity,
      image_mimetype: `image/${ext}`,
      properties: {
        file_url: "arc3-asa",
        file_url_integrity: imageIntegrity,
        file_url_mimetype: `image/${ext}`,
      },
    };

    const arc69Metadata = {
      standard: "arc69",
      description: arcData.asset.description,
      mime_type: `image/${ext}`,
      properties: {
        media_url: `ipfs://${ipfsCid}`,
        mime_type: `image/${ext}`,
      },
    };

    // Add and pin the metadata to IPFS
    const metadataPinned = await pinata.pinJSONToIPFS(
      arcData.asset.manager.length > 1 ? arc69Metadata : arc3Metadata
    );
    const metadataHash = metadataPinned.IpfsHash;
    //Convert metadata hash to base64 32 bytes string (compatible with algorand);
    const hexString = ipfscidv0ToByte32(metadataHash);
    arcData.asset.url =
      arcData.asset.manager.length > 1
        ? `ipfs://${ipfsCid}`
        : `ipfs://${metadataHash}`;
    arcData.asset.metadata = hexString;
    arcData.asset.imageIntegrity = imageIntegrity;
    fs.writeFileSync("arc.json", JSON.stringify(arcData), "utf-8");

    spinner.succeed(chalk.gray("metadata pinned on IPFS"));

    ///Sign transaction and upload NFT to algorand blockchain
    signAndsendTransaction();
  });
}

//Download artwork from online into ipfs folder
async function downloadImageToFolder(url) {
  // Read a JSON file for arc info
  const data = fs.readFileSync("arc.json", "utf-8");
  const arcData = JSON.parse(data);
  const imgPath = [];
  const filename = arcData.asset.unitNametoLowerCase();

  request.head(url, function (err, res, body) {
    const filePath = `images/${filename}.${
      res.headers["content-type"].split("/")[1]
    }`;
    const ext = res.headers["content-type"].split("/")[1];

    request(url)
      .pipe(fs.createWriteStream(filePath))
      .on("finish", async () => {
        console.log(chalk.gray(`file saved to ${filePath}`));
        const image = fs.createReadStream(filePath);
        // Add the image file to IPFS and get the IPFS CID
        const spinner = ora(chalk.gray("Pinning file on IPFS")).start();
        const imageOptions = {
          pinataMetadata: {
            name: filename,
          },
          pinataOptions: {
            cidVersion: 0,
          },
        };
        const imagePinned = await pinata.pinFileToIPFS(image, imageOptions);
        const ipfsCid = imagePinned.IpfsHash;
        spinner.succeed(chalk.gray("file pinned on IPFS"));
        const integrity = encodeCID(ipfsCid);
        const imageIntegrity = "sha256-" + integrity;

        // Create a metadata object for the NFT description
        const arc3Metadata = {
          image: ipfsCid,
          description: arcData.asset.description,
          image: `ipfs://${ipfsCid}`,
          image_integrity: imageIntegrity,
          image_mimetype: `image/${ext}`,
          properties: {
            file_url: "arc3-asa",
            file_url_integrity: imageIntegrity,
            file_url_mimetype: `image/${ext}`,
          },
        };

        const arc69Metadata = {
          standard: "arc69",
          description: arcData.asset.description,
          mime_type: `image/${ext}`,
          properties: {
            media_url: `ipfs://${ipfsCid}`,
            mime_type: `image/${ext}`,
          },
        };

        // Add and pin the metadata to IPFS
        const metadataPinned = await pinata.pinJSONToIPFS(
          arcData.asset.manager.length > 1 ? arc69Metadata : arc3Metadata
        );
        const metadataHash = metadataPinned.IpfsHash;
        //Convert metadata hash to base64 32 bytes string (compatible with algorand);
        const hexString = ipfscidv0ToByte32(metadataHash);
        arcData.asset.url =
          arcData.asset.manager.length > 1
            ? `ipfs://${ipfsCid}`
            : `ipfs://${metadataHash}`;
        arcData.asset.metadata = hexString;
        arcData.asset.imageIntegrity = imageIntegrity;
        fs.writeFileSync("arc.json", JSON.stringify(arcData), "utf-8");

        spinner.succeed(chalk.gray("metadata pinned on IPFS"));
        // console.log("metadata hash: " + chalk.blue(metadataHash));

        ///Sign transaction and upload NFT to algorand blockchain
        signAndsendTransaction();
      })
      .on("error", (err) => {
        console.error(`An error occurred while downloading the image: ${err}`);
      });
  });
}

function createNFT() {
  //Welcome message
  const data = fs.readFileSync("arc.json", "utf-8");
  const arcData = JSON.parse(data);

  const message =
    `${chalk.yellow(
      "WELCOME TO CHAINCRAFT, create a " + arcData.asset.total === 1
        ? "Pure NFT"
        : "Fractional NFT"
    )}` +
    " asset on Algorand blockchain. " +
    chalk.gray(
      arcData.asset.total === 1
        ? "Pure NFT "
        : "Fractional NFT " +
            "have a total supply = " +
            arcData.asset.total +
            "number of decimals = " +
            arcData.asset.decimals +
            ", and metedata pinned on IPFS"
    );
  console.log(
    boxen(message, {
      padding: 1,
      borderColor: "yellow",
      backgroundColor: "black",
    })
  );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question(chalk.yellow("URL or file-path to image: "), (filePath) => {
    //Readline line interface for reading user input

    // Read file and upload to ipfs
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        const parsedUrl = url.parse(filePath);
        // Check if the URL is valid and uses HTTPS
        if (!parsedUrl.protocol || parsedUrl.protocol !== "https:") {
          console.error(chalk.red("Invalid path or URL"));
          rl.close();
          return;
        } else {
          // Check if the URL leads to a file
          https
            .get(filePath, (res) => {
              if (res.statusCode !== 200) {
                console.error("Invalid file URL: " + filePath);
              }

              const chunks = [];
              res.on("data", (chunk) => chunks.push(chunk));
              res.on("end", async () => {
                const buffer = Buffer.concat(chunks);
                const type = await fileTypeFromBuffer(buffer);
                switch (true) {
                  case type && type.mime.startsWith("image/"):
                    ///Upload to IPFS via web3.storage
                    downloadImageToFolder(filePath);
                    break;
                  case !type:
                    console.error("Not an image file: " + filePath);
                    break;
                  default:
                    console.error("Not an image file: " + filePath);
                }
                rl.close();
              });
            })
            .on("error", (error) => {
              rl.close();
              console.error(error);
            });
        }
      } else {
        fs.readFile(filePath, (error, buffer) => {
          if (error) {
            console.log(error);
          } else {
            // Get the file extension
            const ext = path.extname(filePath).toLowerCase();
            // Check if the file is an image type
            const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
            if (imageTypes.includes(ext)) {
              // Read the file
              fs.readFile(filePath, async (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }
                await copyImageToFolder(filePath, ext);
              });
            } else {
              console.log("Not an image file");
            }
          }
        });
        rl.close();
      }
    });
  });
}

async function destroyingAsset(assetID) {
  const destroyMessage = "Destroy Asset " + chalk.yellow(assetID);

  const parm = await checkAsset(assetID);

  console.log(
    boxen(destroyMessage, {
      padding: 1,
      borderColor: "yellow",
      backgroundColor: "black",
    })
  );
  fs.readFile("keyStore.json", async (err, data) => {
    let keyPair = JSON.parse(data);
    const spinner = ora(chalk.gray("Waiting for Transaction")).start();
    if (parm && parm.manager && parm.manager === keyPair.addr) {
      const params = await algodClient.getTransactionParams().do();
      const addr = keyPair.addr;
      const txn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
        from: addr,
        note: undefined,
        assetIndex: assetID,
        suggestedParams: params,
      });
      let array = JSON.parse(keyPair.sk);
      let sk = new Uint8Array(array);
      const rawSignedTxn = txn.signTxn(sk);
      const tx = await algodClient.sendRawTransaction(rawSignedTxn).do();
      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(
        algodClient,
        tx.txId,
        4
      );
      spinner.succeed(chalk.gray("Asset destroyed"));
      console.log(confirmedTxn);
    } else {
      spinner.fail(
        "Asset cannot be destroyed " +
          chalk.gray("(managerAddr is undefined or does not match sender)")
      );
    }
  });
}

export const CreateAsset = async (type, name, description) => {
  //FilePath to users authentication keys
  const filePath = "keyStore.json";

  //Check if filePath exists (if user is logged in)
  fs.access(filePath, fs.constants.F_OK, async (error) => {
    //if no user is authenticated, open browser to complete signing in
    if (error) {
      const spinner = ora(chalk.gray("Waiting for browser login")).start();
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto("https://chaincraft-algo.web.app/");
      // Listen for the button click event
      await page.waitForSelector(".authorize", {
        timeout: 0,
      });
      await page.click(".authorize");
      // Select the keypair values
      const keyPairAddr = await page.$eval(".addr", (el) => el.innerHTML);
      const keyPairSK = await page.$eval(".sk", (el) => el.innerHTML);
      const keyPairObj = {
        addr: keyPairAddr,
        sk: keyPairSK,
      };
      // Write the keypairs to a file
      fs.writeFile("keyStore.json", JSON.stringify(keyPairObj), (error) => {
        if (error) {
          console.error(error);
          return;
        }
      });
      browser.close();
      spinner.succeed(chalk.gray("login successful"));
    }

    //Retrieve user address and secret key from json file
    fs.readFile("keyStore.json", async (err, data) => {
      let keyPair = JSON.parse(data);

      if (keyPair) {
        const network = "Network: " + chalk.yellow("Testnet");
        const address = "Wallet Address: " + chalk.blue(keyPair.addr);
        const values = await algodClient.accountInformation(keyPair.addr).do();
        if (values) {
          const { amount } = values;
          const balance = Math.floor(amount / 1e6);
          const bal = "Balance: " + chalk.blue(balance);
          console.log(network);
          console.log(address);
          console.log(bal + " Algo");
          console.log(
            chalk.gray(
              `Get Faucets: https://bank.testnet.algorand.network/?account=${keyPair.addr}`
            )
          );
          //Start the Process of creating the NFT
          createNFT();
        }
      }
    });
  });
};

export const DestroyAsset = async (assetID) => {
  const filePath = "keyStore.json";

  //Check if filePath exists (if user is logged in)
  fs.access(filePath, fs.constants.F_OK, async (error) => {
    //if no user is authenticated, open browser to complete signing in
    if (error) {
      const spinner = ora(chalk.gray("Waiting for browser login")).start();
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto("https://chaincraft-algo.web.app/");
      // Listen for the button click event
      await page.waitForSelector(".authorize", {
        timeout: 0,
      });
      await page.click(".authorize");
      // Select the keypair values
      const keyPairAddr = await page.$eval(".addr", (el) => el.innerHTML);
      const keyPairSK = await page.$eval(".sk", (el) => el.innerHTML);
      const keyPairObj = {
        addr: keyPairAddr,
        sk: keyPairSK,
      };
      // Write the keypairs to a file
      fs.writeFile("keyStore.json", JSON.stringify(keyPairObj), (error) => {
        if (error) {
          console.error(error);
          return;
        }
      });
      browser.close();
      spinner.succeed(chalk.gray("login successful"));
    }

    //Retrieve user address and secret key from json file
    fs.readFile("keyStore.json", async (err, data) => {
      let keyPair = JSON.parse(data);

      if (keyPair) {
        const network = "Network: " + chalk.yellow("Testnet");
        const address = "Wallet Address: " + chalk.blue(keyPair.addr);
        const values = await algodClient.accountInformation(keyPair.addr).do();
        if (values) {
          const { amount } = values;
          const balance = Math.floor(amount / 1e6);
          const bal = "Balance: " + chalk.blue(balance);
          console.log(network);
          console.log(address);
          console.log(bal + " Algo");
          console.log(
            chalk.gray(
              `Get Faucets: https://bank.testnet.algorand.network/?account=${keyPair.addr}`
            )
          );
          //Start the Process of creating the NFT
          destroyingAsset(assetID);
        }
      }
    });
  });
};
