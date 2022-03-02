//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@interep/contracts/IInterep.sol";

contract InterepNFT is ERC721 {
    IInterep public interep;

    constructor(address interepAddress) ERC721("InterepNFT", "INTRP") {
        interep = IInterep(interepAddress);
    }

    function mint(
        uint256 groupId,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) public {
        interep.verifyProof(groupId, "nft", nullifierHash, groupId, proof);

        _mint(_msgSender(), nullifierHash);
    }
}
