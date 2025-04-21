import { useState } from 'react'
import { ethers } from 'ethers'
import addresses from '../addresses'
import CarbonMarketplaceABI from '../abis/CarbonMarketplace.json'

function AuditorRegistration({ isConnected, account, isOwner }) {
  const [auditorAddress, setAuditorAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegisterAuditor = async (e) => {
    e.preventDefault()
    if (!auditorAddress || !ethers.utils.isAddress(auditorAddress)) {
      setError('Please enter a valid Ethereum address')
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

      const tx = await contract.registerAuditor(auditorAddress)
      await tx.wait()
      setSuccess(`Successfully registered auditor: ${formatAddress(auditorAddress)}`)
      setAuditorAddress('')
    } catch (error) {
      console.error('Error registering auditor:', error)
      setError(error.message || 'Failed to register auditor')
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isOwner) {
    return (
      <div className="auditor-section">
        <h2>Auditor Registration</h2>
        <p>Only contract owner can register auditors.</p>
      </div>
    )
  }

  return (
    <div className="auditor-section">
      <h2>Register Auditor</h2>
      <form onSubmit={handleRegisterAuditor} className="auditor-form">
        <div className="input-group">
          <label htmlFor="auditorAddress">Auditor Address</label>
          <input
            type="text"
            id="auditorAddress"
            value={auditorAddress}
            onChange={(e) => setAuditorAddress(e.target.value)}
            placeholder="Enter Ethereum address"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={!isConnected || isLoading}
        >
          {isLoading ? 'Processing...' : 'Register Auditor'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  )
}

export default AuditorRegistration 