import { EventEmitter } from "@angular/core";
import { IPCTransport } from "./ipc-transport";
import { WebSocketTransport } from "./websocket-transport";

export interface ITransport {
    $tMessage: EventEmitter<string>
    $tStatus: EventEmitter<string>
    isOpen: boolean;

    connect(): void;
    send(data: any): void;
    close(): void;
}



export class TransportFactory {
    public static createTransport(type: string, clientId: string): ITransport {
        if (type === 'ipc') {
            throw new TypeError('NOT AVAILABLE IN FRONTEND');
            //return new IPCTransport(clientId);
        }
        if (type === 'websocket') {
            return new WebSocketTransport(clientId);
        }

        throw new TypeError('RPC_INVALID_TRANSPORT');

    }
}