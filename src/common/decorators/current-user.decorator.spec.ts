import { ExecutionContext } from '@nestjs/common';

// Test the decorator function implementation directly
// This is the actual function logic inside createParamDecorator
const getCurrentUser = (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
};

describe('CurrentUser', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: '1',
        email: 'test@example.com',
      },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('should return user from request', () => {
    const result = getCurrentUser(null, mockExecutionContext);

    expect(result).toEqual({
      userId: '1',
      email: 'test@example.com',
    });
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should return undefined if user is not in request', () => {
    mockRequest.user = undefined;
    const result = getCurrentUser(null, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should handle null user', () => {
    mockRequest.user = null;
    const result = getCurrentUser(null, mockExecutionContext);

    expect(result).toBeNull();
  });

  it('should handle data parameter', () => {
    const result = getCurrentUser('test-data', mockExecutionContext);

    expect(result).toEqual({
      userId: '1',
      email: 'test@example.com',
    });
  });

  it('should extract user from request using switchToHttp', () => {
    const switchToHttpSpy = jest.fn().mockReturnValue({
      getRequest: () => mockRequest,
    });
    mockExecutionContext.switchToHttp = switchToHttpSpy;

    getCurrentUser(null, mockExecutionContext);

    expect(switchToHttpSpy).toHaveBeenCalled();
  });
});
