//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@interep/contracts/IInterep.sol";

uint256 constant GITHUB_GOLD_GROUP_ID = 19792997538846952138225145850176205122934145224103991348074597128209030420613;

contract GithubInterepNFT is ERC721 {
    IInterep public interep;

    constructor(address interepAddress) ERC721("InterepGithub", "IRGH") {
        interep = IInterep(interepAddress);
    }

    function mint(uint256 nullifierHash, uint256[8] calldata proof) public {
        bytes32 signal = bytes32("github-nft");

        interep.verifyProof(GITHUB_GOLD_GROUP_ID, signal, nullifierHash, GITHUB_GOLD_GROUP_ID, proof);

        _mint(_msgSender(), nullifierHash);
    }
}
