


import { 
  Minted as MintedEvent,
  Burned as BurnedEvent,
  LiquidityIncreased as LiquidityIncreasedEvent,
  LiquidityDecreased as LiquidityDecreasedEvent,
  Rebalanced as RebalancedEvent,
  CollectFee as CollectFeeEvent,
  TreasuryUpdated as TreasuryUpdatedEvent,
  TokenPairUpdated as TokenPairUpdatedEvent,
  AmountLimitsUpdated as AmountLimitsUpdatedEvent
} from  "../generated/templates/CamelotLiquidityManager/CamelotLiquidityManager"

import {
  UserAccount,
  Policy,
  Vault,
  VaultDeposit,
  Position,
  TreasuryUpdate,
  TokenPairUpdate,
  AmountLimitsUpdate
} from "../generated/schema"

import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

// Helper function to ensure UserAccount exists
function getOrCreateUserAccount(address: string): UserAccount {
  let user = UserAccount.load(address)
  
  if (user == null) {
    user = new UserAccount(address)
    user.factory = Bytes.fromHexString("0x0000000000000000000000000000000000000000")
    user.save()
  }
  
  return user
}

// Helper function to ensure Vault exists
function getOrCreateVault(address: string): Vault {
  let vault = Vault.load(address)
  
  if (vault == null) {
    vault = new Vault(address)
    vault.token0 = Bytes.fromHexString("0x0000000000000000000000000000000000000000")
    vault.token1 = Bytes.fromHexString("0x0000000000000000000000000000000000000000")
    vault.treasury = Bytes.fromHexString("0x0000000000000000000000000000000000000000")
    vault.treasuryFeePercent = BigInt.fromI32(0)
    vault.minAmount0 = BigInt.fromI32(0)
    vault.maxAmount0 = BigInt.fromI32(0)
    vault.minAmount1 = BigInt.fromI32(0)
    vault.maxAmount1 = BigInt.fromI32(0)
    vault.tickSpacing = BigInt.fromI32(0)
    vault.createdAt = BigInt.fromI32(0)
    vault.save()
  }
  
  return vault
}

// Helper function to get or create a VaultDeposit
function getOrCreateVaultDeposit(vaultAddress: string, userAddress: string): VaultDeposit {
  let id = vaultAddress + "-" + userAddress
  let vaultDeposit = VaultDeposit.load(id)
  
  if (vaultDeposit == null) {
    vaultDeposit = new VaultDeposit(id)
    vaultDeposit.vault = vaultAddress
    vaultDeposit.user = userAddress
    vaultDeposit.createdAt = BigInt.fromI32(0)
    vaultDeposit.save()
  }
  
  return vaultDeposit
}

// Helper function to get or create a Position
function getOrCreatePosition(tokenId: BigInt, userAddress: string, vaultAddress: string): Position {
  let id = tokenId.toString()
  let position = Position.load(id)
  
  if (position == null) {
    let vaultDeposit = getOrCreateVaultDeposit(vaultAddress, userAddress)
    
    position = new Position(id)
    position.nftId = tokenId
    position.user = userAddress
    position.vault = vaultAddress
    position.vaultDeposit = vaultDeposit.id
    position.fee0 = BigInt.fromI32(0)
    position.fee1 = BigInt.fromI32(0)
    position.nonce = BigInt.fromI32(0)
    position.liquidity = BigInt.fromI32(0)
    position.createdAt = BigInt.fromI32(0)
    position.updatedAt = BigInt.fromI32(0)
    position.save()
  }
  
  return position
}

// Handle Minted event
export function handleMinted(event: MintedEvent): void {
  let tokenId = event.params.tokenId
  let liquidity = event.params.liquidity
  let vaultAddress = event.address.toHexString()
  let userAddress = event.transaction.from.toHexString() // This is a simplification
  
  let vault = getOrCreateVault(vaultAddress)
  let user = getOrCreateUserAccount(userAddress)
  let vaultDeposit = getOrCreateVaultDeposit(vaultAddress, userAddress)
  let position = getOrCreatePosition(tokenId, userAddress, vaultAddress)
  
  position.liquidity = liquidity
  position.createdAt = event.block.timestamp
  position.updatedAt = event.block.timestamp
  position.save()
}

// Handle Burned event
export function handleBurned(event: BurnedEvent): void {
  let tokenId = event.params.tokenId
  let vaultAddress = event.address.toHexString()
  let userAddress = event.transaction.from.toHexString() // This is a simplification
  
  let position = Position.load(tokenId.toString())
  if (position) {
    // Mark position as burned by setting liquidity to 0
    position.liquidity = BigInt.fromI32(0)
    position.updatedAt = event.block.timestamp
    position.save()
  }
}

// Handle LiquidityIncreased event
export function handleLiquidityIncreased(event: LiquidityIncreasedEvent): void {
  let tokenId = event.params.tokenId
  let liquidityAdded = event.params.liquidityAdded
  
  let position = Position.load(tokenId.toString())
  if (position) {
    position.liquidity = position.liquidity.plus(liquidityAdded)
    position.updatedAt = event.block.timestamp
    position.nonce = position.nonce.plus(BigInt.fromI32(1)) // Increment nonce for state change
    position.save()
  }
}

// Handle LiquidityDecreased event
export function handleLiquidityDecreased(event: LiquidityDecreasedEvent): void {
  let tokenId = event.params.tokenId
  let liquidityRemoved = event.params.liquidityRemoved
  
  let position = Position.load(tokenId.toString())
  if (position) {
    position.liquidity = position.liquidity.minus(liquidityRemoved)
    position.updatedAt = event.block.timestamp
    position.nonce = position.nonce.plus(BigInt.fromI32(1)) // Increment nonce for state change
    position.save()
  }
}

// Handle Rebalanced event
export function handleRebalanced(event: RebalancedEvent): void {
  let oldTokenId = event.params.oldTokenId
  let newTokenId = event.params.newTokenId
  let newLiquidity = event.params.newLiquidity
  let vaultAddress = event.address.toHexString()
  
  // Get old position
  let oldPosition = Position.load(oldTokenId.toString())
  
  if (oldPosition) {
    // Create new position (if it doesn't exist yet)
    let newPosition = Position.load(newTokenId.toString())
    
    if (newPosition == null) {
      newPosition = new Position(newTokenId.toString())
      newPosition.nftId = newTokenId
      newPosition.user = oldPosition.user // Copy user reference
      newPosition.vault = oldPosition.vault // Copy vault reference
      newPosition.vaultDeposit = oldPosition.vaultDeposit // Copy vault deposit reference
      newPosition.fee0 = oldPosition.fee0 // Transfer accumulated fees
      newPosition.fee1 = oldPosition.fee1
      newPosition.nonce = oldPosition.nonce.plus(BigInt.fromI32(1)) // Increment nonce
      newPosition.createdAt = event.block.timestamp
    } else {
      // If new position already exists, update its properties
      newPosition.fee0 = newPosition.fee0.plus(oldPosition.fee0)
      newPosition.fee1 = newPosition.fee1.plus(oldPosition.fee1)
      newPosition.nonce = newPosition.nonce.plus(BigInt.fromI32(1))
    }
    
    // Set the new liquidity and update timestamp
    newPosition.liquidity = newLiquidity
    newPosition.updatedAt = event.block.timestamp
    newPosition.save()
    
    // Mark old position as inactive by setting liquidity to 0
    oldPosition.liquidity = BigInt.fromI32(0)
    oldPosition.updatedAt = event.block.timestamp
    oldPosition.save()
  }
}

// Handle CollectFee event
export function handleCollectFee(event: CollectFeeEvent): void {
  let tokenId = event.params.tokenId
  let treasuryAmount0 = event.params.treasuryAmount0
  let treasuryAmount1 = event.params.treasuryAmount1 // Note the param is named treasuryAmount1 in your event
  
  let position = Position.load(tokenId.toString())
  if (position) {
    // Update fees collected
    position.fee0 = position.fee0.plus(treasuryAmount0)
    position.fee1 = position.fee1.plus(treasuryAmount1)
    position.updatedAt = event.block.timestamp
    position.nonce = position.nonce.plus(BigInt.fromI32(1))
    position.save()
  }
}

// Handle TreasuryUpdated event
export function handleTreasuryUpdated(event: TreasuryUpdatedEvent): void {
  let vaultAddress = event.address.toHexString()
  let vault = getOrCreateVault(vaultAddress)
  
  // Update vault with new treasury info
  vault.treasury = event.params.treasury
  vault.treasuryFeePercent = event.params.treasuryFeePercent
  vault.save()
  
  // Create treasury update event entity
  let treasuryUpdate = new TreasuryUpdate(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  treasuryUpdate.vault = vaultAddress
  treasuryUpdate.treasury = event.params.treasury
  treasuryUpdate.treasuryFeePercent = event.params.treasuryFeePercent
  treasuryUpdate.blockTimestamp = event.block.timestamp
  treasuryUpdate.save()
}

// Handle TokenPairUpdated event
export function handleTokenPairUpdated(event: TokenPairUpdatedEvent): void {
  let vaultAddress = event.address.toHexString()
  let vault = getOrCreateVault(vaultAddress)
  
  // Update vault with new token pair info
  vault.token0 = event.params.token0
  vault.token1 = event.params.token1
  vault.save()
  
  // Create token pair update event entity
  let tokenPairUpdate = new TokenPairUpdate(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  tokenPairUpdate.vault = vaultAddress
  tokenPairUpdate.token0 = event.params.token0
  tokenPairUpdate.token1 = event.params.token1
  tokenPairUpdate.blockTimestamp = event.block.timestamp
  tokenPairUpdate.save()
}

// Handle AmountLimitsUpdated event
export function handleAmountLimitsUpdated(event: AmountLimitsUpdatedEvent): void {
  let vaultAddress = event.address.toHexString()
  let vault = getOrCreateVault(vaultAddress)
  
  // Update vault with new amount limits
  vault.minAmount0 = event.params.minAmount0
  vault.maxAmount0 = event.params.maxAmount0
  vault.minAmount1 = event.params.minAmount1
  vault.maxAmount1 = event.params.maxAmount1
  vault.save()
  
  // Create amount limits update event entity
  let amountLimitsUpdate = new AmountLimitsUpdate(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  amountLimitsUpdate.vault = vaultAddress
  amountLimitsUpdate.minAmount0 = event.params.minAmount0
  amountLimitsUpdate.maxAmount0 = event.params.maxAmount0
  amountLimitsUpdate.minAmount1 = event.params.minAmount1
  amountLimitsUpdate.maxAmount1 = event.params.maxAmount1
  amountLimitsUpdate.blockTimestamp = event.block.timestamp
  amountLimitsUpdate.save()
}

// You'll need to add additional handlers for factory events like:
// - Policy creation
