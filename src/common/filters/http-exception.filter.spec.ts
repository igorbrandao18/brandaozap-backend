import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
          path: '/test',
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          path: '/test',
        }),
      );
    });

    it('should handle HttpException with object response without message property', () => {
      const exception = new HttpException(
        { errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          path: '/test',
        }),
      );
    });

    it('should handle generic Error', () => {
      const exception = new Error('Generic error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path: '/test',
        }),
      );
    });

    it('should handle unknown exception type', () => {
      const exception = 'String error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    it('should log error for 5xx status codes', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should log warning for 4xx status codes', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
