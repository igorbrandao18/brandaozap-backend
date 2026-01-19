import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Se houver erro ou não houver usuário, lançar UnauthorizedException
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
