// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./GreenNFT.sol";
import "./CarbonCreditToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonMarketplace is Ownable {
    GreenNFT public greenNFT;
    CarbonCreditToken public cct;

    struct Project {
        address owner;
        uint256 amount;
        bool audited;
        uint256 nftId;
    }

    mapping(uint256 => Project) public projects;
    uint256 public nextProjectId;
    mapping(uint256 => uint256) public tokenPrices;

    mapping(address => bool) public auditors;

    event Claimed(uint256 indexed projectId, address indexed projectOwner, uint256 amount);
    event Audited(uint256 indexed projectId, address indexed auditor);
    event Listed(uint256 indexed projectId, uint256 price);
    event Purchased(uint256 indexed projectId, address buyer, uint256 amount);

    constructor(address initialOwner, address _greenNFT, address _cct) Ownable(initialOwner) {
        greenNFT = GreenNFT(_greenNFT);
        cct = CarbonCreditToken(_cct);
    }

    function registerAuditor(address auditor) external onlyOwner {
        auditors[auditor] = true;
    }

    function claimReduction(uint256 amount) external {
        projects[nextProjectId] = Project(msg.sender, amount, false, 0);
        emit Claimed(nextProjectId, msg.sender, amount);
        nextProjectId++;
    }

    function auditClaim(uint256 projectId, string memory uri) external {
        require(auditors[msg.sender], "Not authorized");
        Project storage project = projects[projectId];
        require(!project.audited, "Already audited");

        uint256 nftId = greenNFT.safeMint(project.owner, uri);
        cct.mint(project.owner, project.amount);
        project.audited = true;
        project.nftId = nftId;

        emit Audited(projectId, msg.sender);
    }

    function listForSale(uint256 projectId, uint256 price) external {
        require(projects[projectId].owner == msg.sender, "Not owner");
        require(projects[projectId].audited, "Not audited");
        tokenPrices[projectId] = price;
        emit Listed(projectId, price);
    }

    function buyCCT(uint256 projectId) external payable {
        Project storage project = projects[projectId];
        uint256 price = tokenPrices[projectId];
        require(msg.value >= price, "Insufficient payment");

        cct.transferFrom(project.owner, msg.sender, project.amount);
        payable(project.owner).transfer(price);

        emit Purchased(projectId, msg.sender, project.amount);
    }
}
