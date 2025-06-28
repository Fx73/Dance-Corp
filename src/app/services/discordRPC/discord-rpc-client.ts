import { ITransport, TransportFactory } from "./transport/transport.interface";
import { RPCClientOptions, RPCLoginOptions } from "discord-rpc";

import { EventEmitter } from "@angular/core";
import { Params } from "@angular/router";
import { UserDto } from "src/app/pages/user-profile/user.dto";
import { WebSocketTransport } from "./transport/websocket-transport";

export class RPCClient extends EventEmitter {
    readonly ENDPOINT = 'https://discord.com/api'
    readonly PATH = '/oauth2/token'

    private transport: ITransport;

    private accessToken: string | null = null;
    private clientId: string | null = null;
    private application = null;
    private user = null;
    private _expecting: Map<any, any> = new Map();
    private _subscriptions: any;

    public $rpcReady = new EventEmitter<{ status: string; timestamp: Date }>();


    constructor(clientId: string, options: RPCClientOptions) {
        super();

        this.clientId = clientId
        this.transport = TransportFactory.createTransport(options.transport, clientId);
        this.transport.$tMessage.subscribe(this._onRpcMessage.bind(this));
    }


    async login(options: RPCLoginOptions) {
        let { clientId, accessToken } = options;
        await this.connect();
        if (!options.scopes) {
            this.$rpcReady.emit({ status: 'ready', timestamp: new Date() });
            return this;
        }
        if (!accessToken) {
            accessToken = await this.authorize(options);
        }
        return this.authenticate(accessToken ?? null);
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.transport) {
                reject(new Error('Transport not initialized'));
                return;
            }
            if (this.transport.isOpen) {
                resolve();
                return;
            }
            this.transport.connect();

            let timeout = setTimeout(() => reject(new Error('RPC_CONNECTION_TIMEOUT')), 10_000);

            this.transport.$tStatus.subscribe((status) => {
                clearTimeout(timeout);
                if (status === 'open')
                    resolve();
                else
                    reject(new Error('WebSocket error occurred'));

            });

        });
    }

    async authorize({ scopes, clientSecret, rpcToken, redirectUri, prompt }: RPCLoginOptions) {
        if (clientSecret && rpcToken) {
            const data = new URLSearchParams({
                client_id: this.clientId || '',
                client_secret: clientSecret,
            })

            const body = await fetch(`${this.ENDPOINT}${this.PATH}/rpc`, { method: 'POST', body: data, headers: { Authorization: `Bearer ${this.accessToken}` } })
                .then(async (r) => {
                    const body = await r.json();
                    if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(body)}`);
                    return body;
                });

            rpcToken = body.rpc_token;
        }
        console.log("CODE NOW")

        const { code } = await this.request('AUTHORIZE', {
            scopes,
            client_id: this.clientId,
            prompt,
            rpc_token: rpcToken,
        });
        console.log(code)

        const data = new URLSearchParams(Object.entries({
            client_id: this.clientId || '',
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri || '',
        }))

        const response = await fetch(`${this.ENDPOINT}${this.PATH}`, { method: 'POST', body: data, headers: { Authorization: `Bearer ${this.accessToken}` } })
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(body)}`);
                return body;
            });

        return response.access_token;
    }


    /**
     * Request
     * @param {string} cmd Command
     * @param {Object} [args={}] Arguments
     * @param {string} [evt] Event
     * @returns {Promise}
     * @private
     */
    request(cmd: string, args: any = undefined, evt: any = undefined): Promise<any> {
        return new Promise((resolve, reject) => {
            const nonce = uuid4122();
            this.transport.send({ cmd, args, evt, nonce });
            this._expecting.set(nonce, { resolve, reject });
        });
    }

    /**
     * Message handler
     * @param {Object} message message
     * @private
     */
    _onRpcMessage(message: { cmd: any; evt: string; data: { user: null; message: string | undefined; code: any; }; nonce: any; }) {
        console.log("REVEIVED MSG", message)
        if (message.cmd === RPCCommands["DISPATCH"] && message.evt === RPCEvents["READY"]) {
            if (message.data.user) {
                this.user = message.data.user;
            }
            this.emit('connected');
        } else if (this._expecting.has(message.nonce)) {
            const { resolve, reject } = this._expecting.get(message.nonce);
            if (message.evt === 'ERROR') {
                const e = new Error(message.data.message);
                e.name = message.data.code;
                reject(e);
            } else {
                resolve(message.data);
            }
            this._expecting.delete(message.nonce);
        } else {
            this.emit(message.data);
        }
    }



    /**
     * Authenticate
     * @param {string} accessToken access token
     * @returns {Promise}
     * @private
     */
    authenticate(accessToken: string | null) {
        return this.request('AUTHENTICATE', { access_token: accessToken })
            .then(({ application, user }) => {
                this.accessToken = accessToken;
                this.application = application;
                this.user = user;
                this.$rpcReady.emit({ status: 'ready', timestamp: new Date() });
                return this;
            });
    }


    /**
     * Fetch a guild
     * @param {Snowflake} id Guild ID
     * @param {number} [timeout] Timeout request
     * @returns {Promise<Guild>}
     */
    getGuild(id: any, timeout: any) {
        return this.request(RPCCommands["GET_GUILD"], { guild_id: id, timeout });
    }

    /**
     * Fetch all guilds
     * @param {number} [timeout] Timeout request
     * @returns {Promise<Collection<Snowflake, Guild>>}
     */
    getGuilds(timeout: any) {
        return this.request(RPCCommands["GET_GUILDS"], { timeout });
    }

    /**
     * Get a channel
     * @param {Snowflake} id Channel ID
     * @param {number} [timeout] Timeout request
     * @returns {Promise<Channel>}
     */
    getChannel(id: any, timeout: any) {
        return this.request(RPCCommands["GET_CHANNEL"], { channel_id: id, timeout });
    }

    /**
     * Get all channels
     * @param {Snowflake} [id] Guild ID
     * @param {number} [timeout] Timeout request
     * @returns {Promise<Collection<Snowflake, Channel>>}
     */
    async getChannels(id: any, timeout: any) {
        const { channels } = await this.request(RPCCommands["GET_CHANNELS"], {
            timeout,
            guild_id: id,
        });
        return channels;
    }

    /**
     * @typedef {CertifiedDevice}
     * @prop {string} type One of `AUDIO_INPUT`, `AUDIO_OUTPUT`, `VIDEO_INPUT`
     * @prop {string} uuid This device's Windows UUID
     * @prop {object} vendor Vendor information
     * @prop {string} vendor.name Vendor's name
     * @prop {string} vendor.url Vendor's url
     * @prop {object} model Model information
     * @prop {string} model.name Model's name
     * @prop {string} model.url Model's url
     * @prop {string[]} related Array of related product's Windows UUIDs
     * @prop {boolean} echoCancellation If the device has echo cancellation
     * @prop {boolean} noiseSuppression If the device has noise suppression
     * @prop {boolean} automaticGainControl If the device has automatic gain control
     * @prop {boolean} hardwareMute If the device has a hardware mute
     */

    /**
     * Tell discord which devices are certified
     * @param {CertifiedDevice[]} devices Certified devices to send to discord
     * @returns {Promise}
     */
    setCertifiedDevices(devices: any[]) {
        return this.request(RPCCommands["SET_CERTIFIED_DEVICES"], {
            devices: devices.map((d: { type: any; uuid: any; vendor: any; model: any; related: any; echoCancellation: any; noiseSuppression: any; automaticGainControl: any; hardwareMute: any; }) => ({
                type: d.type,
                id: d.uuid,
                vendor: d.vendor,
                model: d.model,
                related: d.related,
                echo_cancellation: d.echoCancellation,
                noise_suppression: d.noiseSuppression,
                automatic_gain_control: d.automaticGainControl,
                hardware_mute: d.hardwareMute,
            })),
        });
    }

    /**
     * @typedef {UserVoiceSettings}
     * @prop {Snowflake} id ID of the user these settings apply to
     * @prop {?Object} [pan] Pan settings, an object with `left` and `right` set between
     * 0.0 and 1.0, inclusive
     * @prop {?number} [volume=100] The volume
     * @prop {bool} [mute] If the user is muted
     */

    /**
     * Set the voice settings for a user, by id
     * @param {Snowflake} id ID of the user to set
     * @param {UserVoiceSettings} settings Settings
     * @returns {Promise}
     */
    setUserVoiceSettings(id: any, settings: { pan: any; mute: any; volume: any; }) {
        return this.request(RPCCommands["SET_USER_VOICE_SETTINGS"], {
            user_id: id,
            pan: settings.pan,
            mute: settings.mute,
            volume: settings.volume,
        });
    }

    /**
     * Move the user to a voice channel
     * @param {Snowflake} id ID of the voice channel
     * @param {Object} [options] Options
     * @param {number} [options.timeout] Timeout for the command
     * @param {boolean} [options.force] Force this move. This should only be done if you
     * have explicit permission from the user.
     * @returns {Promise}
     */
    selectVoiceChannel(id: any, { timeout, force = false }: { timeout?: number; force?: boolean } = {}) {
        return this.request(RPCCommands["SELECT_VOICE_CHANNEL"], { channel_id: id, timeout, force });
    }

    /**
     * Move the user to a text channel
     * @param {Snowflake} id ID of the voice channel
     * @param {Object} [options] Options
     * @param {number} [options.timeout] Timeout for the command
     * have explicit permission from the user.
     * @returns {Promise}
     */
    selectTextChannel(id: any, { timeout }: { timeout?: number; force?: boolean } = {}) {
        return this.request(RPCCommands["SELECT_TEXT_CHANNEL"], { channel_id: id, timeout });
    }

    /**
     * Get current voice settings
     * @returns {Promise}
     */
    getVoiceSettings() {
        return this.request(RPCCommands["GET_VOICE_SETTINGS"])
            .then((s) => ({
                automaticGainControl: s.automatic_gain_control,
                echoCancellation: s.echo_cancellation,
                noiseSuppression: s.noise_suppression,
                qos: s.qos,
                silenceWarning: s.silence_warning,
                deaf: s.deaf,
                mute: s.mute,
                input: {
                    availableDevices: s.input.available_devices,
                    device: s.input.device_id,
                    volume: s.input.volume,
                },
                output: {
                    availableDevices: s.output.available_devices,
                    device: s.output.device_id,
                    volume: s.output.volume,
                },
                mode: {
                    type: s.mode.type,
                    autoThreshold: s.mode.auto_threshold,
                    threshold: s.mode.threshold,
                    shortcut: s.mode.shortcut,
                    delay: s.mode.delay,
                },
            }));
    }

    /**
     * Set current voice settings, overriding the current settings until this session disconnects.
     * This also locks the settings for any other rpc sessions which may be connected.
     * @param {Object} args Settings
     * @returns {Promise}
     */
    setVoiceSettings(args: { automaticGainControl: any; echoCancellation: any; noiseSuppression: any; qos: any; silenceWarning: any; deaf: any; mute: any; input: { device: any; volume: any; }; output: { device: any; volume: any; }; mode: { type: any; autoThreshold: any; threshold: any; shortcut: any; delay: any; }; }) {
        return this.request(RPCCommands["SET_VOICE_SETTINGS"], {
            automatic_gain_control: args.automaticGainControl,
            echo_cancellation: args.echoCancellation,
            noise_suppression: args.noiseSuppression,
            qos: args.qos,
            silence_warning: args.silenceWarning,
            deaf: args.deaf,
            mute: args.mute,
            input: args.input ? {
                device_id: args.input.device,
                volume: args.input.volume,
            } : undefined,
            output: args.output ? {
                device_id: args.output.device,
                volume: args.output.volume,
            } : undefined,
            mode: args.mode ? {
                type: args.mode.type,
                auto_threshold: args.mode.autoThreshold,
                threshold: args.mode.threshold,
                shortcut: args.mode.shortcut,
                delay: args.mode.delay,
            } : undefined,
        });
    }

    /**
     * Capture a shortcut using the client
     * The callback takes (key, stop) where `stop` is a function that will stop capturing.
     * This `stop` function must be called before disconnecting or else the user will have
     * to restart their client.
     * @param {Function} callback Callback handling keys
     * @returns {Promise<Function>}
     */
    captureShortcut(callback: (arg0: any, arg1: () => Promise<unknown>) => void) {
        function subKey(event: any, args: undefined) {
            return `${event}${JSON.stringify(args)}`;
        }

        const subid = subKey(RPCEvents["CAPTURE_SHORTCUT_CHANGE"], undefined);
        const stop = () => {
            this._subscriptions.delete(subid);
            return this.request(RPCCommands["CAPTURE_SHORTCUT"], { action: 'STOP' });
        };
        this._subscriptions.set(subid, ({ shortcut }: { shortcut: any }) => {
            callback(shortcut, stop);
        });
        return this.request(RPCCommands["CAPTURE_SHORTCUT"], { action: 'START' })
            .then(() => stop);
    }

    /**
     * Sets the presence for the logged in user.
     * @param {object} args The rich presence to pass.
     * @param {number} [pid] The application's process ID. Defaults to the executing process' PID.
     * @returns {Promise}
     */
    setActivity(args: any = {}, pid = getPid()) {
        let timestamps;
        let assets;
        let party;
        let secrets;
        if (args.startTimestamp || args.endTimestamp) {
            timestamps = {
                start: args.startTimestamp,
                end: args.endTimestamp,
            };
            if (timestamps.start instanceof Date) {
                timestamps.start = Math.round(timestamps.start.getTime());
            }
            if (timestamps.end instanceof Date) {
                timestamps.end = Math.round(timestamps.end.getTime());
            }
            if (timestamps.start > 2147483647000) {
                throw new RangeError('timestamps.start must fit into a unix timestamp');
            }
            if (timestamps.end > 2147483647000) {
                throw new RangeError('timestamps.end must fit into a unix timestamp');
            }
        }
        if (
            args.largeImageKey || args.largeImageText
            || args.smallImageKey || args.smallImageText
        ) {
            assets = {
                large_image: args.largeImageKey,
                large_text: args.largeImageText,
                small_image: args.smallImageKey,
                small_text: args.smallImageText,
            };
        }
        if (args.partySize || args.partyId || args.partyMax) {
            party = { id: args.partyId, size: {} };
            if (args.partySize || args.partyMax) {
                party.size = [args.partySize, args.partyMax];
            }
        }
        if (args.matchSecret || args.joinSecret || args.spectateSecret) {
            secrets = {
                match: args.matchSecret,
                join: args.joinSecret,
                spectate: args.spectateSecret,
            };
        }

        return this.request(RPCCommands["SET_ACTIVITY"], {
            pid,
            activity: {
                state: args.state,
                details: args.details,
                timestamps,
                assets,
                party,
                secrets,
                buttons: args.buttons,
                instance: !!args.instance,
            },
        });
    }

    /**
     * Clears the currently set presence, if any. This will hide the "Playing X" message
     * displayed below the user's name.
     * @param {number} [pid] The application's process ID. Defaults to the executing process' PID.
     * @returns {Promise}
     */
    clearActivity(pid = getPid()) {
        return this.request(RPCCommands["SET_ACTIVITY"], {
            pid,
        });
    }

    /**
     * Invite a user to join the game the RPC user is currently playing
     * @param {User} user The user to invite
     * @returns {Promise}
     */
    sendJoinInvite(user: { id: any; }) {
        return this.request(RPCCommands["SEND_ACTIVITY_JOIN_INVITE"], {
            user_id: user.id || user,
        });
    }

    /**
     * Request to join the game the user is playing
     * @param {User} user The user whose game you want to request to join
     * @returns {Promise}
     */
    sendJoinRequest(user: { id: any; }) {
        return this.request(RPCCommands["SEND_ACTIVITY_JOIN_REQUEST"], {
            user_id: user.id || user,
        });
    }

    /**
     * Reject a join request from a user
     * @param {User} user The user whose request you wish to reject
     * @returns {Promise}
     */
    closeJoinRequest(user: { id: any; }) {
        return this.request(RPCCommands["CLOSE_ACTIVITY_JOIN_REQUEST"], {
            user_id: user.id || user,
        });
    }

    createLobby(type: any, capacity: any, metadata: any) {
        return this.request(RPCCommands["CREATE_LOBBY"], {
            type,
            capacity,
            metadata,
        });
    }

    updateLobby(lobby: { id: any; }, { type, owner, capacity, metadata }: { type?: any; owner?: any; capacity?: any; metadata?: any } = {}) {
        return this.request(RPCCommands["UPDATE_LOBBY"], {
            id: lobby.id || lobby,
            type,
            owner_id: (owner && owner.id) || owner,
            capacity,
            metadata,
        });
    }

    deleteLobby(lobby: { id: any; }) {
        return this.request(RPCCommands["DELETE_LOBBY"], {
            id: lobby.id || lobby,
        });
    }

    connectToLobby(id: any, secret: any) {
        return this.request(RPCCommands["CONNECT_TO_LOBBY"], {
            id,
            secret,
        });
    }

    sendToLobby(lobby: { id: any; }, data: any) {
        return this.request(RPCCommands["SEND_TO_LOBBY"], {
            id: lobby.id || lobby,
            data,
        });
    }

    disconnectFromLobby(lobby: { id: any; }) {
        return this.request(RPCCommands["DISCONNECT_FROM_LOBBY"], {
            id: lobby.id || lobby,
        });
    }

    updateLobbyMember(lobby: { id: any; }, user: { id: any; }, metadata: any) {
        return this.request(RPCCommands["UPDATE_LOBBY_MEMBER"], {
            lobby_id: lobby.id || lobby,
            user_id: user.id || user,
            metadata,
        });
    }

    getRelationships() {
        const types = Object.keys(RelationshipTypes);
        return this.request(RPCCommands["GET_RELATIONSHIPS"])
            .then((o) => o.relationships.map((r: { type: string | number; }) => ({
                ...r,
                type: types[r.type as keyof typeof types],
            })));
    }


    async rpcSubscribe(event: { (user: UserDto | null): void; (userData: UserDto | null): UserDto | null; (user: UserDto | null): void; (params: Params): void; (message: any): void; } | undefined, args: { scopes?: any; client_id?: string | null; prompt?: any; rpc_token?: any; access_token?: any; guild_id?: any; timeout?: any; channel_id?: any; devices?: any; user_id?: any; pan?: any; mute?: any; volume?: any; force?: boolean; automatic_gain_control?: any; echo_cancellation?: any; noise_suppression?: any; qos?: any; silence_warning?: any; deaf?: any; input?: { device_id: any; volume: any; } | undefined; output?: { device_id: any; volume: any; } | undefined; mode?: { type: any; auto_threshold: any; threshold: any; shortcut: any; delay: any; } | undefined; action?: string; pid?: any; activity?: { state: any; details: any; timestamps: { start: any; end: any; } | undefined; assets: { large_image: any; large_text: any; small_image: any; small_text: any; } | undefined; party: { id: any; } | undefined; secrets: { match: any; join: any; spectate: any; } | undefined; buttons: any; instance: boolean; }; type?: any; capacity?: any; metadata?: any; id?: any; owner_id?: any; secret?: any; data?: any; lobby_id?: any; } | undefined): Promise<object> {
        await this.request(RPCCommands["SUBSCRIBE"], args, event);
        return {
            unsubscribe: () => this.request(RPCCommands["UNSUBSCRIBE"], args, event),
        };
    }

    /**
     * Destroy the client
     */
    async destroy() {
        await this.transport.close();
    }
}

function keyMirror(keys: string[]): Record<string, string> {
    return keys.reduce((acc, key) => {
        acc[key] = key;
        return acc;
    }, {} as Record<string, string>);
}

const RPCCommands = keyMirror([
    'DISPATCH',
    'AUTHORIZE',
    'AUTHENTICATE',
    'GET_GUILD',
    'GET_GUILDS',
    'GET_CHANNEL',
    'GET_CHANNELS',
    'CREATE_CHANNEL_INVITE',
    'GET_RELATIONSHIPS',
    'GET_USER',
    'SUBSCRIBE',
    'UNSUBSCRIBE',
    'SET_USER_VOICE_SETTINGS',
    'SET_USER_VOICE_SETTINGS_2',
    'SELECT_VOICE_CHANNEL',
    'GET_SELECTED_VOICE_CHANNEL',
    'SELECT_TEXT_CHANNEL',
    'GET_VOICE_SETTINGS',
    'SET_VOICE_SETTINGS_2',
    'SET_VOICE_SETTINGS',
    'CAPTURE_SHORTCUT',
    'SET_ACTIVITY',
    'SEND_ACTIVITY_JOIN_INVITE',
    'CLOSE_ACTIVITY_JOIN_REQUEST',
    'ACTIVITY_INVITE_USER',
    'ACCEPT_ACTIVITY_INVITE',
    'INVITE_BROWSER',
    'DEEP_LINK',
    'CONNECTIONS_CALLBACK',
    'BRAINTREE_POPUP_BRIDGE_CALLBACK',
    'GIFT_CODE_BROWSER',
    'GUILD_TEMPLATE_BROWSER',
    'OVERLAY',
    'BROWSER_HANDOFF',
    'SET_CERTIFIED_DEVICES',
    'GET_IMAGE',
    'CREATE_LOBBY',
    'UPDATE_LOBBY',
    'DELETE_LOBBY',
    'UPDATE_LOBBY_MEMBER',
    'CONNECT_TO_LOBBY',
    'DISCONNECT_FROM_LOBBY',
    'SEND_TO_LOBBY',
    'SEARCH_LOBBIES',
    'CONNECT_TO_LOBBY_VOICE',
    'DISCONNECT_FROM_LOBBY_VOICE',
    'SET_OVERLAY_LOCKED',
    'OPEN_OVERLAY_ACTIVITY_INVITE',
    'OPEN_OVERLAY_GUILD_INVITE',
    'OPEN_OVERLAY_VOICE_SETTINGS',
    'VALIDATE_APPLICATION',
    'GET_ENTITLEMENT_TICKET',
    'GET_APPLICATION_TICKET',
    'START_PURCHASE',
    'GET_SKUS',
    'GET_ENTITLEMENTS',
    'GET_NETWORKING_CONFIG',
    'NETWORKING_SYSTEM_METRICS',
    'NETWORKING_PEER_METRICS',
    'NETWORKING_CREATE_TOKEN',
    'SET_USER_ACHIEVEMENT',
    'GET_USER_ACHIEVEMENTS',
]);

const RPCEvents = keyMirror([
    'CURRENT_USER_UPDATE',
    'GUILD_STATUS',
    'GUILD_CREATE',
    'CHANNEL_CREATE',
    'RELATIONSHIP_UPDATE',
    'VOICE_CHANNEL_SELECT',
    'VOICE_STATE_CREATE',
    'VOICE_STATE_DELETE',
    'VOICE_STATE_UPDATE',
    'VOICE_SETTINGS_UPDATE',
    'VOICE_SETTINGS_UPDATE_2',
    'VOICE_CONNECTION_STATUS',
    'SPEAKING_START',
    'SPEAKING_STOP',
    'GAME_JOIN',
    'GAME_SPECTATE',
    'ACTIVITY_JOIN',
    'ACTIVITY_JOIN_REQUEST',
    'ACTIVITY_SPECTATE',
    'ACTIVITY_INVITE',
    'NOTIFICATION_CREATE',
    'MESSAGE_CREATE',
    'MESSAGE_UPDATE',
    'MESSAGE_DELETE',
    'LOBBY_DELETE',
    'LOBBY_UPDATE',
    'LOBBY_MEMBER_CONNECT',
    'LOBBY_MEMBER_DISCONNECT',
    'LOBBY_MEMBER_UPDATE',
    'LOBBY_MESSAGE',
    'CAPTURE_SHORTCUT_CHANGE',
    'OVERLAY',
    'OVERLAY_UPDATE',
    'ENTITLEMENT_CREATE',
    'ENTITLEMENT_DELETE',
    'USER_ACHIEVEMENT_UPDATE',
    'READY',
    'ERROR',
]);

const RPCErrors = {
    CAPTURE_SHORTCUT_ALREADY_LISTENING: 5004,
    GET_GUILD_TIMED_OUT: 5002,
    INVALID_ACTIVITY_JOIN_REQUEST: 4012,
    INVALID_ACTIVITY_SECRET: 5005,
    INVALID_CHANNEL: 4005,
    INVALID_CLIENTID: 4007,
    INVALID_COMMAND: 4002,
    INVALID_ENTITLEMENT: 4015,
    INVALID_EVENT: 4004,
    INVALID_GIFT_CODE: 4016,
    INVALID_GUILD: 4003,
    INVALID_INVITE: 4011,
    INVALID_LOBBY: 4013,
    INVALID_LOBBY_SECRET: 4014,
    INVALID_ORIGIN: 4008,
    INVALID_PAYLOAD: 4000,
    INVALID_PERMISSIONS: 4006,
    INVALID_TOKEN: 4009,
    INVALID_USER: 4010,
    LOBBY_FULL: 5007,
    NO_ELIGIBLE_ACTIVITY: 5006,
    OAUTH2_ERROR: 5000,
    PURCHASE_CANCELED: 5008,
    PURCHASE_ERROR: 5009,
    RATE_LIMITED: 5011,
    SELECT_CHANNEL_TIMED_OUT: 5001,
    SELECT_VOICE_FORCE_REQUIRED: 5003,
    SERVICE_UNAVAILABLE: 1001,
    TRANSACTION_ABORTED: 1002,
    UNAUTHORIZED_FOR_ACHIEVEMENT: 5010,
    UNKNOWN_ERROR: 1000,
};

const RPCCloseCodes = {
    CLOSE_NORMAL: 1000,
    CLOSE_UNSUPPORTED: 1003,
    CLOSE_ABNORMAL: 1006,
    INVALID_CLIENTID: 4000,
    INVALID_ORIGIN: 4001,
    RATELIMITED: 4002,
    TOKEN_REVOKED: 4003,
    INVALID_VERSION: 4004,
    INVALID_ENCODING: 4005,
};

const LobbyTypes = {
    PRIVATE: 1,
    PUBLIC: 2,
};

const RelationshipTypes = {
    NONE: 0,
    FRIEND: 1,
    BLOCKED: 2,
    PENDING_INCOMING: 3,
    PENDING_OUTGOING: 4,
    IMPLICIT: 5,
};

const uuid4122 = () => {
    let uuid = '';
    for (let i = 0; i < 32; i += 1) {
        if (i === 8 || i === 12 || i === 16 || i === 20) {
            uuid += '-';
        }
        let n;
        if (i === 12) {
            n = 4;
        } else {
            const random = Math.random() * 16 | 0;
            if (i === 16) {
                n = (random & 3) | 0;
            } else {
                n = random;
            }
        }
        uuid += n.toString(16);
    }
    return uuid;
};


function getPid() {
    if (typeof process !== 'undefined') {
        return process.pid;
    }
    return null;
}