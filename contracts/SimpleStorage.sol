// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract SimpleStorage {
  string public data;

  function setData(string calldata _data) external {
    data = _data;
  }
}
