import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PlatformIntegrationConfigService } from '../integrations/platform-integration-config.service';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';

interface NeshanReverseResponse {
  status?: string;
  formatted_address?: string;
  neighbourhood?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  message?: string;
}

@Injectable()
export class MapsService {
  constructor(
    private readonly config: PlatformIntegrationConfigService,
  ) {}

  async browserConfig() {
    const neshan = await this.config.getMapsGatewayConfig('NESHAN_MAPS');
    const browserApiKey =
      neshan?.browserApiKey ||
      (neshan?.serverApiKey?.startsWith('web.')
        ? neshan.serverApiKey
        : undefined);

    return {
      provider: browserApiKey ? 'NESHAN' : null,
      browserApiKey: browserApiKey ?? null,
      configured: Boolean(browserApiKey),
    };
  }

  async reverseGeocode(dto: ReverseGeocodeDto) {
    const neshan = await this.config.getMapsGatewayConfig('NESHAN_MAPS');
    const serviceApiKey = neshan?.serverApiKey;
    if (!serviceApiKey || serviceApiKey.startsWith('web.')) {
      throw new ServiceUnavailableException(
        'برای دریافت خودکار آدرس، کلید وب‌سرویس نشان را در پنل مدیر ارشد ثبت کنید.',
      );
    }

    const params = new URLSearchParams({
      lat: String(dto.latitude),
      lng: String(dto.longitude),
    });
    let response: Response;
    try {
      response = await fetch(`https://api.neshan.org/v5/reverse?${params}`, {
        headers: { 'Api-Key': serviceApiKey },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new BadGatewayException(
        'ارتباط با سرویس نشانی نشان برقرار نشد؛ دوباره تلاش کنید.',
      );
    }

    const body = (await response.json().catch(() => null)) as
      | NeshanReverseResponse
      | null;
    if (!response.ok || body?.status !== 'OK') {
      throw new BadGatewayException(
        body?.message ||
          'سرویس نشان نتوانست آدرس این موقعیت را دریافت کند.',
      );
    }

    return {
      formattedAddress: body.formatted_address ?? null,
      neighbourhood: body.neighbourhood ?? null,
      city: body.city ?? null,
      province: body.state?.replace(/^استان\s+/, '') ?? null,
      county: body.county?.replace(/^شهرستان\s+/, '') ?? null,
    };
  }
}
