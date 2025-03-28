export enum ArrowType {
    Tap = 1,
    Hold = 2,
    Roll = 4
}

/**
 * Converts special characters in the given token according to the specified rules:
 *
 * 1 - Tap note
 * 2 - Hold head
 * 3 - Hold/roll/Minefield end
 * 4 - Roll head
 * 5 - Mine 
 * 6 - Minefield head  
 * 7 - Fake 
 * 8 - Hidden
 */