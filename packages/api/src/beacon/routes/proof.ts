import {JsonPath} from "@chainsafe/ssz";
import {Slot} from "@lodestar/types";
import {Proof} from "@chainsafe/persistent-merkle-tree";
import {ReturnTypes, RoutesData, Schema, sameType, ReqSerializers} from "../../utils/index.js";
import {queryParseProofPathsArr, querySerializeProofPathsArr} from "../../utils/serdes.js";
import {HttpStatusCode} from "../../utils/client/httpStatusCode.js";
import {ApiClientResponse} from "../../interfaces.js";

// See /packages/api/src/routes/index.ts for reasoning and instructions to add new routes

export type Api = {
  /**
   * Returns a multiproof of `jsonPaths` at the requested `stateId`.
   * The requested `stateId` may not be available. Regular nodes only keep recent states in memory.
   */
  getStateProof(
    stateId: string,
    jsonPaths: JsonPath[]
  ): Promise<ApiClientResponse<{[HttpStatusCode.OK]: {data: Proof}}>>;

  /**
   * Returns a serialized proof of state.latestExecutionPayloadHeader.receiptsRoot at the requested `slot`.
   */
  getStateReceiptsRootProof(slot: Slot): Promise<ApiClientResponse<{[HttpStatusCode.OK]: {data: Uint8Array}}>>;
};

/**
 * Define javascript values for each route
 */
export const routesData: RoutesData<Api> = {
  getStateProof: {url: "/eth/v0/beacon/proof/state/{state_id}", method: "GET"},
  getStateReceiptsRootProof: {url: "/eth/v0/beacon/proof/state/receiptsRoot/{slot}", method: "GET"},
};

/* eslint-disable @typescript-eslint/naming-convention */
export type ReqTypes = {
  getStateProof: {params: {state_id: string}; query: {paths: string[]}};
  getStateReceiptsRootProof: {params: {slot: Slot}};
};

export function getReqSerializers(): ReqSerializers<Api, ReqTypes> {
  return {
    getStateProof: {
      writeReq: (state_id, paths) => ({params: {state_id}, query: {paths: querySerializeProofPathsArr(paths)}}),
      parseReq: ({params, query}) => [params.state_id, queryParseProofPathsArr(query.paths)],
      schema: {params: {state_id: Schema.StringRequired}, body: Schema.AnyArray},
    },

    getStateReceiptsRootProof: {
      writeReq: (slot) => ({params: {slot: slot}}),
      parseReq: ({params}) => [params.slot],
      schema: {params: {slot: Schema.Uint}},
    },
  };
}

export function getReturnTypes(): ReturnTypes<Api> {
  return {
    // Just sent the proof JSON as-is
    getStateProof: sameType(),
    getStateReceiptsRootProof: sameType(),
  };
}
