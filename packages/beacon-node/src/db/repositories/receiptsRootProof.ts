import {Slot, ssz} from "@lodestar/types";
import {ChainForkConfig} from "@lodestar/config";
import {Db, Bucket, Repository} from "@lodestar/db";

export class ReceiptsRootProofRepository extends Repository<Slot, Uint8Array> {
  constructor(config: ChainForkConfig, db: Db) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const type = ssz.Bytes32 as any;
    super(config, db, Bucket.receiptsRootProof, type);
  }

  encodeValue(value: Uint8Array): Uint8Array {
    return value;
  }

  decodeValue(data: Uint8Array): Uint8Array {
    return data;
  }

  getId(_: Uint8Array): number {
    throw new Error("Cannot get the db key from proof value");
  }
}
