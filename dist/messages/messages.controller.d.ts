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
        transactionId: string | null;
        content: string;
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
            transactionId: string | null;
            content: string;
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
        transactionId: string | null;
        content: string;
        senderId: string;
        receiverId: string;
    })[]>;
}
