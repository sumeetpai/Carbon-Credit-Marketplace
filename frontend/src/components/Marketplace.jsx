import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import addresses from '../addresses'
import CarbonMarketplaceABI from '../abis/CarbonMarketplace.json'
import CarbonCreditTokenABI from '../abis/CarbonCreditToken.json'
import GreenNFTABI from '../abis/GreenNFT.json'

function Marketplace({ isConnected, account }) {
  const [projectId, setProjectId] = useState('')
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenBalance, setTokenBalance] = useState(null)
  const [listedProjects, setListedProjects] = useState([])
  const [deletedProjects, setDeletedProjects] = useState(() => {
    // Load deleted projects from localStorage on component mount
    const saved = localStorage.getItem('deletedProjects')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  // Save deleted projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('deletedProjects', JSON.stringify([...deletedProjects]))
  }, [deletedProjects])

  useEffect(() => {
    if (isConnected && account) {
      fetchTokenBalance(account)
      fetchAllListedProjects()
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
      setTokenBalance(balance.toString())
    } catch (error) {
      console.error('Error fetching token balance:', error)
    }
  }

  const fetchAllListedProjects = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        addresses.CarbonMarketplace,
        CarbonMarketplaceABI.abi,
        signer
      )

      console.log('Fetching all projects...')
      const nextProjectId = await contract.nextProjectId()
      const totalProjects = nextProjectId.toNumber()
      console.log('Total projects:', totalProjects)

      const listed = []
      for (let i = 0; i < totalProjects; i++) {
        try {
          const project = await contract.projects(i)
          console.log(`Project ${i}:`, project)
          
          // Skip if project is deleted, purchased, or not listed
          if (!project[2] || deletedProjects.has(i)) {
            continue
          }

          // Check if the project is actually listed for sale
          const isListed = await contract.tokenPrices(i)
          if (isListed.toString() === '0') {
            continue
          }

          const greenNFTContract = new ethers.Contract(
            addresses.GreenNFT,
            GreenNFTABI.abi,
            signer
          )
          try {
            const uri = await greenNFTContract.tokenURI(project.nftId)
            const price = await contract.tokenPrices(i)
            const projectData = {
              id: i,
              owner: project[0],
              originalOwner: project[0],
              amount: project[1],
              price: price,
              uri: uri
            }
            console.log(`Added project ${i} to listings:`, projectData)
            listed.push(projectData)
          } catch (error) {
            console.error(`Error fetching NFT URI for project ${i}:`, error)
          }
        } catch (error) {
          console.error(`Error fetching project ${i}:`, error)
        }
      }

      console.log('Final listed projects:', listed)
      setListedProjects(listed)
    } catch (error) {
      console.error('Error fetching listed projects:', error)
      setError('Failed to fetch listed projects: ' + error.message)
    }
  }

  const handleListForSale = async (e) => {
    e.preventDefault()
    if (!projectId || !price || isNaN(price) || price <= 0) {
      setError('Please enter valid project ID and price')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const marketplaceContract = new ethers.Contract(
        addresses.CarbonMarketplace,
        CarbonMarketplaceABI.abi,
        signer
      )

      // Get the project details to verify ownership and audit status
      const project = await marketplaceContract.projects(projectId)
      const currentOwner = project[0]
      const connectedAddress = await signer.getAddress()
      const isAudited = project[2]

      if (currentOwner.toLowerCase() !== connectedAddress.toLowerCase()) {
        throw new Error('Only the project owner can list the project for sale')
      }

      if (!isAudited) {
        throw new Error('Project must be audited before it can be listed for sale')
      }

      // Convert price from ETH to wei
      const priceInWei = ethers.utils.parseEther(price)
      console.log('Listing project:', { 
        projectId, 
        priceInETH: price,
        priceInWei: priceInWei.toString()
      })

      // Get the CCT contract
      const cctContract = new ethers.Contract(
        addresses.CarbonCreditToken,
        CarbonCreditTokenABI.abi,
        signer
      )

      // Check current allowance
      const currentAllowance = await cctContract.allowance(
        connectedAddress,
        addresses.CarbonMarketplace
      )
      const projectAmount = project[1]

      // If current allowance is less than project amount, approve the marketplace
      if (currentAllowance.lt(projectAmount)) {
        console.log('Approving CCT tokens for marketplace...')
        const approveTx = await cctContract.approve(
          addresses.CarbonMarketplace,
          projectAmount
        )
        console.log('Approval transaction hash:', approveTx.hash)
        await approveTx.wait()
        console.log('CCT tokens approved for marketplace')
      }

      // Now list the project for sale
      const tx = await marketplaceContract.listForSale(projectId, priceInWei)
      console.log('Listing transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Listing receipt:', receipt)
      
      setSuccess(`Successfully listed project ${projectId} for ${price} ETH`)
      setProjectId('')
      setPrice('')
      
      // Refresh all listed projects
      await fetchAllListedProjects()
    } catch (error) {
      console.error('Error listing for sale:', error)
      setError(error.message || 'Failed to list for sale')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyCCT = async (projectId, price) => {
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

      // Get the project details first
      const project = await contract.projects(projectId)
      console.log('Project details:', project)

      // Check if project is listed
      if (!project[2]) {
        throw new Error('Project is not listed for sale')
      }

      // Get the actual price from tokenPrices mapping
      const actualPrice = await contract.tokenPrices(projectId)
      console.log('Price details:', {
        priceInWei: actualPrice.toString(),
        priceInETH: ethers.utils.formatEther(actualPrice)
      })

      const buyer = await signer.getAddress()
      console.log('Attempting to buy project:', { 
        projectId, 
        priceInWei: actualPrice.toString(),
        priceInETH: ethers.utils.formatEther(actualPrice),
        buyer,
        projectOwner: project[0],
        amount: project[1].toString()
      })

      // Send the transaction with the exact price
      const tx = await contract.buyCCT(projectId, { 
        value: actualPrice
      })
      console.log('Buy transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Buy receipt:', receipt)
      
      // Add the project to deletedProjects set
      setDeletedProjects(prev => new Set([...prev, projectId]))
      
      // Remove the project from listedProjects
      setListedProjects(prevProjects => 
        prevProjects.filter(p => p.id !== projectId)
      )
      
      setSuccess(`Successfully purchased project ${projectId}`)
      
      // Refresh balance
      await fetchTokenBalance(account)
    } catch (error) {
      console.error('Error buying CCT:', error)
      setError(error.message || 'Failed to buy CCT')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteListing = async (projectId) => {
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

      // Get the project details to verify ownership
      const project = await contract.projects(projectId)
      const currentOwner = project[0]
      const connectedAddress = await signer.getAddress()

      if (currentOwner.toLowerCase() !== connectedAddress.toLowerCase()) {
        throw new Error('Only the project owner can delete the listing')
      }

      // Add the project to deletedProjects set
      setDeletedProjects(prev => new Set([...prev, projectId]))
      
      // Remove the project from listedProjects
      setListedProjects(prevProjects => 
        prevProjects.filter(p => p.id !== projectId)
      )
      
      setSuccess(`Successfully removed listing for project ${projectId}`)
    } catch (error) {
      console.error('Error deleting listing:', error)
      setError(error.message || 'Failed to delete listing')
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

      <div className="seller-panel">
        <h3>List Project for Sale</h3>
        <form onSubmit={handleListForSale} className="sale-form">
          <div className="input-group">
            <label htmlFor="projectId">Project ID</label>
            <input
              type="number"
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID"
              min="0"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="price">Price (ETH)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
      </div>

      <div className="marketplace-list">
        <h3>Available Projects</h3>
        {listedProjects.length > 0 ? (
          <div className="projects-grid">
            {listedProjects.map(project => {
              const isProjectOwner = project.owner.toLowerCase() === account?.toLowerCase()
              const isOriginalOwner = project.originalOwner.toLowerCase() === account?.toLowerCase()
              const isBought = project.owner.toLowerCase() !== project.originalOwner.toLowerCase()
              
              return (
                <div key={project.id} className="project-card">
                  <h4>Project #{project.id}</h4>
                  <div className="project-details">
                    {isBought && (
                      <p className="bought-status">Bought by: {formatAddress(project.owner)}</p>
                    )}
                    <p>Amount: {project.amount.toString()} CCT</p>
                    <p>Price: {ethers.utils.formatEther(project.price)} ETH</p>
                    {project.uri && (
                      <p>Documentation: {project.uri}</p>
                    )}
                  </div>
                  <div className="project-actions">
                    {!isBought && !isOriginalOwner && (
                      <button
                        className="buy-btn"
                        onClick={() => handleBuyCCT(project.id, ethers.utils.formatEther(project.price))}
                        disabled={!isConnected || isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Buy'}
                      </button>
                    )}
                    {isOriginalOwner && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteListing(project.id)}
                        disabled={isLoading}
                      >
                        Delete Listing
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p>No projects listed for sale</p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  )
}

export default Marketplace 