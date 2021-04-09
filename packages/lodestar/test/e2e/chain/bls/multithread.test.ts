import {expect} from "chai";
import {bls, init, PublicKey} from "@chainsafe/bls";
import {BlsMultiThreadNaive} from "../../../../src/chain/bls/multithread";
import {testLogger} from "../../../utils/logger";

describe("chain / bls / multithread queue", function () {
  this.timeout(30 * 1000);
  const logger = testLogger();

  before("Init BLS", async () => {
    await init("blst-native");
  });

  it("Should verify some signatures", async () => {
    const sets: {publicKey: PublicKey; message: Uint8Array; signature: Uint8Array}[] = [];
    for (let i = 0; i < 8; i++) {
      const sk = bls.SecretKey.fromBytes(Buffer.alloc(32, i + 1));
      const msg = Buffer.alloc(32, i);
      const pk = sk.toPublicKey();
      const sig = sk.sign(msg);
      sets.push({
        publicKey: pk,
        message: msg,
        signature: sig.toBytes(),
      });
    }

    const pool = new BlsMultiThreadNaive(logger, "blst-native");
    const isValidArr = await Promise.all(
      Array.from({length: 8}, (i) => i).map(() => pool.verifyMultipleAggregateSignatures(sets))
    );
    for (const [i, isValid] of isValidArr.entries()) {
      expect(isValid).to.equal(true, `sig set ${i} returned invalid`);
    }
  });
});