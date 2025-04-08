import {
  AccountDeployed as AccountDeployedEvent,
  VaultAdded as VaultAddedEvent,
  VaultRemoved as VaultRemovedEvent,
  WalletOwnershipSet as WalletOwnershipSetEvent
} from "../generated/Modular4337Factory/Modular4337Factory"
import {
  AccountDeployed,
  VaultAdded,
  VaultRemoved,
  WalletOwnershipSet
} from "../generated/schema"

export function handleAccountDeployed(event: AccountDeployedEvent): void {
  let entity = new AccountDeployed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.account = event.params.account
  entity.salt = event.params.salt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVaultAdded(event: VaultAddedEvent): void {
  let entity = new VaultAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.vault = event.params.vault

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVaultRemoved(event: VaultRemovedEvent): void {
  let entity = new VaultRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.vault = event.params.vault

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWalletOwnershipSet(event: WalletOwnershipSetEvent): void {
  let entity = new WalletOwnershipSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.owner = event.params.owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
