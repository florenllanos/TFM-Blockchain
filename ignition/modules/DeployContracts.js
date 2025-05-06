// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployModule", (m) => {

  const vacunaTK = m.contract("VacunaTK");
  const cartillaTK = m.contract("CartillaTK");
  const lotTK = m.contract("LotTK");

  return { vacunaTK, cartillaTK, lotTK };
});
