export class MockJwt {
  payload: Record<string, unknown>;

  token: string;

  constructor(payload = {}) {
    this.payload = payload;
    // Simulate JWT signing (omitting actual signing logic)
    this.token = 'fake-access-token';
  }

  public authorize(): Promise<{ access_token: string }> {
    return Promise.resolve({
      access_token: this.token,
    });
  }
}
