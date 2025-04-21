import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import addresses from './addresses'
import CarbonMarketplaceABI from './abis/CarbonMarketplace.json'
import GreenNFTABI from './abis/GreenNFT.json'
import CarbonCreditTokenABI from './abis/CarbonCreditToken.json'

import ClaimReduction from './components/ClaimReduction'
import AuditorRegistration from './components/AuditorRegistration'
import AuditClaim from './components/AuditClaim'
import Marketplace from './components/Marketplace'

function App() {
  const [account, setAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isAuditor, setIsAuditor] = useState(false)
  const [isGreenNFTOwner, setIsGreenNFTOwner] = useState(false)
  const [isCCTOwner, setIsCCTOwner] = useState(false)

  const checkAuditorStatus = async (address, contract) => {
    try {
      const isRegisteredAuditor = await contract.auditors(address)
      setIsAuditor(isRegisteredAuditor)
    } catch (error) {
      console.error('Error checking auditor status:', error)
      setIsAuditor(false)
    }
  }

  const checkGreenNFTOwnership = async (contract) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const greenNFTContract = new ethers.Contract(
        addresses.GreenNFT,
        GreenNFTABI.abi,
        signer
      )
      const owner = await greenNFTContract.owner()
      const marketplaceAddress = addresses.CarbonMarketplace
      console.log('GreenNFT Ownership Check:', {
        currentOwner: owner,
        marketplaceAddress: marketplaceAddress,
        isMarketplaceOwner: owner.toLowerCase() === marketplaceAddress.toLowerCase()
      })
      setIsGreenNFTOwner(owner.toLowerCase() === marketplaceAddress.toLowerCase())
    } catch (error) {
      console.error('Error checking GreenNFT ownership:', error)
    }
  }

  const checkCCTOwnership = async (contract) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const cctContract = new ethers.Contract(
        addresses.CarbonCreditToken,
        CarbonCreditTokenABI.abi,
        signer
      )
      const owner = await cctContract.owner()
      const marketplaceAddress = addresses.CarbonMarketplace
      console.log('CCT Ownership Check:', {
        currentOwner: owner,
        marketplaceAddress: marketplaceAddress,
        isMarketplaceOwner: owner.toLowerCase() === marketplaceAddress.toLowerCase()
      })
      setIsCCTOwner(owner.toLowerCase() === marketplaceAddress.toLowerCase())
    } catch (error) {
      console.error('Error checking CCT ownership:', error)
    }
  }

  const transferGreenNFTOwnership = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const greenNFTContract = new ethers.Contract(
        addresses.GreenNFT,
        GreenNFTABI.abi,
        signer
      )
      
      console.log('Initiating GreenNFT ownership transfer...')
      console.log('Current owner:', await greenNFTContract.owner())
      console.log('Transferring to:', addresses.CarbonMarketplace)
      
      const tx = await greenNFTContract.transferOwnership(addresses.CarbonMarketplace)
      console.log('Transfer transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transfer receipt:', receipt)
      
      const newOwner = await greenNFTContract.owner()
      console.log('New owner:', newOwner)
      
      await checkGreenNFTOwnership()
    } catch (error) {
      console.error('Error transferring GreenNFT ownership:', error)
    }
  }

  const transferCCTOwnership = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const cctContract = new ethers.Contract(
        addresses.CarbonCreditToken,
        CarbonCreditTokenABI.abi,
        signer
      )
      
      console.log('Initiating CCT ownership transfer...')
      console.log('Current owner:', await cctContract.owner())
      console.log('Transferring to:', addresses.CarbonMarketplace)
      
      const tx = await cctContract.transferOwnership(addresses.CarbonMarketplace)
      console.log('Transfer transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transfer receipt:', receipt)
      
      const newOwner = await cctContract.owner()
      console.log('New owner:', newOwner)
      
      await checkCCTOwnership()
    } catch (error) {
      console.error('Error transferring CCT ownership:', error)
    }
  }

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
        setIsConnected(true)
        
        const contract = new ethers.Contract(
          addresses.CarbonMarketplace,
          CarbonMarketplaceABI.abi,
          signer
        )

        const owner = await contract.owner()
        setIsOwner(owner.toLowerCase() === address.toLowerCase())

        await checkAuditorStatus(address, contract)
        await checkGreenNFTOwnership(contract)
        await checkCCTOwnership(contract)
      } else {
        alert("Please install MetaMask!")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Router>
      <div className="app-container">
        <div className="wallet-container">
          {!isConnected ? (
            <button className="connect-wallet-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <div className="wallet-info">
              <div>Connected: {formatAddress(account)}</div>
              <div>Status: {isAuditor ? '✅ Registered Auditor' : '❌ Not an Auditor'}</div>
              {isOwner && <div>Role: Contract Owner</div>}
              {isOwner && !isGreenNFTOwner && (
                <button onClick={transferGreenNFTOwnership} className="transfer-ownership-btn">
                  Transfer GreenNFT Ownership
                </button>
              )}
              {isOwner && !isCCTOwner && (
                <button onClick={transferCCTOwnership} className="transfer-ownership-btn">
                  Transfer CCT Ownership
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="navigation">
          <Link to="/">Home</Link>
          <Link to="/claim">Claim CO₂ Reduction</Link>
          <Link to="/auditor">Register Auditor</Link>
          <Link to="/audit">Audit Claims</Link>
          <Link to="/marketplace">Marketplace</Link>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/" element={
              <div className="home-section">
                <h1>Carbon Credit Marketplace</h1>
                <p>Welcome to the Carbon Credit Marketplace. Use the navigation menu to access different features.</p>
              </div>
            } />
            <Route path="/claim" element={
              <ClaimReduction isConnected={isConnected} account={account} />
            } />
            <Route path="/auditor" element={
              <AuditorRegistration isConnected={isConnected} account={account} isOwner={isOwner} />
            } />
            <Route path="/audit" element={
              <AuditClaim isConnected={isConnected} account={account} isAuditor={isAuditor} />
            } />
            <Route path="/marketplace" element={
              <Marketplace isConnected={isConnected} account={account} />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
