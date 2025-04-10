import {
	AccountDeployed as AccountDeployedEvent,
	VaultAdded as VaultAddedEvent,
	VaultRemoved as VaultRemovedEvent,
	WalletOwnershipSet as WalletOwnershipSetEvent,
} from "../generated/Modular4337Factory/Modular4337Factory";

import { UserAccount, Vault } from "../generated/schema";

import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { CamelotLiquidityManager as CamelotLiquidityManagerContract} from "../generated/templates";

import {CamelotLiquidityManager} from "../generated/Modular4337Factory/CamelotLiquidityManager";

// Helper function to ensure UserAccount exists
function getOrCreateUserAccount(address: string): UserAccount {
	let user = UserAccount.load(address);

	if (user == null) {
		user = new UserAccount(address);
		user.factory = Bytes.fromHexString(
			"0x0000000000000000000000000000000000000000"
		); // Will update when available
		user.account = Bytes.fromHexString(
			"0x0000000000000000000000000000000000000000"
		); // Will update when available
		user.save();
	}

	return user;
}

// Helper function to ensure Vault exists
function getOrCreateVault(address: string): Vault {
	let vault = Vault.load(address);

	if (vault == null) {
		vault = new Vault(address);
		vault.token0 = Bytes.fromHexString(
			"0x0000000000000000000000000000000000000000"
		);
		vault.token1 = Bytes.fromHexString(
			"0x0000000000000000000000000000000000000000"
		);
		vault.treasury = Bytes.fromHexString(
			"0x0000000000000000000000000000000000000000"
		);
		vault.treasuryFeePercent = BigInt.fromI32(0);
		vault.minAmount0 = BigInt.fromI32(0);
		vault.maxAmount0 = BigInt.fromI32(0);
		vault.minAmount1 = BigInt.fromI32(0);
		vault.maxAmount1 = BigInt.fromI32(0);
		vault.tickSpacing = BigInt.fromI32(0);
		vault.createdAt = BigInt.fromI32(0);
    vault.active = false;
		vault.save();
	}

	return vault;
}

// Handle AccountDeployed event
export function handleAccountDeployed(event: AccountDeployedEvent): void {
	// Get the owner address from the event
	let ownerAddress = event.params.owner.toHexString();

	// Get or create the user account
	let user = getOrCreateUserAccount(ownerAddress);

	// Update user account with factory address if not set
	if (
		user.factory.toHexString() == "0x0000000000000000000000000000000000000000"
	) {
		user.factory = event.address;
	}

  user.account = event.params.account;
  user.createdAt = event.block.timestamp;


	// Save the updated user account
	user.save();
}

// Handle VaultAdded event
export function handleVaultAdded(event: VaultAddedEvent): void {
	// Get the vault address from the event
	let vaultAddress = event.params.vault.toHexString();

	// Create a contract binding to access the vault's functions
	let vaultContract = CamelotLiquidityManager.bind(event.params.vault);

	// Get or create the vault entity
	let vault = getOrCreateVault(vaultAddress);

  vault.active = true;

	// Fetch Treasury configuration
	let tryTreasury = vaultContract.try_treasury();
	if (!tryTreasury.reverted) {
		vault.treasury = tryTreasury.value;
	}

	let tryTreasuryFeePercent = vaultContract.try_treasuryFeePercent();
	if (!tryTreasuryFeePercent.reverted) {
		vault.treasuryFeePercent = tryTreasuryFeePercent.value;
	}

	let tryToken0 = vaultContract.try_token0();
	if (!tryToken0.reverted) {
		vault.token0 = tryToken0.value;
	}

	let tryToken1 = vaultContract.try_token1();
	if (!tryToken1.reverted) {
		vault.token1 = tryToken1.value;
	}

	let tryTickSpacing = vaultContract.try_tickSpacing();
	if (!tryTickSpacing.reverted) {
		vault.tickSpacing = BigInt.fromI32(tryTickSpacing.value);
	}

	// Fetch Min and max amount limits
	let tryMinAmount0 = vaultContract.try_minAmount0();
	if (!tryMinAmount0.reverted) {
		vault.minAmount0 = tryMinAmount0.value;
	}

	let tryMinAmount1 = vaultContract.try_minAmount1();
	if (!tryMinAmount1.reverted) {
		vault.minAmount1 = tryMinAmount1.value;
	}

	let tryMaxAmount0 = vaultContract.try_maxAmount0();
	if (!tryMaxAmount0.reverted) {
		vault.maxAmount0 = tryMaxAmount0.value;
	}

	let tryMaxAmount1 = vaultContract.try_maxAmount1();
	if (!tryMaxAmount1.reverted) {
		vault.maxAmount1 = tryMaxAmount1.value;
	}

	// Set creation timestamp
	vault.createdAt = event.block.timestamp;

	// Save the updated vault entity
	vault.save();

	// Start indexing this vault contract using the template
	CamelotLiquidityManagerContract.create(event.params.vault);
}

// Handle VaultRemoved event
export function handleVaultRemoved(event: VaultRemovedEvent): void {
	// Get the vault address from the event
	let vaultAddress = event.params.vault.toHexString();

	// We don't actually remove the vault entity, as that would lose historical data
	// Instead, we could mark it as inactive if needed (you would need to add an 'active' field to the Vault entity)

	let vault = Vault.load(vaultAddress);
	if (vault) {
		vault.active = false
		vault.save();
	}
}


