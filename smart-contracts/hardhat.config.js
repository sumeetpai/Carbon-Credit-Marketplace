require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.22",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545" // or whatever port your Ganache CLI runs on
    }
  }
};
