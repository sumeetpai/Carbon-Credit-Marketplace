import { useState } from 'react'
import { ethers } from 'ethers'
import addresses from '../addresses'
import CarbonMarketplaceABI from '../abis/CarbonMarketplace.json'

function ClaimReduction({ isConnected, account }) {
  const [amount, setAmount] = useState('')
  const [projectId, setProjectId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleClaimReduction = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
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

      const tx = await contract.claimReduction(ethers.utils.parseUnits(amount, 0))
      const receipt = await tx.wait()

      const claimedEvent = receipt.events?.find(event => event.event === 'Claimed')
      if (claimedEvent) {
        setProjectId(claimedEvent.args.projectId.toString())
        setSuccess(`Successfully claimed reduction! Project ID: ${claimedEvent.args.projectId.toString()}`)
      }

      setAmount('')
    } catch (error) {
      console.error('Error claiming reduction:', error)
      setError(error.message || 'Failed to claim reduction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="claim-section">
      <h2>Claim CO₂ Reduction</h2>
      <form onSubmit={handleClaimReduction} className="claim-form">
        <div className="input-group">
          <label htmlFor="amount">Amount of CO₂ Reduced (tons)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="1"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={!isConnected || isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit Claim'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {projectId && (
        <div className="project-info">
          <h3>Project Details</h3>
          <p>Project ID: {projectId}</p>
        </div>
      )}
    </div>
  )
}

export default ClaimReduction 