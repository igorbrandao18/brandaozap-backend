import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should log request and response', (done) => {
      const loggerSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('GET /test 200'),
          );
          done();
        },
      });
    });

    it('should calculate delay correctly', (done) => {
      const loggerSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringMatching(/\d+ms/),
          );
          done();
        },
      });
    });

    it('should handle different HTTP methods', (done) => {
      mockRequest.method = 'POST';
      const loggerSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('POST /test'),
          );
          done();
        },
      });
    });

    it('should handle different status codes', (done) => {
      mockResponse.statusCode = 404;
      const loggerSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining('404'),
          );
          done();
        },
      });
    });
  });
});
