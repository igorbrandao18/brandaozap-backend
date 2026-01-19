import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface WAHAQrCode {
  qr: string;
}

export interface WAHASessionStatus {
  status: string;
  qr?: string;
  me?: {
    id: string;
    name: string;
    pushname: string;
  };
}

export interface WAHASendMessageResponse {
  sent: boolean;
  id: string;
}

@Injectable()
export class WahaClient {
  private readonly logger = new Logger(WahaClient.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('waha.baseUrl') || 'http://localhost:3002';
    const apiKey = this.configService.get<string>('waha.apiKey') || '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar API Key se configurada (WAHA usa X-Api-Key header)
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
      this.logger.log(`WAHA Client inicializado com API Key: ${apiKey.substring(0, 8)}...`);
    } else {
      this.logger.warn('WAHA API Key não configurada - algumas funcionalidades podem não funcionar');
    }
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.configService.get<number>('waha.timeout'),
      headers,
    });
  }

  async createSession(sessionId: string): Promise<void> {
    this.logger.log(`🚀 Starting createSession for ${sessionId}...`);
    try {
      // Primeiro, verificar se a sessão já existe
      let sessionExists = false;
      let sessionStatus = null;
      
      try {
        this.logger.log(`📤 GET /api/sessions/${sessionId} - Checking if session exists...`);
        const checkResponse = await this.axiosInstance.get(`/api/sessions/${sessionId}`);
        sessionExists = true;
        sessionStatus = checkResponse.data?.status;
        this.logger.log(`✅ Session ${sessionId} exists with status: ${sessionStatus}`);
        this.logger.log(`📦 Session data:`, JSON.stringify(checkResponse.data));
      } catch (checkError: any) {
        if (checkError.response?.status === 404) {
          this.logger.log(`ℹ️ Session ${sessionId} does not exist, will create it`);
          sessionExists = false;
        } else {
          throw checkError;
        }
      }
      
      // Se sessão existe e está STOPPED, iniciar ela
      if (sessionExists && sessionStatus === 'STOPPED') {
        this.logger.log(`🔄 Session ${sessionId} is STOPPED, starting it...`);
        try {
          const startResponse = await this.axiosInstance.post(`/api/sessions/${sessionId}/start`);
          this.logger.log(`✅ Session ${sessionId} started successfully (status: ${startResponse.data?.status || startResponse.status})`);
          this.logger.log(`📦 Response data:`, JSON.stringify(startResponse.data));
          // Aguardar um pouco após iniciar
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return;
        } catch (startError: any) {
          this.logger.error(`❌ Error starting session ${sessionId}:`, startError.response?.data || startError.message);
          throw startError;
        }
      }
      
      // Se sessão existe e está STARTING ou SCAN_QR_CODE, apenas aguardar
      if (sessionExists && (sessionStatus === 'STARTING' || sessionStatus === 'SCAN_QR_CODE')) {
        this.logger.log(`ℹ️ Session ${sessionId} is already ${sessionStatus}, no action needed`);
        return;
      }
      
      // Se sessão existe e está WORKING, retornar
      if (sessionExists && sessionStatus === 'WORKING') {
        this.logger.log(`✅ Session ${sessionId} is already WORKING`);
        return;
      }
      
      // Se sessão não existe, criar
      if (!sessionExists) {
        try {
          this.logger.log(`📤 POST /api/sessions with name: ${sessionId}`);
          const createResponse = await this.axiosInstance.post(`/api/sessions`, {
            name: sessionId,
            config: {},
          });
          this.logger.log(`✅ Session ${sessionId} created in WAHA (status: ${createResponse.status})`);
          this.logger.log(`📦 Response data:`, JSON.stringify(createResponse.data));
          // Aguardar um pouco para o WAHA processar a criação
          await new Promise((resolve) => setTimeout(resolve, 3000));
          
          // Verificar se a sessão foi realmente criada
          try {
            const verifyResponse = await this.axiosInstance.get(`/api/sessions/${sessionId}`);
            this.logger.log(`✅ Session ${sessionId} verified in WAHA:`, JSON.stringify(verifyResponse.data));
            
            // Se a sessão foi criada mas não iniciou automaticamente, iniciar
            if (verifyResponse.data?.status === 'STOPPED') {
              this.logger.log(`🔄 Session ${sessionId} was created but is STOPPED, starting it...`);
              const startResponse = await this.axiosInstance.post(`/api/sessions/${sessionId}/start`);
              this.logger.log(`✅ Session ${sessionId} started:`, JSON.stringify(startResponse.data));
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          } catch (verifyError: any) {
            this.logger.warn(`⚠️ Could not verify session ${sessionId} after creation:`, verifyError.response?.data || verifyError.message);
          }
          } catch (createError: any) {
          const statusCode = createError.response?.status || createError.status;
          const errorMessage = createError.response?.data?.message || createError.message || 'Unknown error';
          
          // Se erro 422 (Unprocessable Entity), sessão já existe - tentar iniciar
          if (statusCode === 422 && errorMessage.includes('already exists')) {
            this.logger.log(`ℹ️ Session ${sessionId} already exists (422), trying to start it...`);
            try {
              const startResponse = await this.axiosInstance.post(`/api/sessions/${sessionId}/start`);
              this.logger.log(`✅ Session ${sessionId} started:`, JSON.stringify(startResponse.data));
              await new Promise((resolve) => setTimeout(resolve, 3000));
              return;
            } catch (startError: any) {
              this.logger.error(`❌ Error starting existing session ${sessionId}:`, startError.response?.data || startError.message);
              throw startError;
            }
          }
          
          // Para outros erros, propagar
          this.logger.error(`❌ Error creating session ${sessionId}:`, createError.response?.data || createError.message);
          throw createError;
        }
      }
      
      // Se chegou aqui, a sessão foi criada/iniciada com sucesso
      this.logger.log(`✅ Session ${sessionId} creation/start process completed`);
    } catch (error: any) {
      this.logger.error(
        `Error in createSession for ${sessionId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<WAHASessionStatus> {
    try {
      // WAHA usa GET /api/sessions/{name} para obter status completo da sessão
      const response = await this.axiosInstance.get(`/api/sessions/${sessionId}`);
      const sessionData = response.data;
      
      // Converter o formato da resposta do WAHA para o formato esperado
      return {
        status: sessionData.status || 'UNKNOWN',
        qr: sessionData.qr || undefined,
        me: sessionData.me || undefined,
      };
    } catch (error: any) {
      // Se a sessão não existe (404), lançar erro específico para ser tratado no service
      if (error.response?.status === 404) {
        this.logger.warn(`Session ${sessionId} not found in WAHA`);
        throw error; // Propagar para ser tratado no service
      }
      this.logger.error(`Error getting session status ${sessionId}:`, error);
      throw error;
    }
  }

  async getQrCode(sessionId: string): Promise<string> {
    try {
      // Verificar o status da sessão primeiro
      const statusResponse = await this.axiosInstance.get(`/api/sessions/${sessionId}`);
      const sessionData = statusResponse.data;
      
      // Se o status não é SCAN_QR_CODE, QR code não está disponível
      if (sessionData.status !== 'SCAN_QR_CODE') {
        this.logger.warn(`Session ${sessionId} status is ${sessionData.status}, QR code not available yet`);
        throw new Error(`Session status is ${sessionData.status}, QR code only available when status is SCAN_QR_CODE`);
      }
      
      // Buscar QR code do endpoint específico
      // WAHA Core retorna PNG em: /api/{session}/auth/qr
      // Tentar primeiro como JSON (pode retornar {mimetype, data})
      try {
        const qrResponse = await this.axiosInstance.get(`/api/${sessionId}/auth/qr`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        // Se retornou JSON com mimetype e data
        if (qrResponse.data && typeof qrResponse.data === 'object' && qrResponse.data.data) {
          const dataUrl = `data:${qrResponse.data.mimetype || 'image/png'};base64,${qrResponse.data.data}`;
          this.logger.log(`✅ QR code retrieved as JSON for session ${sessionId}`);
          return dataUrl;
        }
        
        // Se retornou string direta (base64)
        if (typeof qrResponse.data === 'string') {
          const dataUrl = `data:image/png;base64,${qrResponse.data}`;
          this.logger.log(`✅ QR code retrieved as string for session ${sessionId}`);
          return dataUrl;
        }
      } catch (jsonError: any) {
        // Se erro ao buscar como JSON, tentar como PNG binário
        this.logger.log(`Trying to fetch QR code as PNG binary...`);
      }
      
      // Tentar buscar como PNG binário
      try {
        const qrResponse = await this.axiosInstance.get(`/api/${sessionId}/auth/qr`, {
          responseType: 'arraybuffer', // Receber como buffer para converter para base64
        });
        
        // Converter PNG para base64 data URL
        const base64 = Buffer.from(qrResponse.data).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;
        
        this.logger.log(`✅ QR code retrieved as PNG binary for session ${sessionId}`);
        return dataUrl;
      } catch (qrError: any) {
        // Se erro 404 ou 422, QR code ainda não está disponível
        if (qrError.response?.status === 404 || qrError.response?.status === 422) {
          this.logger.warn(`QR code not available yet for session ${sessionId} (${qrError.response?.status})`);
          throw qrError;
        }
        throw qrError;
      }
    } catch (error: any) {
      // Se erro 404 ou 422, QR code ainda não está disponível
      if (error.response?.status === 404 || error.response?.status === 422) {
        this.logger.warn(`QR code not available for session ${sessionId} (${error.response?.status})`);
        throw error;
      }
      this.logger.error(`Error getting QR code ${sessionId}:`, error);
      throw error;
    }
  }

  async stopSession(sessionId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/api/sessions/${sessionId}`);
    } catch (error) {
      this.logger.error(`Error stopping session ${sessionId}:`, error);
      throw error;
    }
  }

  async sendText(
    sessionId: string,
    to: string,
    text: string,
  ): Promise<WAHASendMessageResponse> {
    try {
      const response = await this.axiosInstance.post(`/api/sendText`, {
        session: sessionId,
        to,
        text,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending text message:`, error);
      throw error;
    }
  }

  async sendImage(
    sessionId: string,
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WAHASendMessageResponse> {
    try {
      const response = await this.axiosInstance.post(`/api/sendImage`, {
        session: sessionId,
        to,
        image: imageUrl,
        caption,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending image:`, error);
      throw error;
    }
  }

  async sendFile(
    sessionId: string,
    to: string,
    fileUrl: string,
    filename: string,
  ): Promise<WAHASendMessageResponse> {
    try {
      const response = await this.axiosInstance.post(`/api/sendFile`, {
        session: sessionId,
        to,
        file: fileUrl,
        filename,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending file:`, error);
      throw error;
    }
  }

  async getChats(sessionId: string): Promise<any[]> {
    try {
      // WAHA Core usa: /api/{session}/chats
      // Tentar primeiro o endpoint /chats/overview que retorna informações resumidas
      try {
        this.logger.log(`📤 GET /api/${sessionId}/chats/overview - Tentando endpoint overview...`);
        const overviewResponse = await this.axiosInstance.get(`/api/${sessionId}/chats/overview`);
        this.logger.log(`✅ Overview retornou ${overviewResponse.data?.length || 0} chats`);
        return overviewResponse.data || [];
      } catch (overviewError: any) {
        // Se overview não existir, usar o endpoint padrão /chats
        this.logger.log(`⚠️ Overview não disponível (${overviewError.response?.status}), tentando /chats...`);
        const response = await this.axiosInstance.get(`/api/${sessionId}/chats`);
        this.logger.log(`✅ Chats retornou ${response.data?.length || 0} chats`);
        return response.data || [];
      }
    } catch (error: any) {
      this.logger.error(`Error getting chats for session ${sessionId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getChatMessages(sessionId: string, chatId: string, limit?: number, page?: number): Promise<any[]> {
    try {
      const encodedChatId = encodeURIComponent(chatId);
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (page) params.append('page', page.toString());
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      this.logger.log(`📤 GET /api/${sessionId}/chats/${encodedChatId}/messages${queryString}`);
      const response = await this.axiosInstance.get(`/api/${sessionId}/chats/${encodedChatId}/messages${queryString}`);
      return response.data || [];
    } catch (error: any) {
      this.logger.error(`Error getting messages for chat ${chatId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getChatPicture(sessionId: string, chatId: string): Promise<string> {
    try {
      const encodedChatId = encodeURIComponent(chatId);
      const response = await this.axiosInstance.get(`/api/${sessionId}/chats/${encodedChatId}/picture`, {
        responseType: 'arraybuffer',
      });
      const base64 = Buffer.from(response.data).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error: any) {
      this.logger.error(`Error getting chat picture for ${chatId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async archiveChat(sessionId: string, chatId: string): Promise<void> {
    try {
      const encodedChatId = encodeURIComponent(chatId);
      await this.axiosInstance.post(`/api/${sessionId}/chats/${encodedChatId}/archive`);
    } catch (error: any) {
      this.logger.error(`Error archiving chat ${chatId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async unarchiveChat(sessionId: string, chatId: string): Promise<void> {
    try {
      const encodedChatId = encodeURIComponent(chatId);
      await this.axiosInstance.post(`/api/${sessionId}/chats/${encodedChatId}/unarchive`);
    } catch (error: any) {
      this.logger.error(`Error unarchiving chat ${chatId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async deleteChat(sessionId: string, chatId: string): Promise<void> {
    try {
      const encodedChatId = encodeURIComponent(chatId);
      await this.axiosInstance.delete(`/api/${sessionId}/chats/${encodedChatId}`);
    } catch (error: any) {
      this.logger.error(`Error deleting chat ${chatId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async markMessagesAsRead(sessionId: string, chatId: string): Promise<void> {
    try {
      const encodedChatId = encodeURIComponent(chatId);
      await this.axiosInstance.post(`/api/${sessionId}/chats/${encodedChatId}/messages/read`);
    } catch (error: any) {
      this.logger.error(`Error marking messages as read for ${chatId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getContacts(sessionId: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/api/${sessionId}/contacts`);
      return response.data || [];
    } catch (error: any) {
      this.logger.error(`Error getting contacts for session ${sessionId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getContact(sessionId: string, contactId: string): Promise<any> {
    try {
      const encodedContactId = encodeURIComponent(contactId);
      const response = await this.axiosInstance.get(`/api/${sessionId}/contacts/${encodedContactId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error getting contact ${contactId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getMe(sessionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/api/${sessionId}/me`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error getting me info for session ${sessionId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getAllSessions(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/api/sessions');
      return response.data || [];
    } catch (error: any) {
      this.logger.error(`Error getting all sessions:`, error.response?.data || error.message);
      throw error;
    }
  }
}
