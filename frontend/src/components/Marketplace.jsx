import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import addresses from '../addresses'
import CarbonMarketplaceABI from '../abis/CarbonMarketplace.json'
import CarbonCreditTokenABI from '../abis/CarbonCreditToken.json'

function Marketplace({ isConnected, account }) {
  const [salePrice, setSalePrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenBalance, setTokenBalance] = useState(null)
  const [checkAddress, setCheckAddress] = useState('')
  const [checkedBalance, setCheckedBalance] = useState(null)

  useEffect(() => {
    if (isConnected && account) {
      fetchTokenBalance(account)
    }
  }, [isConnected, account])

  const fetchTokenBalance = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const cctContract = new ethers.Contract(
        addresses.CarbonCreditToken,
        CarbonCreditTokenABI.abi,
        signer
      )
      
      const balance = await cctContract.balanceOf(address)
      if (address.toLowerCase() === account.toLowerCase()) {
        setTokenBalance(balance.toString())
      } else {
        setCheckedBalance(balance.toString())
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
    }
  }

  const handleCheckBalance = async (e) => {
    e.preventDefault()
    if (!checkAddress || !ethers.utils.isAddress(checkAddress)) {
      setError('Please enter a valid Ethereum address')
      return
    }

    await fetchTokenBalance(checkAddress)
  }

  const handleListForSale = async (e) => {
    e.preventDefault()
    if (!salePrice || isNaN(salePrice) || salePrice <= 0) {
      setError('Please enter a valid price')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        addresses.CarbonMarketplace,
        CarbonMarketplaceABI.abi,
        signer
      )

      const tx = await contract.listForSale(ethers.utils.parseEther(salePrice))
      await tx.wait()
      setSuccess(`Successfully listed CCT tokens for sale at ${salePrice} ETH`)
      setSalePrice('')
      await fetchTokenBalance(account)
    } catch (error) {
      console.error('Error listing for sale:', error)
      setError(error.message || 'Failed to list for sale')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyCCT = async (e) => {
    e.preventDefault()
    if (!salePrice || isNaN(salePrice) || salePrice <= 0) {
      setError('Please enter a valid price')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        addresses.CarbonMarketplace,
        CarbonMarketplaceABI.abi,
        signer
      )

      const tx = await contract.buyCCT({ value: ethers.utils.parseEther(salePrice) })
      await tx.wait()
      setSuccess(`Successfully purchased CCT tokens`)
      setSalePrice('')
      await fetchTokenBalance(account)
    } catch (error) {
      console.error('Error buying CCT:', error)
      setError(error.message || 'Failed to buy CCT')
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="marketplace-section">
      <h2>Carbon Credit Token Marketplace</h2>

      <div className="balance-section">
        <h3>Your CCT Balance</h3>
        {tokenBalance !== null ? (
          <p>{tokenBalance} CCT</p>
        ) : (
          <p>Loading balance...</p>
        )}
      </div>

      <div className="check-balance-section">
        <h3>Check CCT Balance</h3>
        <form onSubmit={handleCheckBalance} className="check-balance-form">
          <div className="input-group">
            <label htmlFor="checkAddress">Address</label>
            <input
              type="text"
              id="checkAddress"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="Enter Ethereum address"
              required
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={!isConnected || isLoading}
          >
            Check Balance
          </button>
        </form>
        {checkedBalance !== null && (
          <p>Balance: {checkedBalance} CCT</p>
        )}
      </div>

      <div className="marketplace-actions">
        <h3>Marketplace Actions</h3>
        <form onSubmit={handleListForSale} className="sale-form">
          <div className="input-group">
            <label htmlFor="salePrice">Sale Price (ETH)</label>
            <input
              type="number"
              id="salePrice"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Enter price in ETH"
              min="0"
              step="0.0001"
              required
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={!isConnected || isLoading}
          >
            {isLoading ? 'Processing...' : 'List for Sale'}
          </button>
        </form>
        
        <form onSubmit={handleBuyCCT} className="buy-form">
          <div className="input-group">
            <label htmlFor="buyPrice">Buy Price (ETH)</label>
            <input
              type="number"
              id="buyPrice"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Enter price in ETH"
              min="0"
              step="0.0001"
              required
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={!isConnected || isLoading}
          >
            {isLoading ? 'Processing...' : 'Buy CCT'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  )
}

export default Marketplace 