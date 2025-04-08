import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, Bytes } from "@graphprotocol/graph-ts"
import { AccountDeployed } from "../generated/schema"
import { AccountDeployed as AccountDeployedEvent } from "../generated/Modular4337Factory/Modular4337Factory"
import { handleAccountDeployed } from "../src/modular-4337-factory"
import { createAccountDeployedEvent } from "./modular-4337-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let owner = Address.fromString("0x0000000000000000000000000000000000000001")
    let account = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let salt = Bytes.fromI32(1234567890)
    let newAccountDeployedEvent = createAccountDeployedEvent(
      owner,
      account,
      salt
    )
    handleAccountDeployed(newAccountDeployedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AccountDeployed created and stored", () => {
    assert.entityCount("AccountDeployed", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AccountDeployed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "owner",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "AccountDeployed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "account",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "AccountDeployed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "salt",
      "1234567890"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
