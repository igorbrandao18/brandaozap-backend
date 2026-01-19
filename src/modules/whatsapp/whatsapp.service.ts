import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WahaClient } from './waha/waha.client';
import { UsersService } from '../users/users.service';
import { ContactsService } from '../contacts/contacts.service';
import { WhatsAppSession, SessionStatus, Prisma } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wahaClient: WahaClient,
    private readonly usersService: UsersService,
    private readonly contactsService: ContactsService,
  ) {}

  async createSession(
    userId: string,
    name: string,
    sessionId?: string,
  ): Promise<WhatsAppSession> {
    this.logger.log(`🔵 createSession called for user ${userId}, name: ${name}, sessionId: ${sessionId || 'auto-generated'}`);
    await this.usersService.findById(userId);
    
    // Se não foi fornecido sessionId, gerar um único para este usuário
    // Mas no WAHA sempre usaremos "default" (limitação do WAHA Core)
    const finalSessionId = sessionId || `session_${userId}_${Date.now()}`;
    
    // Declarar variável session aqui para usar em todo o método
    let session: WhatsAppSession;
    
    // Verificar se este usuário já tem uma sessão ativa
    const existingUserSession = await this.prisma.whatsAppSession.findFirst({
      where: { 
        userId,
        deletedAt: null,
        // Buscar sessões ativas ou em processo
        status: {
          in: [SessionStatus.STARTING, SessionStatus.QRCODE, SessionStatus.WORKING],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Se usuário já tem sessão ativa, verificar se precisa criar no WAHA
    if (existingUserSession) {
      this.logger.log(`User ${userId} already has an active session: ${existingUserSession.sessionId}`);
      
      // Se a sessão está WORKING, apenas retornar (já está conectada)
      if (existingUserSession.status === SessionStatus.WORKING) {
        this.logger.log(`Session ${existingUserSession.sessionId} is already WORKING, returning existing session`);
        return existingUserSession;
      }
      
      // Se a sessão está STARTING ou QRCODE mas não tem QR code, pode não existir no WAHA
      // Vamos tentar criar/reiniciar no WAHA mesmo assim
      if (
        existingUserSession.status === SessionStatus.STARTING ||
        (existingUserSession.status === SessionStatus.QRCODE && !existingUserSession.qrCode)
      ) {
        this.logger.log(
          `Session ${existingUserSession.sessionId} exists but may not be in WAHA. Will attempt to create/restart.`,
        );
        // Continuar com o fluxo de criar/reiniciar no WAHA
        // Usar a sessão existente como base
        session = existingUserSession;
        // Pular a criação no banco, mas continuar com criação no WAHA
        const wahaSessionId = 'default';
        
        try {
          this.logger.log(`Attempting to create/restart session ${wahaSessionId} in WAHA for existing session...`);
          await this.wahaClient.createSession(wahaSessionId);
          this.logger.log(`✅ Session ${wahaSessionId} created/started in WAHA successfully`);
          
          // Aguardar e buscar status
          await new Promise((resolve) => setTimeout(resolve, 3000));
          
          // Fazer polling para verificar se a sessão foi realmente criada no WAHA
          let sessionReady = false;
          let pollAttempts = 0;
          const maxPollAttempts = 10;
          
          while (!sessionReady && pollAttempts < maxPollAttempts) {
            try {
              const wahaStatus = await this.wahaClient.getSessionStatus(wahaSessionId);
              sessionReady = true;
              
              const updateData: Prisma.WhatsAppSessionUpdateInput = {};
              
              if (wahaStatus.status === 'WORKING') {
                updateData.status = SessionStatus.WORKING;
                if (wahaStatus.me) {
                  updateData.phoneNumber = wahaStatus.me.id;
                  updateData.profileName = wahaStatus.me.name || wahaStatus.me.pushname;
                }
              } else if (wahaStatus.status === 'QRCODE' || wahaStatus.status === 'SCAN_QR_CODE') {
                updateData.status = SessionStatus.QRCODE;
                // QR code será buscado separadamente se necessário
              } else if (wahaStatus.status === 'FAILED') {
                updateData.status = SessionStatus.FAILED;
              } else if (wahaStatus.status === 'STOPPED') {
                updateData.status = SessionStatus.STOPPED;
              }
              
              const updatedSession = await this.prisma.whatsAppSession.update({
                where: { id: existingUserSession.id },
                data: updateData,
              });
              
              // Se status é QRCODE e não tem QR code ainda, tentar buscar
              if (
                updatedSession.status === SessionStatus.QRCODE &&
                !updatedSession.qrCode
              ) {
                try {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  const qrCode = await this.wahaClient.getQrCode(wahaSessionId);
                  return this.prisma.whatsAppSession.update({
                    where: { id: updatedSession.id },
                    data: { qrCode },
                  });
                } catch (qrError: any) {
                  if (qrError?.response?.status === 404 || qrError?.response?.status === 422) {
                    this.logger.warn(`QR code not available yet, returning session without QR code`);
                    return updatedSession;
                  }
                  return updatedSession;
                }
              }
              
              return updatedSession;
            } catch (statusError: any) {
              pollAttempts++;
              const statusCode = statusError?.response?.status || statusError?.status;
              
              if (statusCode === 404 || statusCode === 422) {
                if (pollAttempts >= maxPollAttempts) {
                  this.logger.warn(`Session ${wahaSessionId} not ready after ${maxPollAttempts} attempts`);
                  return existingUserSession;
                }
                await new Promise((resolve) => setTimeout(resolve, 3000));
                continue;
              }
              throw statusError;
            }
          }
          
          return existingUserSession;
        } catch (createError: any) {
          const statusCode = createError?.response?.status || createError?.status;
          this.logger.error(`Error creating session in WAHA:`, createError);
          
          if (statusCode !== 404) {
            throw new BadRequestException(
              createError?.response?.data?.message ||
                `Erro ao criar sessão no WAHA: ${createError?.message || 'Erro desconhecido'}`,
            );
          }
          // Se 404, retornar sessão existente mesmo sem criar no WAHA
          return existingUserSession;
        }
      }
      
      // Se a sessão está parada ou falhou, vamos reiniciar
      if (existingUserSession.status === SessionStatus.STOPPED || existingUserSession.status === SessionStatus.FAILED) {
        // Continuar com o fluxo de reiniciar
      } else {
        // Para outros casos (QRCODE com QR code), retornar sessão existente
        return existingUserSession;
      }
    }

    // Verificar se já existe sessão com esse ID específico (mesmo que parada)
    const existingSession = await this.prisma.whatsAppSession.findFirst({
      where: { sessionId: finalSessionId, deletedAt: null },
    });
    
    if (existingSession) {
      // Se sessão existe e está parada ou falhou, reutilizar e reiniciar
      if (existingSession.status === SessionStatus.STOPPED || existingSession.status === SessionStatus.FAILED) {
        session = await this.prisma.whatsAppSession.update({
          where: { id: existingSession.id },
          data: {
            name,
            status: SessionStatus.STARTING,
            isActive: true,
            qrCode: null,
            phoneNumber: null,
            profileName: null,
            profilePicture: null,
          },
        });
      } else {
        // Se sessão existe e está ativa, retornar erro
        throw new BadRequestException('Session ID already exists');
      }
    } else {
      // Criar nova sessão
      session = await this.prisma.whatsAppSession.create({
        data: {
          name,
          sessionId: finalSessionId,
          status: SessionStatus.STARTING,
          userId,
          isActive: true,
        },
      });
    }

    try {
      // WAHA Core só suporta sessão "default"
      // Vamos usar "default" no WAHA, mas manter sessionId único no banco
      const wahaSessionId = 'default';

      // Se sessão existia e estava parada, tentar parar no WAHA primeiro (se existir)
      const wasReused =
        existingSession &&
        (existingSession.status === SessionStatus.STOPPED ||
          existingSession.status === SessionStatus.FAILED);
      if (wasReused) {
        try {
          await this.wahaClient.stopSession(wahaSessionId);
        } catch (stopError: any) {
          // Se sessão não existe no WAHA (404), não é problema
          if (stopError?.response?.status !== 404) {
            this.logger.warn(`Error stopping old session in WAHA:`, stopError);
          }
        }
      }

      // Criar/reiniciar sessão no WAHA (sempre usando "default")
      // O WahaClient já tem retry logic, então apenas chamar e tratar erros
      this.logger.log(`Attempting to create session ${wahaSessionId} in WAHA...`);
      try {
        await this.wahaClient.createSession(wahaSessionId);
        this.logger.log(`✅ Session ${wahaSessionId} created/started in WAHA successfully`);
      } catch (createError: any) {
        // Log detalhado do erro
        const statusCode = createError?.response?.status || createError?.status;
        const errorMessage = createError?.response?.data?.message || createError?.message || 'Unknown error';
        const errorData = createError?.response?.data || {};
        
        this.logger.error(
          `❌ Error creating session ${wahaSessionId} in WAHA:`,
          JSON.stringify({
            statusCode,
            message: errorMessage,
            data: errorData,
            stack: createError?.stack,
          }),
        );
        
        // Se erro 404 após todas as tentativas do WahaClient, logar e continuar
        // Pode ser que a sessão ainda não esteja pronta, mas vamos tentar buscar status mesmo assim
        if (statusCode === 404) {
          this.logger.warn(
            `⚠️ Session ${wahaSessionId} not found in WAHA after retries. This might be normal if session is still initializing.`,
          );
          // Continuar o fluxo - vamos tentar buscar status mesmo assim
        } else {
          // Para outros erros, propagar
          throw new BadRequestException(
            errorMessage || `Erro ao criar sessão no WAHA: ${createError?.message || 'Erro desconhecido'}`,
          );
        }
      }

      // Aguardar um pouco para o WAHA processar a criação da sessão
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Fazer polling para verificar se a sessão foi realmente criada no WAHA
      // WAHA Core pode demorar para criar a sessão
      let sessionReady = false;
      let pollAttempts = 0;
      const maxPollAttempts = 10; // Tentar até 10 vezes (30 segundos total)

      while (!sessionReady && pollAttempts < maxPollAttempts) {
        try {
          const wahaStatus = await this.wahaClient.getSessionStatus(wahaSessionId);
          sessionReady = true; // Sessão existe, continuar

          const updateData: Prisma.WhatsAppSessionUpdateInput = {};

          // Atualizar status baseado na resposta do WAHA
          if (wahaStatus.status === 'WORKING') {
            updateData.status = SessionStatus.WORKING;
            if (wahaStatus.me) {
              updateData.phoneNumber = wahaStatus.me.id;
              updateData.profileName = wahaStatus.me.name || wahaStatus.me.pushname;
            }
          } else if (wahaStatus.status === 'QRCODE' || wahaStatus.status === 'SCAN_QR_CODE') {
            updateData.status = SessionStatus.QRCODE;
            // QR code será buscado separadamente se necessário
          } else if (wahaStatus.status === 'FAILED') {
            updateData.status = SessionStatus.FAILED;
          } else if (wahaStatus.status === 'STOPPED') {
            updateData.status = SessionStatus.STOPPED;
          }

          // Atualizar a sessão pelo ID, mantendo o sessionId único do usuário
          const updatedSession = await this.prisma.whatsAppSession.update({
            where: { id: session.id },
            data: updateData,
          });

          // Se status é QRCODE e não tem QR code ainda, tentar buscar
          if (
            updatedSession.status === SessionStatus.QRCODE &&
            !updatedSession.qrCode
          ) {
            try {
              // Aguardar um pouco mais antes de buscar QR code
              await new Promise((resolve) => setTimeout(resolve, 2000));
              const qrCode = await this.wahaClient.getQrCode(wahaSessionId);
              return this.prisma.whatsAppSession.update({
                where: { id: updatedSession.id },
                data: { qrCode },
              });
            } catch (qrError: any) {
              // Se erro 404 ou 422, QR code ainda não está disponível
              if (qrError?.response?.status === 404 || qrError?.response?.status === 422) {
                this.logger.warn(
                  `QR code not available yet for session ${wahaSessionId} (attempt ${pollAttempts + 1})`,
                );
                // Retornar sessão atualizada sem QR code - o frontend vai fazer polling
                return updatedSession;
              }
              // Para outros erros, apenas logar e retornar sessão sem QR code
              this.logger.warn(
                `Error getting QR code for session ${wahaSessionId}:`,
                qrError?.response?.data || qrError?.message,
              );
              return updatedSession;
            }
          }

          return updatedSession;
        } catch (statusError: any) {
          pollAttempts++;
          const statusCode = statusError?.response?.status || statusError?.status;

          // Se erro 404 ou 422, sessão ainda não existe - continuar polling
          if (statusCode === 404 || statusCode === 422) {
            if (pollAttempts >= maxPollAttempts) {
              this.logger.warn(
                `Session ${wahaSessionId} not ready after ${maxPollAttempts} attempts, returning session with STARTING status`,
              );
              // Retornar a sessão criada no banco com status STARTING
              // O frontend vai fazer polling e tentar buscar o QR code depois
              return session;
            }
            // Aguardar antes de tentar novamente
            this.logger.log(
              `Session ${wahaSessionId} not ready yet (attempt ${pollAttempts}/${maxPollAttempts}), waiting...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }

          // Para outros erros, propagar
          throw statusError;
        }
      }

      // Se chegou aqui sem sucesso, retornar sessão com status STARTING
      this.logger.warn(
        `Session ${wahaSessionId} not ready after polling, returning session with STARTING status`,
      );
      return session;
    } catch (error: any) {
      this.logger.error(`Error creating WAHA session:`, error);
      
      // Se já é uma BadRequestException, propagar
      if (error instanceof BadRequestException) {
        await this.prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { status: SessionStatus.FAILED },
        });
        throw error;
      }
      
      // Para outros erros, atualizar status e lançar erro genérico
      await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { status: SessionStatus.FAILED },
      });
      
      throw new BadRequestException(
        error.response?.data?.message || 
        error.message || 
        'Erro ao criar sessão WhatsApp'
      );
    }
  }

  async getSession(sessionId: string): Promise<WhatsAppSession> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: { sessionId, deletedAt: null },
      include: { user: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getUserSessions(userId: string): Promise<WhatsAppSession[]> {
    const sessions = await this.prisma.whatsAppSession.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Tentar sincronizar status com WAHA para a sessão mais recente
    // Isso resolve problemas de sincronização após reiniciar Docker
    if (sessions.length > 0) {
      const latestSession = sessions[0];
      
      // Se a sessão não está deletada e não está em estado final (STOPPED/FAILED),
      // ou se está STOPPED mas pode estar ativa no WAHA, tentar sincronizar
      if (
        latestSession.status === SessionStatus.STOPPED ||
        latestSession.status === SessionStatus.FAILED ||
        latestSession.status === SessionStatus.STARTING ||
        latestSession.status === SessionStatus.QRCODE ||
        latestSession.status === SessionStatus.WORKING
      ) {
        try {
          const wahaSessionId = 'default'; // WAHA Core só suporta "default"
          const wahaStatus = await this.wahaClient.getSessionStatus(wahaSessionId);
          
          // Se o WAHA diz que está WORKING mas o banco diz STOPPED/FAILED, atualizar
          if (wahaStatus.status === 'WORKING' && 
              (latestSession.status === SessionStatus.STOPPED || 
               latestSession.status === SessionStatus.FAILED)) {
            this.logger.log(`Sincronizando sessão ${latestSession.sessionId}: WAHA está WORKING mas banco está ${latestSession.status}`);
            
            const updateData: Prisma.WhatsAppSessionUpdateInput = {
              status: SessionStatus.WORKING,
              isActive: true,
            };
            
            if (wahaStatus.me) {
              updateData.phoneNumber = wahaStatus.me.id;
              updateData.profileName = wahaStatus.me.name || wahaStatus.me.pushname;
            }
            
            const updatedSession = await this.prisma.whatsAppSession.update({
              where: { id: latestSession.id },
              data: updateData,
            });
            
            // Substituir na lista retornada
            sessions[0] = updatedSession;
          }
        } catch (error: any) {
          // Se não conseguir verificar no WAHA (404, etc), apenas logar e continuar
          // Não é um erro crítico - pode ser que a sessão realmente não exista no WAHA
          this.logger.debug(`Não foi possível sincronizar sessão ${latestSession.sessionId} com WAHA:`, error?.response?.status || error?.message);
        }
      }
    }

    return sessions;
  }

  async updateSessionStatus(sessionId: string): Promise<WhatsAppSession> {
    // Buscar sessão no banco pelo sessionId único do usuário
    const session = await this.getSession(sessionId);
    
    // WAHA Core só suporta sessão "default"
    // Buscar status do WAHA usando "default", mas atualizar a sessão do usuário no banco
    const wahaSessionId = 'default';
    
    try {
      const wahaStatus = await this.wahaClient.getSessionStatus(wahaSessionId);
      
      this.logger.log(`Status do WAHA para sessão ${sessionId}: ${wahaStatus.status}`);

      const updateData: Prisma.WhatsAppSessionUpdateInput = {};

      // Atualizar status baseado na resposta do WAHA
      if (wahaStatus.status === 'WORKING') {
        updateData.status = SessionStatus.WORKING;
        updateData.isActive = true;
        if (wahaStatus.me) {
          updateData.phoneNumber = wahaStatus.me.id;
          updateData.profileName = wahaStatus.me.name || wahaStatus.me.pushname;
        }
        this.logger.log(`Atualizando sessão ${sessionId} para WORKING no banco`);
      } else if (wahaStatus.status === 'QRCODE' || wahaStatus.status === 'SCAN_QR_CODE') {
        updateData.status = SessionStatus.QRCODE;
        // QR code será buscado separadamente se necessário
      } else if (wahaStatus.status === 'FAILED') {
        updateData.status = SessionStatus.FAILED;
        updateData.isActive = false;
      } else if (wahaStatus.status === 'STOPPED') {
        updateData.status = SessionStatus.STOPPED;
        updateData.isActive = false;
      }

      const updatedSession = await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: updateData,
      });
      
      this.logger.log(`Sessão ${sessionId} atualizada no banco: ${updatedSession.status}`);
      return updatedSession;
    } catch (error: any) {
      // Se a sessão não existe no WAHA (404), verificar se está realmente desconectada
      // ou se é um problema temporário
      const statusCode = error?.response?.status || error?.status;
      if (statusCode === 404 || statusCode === 500 || statusCode === 422) {
        this.logger.warn(`Session ${sessionId} not found in WAHA (${statusCode}), returning current status from DB`);
        // Se o banco diz STOPPED mas pode estar conectado, tentar uma última verificação
        if (session.status === SessionStatus.STOPPED || session.status === SessionStatus.FAILED) {
          this.logger.log(`Sessão ${sessionId} está ${session.status} no banco, mas WAHA retornou ${statusCode}. Pode estar realmente desconectada.`);
        }
        return session;
      }
      // Para outros erros, propagar
      this.logger.error(`Error updating session status ${sessionId}:`, error);
      throw error;
    }
  }

  async getQrCode(sessionId: string): Promise<string> {
    // Buscar sessão no banco pelo sessionId único do usuário
    const session = await this.getSession(sessionId);
    
    // WAHA Core só suporta sessão "default"
    const wahaSessionId = 'default';
    
    // Verificar status atual no WAHA para garantir que ainda está em SCAN_QR_CODE
    try {
      const wahaStatus = await this.wahaClient.getSessionStatus(wahaSessionId);
      
      // Se status mudou para WORKING, não precisa mais de QR code
      if (wahaStatus.status === 'WORKING') {
        this.logger.log(`Session ${sessionId} is already WORKING, no QR code needed`);
        return '';
      }
      
      // Se status não é SCAN_QR_CODE, QR code não está disponível
      if (wahaStatus.status !== 'SCAN_QR_CODE' && wahaStatus.status !== 'QRCODE') {
        this.logger.warn(`Session ${sessionId} status is ${wahaStatus.status}, QR code not available`);
        // Retornar QR code do banco se existir, caso contrário string vazia
        return session.qrCode || '';
      }
    } catch (statusError: any) {
      // Se erro ao buscar status, tentar usar QR code do banco se existir
      if (session.qrCode) {
        this.logger.warn(`Could not check WAHA status, returning cached QR code`);
        return session.qrCode;
      }
    }
    
    // Sempre buscar QR code atualizado do WAHA (QR codes expiram)
    // Não usar cache para garantir que sempre temos o QR code mais recente
    try {
      const qrCode = await this.wahaClient.getQrCode(wahaSessionId);
      // Atualizar a sessão do usuário no banco com o QR code atualizado
      await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { qrCode, status: SessionStatus.QRCODE },
      });
      this.logger.log(`✅ QR code updated for session ${sessionId}`);
      return qrCode;
    } catch (error: any) {
      // Se erro 404 ou 422, QR code ainda não está disponível
      const statusCode = error?.response?.status || error?.status;
      if (statusCode === 404 || statusCode === 422) {
        this.logger.warn(
          `QR code not available yet for session ${sessionId} (${statusCode}). Using cached QR code if available.`,
        );
        // Retornar QR code do banco se existir, caso contrário string vazia
        return session.qrCode || '';
      }
      
      // Se não conseguir buscar QR code do WAHA, retornar o que tem no banco
      if (session.qrCode) {
        this.logger.warn(`Error fetching QR code, returning cached version`);
        return session.qrCode;
      }
      
      // Para outros erros, logar mas retornar string vazia
      this.logger.error(`Error getting QR code for session ${sessionId}:`, error);
      return '';
    }
  }

  async stopSession(sessionId: string): Promise<void> {
    // Buscar sessão no banco pelo sessionId único do usuário
    const session = await this.getSession(sessionId);

    // WAHA Core só suporta sessão "default"
    const wahaSessionId = 'default';

    try {
      await this.wahaClient.stopSession(wahaSessionId);
      await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { status: SessionStatus.STOPPED, isActive: false },
      });
    } catch (error) {
      this.logger.error(`Error stopping session:`, error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (session.status === SessionStatus.WORKING) {
      await this.stopSession(sessionId);
    }

    await this.prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { deletedAt: new Date() },
    });
  }

  async sendText(
    sessionId: string,
    to: string,
    text: string,
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session.status !== SessionStatus.WORKING) {
      throw new BadRequestException('Session is not working');
    }

    await this.wahaClient.sendText(sessionId, to, text);
  }

  async sendImage(
    sessionId: string,
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session.status !== SessionStatus.WORKING) {
      throw new BadRequestException('Session is not working');
    }

    await this.wahaClient.sendImage(sessionId, to, imageUrl, caption);
  }

  async sendFile(
    sessionId: string,
    to: string,
    fileUrl: string,
    filename: string,
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session.status !== SessionStatus.WORKING) {
      throw new BadRequestException('Session is not working');
    }

    await this.wahaClient.sendFile(sessionId, to, fileUrl, filename);
  }

  async getChatsCount(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId);

    if (session.status !== SessionStatus.WORKING) {
      throw new BadRequestException('Session is not working');
    }

    const wahaSessionId = 'default'; // WAHA Core só suporta "default"
    
    try {
      const chats = await this.wahaClient.getChats(wahaSessionId);
      this.logger.log(`Found ${chats.length} chats for session ${sessionId}`);
      return chats.length;
    } catch (error: any) {
      this.logger.error(`Error getting chats count for session ${sessionId}:`, error);
      throw error;
    }
  }

  async syncChatsFromWAHA(sessionId: string, userId: string): Promise<any[]> {
    const session = await this.getSession(sessionId);
    
    if (session.status !== SessionStatus.WORKING) {
      throw new BadRequestException('Session is not working');
    }

    const wahaSessionId = 'default'; // WAHA Core só suporta "default"
    
    try {
      const wahaChats = await this.wahaClient.getChats(wahaSessionId);
      this.logger.log(`Found ${wahaChats.length} chats in WAHA for session ${sessionId}`);
      
      // Sincronizar chats do WAHA com conversas no banco
      const conversations: any[] = [];
      
      for (const chat of wahaChats) {
        // Parse do chat ID do WAHA (formato: 5511999999999@c.us ou grupo@g.us)
        const originalChatId = chat.id || chat.chatId || '';
        let phoneNumber = originalChatId;
        if (phoneNumber.includes('@c.us')) {
          phoneNumber = phoneNumber.replace('@c.us', '');
        } else if (phoneNumber.includes('@g.us')) {
          phoneNumber = phoneNumber.replace('@g.us', '');
        }
        
        // Nome do contato/grupo - garantir que seja string
        let contactName = phoneNumber;
        if (chat.name) {
          if (typeof chat.name === 'string') {
            contactName = chat.name;
          } else if (typeof chat.name === 'object' && chat.name !== null) {
            // Para grupos, pode vir como objeto com propriedades como 'name', 'subject', etc.
            contactName = (chat.name as any).name || (chat.name as any).subject || (chat.name as any).formattedName || String(chat.name);
          } else {
            contactName = String(chat.name);
          }
        } else if (chat.pushname) {
          contactName = typeof chat.pushname === 'string' ? chat.pushname : String(chat.pushname);
        } else if (chat.contactName) {
          contactName = typeof chat.contactName === 'string' ? chat.contactName : String(chat.contactName);
        } else if (chat.subject) {
          // Para grupos, pode ter 'subject' em vez de 'name'
          contactName = typeof chat.subject === 'string' ? chat.subject : String(chat.subject);
        }
        
        // Foto do chat (se disponível)
        const chatPicture = chat.picture || null;
        
        // Última mensagem - garantir que seja string legível
        let lastMessage = '';
        if (chat.lastMessage) {
          if (typeof chat.lastMessage === 'string') {
            lastMessage = chat.lastMessage;
          } else if (typeof chat.lastMessage === 'object' && chat.lastMessage !== null) {
            const msgObj = chat.lastMessage as any;
            
            // Tentar extrair texto legível de diferentes propriedades
            // WAHA pode retornar em diferentes formatos
            if (msgObj.body && typeof msgObj.body === 'string') {
              lastMessage = msgObj.body;
            } else if (msgObj.text && typeof msgObj.text === 'string') {
              lastMessage = msgObj.text;
            } else if (msgObj.message && typeof msgObj.message === 'string') {
              lastMessage = msgObj.message;
            } else if (msgObj.content && typeof msgObj.content === 'string') {
              lastMessage = msgObj.content;
            } else if (msgObj.caption && typeof msgObj.caption === 'string') {
              lastMessage = msgObj.caption;
            } else if (msgObj.type) {
              // Se tem tipo mas não tem texto legível, mostrar tipo de mídia
              const msgType = String(msgObj.type).toLowerCase();
              if (msgType === 'image' || msgType === 'photo') {
                lastMessage = msgObj.caption ? `📷 ${msgObj.caption}` : '📷 Imagem';
              } else if (msgType === 'video') {
                lastMessage = msgObj.caption ? `🎥 ${msgObj.caption}` : '🎥 Vídeo';
              } else if (msgType === 'audio' || msgType === 'ptt') {
                lastMessage = '🎵 Áudio';
              } else if (msgType === 'document' || msgType === 'file') {
                lastMessage = msgObj.filename ? `📄 ${msgObj.filename}` : '📄 Documento';
              } else if (msgType === 'location') {
                lastMessage = '📍 Localização';
              } else if (msgType === 'contact') {
                lastMessage = '👤 Contato';
              } else if (msgType === 'sticker') {
                lastMessage = '😀 Sticker';
              } else if (msgType === 'link' || msgObj.url) {
                lastMessage = msgObj.url ? `🔗 ${msgObj.url.substring(0, 50)}` : '🔗 Link';
              } else {
                // Se não conseguir identificar, tentar pegar qualquer propriedade string
                const stringProps = Object.values(msgObj).find((val: any) => 
                  typeof val === 'string' && 
                  val.length > 0 && 
                  val.length < 200 &&
                  !val.includes('@') &&
                  !val.startsWith('false_') &&
                  !val.match(/^[a-f0-9]{24}$/i) // Não IDs MongoDB
                );
                if (stringProps) {
                  lastMessage = String(stringProps);
                } else {
                  lastMessage = '[Mensagem]';
                }
              }
            } else {
              // Se não tem tipo nem propriedades conhecidas, tentar pegar primeira propriedade string legível
              const stringProps = Object.values(msgObj).find((val: any) => 
                typeof val === 'string' && 
                val.length > 0 && 
                val.length < 200 &&
                !val.includes('@') &&
                !val.startsWith('false_') &&
                !val.match(/^[a-f0-9]{24}$/i) // Não IDs MongoDB
              );
              if (stringProps) {
                lastMessage = String(stringProps);
              } else {
                lastMessage = '[Mensagem]';
              }
            }
            
            // Limitar tamanho da mensagem
            if (lastMessage.length > 100) {
              lastMessage = lastMessage.substring(0, 100) + '...';
            }
          } else {
            lastMessage = String(chat.lastMessage);
          }
        }
        
        // Timestamp da última mensagem
        let lastMessageTime = new Date();
        if (chat.lastMessage?.timestamp) {
          // WAHA pode retornar timestamp em segundos ou milissegundos
          const timestamp = chat.lastMessage.timestamp;
          lastMessageTime = timestamp > 1000000000000 
            ? new Date(timestamp) 
            : new Date(timestamp * 1000);
        } else if (chat.timestamp) {
          const timestamp = chat.timestamp;
          lastMessageTime = timestamp > 1000000000000 
            ? new Date(timestamp) 
            : new Date(timestamp * 1000);
        } else if (chat.updatedAt) {
          lastMessageTime = new Date(chat.updatedAt);
        }
        
        // Garantir que contactName seja string antes de salvar
        const contactNameString = typeof contactName === 'string' 
          ? contactName 
          : (typeof contactName === 'object' && contactName !== null
              ? ((contactName as any).name || (contactName as any).subject || (contactName as any).formattedName || String(contactName))
              : String(contactName));
        
        // Buscar ou criar contato
        let contact = await this.contactsService.findByPhoneNumber(phoneNumber, userId);
        
        if (!contact) {
          contact = await this.contactsService.create(
            userId,
            contactNameString,
            phoneNumber,
          );
        } else {
          // Atualizar nome do contato se mudou (especialmente para grupos)
          if (contact.name !== contactNameString) {
            contact = await this.contactsService.update(contact.id, userId, { 
              name: contactNameString 
            });
          }
        }
        
        // Buscar ou criar conversa
        let conversation = await this.prisma.conversation.findFirst({
          where: { userId, sessionId: session.id, phoneNumber },
        });
        
        if (conversation) {
          // Atualizar conversa existente
          conversation = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessage: lastMessage.substring(0, 200), // Limitar tamanho
              lastMessageType: chat.lastMessage?.type || 'text',
              contactId: contact.id,
              updatedAt: lastMessageTime,
            },
            include: { contact: true },
          });
        } else {
          // Criar nova conversa
          conversation = await this.prisma.conversation.create({
            data: {
              userId,
              sessionId: session.id,
              phoneNumber,
              contactId: contact.id,
              lastMessage: lastMessage.substring(0, 200),
              lastMessageType: chat.lastMessage?.type || 'text',
              unreadCount: chat.unreadCount || 0,
            },
            include: { contact: true },
          });
        }
        
        // Adicionar foto do chat se disponível no objeto chat do WAHA
        // A foto será buscada no frontend quando necessário (lazy loading)
        conversations.push({
          ...conversation,
          unreadCount: chat.unreadCount || 0,
          picture: chatPicture || null, // Usar foto do WAHA se disponível
          chatId: originalChatId, // Manter chatId original para buscar foto depois
        } as any);
      }
      
      return conversations.sort((a: any, b: any) => 
        new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    } catch (error: any) {
      this.logger.error(`Error syncing chats from WAHA for session ${sessionId}:`, error);
      throw error;
    }
  }

  // ========== CHATS PROXY METHODS ==========
  async getChatsFromWAHA(sessionId: string): Promise<any[]> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    return this.wahaClient.getChats(wahaSessionId);
  }

  async getChatPicture(sessionId: string, chatId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    return this.wahaClient.getChatPicture(wahaSessionId, chatId);
  }

  async archiveChat(sessionId: string, chatId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    await this.wahaClient.archiveChat(wahaSessionId, chatId);
  }

  async unarchiveChat(sessionId: string, chatId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    await this.wahaClient.unarchiveChat(wahaSessionId, chatId);
  }

  async deleteChat(sessionId: string, chatId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    await this.wahaClient.deleteChat(wahaSessionId, chatId);
  }

  // ========== MESSAGES PROXY METHODS ==========
  async getChatMessages(
    sessionId: string,
    chatId: string,
    limit?: number,
    page?: number,
  ): Promise<any[]> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    return this.wahaClient.getChatMessages(wahaSessionId, chatId, limit, page);
  }

  async markMessagesAsRead(sessionId: string, chatId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    await this.wahaClient.markMessagesAsRead(wahaSessionId, chatId);
  }

  // ========== CONTACTS PROXY METHODS ==========
  async getContacts(sessionId: string): Promise<any[]> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    return this.wahaClient.getContacts(wahaSessionId);
  }

  async getContact(sessionId: string, contactId: string): Promise<any> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    return this.wahaClient.getContact(wahaSessionId, contactId);
  }

  // ========== STATUS PROXY METHODS ==========
  async getMe(sessionId: string): Promise<any> {
    const session = await this.getSession(sessionId);
    const wahaSessionId = 'default';
    return this.wahaClient.getMe(wahaSessionId);
  }
}
