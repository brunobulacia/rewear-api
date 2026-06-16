import { MessagesService, SendMessageDto } from './messages.service';
export declare class MessagesController {
    private readonly service;
    constructor(service: MessagesService);
    send(dto: SendMessageDto, user: {
        userId: string;
    }): Promise<{
        sender: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        transactionId: string | null;
        senderId: string;
        receiverId: string;
    }>;
    getInbox(user: {
        userId: string;
    }): Promise<{
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
            content: string;
            transactionId: string | null;
            senderId: string;
            receiverId: string;
        };
    }[]>;
    getByTransaction(transactionId: string, user: {
        userId: string;
    }): Promise<({
        sender: {
            id: string;
            walletAddress: string;
            nombre: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        transactionId: string | null;
        senderId: string;
        receiverId: string;
    })[]>;
}
