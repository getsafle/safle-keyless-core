import './App.css';
import { useEffect, useState } from 'react';
import Web3 from 'web3';
import abi from './erc20-abi.json';
import { KeylessWeb3, getNetworks } from '@getsafle/safle-keyless-js'
import { connectToParent } from 'penpal';
import { RPC_URLS } from './constants/RPC_URLS';
import ConnectionManager from './utils/ConnectionManager';
let address
let connection

const connectionManager = new ConnectionManager()  // !* initialization of ConnectionManager
function App() {
    const [connect, setConnect] = useState(false);
    //! Current implementation:
    useEffect(()=>{
        (async()=>{
            await connectionManager.initializeConnection();
            await connectionManager.initializeConnectionManager()
            const res = await connectionManager.getAccounts()
            if(res?.loginSuccess){
                setConnect(res.loginSuccess)
            }
        })()
    },[])
    
    //! Current implementation ends here 
    
    //TODO cleanup the following code
    
    let showLogin  = false;
    
    // useEffect(() => {
        // connection = connectToParent({
        //     // debug:true,
        // methods: {
        //     childMethod: async(parentShowLogin) => {
        //         showLogin= parentShowLogin
        //         let login
        //         try{
        //             login=await init()
        //             return Promise.resolve({sucess:true,resp:login});

        //         }
        //         catch(e){
        //             return {sucess:false,error:e};

        //         }
        //     //   return Promise.resolve({sucess:true,resp:login});
        //     },
        // },
        // });
        // onClickConnection();

    // }, []);

    
    const [showDropDown, setShowDropDown] = useState(false)
    const [fromAddr, setfromAddr] = useState(false);
    const [userBalance, setUserBalance] = useState(0)
    const [succMsg, setSuccMsg] = useState('');
    let logged = false;

    let [w3, setW3] = useState(null);
    let [keyless, setKeyless] = useState(false);

    let [userAvailableTokens, setUserAvailableTokens] = useState([])
    let [selectedChain, setSelectedChain] = useState({ chainId: 0, chain: "" })

    const init = async () => {

        logged = true;
        let networks = await getNetworks();

        console.log('networkssssssssss : ', networks);

        const rpcUrls = RPC_URLS

        for (var i in networks) {
            networks[i]['rpcURL'] = rpcUrls[networks[i].chainId];
        }

        console.log(networks);

        let keyless2 = new KeylessWeb3({ blockchain: networks, env: "test" });

        let w32 = new Web3(keyless2.provider);

        console.log({ w32 })

        setW3(w32)

        // w32.currentProvider.on('login successful', setAddress);
                let addressResult=await setAddress(w32, keyless2)

        w32.currentProvider.on('login successful', callFn =>  setAddress(w32, keyless2));
        w32.currentProvider.on('transactionSuccess', successTrans);

        console.log({ w32 })
        console.log("In Init--->",showLogin)
        if(showLogin){
            
            keyless2.login();
            

        }
        console.log("testLog--->",{ keyless2 })
        // awaitsetKeyless(keyless2)
        // let addressResult=await setAddress(w32, keyless2)
        console.log("address--->",addressResult)
        connection.promise.then(parent=>{
            parent.parentMethod({"sucess":true,message:"one method executed init",data:""})})
        return {"sucess":true,message:"one method executed init return",data:"",}
    }

    const setAddress = async(_w3, _keyless) => {
        // const setAddress = () => {
        console.log('login ', _w3);
        setTimeout(() => {
            _w3.eth.personal.getAccounts().then(async (addreses) => {
                console.log("personal : ", addreses);
                address =addreses
                if (Array.isArray(addreses) && addreses.length > 0) {
                    const from = addreses.shift();
                    console.log(from);
                    setfromAddr(from);
                    setConnect(true)
                    const bal = await _w3.eth.getBalance(from);
                    setUserBalance(_w3.utils.fromWei(bal, 'ether'))
                    let tokens = await _keyless.getCurrentNetworkTokens()
                    console.log({ tokens })
                    setUserAvailableTokens(tokens)

                    let currentChain = await _keyless.getCurrentChain()
                    setSelectedChain(currentChain)
                }
                connection.promise.then(parent=>{
                parent.parentMethod({"sucess":true,message:"adresss sent",data:addreses})})
            });

            _w3.eth.personal.getAccounts().then((accounts) => {
                address =accounts
                connection.promise.then(parent=>{
                parent.parentMethod({"sucess":true,message:"adresss sent",data:accounts})})
     
                console.log('getAcc : ', accounts);
            });
        }, 0);

         

        return address
    }

    const successTrans = (resp) => {
        console.log(resp.receipt);
        // setfromAddr(false);
        setSuccMsg('Transaction succeded.');
    }

    const setTokenDecimal = (value, decimal) => {
        if (!value || !decimal) return 0;
        let val;
        if (value.length > decimal) {
            val = value;
        } else {
            val = "0".repeat(decimal - value.length + 1) + value;
        }
        let res = val.substring(0, val.length - decimal) + "." + val.substring(val.length - decimal);
        return res;
    }


    const [messageToSign, setMessageToSign] = useState('')
    const [messageSignature, setMessageSignature] = useState('')

    const signMessage = async () => {
        const message = messageToSign;
        console.log({ message, messageToSign })
        const resp = await w3.eth.sign(message, fromAddr);

        console.log(resp);
        setMessageToSign("")
        setMessageSignature(resp.signature)
    }
    const onClickConnection = async () => {
        if (connect) {

            keyless.disconnect()

            setSendTo('')
            setSendAmount(0)
            setMessageToSign('')
            setMessageSignature('')
            setConnect(false);
            setShowDropDown(false)
            setfromAddr(false);
            setUserBalance(0)
            setSuccMsg('');
            let logged = false;
            setW3(null);
            setKeyless(false);
            setUserAvailableTokens([])
            setSelectedChain({ chainId: 0, chain: "" })
            setConnect(false)
        } else {
            await init()
        }
    }
    const refreshBalance = async () => {
        const bal = await w3.eth.getBalance(fromAddr);
        setUserBalance(w3.utils.fromWei(bal, 'ether'))
        // setUserBalance(bal)
    }

    const [sendTo, setSendTo] = useState('')
    const [sendAmount, setSendAmount] = useState(0)

    const sendAmountTransaction = async () => {

        console.log({ sendTo, sendAmount })

        const sendValue = w3.utils.toBN(sendAmount * Math.pow(10, 18));
        console.log({ sendValue })
        // data = 0xa9059cbb0000000000000000000000002723a2756ecb99b3b50f239782876fb595728ac00000000000000000000000000000000000000000000000000de0b6b3a7640000
        const transaction = {
            'from': fromAddr,
            'to': sendTo, //to address
            'value': sendValue,
            // 'gas': gas,
            // 'data': data,
            // 'nonce': nonce,
            // 'type': '0x2',
            // 'chainId': 137,
        };

        console.log('raw txxxxx : ', transaction);

        const resp = await w3.eth.sendTransaction(transaction);
        console.log({ resp });

        const signedTx = await w3.eth.signTransaction(transaction);
        console.log('signedTx : ', signedTx);

    }


    const [_tokenTo, setTokenTo] = useState('{}')
    const [tokenSendTo, setTokenSendTo] = useState('')
    const [tokenAmount, setTokenAmount] = useState(0)

    const sendTokenAmountTransaction = async () => {

        let tokenTo = JSON.parse(_tokenTo)
        console.log({ tokenSendTo, _tokenTo, tokenAmount, tokenTo })


        const toAddress = tokenSendTo
        const contractAddress = tokenTo.tokenAddress.toLowerCase();

        const nonce = await w3.eth.getTransactionCount(fromAddr, 'latest'); // nonce starts counting from 0

        const instance = new w3.eth.Contract(abi, contractAddress);

        const sendValue = w3.utils.toBN(tokenAmount * Math.pow(10, tokenTo.decimal));
        console.log({ sendValue })

        // const sendValue = w3.utils.toBN(0.01 * Math.pow(10, 18));

        let data, gas, balance;

        data = await instance.methods.transfer(toAddress, sendValue).encodeABI();

        try {
            balance = await instance.methods.balanceOf(fromAddr).call();
            console.log('weenus balance : ', balance);
            gas = await instance.methods.transfer(toAddress, sendValue).estimateGas({ from: fromAddr });
        } catch (e) {
            console.log('err', e);
        }

        console.log('dataaaaa : ', data);
        console.log('gassssss : ', gas);
        console.log('balanceeeeeee : ', balance);

        // data = 0xa9059cbb0000000000000000000000002723a2756ecb99b3b50f239782876fb595728ac00000000000000000000000000000000000000000000000000de0b6b3a7640000
        const transaction = {
            'from': fromAddr,
            'to': contractAddress, //to address
            'value': 0,
            // 'gas': gas,
            'data': data,
            // 'nonce': nonce,
            // 'type': '0x2',
            // 'chainId': 137,
        };

        console.log('raw txxxxx : ', transaction);

        const resp = await w3.eth.sendTransaction(transaction);
        console.log(resp);

        const signedTx = await w3.eth.signTransaction(transaction);
        console.log('signedTx : ', signedTx);

    }

    const dashboardRenderer= ()=>{
        <div>connected</div>
    // <div className="header">
    //             <div className="header__logo">
    //                 <img src="/Safle_Logo.png" />
    //             </div>
    //             <div className="header__title">
    //                 <h1>Safle Keyless Demo</h1>
    //             </div>
    //             <div
    //                 className={"header__connect " + (connect ? "disconnect" : "connect")}
    //                 onClick={onClickConnection}
    //             // () => setConnect(!connect)}
    //             >
    //                 <button>
    //                     <span className="outer">
    //                         <span className="inner">&nbsp;</span>
    //                     </span>
    //                     {connect ? "Disconnect" : "Connect"}
    //                 </button>
    //             </div>
    //         </div> 
    }

    return (
        <div className="container">
            {
                connect? dashboardRenderer : null
            }
        </div>
    );
}

export default App;