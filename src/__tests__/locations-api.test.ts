import { vi, type Mock } from 'vitest';
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  searchLocations,
} from '@/api/locations';
import type { Location, LocationCreate, LocationUpdate } from '@/types/location';

const mockLocation: Location = {
  id: 'loc-1',
  name: 'Port Olisar',
  location_type: 'station',
  parent_id: 'planet-1',
  coordinates: { x: 100, y: 200, z: 300 },
  has_trade_terminal: true,
  has_landing_pad: true,
  landing_pad_size: 'large',
};

const BASE = 'http://localhost:8003';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockLocation),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listLocations', () => {
  it('sends GET /locations and returns Location[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockLocation]),
    });

    const result = await listLocations();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/locations`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([mockLocation]);
  });

  it('sends GET /locations with location_type filter', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockLocation]),
    });

    const result = await listLocations({ location_type: 'station' });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/locations?location_type=station`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([mockLocation]);
  });

  it('sends GET /locations with parent_id filter', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockLocation]),
    });

    const result = await listLocations({ parent_id: 'planet-1' });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/locations?parent_id=planet-1`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([mockLocation]);
  });

  it('sends GET /locations with both filters', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockLocation]),
    });

    const result = await listLocations({ location_type: 'station', parent_id: 'planet-1' });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/locations?location_type=station&parent_id=planet-1`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([mockLocation]);
  });
});

describe('getLocation', () => {
  it('sends GET /locations/:id and returns Location', async () => {
    const result = await getLocation('loc-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/locations/loc-1`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(mockLocation);
  });
});

describe('createLocation', () => {
  it('sends POST /locations with body and returns Location', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...createData } = mockLocation;
    const payload: LocationCreate = createData;

    const result = await createLocation(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockLocation);
  });
});

describe('updateLocation', () => {
  it('sends PUT /locations/:id with body and returns Location', async () => {
    const payload: LocationUpdate = { name: 'Updated Station' };

    const result = await updateLocation('loc-1', payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/locations/loc-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockLocation);
  });
});

describe('deleteLocation', () => {
  it('sends DELETE /locations/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteLocation('loc-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/locations/loc-1`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('searchLocations', () => {
  it('sends GET /locations/search?q=query and returns Location[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockLocation]),
    });

    const result = await searchLocations('olisar');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/locations/search?q=olisar`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([mockLocation]);
  });

  it('encodes special characters in query', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await searchLocations('port & olisar');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/locations/search?q=port%20%26%20olisar`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([]);
  });
});

describe('error handling', () => {
  it('throws on non-ok response from request helper', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getLocation('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteLocation', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteLocation('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});
