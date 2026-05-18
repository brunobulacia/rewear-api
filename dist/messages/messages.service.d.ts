import { PrismaService } from '../prisma/prisma.service';
export declare class SendMessageDto {
    transactionId: string;
    content: string;
}
export declare class MessagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    send(dto: SendMessageDto, fromUserId: string): Promise<{
        sender: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
    } & {
        id: string;
        createdAt: Date;
        transactionId: string | null;
        content: string;
        senderId: string;
        receiverId: string;
    }>;
    getInbox(userId: string): Promise<{
        transactionId: string;
        garment: {
            id: string;
            titulo: string;
            imagenes: string[];
        };
        otherUser: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
        lastMessage: {
            sender: {
                id: string;
                walletAddress: string;
                nombre: string;
            };
        } & {
            id: string;
            createdAt: Date;
            transactionId: string | null;
            content: string;
            senderId: string;
            receiverId: string;
        };
    }[]>;
    getByTransaction(transactionId: string, userId: string): Promise<({
        sender: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
    } & {
        id: string;
        createdAt: Date;
        transactionId: string | null;
        content: string;
        senderId: string;
        receiverId: string;
    })[]>;
}
