import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRaw, postJson } from '../utils/http-client';

export interface FactoryMapChargeStation {
  id: string;
  x: number;
  y: number;
}

export interface FactoryMapData {
  mapId: number;
  width: number;
  height: number;
  xAttrMin: number;
  yAttrMin: number;
  // Each entry is a travel-path polyline: an array of [x, y] points.
  allPath: number[][][];
  chargeStations: FactoryMapChargeStation[];
}

interface TopologyListResponse {
  code: number;
  desc?: string;
  data?: {
    mapId: number;
    mapJsonUrl: string;
    mapZipUrl: string;
  };
}

// Raw shape of the file at mapJsonUrl. chargeCoor entries come as
// [chargerId, { x, y, z, chargeAngle }] tuples.
interface RawMapJson {
  width: number;
  height: number;
  xAttrMin: number;
  yAttrMin: number;
  allPath: number[][][];
  chargeCoor?: Array<[string, { x: number; y: number }]>;
}

@Injectable()
export class FactoryMapService {
  constructor(private readonly configService: ConfigService) {}

  async getFactoryMap(areaId?: number): Promise<FactoryMapData> {
    const url = this.configService.get<string>('robotTopology.url');
    if (!url) {
      throw new ServiceUnavailableException(
        'Robot topology URL is not configured',
      );
    }
    const effectiveAreaId =
      areaId ?? this.configService.get<number>('taskOrder.areaId') ?? 2;

    let topologyRaw: string;
    try {
      topologyRaw = await postJson(url, { areaId: effectiveAreaId }, 5000);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to reach robot topology endpoint: ${error}`,
      );
    }

    let topology: TopologyListResponse;
    try {
      topology = JSON.parse(topologyRaw);
    } catch (error) {
      throw new BadGatewayException(
        `Robot topology endpoint returned invalid JSON: ${error}`,
      );
    }

    const RCS_SUCCESS_CODE = 1000;
    if (topology.code !== RCS_SUCCESS_CODE || !topology.data?.mapJsonUrl) {
      throw new BadGatewayException(
        `Robot topology endpoint rejected the request (code ${topology.code}): ${topology.desc ?? ''}`,
      );
    }

    let mapRaw: string;
    try {
      mapRaw = await getRaw(topology.data.mapJsonUrl, 8000);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to fetch factory map data: ${error}`,
      );
    }

    let map: RawMapJson;
    try {
      map = JSON.parse(mapRaw);
    } catch (error) {
      throw new BadGatewayException(
        `Factory map data was not valid JSON: ${error}`,
      );
    }

    return {
      mapId: topology.data.mapId,
      width: map.width,
      height: map.height,
      xAttrMin: map.xAttrMin,
      yAttrMin: map.yAttrMin,
      allPath: map.allPath ?? [],
      chargeStations: (map.chargeCoor ?? []).map(([id, coor]) => ({
        id,
        x: coor.x,
        y: coor.y,
      })),
    };
  }
}
