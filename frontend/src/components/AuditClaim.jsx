import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import addresses from '../addresses'
import CarbonMarketplaceABI from '../abis/CarbonMarketplace.json'
import CarbonCreditTokenABI from '../abis/CarbonCreditToken.json'

function AuditClaim({ isConnected, account, isAuditor }) {
  const [auditProjectId, setAuditProjectId] = useState('')
  const [auditUri, setAuditUri] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [projectDetails, setProjectDetails] = useState(null)
  const [tokenBalance, setTokenBalance] = useState(null)

  const fetchProjectDetails = async (projectId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        addresses.CarbonMarketplace,
        CarbonMarketplaceABI.abi,
        signer
      )
      
      const project = await contract.projects(projectId)
      setProjectDetails(project)
      
      if (project.audited) {
        await fetchTokenBalance(project.owner)
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
    }
  }

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
      setTokenBalance(balance.toString())
    } catch (error) {
      console.error('Error fetching token balance:', error)
    }
  }

  const handleAuditClaim = async (e) => {
    e.preventDefault()
    if (!auditProjectId || !auditUri) {
      setError('Please enter both Project ID and URI')
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

      const tx = await contract.auditClaim(auditProjectId, auditUri)
      await tx.wait()
      setSuccess(`Successfully audited project ${auditProjectId}`)
      
      // Fetch updated project details and token balance
      await fetchProjectDetails(auditProjectId)
      
      setAuditProjectId('')
      setAuditUri('')
    } catch (error) {
      console.error('Error auditing claim:', error)
      setError(error.message || 'Failed to audit claim')
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isAuditor) {
    return (
      <div className="audit-section">
        <h2>Audit Project Claim</h2>
        <p>Only registered auditors can audit claims.</p>
      </div>
    )
  }

  return (
    <div className="audit-section">
      <h2>Audit Project Claim</h2>
      <form onSubmit={handleAuditClaim} className="audit-form">
        <div className="input-group">
          <label htmlFor="auditProjectId">Project ID</label>
          <input
            type="number"
            id="auditProjectId"
            value={auditProjectId}
            onChange={(e) => setAuditProjectId(e.target.value)}
            placeholder="Enter project ID"
            min="0"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="auditUri">Project URI</label>
          <input
            type="text"
            id="auditUri"
            value={auditUri}
            onChange={(e) => setAuditUri(e.target.value)}
            placeholder="Enter project documentation URI"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={!isConnected || isLoading}
        >
          {isLoading ? 'Processing...' : 'Audit Claim'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {projectDetails && (
        <div className="project-details-section">
          <h3>Project Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Owner:</label>
              <span>{formatAddress(projectDetails.owner)}</span>
            </div>
            <div className="detail-item">
              <label>Amount:</label>
              <span>{projectDetails.amount.toString()} CCT</span>
            </div>
            <div className="detail-item">
              <label>Audited:</label>
              <span>{projectDetails.audited ? '✅' : '❌'}</span>
            </div>
            {projectDetails.audited && tokenBalance && (
              <div className="detail-item">
                <label>Token Balance:</label>
                <span>{tokenBalance} CCT</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditClaim 