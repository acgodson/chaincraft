#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import { CreateAsset, DestroyAsset } from "./web3.mjs";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";
import puppeteer from "puppeteer";
import { isPowerOf10 } from "./utils.mjs";
import { isValidAlgoAddress, CreateFolder } from "./utils.mjs";

yargs(hideBin(process.argv))
  .command({
    command: "create-asset",
    describe: "Create new Asset on Algorand Blockchain",
    builder: (yargs) => {
      return yargs.options({
        type: {
          alias: "type",
          describe: "Option to create either a pure or fractional nft",
          demandOption: true,
          type: "string",
          choices: ["pure nft", "fractional"],
        },
        name: {
          alias: "name",
          describe: "Used to derieve asset and unit name for NFT Asset",
          demandOption: true,
          type: "string",
        },
        description: {
          alias: "description",
          describe: "Description for NFT metadata",
          demandOption: false,
          type: "string",
        },
        manager: {
          alias: "manager",
          describe: "Add manager address, supports arc69 standard too",
          demandOption: false,
          type: "string",
        },
        freezer: {
          alias: "freezer",
          describe: "Can freeze and unfreeze assets",
          demandOption: false,
          type: "string",
        },
      });
    },
    handler: (argv) => {
      //Create Pure NFT
      if (argv.type === "pure nft") {
        function initPureNFT(arc) {
          CreateFolder("images/");
          fs.writeFileSync("arc.json", JSON.stringify(arc), "utf-8");
          CreateAsset();
        }

        const name = argv.name.toUpperCase();
        const note = argv.description ? argv.description : "";
        const arc = {
          asset: {
            defaultFrozen: false,
            unitName: name,
            assetName: argv.manager
              ? `${name.toLowerCase()}@arc69`
              : `${name.toLowerCase()}@arc3`,
            url: "",
            manager: argv.manager ? argv.manager : "",
            freezer: argv.freezer ? argv.freezer : "",
            metadata: "",
            imageIntegrity: "",
          },
          description: note,
          creator: null,
          total: 1,
          decimals: 0,
        };

        if (argv.manager && argv.manager.length > 0) {
          switch (isValidAlgoAddress(argv.manager)) {
            case true:
              initPureNFT(arc);
              break;
            case false:
              console.error("Invalid manager addr format");
              return;
            default:
              console.error("Error checking manager");
              return;
          }
        } else {
          initPureNFT(arc);
        }
      }

      //Create fractional NFT
      if (argv.type === "fractional") {
        function initFractionalNFT(arc) {
          CreateFolder("images/");
          fs.writeFileSync("arc.json", JSON.stringify(arc), "utf-8");
          CreateAsset();
        }
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.question(
          chalk.yellow(
            "Enter Total (power of 10 greater than 1: 10,100,1000...): "
          ),
          (number) => {
            const totalNumber = isPowerOf10(number);
            console.log(totalNumber);
            if (totalNumber === false) {
              console.error(chalk.red("Inavid total"));
              console.log(
                "Number must be a power of 10 greater than 1: 10,100,1000,1000..."
              );
              return;
            }
            const decimals = Math.log10(number);
            const name = argv.name.toUpperCase();
            const note = argv.description ? argv.description : "";

            const arc = {
              asset: {
                defaultFrozen: false,
                unitName: name,
                assetName: argv.manager
                  ? `${name.toLowerCase()}@arc69`
                  : `${name.toLowerCase()}@arc3`,
                url: "",
                manager: argv.manager ? argv.manager : "",
                metadata: "",
                imageIntegrity: "",
              },
              description: note,
              creator: null,
              total: totalNumber,
              decimals: decimals,
            };

            if (argv.manager && argv.manager.length > 0) {
              switch (isValidAlgoAddress(argv.manager)) {
                case true:
                  initFractionalNFT(arc);
                  break;
                case false:
                  console.error("Invalid manager addr format");
                  return;
                default:
                  console.error("Error checking manager");
                  return;
              }
            } else {
              initFractionalNFT(arc);
            }
          }
        );
      }
    },
  })
  .command({
    command: "destroy-asset",
    describe: "Destroy Asset on Algorand Blockchain",
    builder: (yargs) => {
      return yargs.options({
        id: {
          alias: "id",
          describe: "asset id (asset-index of selected NFT)",
          demandOption: true,
          type: "string",
        },
      });
    },
    handler: (argv) => {
      if (argv.id) {
        DestroyAsset(argv.id);
      } else {
        console.error("asset id required");
      }
    },
  })
  .command({
    command: "freeze-asset",
    describe: "Freeze or Unfreeze asset on Algorand Blockchain",
    builder: (yargs) => {
      return yargs.options({
        id: {
          alias: "id",
          describe: "asset id (asset-index of selected NFT)",
          demandOption: true,
          type: "string",
        },
      });
    },
    handler: (argv) => {
      if (argv.id) {
        console.log("I'm ready to modify this particular asset's metadata");
      }
    },
  })
  .command({
    command: "reauth",
    describe:
      "Sign in to your chaincraft Wallet and overide any existing keystore",
    handler: async () => {
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
    },
  })
  .parse();
