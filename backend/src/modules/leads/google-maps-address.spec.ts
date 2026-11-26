import { resolveGoogleMapsAddress } from './google-maps-address';

describe('Google Maps deal address lookup', () => {
  const initialKey = process.env.GOOGLE_MAPS_API_KEY;
  const address = '12 Golf Course Road, Gurugram, Haryana, India';
  const geocodeResult = () =>
    Response.json({
      status: 'OK',
      results: [{ formatted_address: address }],
    });

  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (initialKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = initialKey;
  });

  it('expands short links and geocodes the pin instead of the map viewport', async () => {
    const fetcher = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        Response.redirect(
          'https://www.google.com/maps/place/Site/@28,77,15z/data=!3d28.45!4d77.09',
        ),
      )
      .mockResolvedValueOnce(geocodeResult());

    await expect(
      resolveGoogleMapsAddress('https://maps.app.goo.gl/example'),
    ).resolves.toEqual({ address });
    expect(fetcher.mock.calls[0][1]?.redirect).toBe('manual');
    expect(
      new URL(String(fetcher.mock.calls[1][0])).searchParams.get('latlng'),
    ).toBe('28.45,77.09');
  });

  it('prefers an explicit place ID over search text', async () => {
    const fetcher = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(geocodeResult());

    await expect(
      resolveGoogleMapsAddress(
        'https://www.google.com/maps/search/?api=1&query=Gurugram&query_place_id=ChIJExample',
      ),
    ).resolves.toEqual({ address });
    const request = new URL(String(fetcher.mock.calls[0][0]));
    expect(request.searchParams.get('place_id')).toBe('ChIJExample');
    expect(request.searchParams.has('address')).toBe(false);
  });

  it('rejects redirects outside Google Maps before making a second request', async () => {
    const fetcher = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.redirect('https://example.com/maps/place/Site'),
      );

    await expect(
      resolveGoogleMapsAddress('https://maps.app.goo.gl/example'),
    ).rejects.toThrow('Could not open');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
