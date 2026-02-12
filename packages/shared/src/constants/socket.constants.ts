export const SOCKET_EVENTS = {
    // Client-to-server
    ROOM_CREATE: 'room:create',
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    ROOM_LIST: 'room:list',
    GAME_START: 'game:start',
    GAME_MOVE: 'game:move',
    GAME_CASTLING_MOVE: 'game:castling-move',
    GAME_RESIGN: 'game:resign',

    // Server-to-client
    ROOM_CREATED: 'room:created',
    ROOM_JOINED: 'room:joined',
    ROOM_UPDATED: 'room:updated',
    ROOM_LIST_UPDATED: 'room:list-updated',
    GAME_STARTED: 'game:started',
    MOVE_RESULT: 'game:move-result',
    GAME_OVER: 'game:over',
    PLAYER_DISCONNECTED: 'player:disconnected',
    ERROR: 'error:message',
} as const;

export const ROOM_CONSTRAINTS = {
    MAX_PLAYERS: 2,
    ROOM_NAME_MIN_LENGTH: 1,
    ROOM_NAME_MAX_LENGTH: 30,
    PLAYER_NAME_MIN_LENGTH: 1,
    PLAYER_NAME_MAX_LENGTH: 20,
} as const;
