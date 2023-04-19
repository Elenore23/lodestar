import {ChainForkConfig} from "@lodestar/config";
import {CompactMultiProof, ProofTypeSerialized, SingleProof} from "@chainsafe/persistent-merkle-tree";
import {Api, ReqTypes, routesData, getReturnTypes, getReqSerializers} from "../routes/proof.js";
import {ServerRoutes, getGenericJsonServer} from "../../utils/server/index.js";
import {ServerApi} from "../../interfaces.js";

export function getRoutes(config: ChainForkConfig, api: ServerApi<Api>): ServerRoutes<Api, ReqTypes> {
  const reqSerializers = getReqSerializers();
  const serverRoutes = getGenericJsonServer<ServerApi<Api>, ReqTypes>(
    {routesData, getReturnTypes, getReqSerializers},
    config,
    api
  );

  return {
    // Non-JSON routes. Return binary
    getStateProof: {
      ...serverRoutes.getStateProof,
      handler: async (req) => {
        const args = reqSerializers.getStateProof.parseReq(req);
        const {data} = await api.getStateProof(...args);
        const leaves = (data as CompactMultiProof).leaves;
        const response = new Uint8Array(32 * leaves.length);
        for (let i = 0; i < leaves.length; i++) {
          response.set(leaves[i], i * 32);
        }
        // Fastify 3.x.x will automatically add header `Content-Type: application/octet-stream` if Buffer
        return Buffer.from(response);
      },
    },
    getBlockProof: {
      ...serverRoutes.getBlockProof,
      handler: async (req) => {
        const args = reqSerializers.getBlockProof.parseReq(req);
        const {data} = await api.getBlockProof(...args);
        const leaves = (data as CompactMultiProof).leaves;
        const response = new Uint8Array(32 * leaves.length);
        for (let i = 0; i < leaves.length; i++) {
          response.set(leaves[i], i * 32);
        }
        // Fastify 3.x.x will automatically add header `Content-Type: application/octet-stream` if Buffer
        return Buffer.from(response);
      },
    },
    getStateReceiptsRootProof: {
      ...serverRoutes.getStateReceiptsRootProof,
      handler: async (req) => {
        const args = reqSerializers.getStateReceiptsRootProof.parseReq(req);
        const {data} = await api.getStateReceiptsRootProof(...args);
        // Fastify 3.x.x will automatically add header `Content-Type: application/octet-stream` if Buffer
        return data;
      },
    },
    getStateProofWithPath: {
      ...serverRoutes.getStateProofWithPath,
      handler: async (req) => {
        const args = reqSerializers.getStateProofWithPath.parseReq(req);
        const {data} = await api.getStateProofWithPath(...args);
        const proof = data as SingleProof;
        const witnesses = proof.witnesses;
        const response = new Uint8Array(1 + 8 + 32 + 32 * witnesses.length);
        response[0] = ProofTypeSerialized.indexOf(data.type);
        const writer = new DataView(response.buffer, response.byteOffset, response.byteLength);
        let offset = 1;
        writer.setBigInt64(offset, proof.gindex, true);
        offset += 8;
        response.set(proof.leaf, offset);
        offset += 32;
        for (let i = 0; i < witnesses.length; i++) {
          response.set(witnesses[i], offset + i * 32);
        }
        // Fastify 3.x.x will automatically add header `Content-Type: application/octet-stream` if Buffer
        return Buffer.from(response);
      },
    },
  };
}
