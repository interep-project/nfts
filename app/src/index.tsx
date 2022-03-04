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
    List,
    ListItem,
    ListItemButton,
    ListItemText,
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
import { LoadingButton } from "@mui/lab"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { Contract, ethers, utils } from "ethers"
import React from "react"
import ReactDOM from "react-dom"
import { abi as contractAbi } from "../static/InterepNFT.json"

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

const contractAddress = "0x4100e04576439D35E8933fF42ccAcC6C84b855bd"

function App() {
    const classes = useStyles()
    const [_ethereumProvider, setEthereumProvider] = React.useState<any>()
    const [_tokenId, setTokenId] = React.useState<string>("")
    const [_oAuthProvider, setOAuthProvider] = React.useState<string>("")
    const [_error, setError] = React.useState<boolean>(false)
    const [_loading, setLoading] = React.useState<boolean>(false)
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
        setError(false)
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
        const externalNullifier = utils.solidityKeccak256(["string", "string"], [groupId.provider, groupId.name])
        const signal = "nft"

        const zkFiles = { wasmFilePath: "./semaphore.wasm", zkeyFilePath: "./semaphore_final.zkey" }

        setLoading(true)

        try {
            const proof = await createProof(identity, groupId, externalNullifier, signal, zkFiles)
            const contract = new Contract(contractAddress, contractAbi)

            setTokenId(proof[2])

            await contract.connect(signer).mint(proof[0], utils.formatBytes32String(signal), proof[2], proof[4])

            setActiveStep(3)
        } catch (error) {
            console.error(error)

            setError(true)

            resetSteps()
        }

        setLoading(false)
    }

    return (
        <ThemeProvider theme={theme}>
            <Paper className={classes.container} elevation={0} square={true}>
                <Box className={classes.content}>
                    <Typography variant="h4" sx={{ mb: 2 }}>
                        Interep NFTs
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 4 }}>
                        Join an Interep gold group on&nbsp;
                        <Link href="https://kovan.interep.link" underline="hover" rel="noreferrer" target="_blank">
                            kovan.interep.link
                        </Link>
                        , wait 1 minute and mint your NFT.
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
                            <StepLabel error={!!_error}>Mint your Interep NFT</StepLabel>
                            <StepContent style={{ width: 400 }}>
                                <LoadingButton
                                    loading={_loading}
                                    loadingIndicator="Loading..."
                                    fullWidth
                                    onClick={() => mintNFT()}
                                    variant="outlined"
                                >
                                    Mint NFT
                                </LoadingButton>
                            </StepContent>
                        </Step>
                    </Stepper>

                    {_activeStep === 3 && (
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
                                    href={"https://kovan.etherscan.io/token/" + contractAddress + "/?a=" + _tokenId}
                                    underline="hover"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    {_tokenId.substring(0, 10)}
                                </Link>
                            </Typography>
                        </Paper>
                    )}

                    {_error && (
                        <Paper className={classes.results} sx={{ p: 3 }}>
                            <Typography variant="body1">
                                Sorry, there was an error in the creation of your Semaphore proof.
                            </Typography>
                            <List sx={{ mb: 0 }}>
                                <ListItem>
                                    <ListItemText secondary="• Make sure you have enough balance in your wallet." />
                                </ListItem>
                                <ListItem>
                                    <ListItemText secondary="• Verify that you are part of a gold group." />
                                </ListItem>
                                <ListItemButton
                                    component="a"
                                    href={"https://kovan.etherscan.io/token/" + contractAddress + "/?a=" + _tokenId}
                                    target="_blank"
                                >
                                    <ListItemText secondary="• Click here to check if you have already minted your NFT." />
                                </ListItemButton>
                            </List>
                            <Typography variant="body1">{_error}</Typography>
                        </Paper>
                    )}
                </Box>
            </Paper>
        </ThemeProvider>
    )
}

const root = document.getElementById("root")

ReactDOM.render(<App />, root)
