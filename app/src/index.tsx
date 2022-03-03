import { keccak256 } from "@ethersproject/solidity"
import createIdentity from "@interep/identity"
import createProof from "@interep/proof"
import detectEthereumProvider from "@metamask/detect-provider"
import ReplayIcon from "@mui/icons-material/Replay"
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    Link,
    MenuItem,
    Paper,
    Select,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Theme,
    Typography
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { Contract, ethers } from "ethers"
import React from "react"
import ReactDOM from "react-dom"
import { abi } from "../static/InterepNFT.json"

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            flex: 1
        },
        content: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        },
        results: {
            position: "relative",
            marginTop: 20,
            width: 530,
            textAlign: "center"
        },
        resetButton: {
            zIndex: 1,
            right: 5,
            top: 5
        },
        listItem: {
            paddingTop: 0,
            paddingBottom: 0
        }
    })
)

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#66A8C9"
        }
    }
})

function App() {
    const classes = useStyles()
    const [_ethereumProvider, setEthereumProvider] = React.useState<any>()
    const [_tokenId, setTokenId] = React.useState<string>("")
    const [_oAuthProvider, setOAuthProvider] = React.useState<string>("")
    const [_errorMessage, setErrorMessage] = React.useState<string>("")
    const [_activeStep, setActiveStep] = React.useState<number>(0)

    React.useEffect(() => {
        ;(async function IIFE() {
            if (!_ethereumProvider) {
                const ethereumProvider = (await detectEthereumProvider()) as any

                if (ethereumProvider) {
                    setEthereumProvider(ethereumProvider)
                } else {
                    console.error("Please install Metamask!")
                }
            } else {
                const accounts = await _ethereumProvider.request({ method: "eth_accounts" })

                if (accounts.length !== 0 && accounts[0]) {
                    setActiveStep(1)
                }

                _ethereumProvider.on("accountsChanged", (newAccounts: string[]) => {
                    if (newAccounts.length === 0) {
                        setActiveStep(0)
                        setTokenId("")
                    }
                })
            }
        })()
    }, [_ethereumProvider])

    function handleNext() {
        setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
        setErrorMessage("")
    }

    function resetSteps() {
        setActiveStep(1)
        setOAuthProvider("")
        setTokenId("")
    }

    async function connect() {
        await _ethereumProvider.request({ method: "eth_requestAccounts" })
        handleNext()
    }

    async function selectProvider(event: any) {
        setOAuthProvider(event.target.value)
        handleNext()
    }

    async function mintNFT() {
        const ethersProvider = new ethers.providers.Web3Provider(_ethereumProvider)
        const signer = ethersProvider.getSigner()
        const identity = await createIdentity((message: string) => signer.signMessage(message), _oAuthProvider)

        const groupId = {
            provider: _oAuthProvider.toLowerCase(),
            name: "gold"
        }
        const externalNullifier = keccak256(["string", "string"], [groupId.provider, groupId.name])
        const signal = "nft"

        const zkFiles = { wasmFilePath: "./semaphore.wasm", zkeyFilePath: "./semaphore_final.zkey" }

        try {
            const proof = await createProof(identity, groupId, externalNullifier, signal, zkFiles)
            const contract = new Contract("0xF9AB5f33A05fb51645bF8848b607f3E7341Fa6Bc", abi)

            await contract.connect(signer).mint(proof[0], proof[2], proof[4])

            setTokenId(proof[2])
            setActiveStep(3)
        } catch (error) {
            console.error(error)

            setErrorMessage(
                "Sorry, there was an error in the creation of your Semaphore proof. Please verify that you are in a 'gold' group."
            )

            resetSteps()
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <Paper className={classes.container} elevation={0} square={true}>
                <Box className={classes.content}>
                    <Typography variant="h4" sx={{ mb: 2 }}>
                        Interep NFTs
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 4 }}>
                        Join an Interep 'gold' group on&nbsp;
                        <Link href="https://kovan.interep.link" underline="hover" rel="noreferrer" target="_blank">
                            kovan.interep.link
                        </Link>
                        &nbsp;and mint your NFT.
                    </Typography>

                    <Stepper activeStep={_activeStep} orientation="vertical">
                        <Step>
                            <StepLabel>Connect your wallet with Metamask</StepLabel>
                            <StepContent style={{ width: 400 }}>
                                <Button
                                    fullWidth
                                    onClick={() => connect()}
                                    variant="outlined"
                                    disabled={!_ethereumProvider}
                                >
                                    Connect wallet
                                </Button>
                            </StepContent>
                        </Step>
                        <Step>
                            <StepLabel>Select an Interep provider</StepLabel>
                            <StepContent style={{ width: 400 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="oauth-provider-select-label">Provider</InputLabel>
                                    <Select
                                        labelId="oauth-provider-select-label"
                                        value={_oAuthProvider}
                                        label="Provider"
                                        variant="outlined"
                                        onChange={selectProvider}
                                    >
                                        <MenuItem value="Twitter">Twitter</MenuItem>
                                        <MenuItem value="Github">Github</MenuItem>
                                        <MenuItem value="Reddit">Reddit</MenuItem>
                                    </Select>
                                </FormControl>
                            </StepContent>
                        </Step>
                        <Step>
                            <StepLabel error={!!_errorMessage}>Mint your Interep NFT</StepLabel>
                            <StepContent style={{ width: 400 }}>
                                <Button fullWidth onClick={() => mintNFT()} variant="outlined">
                                    Mint NFT
                                </Button>
                            </StepContent>
                        </Step>
                    </Stepper>

                    {_tokenId && (
                        <Paper className={classes.results} sx={{ p: 3 }}>
                            <IconButton
                                onClick={() => resetSteps()}
                                className={classes.resetButton}
                                style={{ position: "absolute" }}
                            >
                                <ReplayIcon />
                            </IconButton>
                            <Typography variant="body1">
                                You have minted your Interep NFT successfully:&nbsp;
                                <Link
                                    href={"https://kovan.etherscan.io/token/" + _tokenId}
                                    underline="hover"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    {_tokenId.substring(0, 10)}
                                </Link>
                            </Typography>
                        </Paper>
                    )}

                    {_errorMessage && (
                        <Paper className={classes.results} sx={{ p: 3 }}>
                            <Typography variant="body1">{_errorMessage}</Typography>
                        </Paper>
                    )}
                </Box>
            </Paper>
        </ThemeProvider>
    )
}

const root = document.getElementById("root")

ReactDOM.render(<App />, root)
