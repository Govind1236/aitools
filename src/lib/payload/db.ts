import config from "@payload-config";
import { getPayload, type Payload } from "payload";

let _payload: Payload | null = null;

export async function getPayloadClient(): Promise<Payload> {
  if (_payload) return _payload;
  _payload = await getPayload({ config });
  return _payload;
}