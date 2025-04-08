

import {
  AccountDeployed as AccountDeployedEvent,
  VaultAdded as VaultAddedEvent,
  VaultRemoved as VaultRemovedEvent,
  WalletOwnershipSet as WalletOwnershipSetEvent
} from "../generated/Modular4337Factory/Modular4337Factory"

import {
  UserAccount,
  Vault
} from "../generated/schema"

import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { CamelotLiquidityManager } from '../generated/templates'

// Helper function to ensure UserAccount exists
function getOrCreateUserAccount(address: string): UserAccount {
  let user = UserAccount.load(address)
  
  if (user == null) {
    user = new UserAccount(address)
    user.nonce = BigInt.fromI32(0)
    user.factory = Bytes.fromHexString("0x0000000000000000000000000000000000000000") // Will update when available
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

// Handle AccountDeployed event
export function handleAccountDeployed(event: AccountDeployedEvent): void {
  // Get the owner address from the event
  let ownerAddress = event.params.owner.toHexString()
  
  // Get or create the user account
  let user = getOrCreateUserAccount(ownerAddress)
  
  // Update user account with factory address if not set
  if (user.factory.toHexString() == "0x0000000000000000000000000000000000000000") {
    user.factory = event.address
  }
  
  // Save the updated user account
  user.save()
}

// Handle VaultAdded event
export function handleVaultAdded(event: VaultAddedEvent): void {
  // Get the vault address from the event
  let vaultAddress = event.params.vault.toHexString()
  
  // Get or create the vault
  let vault = getOrCreateVault(vaultAddress)
  
  // Set creation timestamp if not already set
  if (vault.createdAt.equals(BigInt.fromI32(0))) {
    vault.createdAt = event.block.timestamp
  }
  
  // Save the vault
  vault.save()
  
  // Start indexing this vault contract using the template
  CamelotLiquidityManager.create(event.params.vault)
}

// Handle VaultRemoved event
export function handleVaultRemoved(event: VaultRemovedEvent): void {
  // Get the vault address from the event
  let vaultAddress = event.params.vault.toHexString()
  
  // We don't actually remove the vault entity, as that would lose historical data
  // Instead, we could mark it as inactive if needed (you would need to add an 'active' field to the Vault entity)
  
  let vault = Vault.load(vaultAddress)
  if (vault) {
    // If you had an 'active' field, you could set it to false here
    // vault.active = false
    vault.save()
  }
}

// Handle WalletOwnershipSet event
export function handleWalletOwnershipSet(event: WalletOwnershipSetEvent): void {
  // Get the owner address from the event
  let ownerAddress = event.params.owner.toHexString()
  
  // Get or create the user account
  let user = getOrCreateUserAccount(ownerAddress)
  
  // The wallet address is associated with this user
  // If you had a wallet entity or a wallets array in UserAccount, you could update it here
  
  // Save the user account
  user.save()
}