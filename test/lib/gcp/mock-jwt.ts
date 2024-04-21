export class MockJwt {
  payload: any;

  token: string;

  constructor(payload = {}) {
    this.payload = payload;
    // Simulate JWT signing (omitting actual signing logic)
    this.token = 'fake-access-token';
  }

  public authorize(): Promise<any> {
    return Promise.resolve({
      access_token: this.token,
    });
  }
}
