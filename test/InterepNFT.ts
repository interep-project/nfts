import { expect } from "chai"
import { Signer, constants, Contract } from "ethers"
import { run } from "hardhat"
import { InterepNFT } from "../build/typechain/InterepNFT"
import { abi as InterepAbi } from "../build/contracts/@interep/contracts/Interep.sol/Interep.json"
import { deployMockContract } from "@ethereum-waffle/mock-contract"

describe("InterepNFT", () => {
    let contract: InterepNFT
    let accounts: string[]
    let interepMock: Contract

    before(async () => {
        const signers = await run("accounts", { logs: false })

        interepMock = await deployMockContract(signers[0], InterepAbi)

        contract = await run("deploy", { logs: false, interepAddress: interepMock.address })

        accounts = await Promise.all(signers.map((signer: Signer) => signer.getAddress()))
    })

    describe("# mint", () => {
        it("Should mint an Interep NFT", async () => {
            const groupId = 1
            const nullifierHash = 2
            const proof = [1, 2, 3, 4, 5, 6, 7, 8]

            await interepMock.mock.verifyProof.returns()

            const transaction = contract.mint(groupId, nullifierHash, proof as any)

            await expect(transaction)
                .to.emit(contract, "Transfer")
                .withArgs(constants.AddressZero, accounts[0], nullifierHash)
        })
    })
})
