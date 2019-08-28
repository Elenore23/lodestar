import {INewEpochCallback, INewSlotCallback, IRpcClient} from "./interface";
import {Slot} from "@chainsafe/eth2.0-types";
import {intDiv} from "../../util/math";
import {computeEpochOfSlot} from "../../chain/stateTransition/util";
import {IBeaconConfig} from "@chainsafe/eth2.0-config";
import {IBeaconApi} from "../../rpc/api/beacon";
import {IValidatorApi} from "../../rpc/api/validator";


export abstract class AbstractRpcClient implements IRpcClient {

  // @ts-ignore
  protected config: IBeaconConfig;
  private currentSlot: Slot = 0;

  private currentEpoch: Slot = 0;

  private newSlotCallbacks: INewSlotCallback[] = [];
  private newEpochCallbacks: INewEpochCallback[] = [];

  private running = false;



  public onNewEpoch(cb: INewEpochCallback): void {
    if (cb) {
      this.newEpochCallbacks.push(cb);
    }
  }

  public onNewSlot(cb: INewSlotCallback): void {
    if (cb) {
      this.newSlotCallbacks.push(cb);
    }
  }

  public async connect(): Promise<void> {
    await this.startSlotCounting();
  }

  public async disconnect(): Promise<void> {
    this.running = false;
  }

  private async startSlotCounting(): Promise<void> {
    this.running = true;
    const genesisTime = await this.beacon.getGenesisTime();
    const diffInSeconds = (Date.now() / 1000) - genesisTime;
    this.currentSlot = intDiv(diffInSeconds, this.config.params.SECONDS_PER_SLOT);
    //update slot after remaining seconds until next slot
    const diffTillNextSlot =
        (this.config.params.SECONDS_PER_SLOT - diffInSeconds % this.config.params.SECONDS_PER_SLOT) * 1000;
    //subscribe to new slots and notify upon new epoch
    this.onNewSlot(this.updateEpoch.bind(this));
    const that = this;
    setTimeout(
      that.updateSlot.bind(that),
      diffTillNextSlot
    );
  }

  private updateSlot(): void {
    if(!this.running) {
      return;
    }
    this.currentSlot++;
    this.newSlotCallbacks.forEach((cb) => {
      cb(this.currentSlot);
    });
    //recursively invoke update slot after SECONDS_PER_SLOT
    const that = this;
    setTimeout(
      that.updateSlot.bind(that),
      this.config.params.SECONDS_PER_SLOT * 1000
    );
  }

  private updateEpoch(slot: Slot): void {
    const epoch = computeEpochOfSlot(this.config, slot);
    if (epoch !== this.currentEpoch && epoch !== 0) {
      this.currentEpoch = epoch;
      this.newEpochCallbacks.forEach((cb) => {
        cb(this.currentEpoch);
      });
    }
  }

  abstract beacon: IBeaconApi;
  abstract validator: IValidatorApi;

}
