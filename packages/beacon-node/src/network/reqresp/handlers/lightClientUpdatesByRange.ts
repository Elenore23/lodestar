import { allForks, altair } from "@lodestar/types";
import { MAX_REQUEST_LIGHT_CLIENT_UPDATES } from "@lodestar/params";
import {
  ResponseOutgoing,
  LightClientServerError,
  LightClientServerErrorCode,
  ResponseError,
  RespStatus
} from "@lodestar/reqresp";
import { IBeaconChain } from "../../../chain/index.js";
import { ReqRespMethod, responseSszTypeByMethod } from "../types.js";

export async function* onLightClientUpdatesByRange(
  requestBody: altair.LightClientUpdatesByRange,
  chain: IBeaconChain
): AsyncIterable<ResponseOutgoing> {
  const update = await chain.lightClientServer.getUpdate(requestBody.startPeriod);
  const count = Math.min(MAX_REQUEST_LIGHT_CLIENT_UPDATES, requestBody.count);
  const fork = chain.config.getForkName(update.signatureSlot);
  for await (const update of updatesDataGenerator(requestBody.startPeriod, count, chain)) {
    yield {
      data: update,
      fork: fork,
    };
  }
}

export async function* updatesDataGenerator(
  startPeriod: number,
  count: number,
  chain: IBeaconChain
): AsyncIterable<Uint8Array> {
  for (let period = startPeriod; period < startPeriod + count; period++) {
    try {
      const update = await chain.lightClientServer.getUpdate(period);
      const fork = chain.config.getForkName(update.signatureSlot);
      const type = responseSszTypeByMethod[ReqRespMethod.LightClientUpdatesByRange](fork, 0);
      yield type.serialize(update);
    } catch (e) {
      if ((e as LightClientServerError).type?.code === LightClientServerErrorCode.RESOURCE_UNAVAILABLE) {
        throw new ResponseError(RespStatus.RESOURCE_UNAVAILABLE, (e as Error).message);
      } else {
        throw new ResponseError(RespStatus.SERVER_ERROR, (e as Error).message);
      }
    }
  }
}
