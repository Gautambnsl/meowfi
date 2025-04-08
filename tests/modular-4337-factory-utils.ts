import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  AccountDeployed,
  VaultAdded,
  VaultRemoved,
  WalletOwnershipSet
} from "../generated/Modular4337Factory/Modular4337Factory"

export function createAccountDeployedEvent(
  owner: Address,
  account: Address,
  salt: Bytes
): AccountDeployed {
  let accountDeployedEvent = changetype<AccountDeployed>(newMockEvent())

  accountDeployedEvent.parameters = new Array()

  accountDeployedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  accountDeployedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  accountDeployedEvent.parameters.push(
    new ethereum.EventParam("salt", ethereum.Value.fromFixedBytes(salt))
  )

  return accountDeployedEvent
}

export function createVaultAddedEvent(vault: Address): VaultAdded {
  let vaultAddedEvent = changetype<VaultAdded>(newMockEvent())

  vaultAddedEvent.parameters = new Array()

  vaultAddedEvent.parameters.push(
    new ethereum.EventParam("vault", ethereum.Value.fromAddress(vault))
  )

  return vaultAddedEvent
}

export function createVaultRemovedEvent(vault: Address): VaultRemoved {
  let vaultRemovedEvent = changetype<VaultRemoved>(newMockEvent())

  vaultRemovedEvent.parameters = new Array()

  vaultRemovedEvent.parameters.push(
    new ethereum.EventParam("vault", ethereum.Value.fromAddress(vault))
  )

  return vaultRemovedEvent
}

export function createWalletOwnershipSetEvent(
  wallet: Address,
  owner: Address
): WalletOwnershipSet {
  let walletOwnershipSetEvent = changetype<WalletOwnershipSet>(newMockEvent())

  walletOwnershipSetEvent.parameters = new Array()

  walletOwnershipSetEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  walletOwnershipSetEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return walletOwnershipSetEvent
}
