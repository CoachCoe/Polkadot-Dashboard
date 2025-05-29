export const encryptionService = {
  encrypt: jest.fn((data: string) => data),
  decrypt: jest.fn((data: string) => data),
  getInstance: jest.fn(() => ({
    encrypt: jest.fn((data: string) => data),
    decrypt: jest.fn((data: string) => data)
  }))
}; 